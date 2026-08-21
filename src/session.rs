use crate::config::Config;
use crate::db::DbPool;
use crate::models::{Session, User};
use base64::Engine;
use chrono::{Duration, Utc};
use serde_json::json;
use sha2::{Digest, Sha256};
use sqlx::Row;
use std::time::{SystemTime, UNIX_EPOCH};

pub const SESSION_COOKIE: &str = "better-auth.session_token";
pub const SECURE_SESSION_COOKIE: &str = "__Secure-better-auth.session_token";

#[derive(Clone)]
pub struct OAuthState {
    pub callback: String,
    pub nonce: u64,
}

pub fn new_nonce() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos() as u64)
        .unwrap_or(0)
        ^ rand::random::<u64>()
}

pub fn encode_state(callback: &str) -> String {
    let json = json!({ "cb": callback, "n": new_nonce() }).to_string();
    base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(json.as_bytes())
}

pub fn decode_state(state: &str) -> Option<String> {
    let bytes = base64::engine::general_purpose::URL_SAFE_NO_PAD
        .decode(state)
        .ok()?;
    let value: serde_json::Value = serde_json::from_slice(&bytes).ok()?;
    value
        .get("cb")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
}

pub fn hash_token(token: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(token.as_bytes());
    hex::encode(hasher.finalize())
}

pub fn new_token() -> String {
    let mut data = [0u8; 32];
    rand::RngCore::fill_bytes(&mut rand::rngs::OsRng, &mut data);
    hex::encode(data)
}

pub fn session_cookie_value(headers: &axum::http::HeaderMap) -> Option<(String, String)> {
    let raw = headers.get(axum::http::header::COOKIE)?;
    let raw = raw.to_str().ok()?;
    for (name, val) in raw.split(';').filter_map(|p| {
        let mut it = p.trim().splitn(2, '=');
        Some((it.next()?, it.next()?))
    }) {
        if name == SESSION_COOKIE || name == SECURE_SESSION_COOKIE {
            if !val.is_empty() {
                return Some((name.to_string(), url_unescape(val)));
            }
        }
    }
    None
}

fn url_unescape(s: &str) -> String {
    percent_encoding::percent_decode_str(s).decode_utf8_lossy().to_string()
}

pub async fn get_session_from_headers(
    pool: &DbPool,
    headers: &axum::http::HeaderMap,
) -> Result<Option<(Session, User)>, sqlx::Error> {
    let Some((_, token)) = session_cookie_value(headers) else {
        return Ok(None);
    };
    let token_hash = hash_token(&token);
    // Compatible with better-auth sessions: token column may hold either the
    // plain token or its hash. Check both.
    let s = sqlx::query_as::<_, Session>(
        r#"SELECT id, expires_at AT TIME ZONE 'UTC' AS expires_at, token, user_id FROM sessions WHERE token = $1 OR token = $2"#,
    )
    .bind(&token)
    .bind(&token_hash)
    .fetch_optional(pool)
    .await?;
    let Some(s) = s else { return Ok(None) };
    if s.expires_at <= Utc::now() {
        return Ok(None);
    }
    let user = crate::queries::get_user_by_id(pool, &s.user_id).await?;
    Ok(user.map(|u| (s, u)))
}

pub async fn create_session(
    pool: &DbPool,
    user_id: &str,
    ip: Option<String>,
    user_agent: Option<String>,
) -> Result<String, sqlx::Error> {
    let id = uuid::Uuid::new_v4().to_string();
    let token = new_token();
    let expires = Utc::now() + Duration::days(7);
    sqlx::query(
        r#"INSERT INTO sessions (id, expires_at, token, ip_address, user_agent, user_id) VALUES ($1, $2, $3, $4, $5, $6)"#,
    )
    .bind(&id)
    .bind(expires.naive_utc())
    .bind(&token)
    .bind(ip)
    .bind(user_agent)
    .bind(user_id)
    .execute(pool)
    .await?;
    Ok(token)
}

pub async fn delete_session(pool: &DbPool, token: &str) -> Result<(), sqlx::Error> {
    let h = hash_token(token);
    sqlx::query("DELETE FROM sessions WHERE token = $1 OR token = $2")
        .bind(token)
        .bind(h)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn delete_all_user_sessions(pool: &DbPool, user_id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(user_id)
        .execute(pool)
        .await?;
    Ok(())
}

// ---------- Google OAuth ----------

pub fn google_auth_url(cfg: &Config) -> String {
    let redirect = format!("{}/api/auth/callback/google", cfg.app_url);
    let state = encode_state("/contribute");
    format!(
        "https://accounts.google.com/o/oauth2/v2/auth?client_id={}&redirect_uri={}&response_type=code&scope=openid%20email%20profile&prompt=select_account&state={}",
        cfg.google_client_id, urlencoding::encode(&redirect), urlencoding::encode(&state)
    )
}

pub async fn exchange_code_for_token(
    cfg: &Config,
    code: &str,
) -> Result<(serde_json::Value, serde_json::Value), String> {
    let client = reqwest::Client::new();
    let redirect = format!("{}/api/auth/callback/google", cfg.app_url);
    let resp = client
        .post("https://oauth2.googleapis.com/token")
        .form(&[
            ("client_id", cfg.google_client_id.as_str()),
            ("client_secret", cfg.google_client_secret.as_str()),
            ("code", code),
            ("grant_type", "authorization_code"),
            ("redirect_uri", redirect.as_str()),
        ])
        .send()
        .await
        .map_err(|e| format!("token request failed: {e}"))?;
    let token_value: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("token response invalid: {e}"))?;
    let token = token_value
        .get("access_token")
        .and_then(|v| v.as_str())
        .ok_or("missing access_token")?
        .to_string();

    let user_resp = client
        .get("https://www.googleapis.com/oauth2/v3/userinfo")
        .bearer_auth(&token)
        .send()
        .await
        .map_err(|e| format!("userinfo request failed: {e}"))?;
    let user_value: serde_json::Value = user_resp
        .json()
        .await
        .map_err(|e| format!("userinfo response invalid: {e}"))?;
    Ok((token_value, user_value))
}

pub async fn upsert_google_user(
    pool: &DbPool,
    token_value: &serde_json::Value,
    user_value: &serde_json::Value,
) -> Result<User, sqlx::Error> {
    let sub = user_value
        .get("sub")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let email = user_value
        .get("email")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let name = user_value.get("name").and_then(|v| v.as_str()).map(String::from);
    let picture = user_value
        .get("picture")
        .and_then(|v| v.as_str())
        .map(String::from);
    let verified = user_value
        .get("email_verified")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);

    let account_id = user_value.get("sub").and_then(|v| v.as_str()).unwrap_or("");
    let account_id = account_id.to_string();

    // Find existing user by account.sub
    let user_id: Option<String> = sqlx::query(
        "SELECT user_id FROM accounts WHERE provider_id = 'google' AND account_id = $1",
    )
    .bind(&account_id)
    .fetch_optional(pool)
    .await?
    .map(|r| r.try_get::<String, _>(0))
    .transpose()
    .ok()
    .flatten();

    let user_id = match user_id {
        Some(id) => {
            // ensure email matches too (in case account exists)
            let existing = crate::queries::get_user_by_id(pool, &id).await?;
            match existing {
                Some(u) => u,
                None => {
                    let uid = uuid::Uuid::new_v4().to_string();
                    sqlx::query(
                        r#"INSERT INTO users (id, email, name, image, avatar_url, email_verified, onboarding_tour_state)
                           VALUES ($1, $2, $3, $4, $5, $6, 'not_started')"#,
                    )
                    .bind(&uid)
                    .bind(&email)
                    .bind(&name)
                    .bind(&picture)
                    .bind(&picture)
                    .bind(verified)
                    .execute(pool)
                    .await?;
                    crate::queries::get_user_by_id(pool, &uid).await?.unwrap()
                }
            }
        }
        None => {
            // Find by email first (link existing account) else create
            let existing = crate::queries::get_user_by_email(pool, &email).await?;
            let user = match existing {
                Some(u) => u,
                None => {
                    let uid = uuid::Uuid::new_v4().to_string();
                    sqlx::query(
                        r#"INSERT INTO users (id, email, name, image, avatar_url, email_verified, onboarding_tour_state)
                           VALUES ($1, $2, $3, $4, $5, $6, 'not_started')"#,
                    )
                    .bind(&uid)
                    .bind(&email)
                    .bind(&name)
                    .bind(&picture)
                    .bind(&picture)
                    .bind(verified)
                    .execute(pool)
                    .await?;
                    crate::queries::get_user_by_id(pool, &uid).await?.unwrap()
                }
            };
            user
        }
    };

    // Upsert account row
    let access_token = token_value.get("access_token").and_then(|v| v.as_str());
    let refresh_token = token_value.get("refresh_token").and_then(|v| v.as_str());
    let id_token = token_value.get("id_token").and_then(|v| v.as_str());
    let account_row = sqlx::query(
        "SELECT id FROM accounts WHERE provider_id = 'google' AND account_id = $1",
    )
    .bind(&account_id)
    .fetch_optional(pool)
    .await?;
    if let Some(r) = account_row {
        let account_pk: String = r.try_get(0)?;
        sqlx::query(
            "UPDATE accounts SET access_token=$1, refresh_token=$2, id_token=$3, scope=$4, updated_at=now() WHERE id=$5",
        )
        .bind(access_token)
        .bind(refresh_token)
        .bind(id_token)
        .bind("openid email profile")
        .bind(&account_pk)
        .execute(pool)
        .await?;
    } else {
        let account_pk = uuid::Uuid::new_v4().to_string();
        sqlx::query(
            r#"INSERT INTO accounts (id, account_id, provider_id, user_id, access_token, refresh_token, id_token, scope)
               VALUES ($1, $2, 'google', $3, $4, $5, $6, 'openid email profile')"#,
        )
        .bind(&account_pk)
        .bind(&account_id)
        .bind(&user_id.id)
        .bind(access_token)
        .bind(refresh_token)
        .bind(id_token)
        .execute(pool)
        .await?;
    }

    Ok(user_id)
}

pub async fn require_user(
    pool: &DbPool,
    headers: &axum::http::HeaderMap,
) -> Result<Option<(Session, User)>, sqlx::Error> {
    get_session_from_headers(pool, headers).await
}

pub async fn require_admin(
    pool: &DbPool,
    headers: &axum::http::HeaderMap,
) -> Result<Option<User>, sqlx::Error> {
    let Some((_, user)) = get_session_from_headers(pool, headers).await? else {
        return Ok(None);
    };
    // Re-read role from DB (do not trust session payload).
    let user = crate::queries::get_user_by_id(pool, &user.id).await?;
    match user {
        Some(u) if u.role == "admin" => Ok(Some(u)),
        _ => Ok(None),
    }
}
