use crate::queries::*;
use crate::session::get_session_from_headers;
use crate::state::AppState;
use axum::extract::{Multipart, Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Redirect, Response};
use axum::Json;
use base64::Engine;
use chrono::{Datelike, Utc};
use hmac::{Hmac, Mac};
use serde::Deserialize;
use serde_json::json;
use sha2::Sha256;

pub async fn institutions_api(
    State(state): State<AppState>,
    Query(q): Query<InstitutionsQuery>,
) -> Response {
    let categories = match &q.category {
        Some(c) => c
            .split(',')
            .filter(|s| !s.is_empty())
            .map(|c| crate::constants::normalize_institution_category(c).to_string())
            .collect(),
        None => vec![],
    };
    let filter = PublicFilter {
        search: q.search.clone(),
        categories,
        state: q.state.clone(),
    };
    let mode = q.mode.clone().unwrap_or_else(|| "page".to_string());
    let result = if mode == "markers" {
        match get_public_institution_markers(&state.pool, &filter).await {
            Ok(v) => serde_json::to_string(&v).unwrap_or_default(),
            Err(e) => {
                tracing::error!("markers error: {e}");
                r#"{"error":"Failed to fetch institutions"}"#.to_string()
            }
        }
    } else {
        let page = q.page.unwrap_or(1).max(1);
        let limit = q.limit.unwrap_or(15).clamp(1, 100);
        match get_public_institutions_page(&state.pool, &filter, page, limit).await {
            Ok(v) => serde_json::to_string(&v).unwrap_or_default(),
            Err(e) => {
                tracing::error!("page error: {e}");
                r#"{"error":"Failed to fetch institutions"}"#.to_string()
            }
        }
    };
    let mut resp = Response::new(axum::body::Body::from(result));
    *resp.status_mut() = StatusCode::OK;
    resp.headers_mut().insert(
        "cache-control",
        "public, s-maxage=300, stale-while-revalidate=86400".parse().unwrap(),
    );
    resp.headers_mut().insert("content-type", "application/json".parse().unwrap());
    resp
}

#[derive(Deserialize)]
pub struct InstitutionsQuery {
    pub search: Option<String>,
    pub category: Option<String>,
    pub state: Option<String>,
    pub mode: Option<String>,
    pub page: Option<i64>,
    pub limit: Option<i64>,
}

fn cors_response_headers() -> Vec<(&'static str, &'static str)> {
    vec![
        ("Access-Control-Allow-Origin", "*"),
        ("Access-Control-Allow-Methods", "GET, OPTIONS"),
        ("Access-Control-Allow-Headers", "Content-Type"),
    ]
}

pub async fn random_api(State(state): State<AppState>) -> Response {
    use sqlx::Row;
    let rows = sqlx::query(
        "SELECT id, name, category, state, city, qr_image, qr_content, supported_payment, coords
         FROM institutions WHERE status = 'approved' ORDER BY RANDOM() LIMIT 1",
    )
    .fetch_optional(&state.pool)
    .await;
    let row = rows.ok().flatten();
    match row {
        Some(r) => {
            let name: String = r.try_get("name").unwrap_or_default();
            let category: String = r.try_get("category").unwrap_or_default();
            let inst_state: String = r.try_get("state").unwrap_or_default();
            let city: String = r.try_get("city").unwrap_or_default();
            let id: i64 = r.try_get("id").unwrap_or(0);
            let qr_image: Option<String> = r.try_get("qr_image").ok().flatten();
            let qr_content: Option<String> = r.try_get("qr_content").ok().flatten();
            let supported_payment: Option<serde_json::Value> = r.try_get("supported_payment").ok().flatten();
            let coords: Option<serde_json::Value> = r.try_get("coords").ok().flatten();
            let body = json!({
                "id": id, "name": name, "category": category, "state": inst_state, "city": city,
                "qrImage": qr_image, "qrContent": qr_content,
                "supportedPayment": supported_payment, "coords": coords,
            });
            build_json_response(body, StatusCode::OK)
        }
        None => build_json_response(json!({"message": "No institutions found"}), StatusCode::NOT_FOUND),
    }
}

fn build_json_response(value: serde_json::Value, status: StatusCode) -> Response {
    let mut resp = Json(value).into_response();
    *resp.status_mut() = status;
    for (k, v) in cors_response_headers() {
        resp.headers_mut().insert(k, v.parse().unwrap());
    }
    resp.headers_mut()
        .insert("cache-control", "no-cache, no-store, must-revalidate".parse().unwrap());
    resp.headers_mut().insert("pragma", "no-cache".parse().unwrap());
    resp.headers_mut().insert("expires", "0".parse().unwrap());
    resp
}

// ---------- GetDoa proxy ----------

pub async fn getdoa_list(Query(q): Query<GetDoaQuery>) -> Response {
    let client = reqwest::Client::new();
    let mut url = format!("https://getdoa.com/api/doa?page={}&limit={}", q.page.unwrap_or_else(|| "1".into()), q.limit.unwrap_or_else(|| "10".into()));
    if let Some(search) = q.search {
        if !search.is_empty() {
            url.push_str(&format!("&search={}", urlencoding::encode(&search)));
        }
    }
    match client.get(&url).header("User-Agent", "sedekahje-bot").send().await {
        Ok(resp) => {
            let status = resp.status();
            let content_type = resp
                .headers()
                .get(reqwest::header::CONTENT_TYPE)
                .and_then(|v| v.to_str().ok())
                .unwrap_or("application/json")
                .to_string();
            match resp.bytes().await {
                Ok(bytes) => {
                    let mut resp = Response::new(axum::body::Body::from(bytes.to_vec()));
                    *resp.status_mut() = StatusCode::from_u16(status.as_u16()).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);
                    resp.headers_mut().insert(
                        "cache-control",
                        "public, s-maxage=3600, stale-while-revalidate=86400".parse().unwrap(),
                    );
                    resp.headers_mut().insert("content-type", content_type.parse().unwrap());
                    resp
                }
                Err(_) => json_error(json!("Failed to fetch GetDoa API")).into_response(),
            }
        }
        Err(_) => json_error(json!("Failed to fetch GetDoa API")).into_response(),
    }
}

#[derive(Deserialize)]
pub struct GetDoaQuery {
    pub page: Option<String>,
    pub limit: Option<String>,
    pub search: Option<String>,
    pub category: Option<String>,
    pub count: Option<String>,
}

pub async fn getdoa_random(Query(q): Query<GetDoaQuery>) -> Response {
    let client = reqwest::Client::new();
    let mut url = String::from("https://getdoa.com/api/doa/random");
    let mut sep = '?';
    if let Some(cat) = q.category {
        url.push_str(&format!("{sep}category={}", urlencoding::encode(&cat)));
        sep = '&';
    }
    if let Some(count) = q.count {
        url.push_str(&format!("{sep}count={}", urlencoding::encode(&count)));
    }
    match client.get(&url).send().await {
        Ok(resp) => {
            let parsed: serde_json::Value = resp.json().await.unwrap_or(json!(null));
            let data = parsed.get("data").or_else(|| parsed.as_object().map(|_| parsed.get("data").unwrap_or(&parsed)));
            let data = match data {
                Some(d) if !d.is_null() => d.clone(),
                _ => {
                    return Json(json!({"error": "Invalid GetDoa API response"})).into_response();
                }
            };
            let mut resp = Json(transform_doa(&data)).into_response();
            resp.headers_mut().insert("cache-control", "no-store".parse().unwrap());
            resp
        }
        Err(_) => Json(json!({"error": "Failed to fetch GetDoa API"})).into_response(),
    }
}

fn transform_doa(d: &serde_json::Value) -> serde_json::Value {
    let s = |k: &str| d.get(k).and_then(|v| v.as_str()).unwrap_or("").to_string();
    json!({
        "name_my": s("name_my"),
        "name_en": s("name_en"),
        "content": s("content"),
        "reference_my": s("reference_my"),
        "reference_en": s("reference_en"),
        "meaning_my": s("meaning_my"),
        "meaning_en": s("meaning_en"),
        "category_names": d.get("category_names").and_then(|v| v.as_array()).cloned().unwrap_or_default(),
    })
}

// ---------- Institution submit (multipart) ----------

pub async fn submit_institution(
    State(state): State<AppState>,
    headers: HeaderMap,
    mut multipart: Multipart,
) -> Response {
    use sqlx::Row;
    let Some((_sess, user)) = get_session_from_headers(&state.pool, &headers).await.ok().flatten() else {
        return json_error_status(json!({"ok": false, "status":"error","message":"Not authenticated. Please sign in to sedekah.je first."}), StatusCode::UNAUTHORIZED);
    };

    // Admin bypasses rate limiting.
    let is_admin = user.role == "admin";
    if !is_admin {
        let day_ago = Utc::now() - chrono::Duration::days(1);
        let count: i64 = sqlx::query(
            "SELECT COUNT(*) FROM institutions WHERE contributor_id = $1 AND created_at >= $2",
        )
        .bind(&user.id)
        .bind(day_ago)
        .fetch_one(&state.pool)
        .await
        .map(|r| r.try_get(0).unwrap_or(0))
        .unwrap_or(0);
        if count >= 3 {
            return json_error_status(json!({"ok": false,"status":"error","message":"Rate limit: max 3 submissions per day."}), StatusCode::TOO_MANY_REQUESTS);
        }
    }

    let mut fields: std::collections::HashMap<String, String> = std::collections::HashMap::new();
    let mut file_name: Option<String> = None;
    let mut file_bytes: Vec<u8> = Vec::new();
    let mut file_type: Option<String> = None;

    while let Some(field) = multipart.next_field().await.unwrap_or(None) {
        let name = field.name().unwrap_or("").to_string();
        match name.as_str() {
            "qrImage" => {
                file_name = field.file_name().map(String::from);
                file_type = field.content_type().map(String::from);
                file_bytes = field.bytes().await.unwrap_or_default().to_vec();
            }
            _ => {
                if let Ok(v) = field.text().await {
                    fields.insert(name, v);
                }
            }
        }
    }

    let g = |k: &str| fields.get(k).cloned().unwrap_or_default();
    let name = g("name");
    let category = g("category");
    let st = g("state");
    let city = g("city");
    let qr_content = g("qrContent").trim().to_string();
    let source_url = g("sourceUrl").trim().to_string();

    if name.is_empty() {
        return json_error(json!("Name is required."));
    }
    if !crate::constants::CATEGORIES.contains(&category.as_str()) {
        return json_error(json!("Invalid category."));
    }
    if !crate::constants::STATES.contains(&st.as_str()) {
        return json_error(json!("Invalid state."));
    }
    if city.is_empty() {
        return json_error(json!("City is required."));
    }
    if file_bytes.is_empty() {
        return json_error(json!("QR image is required."));
    }
    if file_bytes.len() > 5 * 1024 * 1024 {
        return json_error(json!("Image too large. Max 5MB."));
    }
    let is_image = file_type.as_deref().map(|t| t.starts_with("image/")).unwrap_or(false);
    if !is_image {
        return json_error(json!("File must be an image."));
    }
    if !qr_content.is_empty() && qr_content_exists(&state.pool, &qr_content).await.unwrap_or(false) {
        return json_error_status(json!({"ok": false,"status":"error","message":"This QR code already exists in the system."}), StatusCode::CONFLICT);
    }

    // Upload to R2
    let Some(r2) = state.r2.as_ref() else {
        return json_error(json!("Failed to upload image."));
    };
    let original_name = file_name.unwrap_or_else(|| "qr.png".to_string());
    let qr_url = match r2.upload_file(&file_bytes, &original_name).await {
        Ok(u) => u,
        Err(_) => return json_error(json!("Failed to upload image.")),
    };

    let slug = match generate_unique_slug(&state.pool, &name, None).await {
        Ok(s) => s,
        Err(_) => return json_error(json!("Failed to save institution.")),
    };

    let coords = crate::geocode::geocode_institution_with_fallback(&state.cfg, &name, &city, &st).await;
    let supported: serde_json::Value = if crate::render::is_toyyibpay(Some(&qr_content)) {
        json!(["toyyibpay"])
    } else {
        json!(["duitnow"])
    };
    let coords_json = coords.map(|(lat, lng)| serde_json::json!([lat, lng]));

    let res = sqlx::query(
        "INSERT INTO institutions (name, slug, category, state, city, qr_image, qr_content, supported_payment, coords, source_url, contributor_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
         RETURNING id",
    )
    .bind(&name)
    .bind(&slug)
    .bind(&category)
    .bind(&st)
    .bind(&city)
    .bind(&qr_url)
    .bind(if qr_content.is_empty() { None } else { Some(&qr_content) })
    .bind(&supported)
    .bind(coords_json)
    .bind(if source_url.is_empty() { None } else { Some(&source_url) })
    .bind(&user.id)
    .fetch_one(&state.pool)
    .await;
    match res {
        Ok(row) => {
            let id: i64 = row.try_get(0).unwrap_or(0);
            crate::telegram::log_new_institution(&state.cfg, id, &name, &category).await;
            Json(json!({"status":"success","id": id})).into_response()
        }
        Err(_) => json_error(json!("Failed to save institution.")),
    }
}

fn json_error(message: serde_json::Value) -> Response {
    json_error_status(json!({"ok": false, "status":"error","message": message}), StatusCode::BAD_REQUEST)
}

fn json_error_status(v: serde_json::Value, status: StatusCode) -> Response {
    let mut resp = Json(v).into_response();
    *resp.status_mut() = status;
    resp
}

// ---------- Meta OAuth ----------

pub async fn meta_oauth_start(State(state): State<AppState>) -> Response {
    let cfg = &state.cfg;
    let Some(client_id) = cfg.threads_api_client_id.as_ref() else {
        return Json(json!({"ok":false,"error":"missing_configuration","message":"Missing THREADS_API_CLIENT_ID configuration."})).into_response();
    };
    let base = cfg
        .meta_callback_base
        .clone()
        .unwrap_or_else(|| cfg.app_url.clone());
    let redirect = format!("{}/api/meta/oauth/callback", base.trim_end_matches('/'));
    let oauth_state = uuid::Uuid::new_v4().to_string();
    let url = format!(
        "https://threads.net/oauth/authorize?client_id={}&redirect_uri={}&response_type=code&scope=threads_basic,threads_content_publish,threads_read_replies,threads_manage_replies&state={}",
        urlencoding::encode(client_id),
        urlencoding::encode(&redirect),
        oauth_state
    );
    let mut resp = Redirect::to(&url).into_response();
    resp.headers_mut().insert(
        "set-cookie",
        format!("meta_oauth_state={oauth_state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600")
            .parse()
            .unwrap(),
    );
    resp
}

#[derive(Deserialize)]
pub struct MetaCallbackQuery {
    pub code: Option<String>,
    pub state: Option<String>,
    pub error: Option<String>,
    pub error_reason: Option<String>,
    pub error_description: Option<String>,
}

pub async fn meta_oauth_callback(State(state): State<AppState>, headers: HeaderMap, Query(q): Query<MetaCallbackQuery>) -> Response {
    use sqlx::Row;
    let cfg = state.cfg.clone();
    let base = cfg.meta_callback_base.clone().unwrap_or_else(|| cfg.app_url.clone());
    let oauth_state = headers
        .get("cookie")
        .and_then(|v| v.to_str().ok())
        .and_then(|raw| raw.split(';').find_map(|p| {
            let (k, v) = p.trim().split_once('=')?;
            if k == "meta_oauth_state" { Some(v.to_string()) } else { None }
        }));
    let del = || {
        let mut r = Response::new(axum::body::Body::empty());
        r.headers_mut().insert(
            "set-cookie",
            "meta_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0".parse().unwrap(),
        );
        r
    };
    if q.state.clone().map(|s| Some(s)) != oauth_state.clone().map(|s| Some(s)) {
        let mut r = del();
        let body = Json(json!({"ok":false,"error":"invalid_state","message":"Invalid or missing OAuth state."})).into_response();
        *r.status_mut() = StatusCode::BAD_REQUEST;
        return merge_body(r, body).await;
    }
    if let Some(err) = q.error.clone() {
        let reason = q.error_reason.clone().unwrap_or_else(|| err.clone());
        let desc = q.error_description.clone().unwrap_or_default();
        let target = format!("{}/admin/threads?oauth=error&reason={}&description={}", base.trim_end_matches('/'), urlencoding::encode(&reason), urlencoding::encode(&desc));
        let mut r = del();
        let rd = Redirect::to(&target).into_response();
        return merge_body(r, rd).await;
    }
    let Some(code) = q.code.clone() else {
        let mut r = del();
        let body = Json(json!({"ok":false,"error":"missing_code","message":"Missing OAuth code."})).into_response();
        *r.status_mut() = StatusCode::BAD_REQUEST;
        return merge_body(r, body).await;
    };
    let (Some(client_id), Some(client_secret)) = (cfg.threads_api_client_id.clone(), cfg.threads_api_client_secret.clone()) else {
        let mut r = del();
        let body = Json(json!({"ok":false,"error":"missing_configuration","message":"Missing THREADS_API_CLIENT_ID or THREADS_API_CLIENT_SECRET configuration."})).into_response();
        *r.status_mut() = StatusCode::INTERNAL_SERVER_ERROR;
        return merge_body(r, body).await;
    };
    let redirect = format!("{}/api/meta/oauth/callback", base.trim_end_matches('/'));
    let client = reqwest::Client::new();
    let token_resp = client
        .post("https://graph.threads.net/oauth/access_token")
        .form(&[
            ("client_id", client_id.as_str()),
            ("client_secret", client_secret.as_str()),
            ("code", code.as_str()),
            ("grant_type", "authorization_code"),
            ("redirect_uri", redirect.as_str()),
        ])
        .send()
        .await;
    let token_value = match token_resp {
        Ok(r) => r.json::<serde_json::Value>().await.unwrap_or(json!(null)),
        Err(_) => {
            let mut r = del();
            let body = Json(json!({"ok":false,"error":"token_exchange_failed","message":"Token exchange failed."})).into_response();
            *r.status_mut() = StatusCode::BAD_GATEWAY;
            return merge_body(r, body).await;
        }
    };
    let Some(access_token) = token_value.get("access_token").and_then(|v| v.as_str()).map(String::from) else {
        let mut r = del();
        let body = Json(json!({"ok":false,"error":"invalid_token_response","message":"Invalid token response."})).into_response();
        *r.status_mut() = StatusCode::BAD_GATEWAY;
        return merge_body(r, body).await;
    };
    let user_id = token_value.get("user_id").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let expires_in = token_value.get("expires_in").and_then(|v| v.as_i64()).unwrap_or(86400).max(3600);
    let stored = json!({
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user_id,
        "expires_in": expires_in,
        "stored_at": Utc::now().to_rfc3339(),
    });
    let expires = Utc::now() + chrono::Duration::seconds(expires_in);
    let _ = sqlx::query(
        r#"INSERT INTO verifications (id, identifier, value, expires_at)
           VALUES ('meta-threads-oauth-token', 'meta:threads:oauth-token', $1, $2)
           ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, expires_at = EXCLUDED.expires_at, updated_at = now()"#,
    )
    .bind(stored.to_string())
    .bind(expires.naive_utc())
    .execute(&state.pool)
    .await;
    let target = format!("{}/admin/threads?oauth=connected", base.trim_end_matches('/'));
    let mut r = Redirect::to(&target).into_response();
    r.headers_mut().insert("set-cookie", "meta_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0".parse().unwrap());
    let _ = oauth_state;
    let _ = row_use(&redirect);
    r
}

fn row_use(_s: &str) {}

async fn merge_body(mut r: Response, body: Response) -> Response {
    let status = body.status();
    let headers_r: Vec<(axum::http::HeaderName, axum::http::HeaderValue)> = body
        .headers()
        .iter()
        .filter(|(k, _)| *k != "set-cookie")
        .map(|(k, v)| (k.clone(), v.clone()))
        .collect();
    let body_bytes = match axum::body::to_bytes(body.into_body(), 10 * 1024 * 1024).await {
        Ok(b) => b.to_vec(),
        Err(_) => Vec::new(),
    };
    *r.status_mut() = status;
    *r.body_mut() = axum::body::Body::from(body_bytes);
    for (k, v) in headers_r {
        r.headers_mut().insert(k, v);
    }
    r
}

// ---------- Meta signed_request ----------

type HmacSha256 = Hmac<Sha256>;

pub async fn meta_data_deletion(
    State(state): State<AppState>,
    method: axum::http::Method,
    headers: HeaderMap,
    body_bytes: axum::body::Bytes,
) -> Response {
    use sqlx::Row;
    if method == axum::http::Method::GET {
        return Json(json!({"ok":true,"service":"meta-data-deletion"})).into_response();
    }
    let Some(secret) = state.cfg.threads_app_secret.clone() else {
        return Json(json!({"ok":false,"error":"missing_configuration","message":"Missing THREADS_APP_SECRET configuration."})).into_response();
    };
    let ct = headers
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    let form = if ct.contains("application/json") {
        let v: serde_json::Value = serde_json::from_slice(&body_bytes).unwrap_or(json!({}));
        v.get("signed_request").and_then(|x| x.as_str()).map(String::from)
    } else {
        let body_str = String::from_utf8_lossy(&body_bytes);
        percent_encoding::percent_decode_str(&body_str)
            .decode_utf8_lossy()
            .split('&')
            .find_map(|p| {
                let (k, v) = p.split_once('=')?;
                if k == "signed_request" { Some(v.to_string()) } else { None }
            })
    };
    let Some(signed_request) = form else {
        return Json(json!({"ok":false,"error":"missing_signed_request","message":"Missing signed_request payload."})).into_response();
    };
    let payload = match verify_signed_request(&secret, &signed_request) {
        Some(p) => p,
        None => {
            return Json(json!({"ok":false,"error":"invalid_signed_request","message":"signed_request verification failed."})).into_response();
        }
    };
    let user_id = payload
        .get("user_id")
        .or_else(|| payload.get("app_scoped_user_id"))
        .and_then(|v| v.as_str())
        .map(String::from);
    let Some(user_id) = user_id else {
        return Json(json!({"ok":false,"error":"missing_user_id","message":"signed_request payload does not include a user identifier."})).into_response();
    };
    let confirmation_code = uuid::Uuid::new_v4().to_string();
    let identifier = format!("meta:data-deletion:{confirmation_code}");
    let value = json!({
        "userId": user_id, "status": "in_progress", "error": null,
        "createdAt": Utc::now().to_rfc3339(), "updatedAt": Utc::now().to_rfc3339(),
    });
    let expires = Utc::now() + chrono::Duration::days(30);
    // revoke access
    let deleted = sqlx::query(
        "UPDATE accounts SET access_token=NULL, refresh_token=NULL, id_token=NULL, access_token_expires_at=NULL, refresh_token_expires_at=NULL, updated_at=now() WHERE account_id = $1 AND provider_id IN ('threads','meta','instagram','facebook')",
    )
    .bind(&user_id)
    .execute(&state.pool)
    .await
    .map(|r| r.rows_affected())
    .unwrap_or(0);
    let status = if deleted > 0 { "complete" } else { "complete" };
    let mut value = value;
    value["status"] = json!(status);
    value["updatedAt"] = json!(Utc::now().to_rfc3339());
    let _ = sqlx::query(
        "INSERT INTO verifications (id, identifier, value, expires_at) VALUES ($1, $2, $3, $4)",
    )
    .bind(&confirmation_code)
    .bind(&identifier)
    .bind(value.to_string())
    .bind(expires.naive_utc())
    .execute(&state.pool)
    .await;
    let base = state
        .cfg
        .meta_callback_base
        .clone()
        .or_else(|| Some(state.cfg.app_url.clone()))
        .unwrap_or_else(|| "https://sedekah.je".into());
    Json(json!({
        "url": format!("{}/api/meta/data-deletion/status/{}", base.trim_end_matches('/'), confirmation_code),
        "confirmation_code": confirmation_code,
    }))
    .into_response()
}

fn base64url_decode(s: &str) -> Option<Vec<u8>> {
    base64::engine::general_purpose::URL_SAFE_NO_PAD
        .decode(s)
        .ok()
}

fn verify_signed_request(app_secret: &str, signed_request: &str) -> Option<serde_json::Value> {
    let (sig_b64, payload_b64) = signed_request.split_once('.')?;
    let sig = base64url_decode(sig_b64)?;
    let payload_bytes = base64url_decode(payload_b64)?;
    let payload: serde_json::Value = serde_json::from_slice(&payload_bytes).ok()?;
    let algo = payload.get("algorithm").and_then(|v| v.as_str()).unwrap_or("").to_uppercase();
    if algo != "HMAC-SHA256" {
        return None;
    }
    let mut mac = HmacSha256::new_from_slice(app_secret.as_bytes()).ok()?;
    mac.update(payload_b64.as_bytes());
    let expected = mac.finalize().into_bytes();
    if sig.len() != expected.len() {
        return None;
    }
    let same = sig.iter().zip(expected.iter()).all(|(a, b)| a == b);
    if !same {
        return None;
    }
    Some(payload)
}

pub async fn meta_data_deletion_status(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Response {
    use sqlx::Row;
    let row = sqlx::query(
        "SELECT value, expires_at FROM verifications WHERE id = $1 AND identifier = $2",
    )
    .bind(&id)
    .bind(format!("meta:data-deletion:{id}"))
    .fetch_optional(&state.pool)
    .await
    .ok()
    .flatten();
    match row {
        Some(r) => {
            let expires_at: chrono::DateTime<Utc> = r.try_get(1).unwrap_or(Utc::now() - chrono::Duration::days(1));
            if expires_at <= Utc::now() {
                return Json(json!({"confirmation_code": id, "status": "expired"})).into_response();
            }
            let value: String = r.try_get(0).unwrap_or_default();
            let parsed: serde_json::Value = serde_json::from_str(&value).unwrap_or(json!({}));
            let status = parsed.get("status").and_then(|v| v.as_str()).unwrap_or("error");
            Json(json!({"confirmation_code": id, "status": status})).into_response()
        }
        None => {
            let mut resp = Json(json!({"ok":false,"confirmation_code": id,"status":"error","message":"Deletion job not found."})).into_response();
            *resp.status_mut() = StatusCode::NOT_FOUND;
            resp
        }
    }
}

pub async fn meta_deauthorize(State(state): State<AppState>) -> Response {
    let Some(secret) = state.cfg.threads_app_secret.clone() else {
        return Json(json!({"ok":false,"error":"missing_configuration","message":"Missing THREADS_APP_SECRET configuration."})).into_response();
    };
    let _ = secret;
    Json(json!({"ok":true,"revoked":false,"revoked_count":0,"note":"Deauthorize requires a POST with signed_request; GET is a health check."}))
    .into_response()
}

// ---------- OG images ----------

pub async fn og_institution(
    State(state): State<AppState>,
    Path(slug): Path<String>,
) -> Response {
    let Some(inst) = get_institution_by_slug(&state.pool, &slug).await
        .map_err(|e| tracing::error!("og slug lookup: {e}"))
        .ok()
        .flatten()
    else {
        tracing::warn!("og: institution not found for slug {slug}");
        return (StatusCode::NOT_FOUND, "Not found").into_response();
    };
    let Some(qr_content) = inst.qr_content.clone() else {
        tracing::warn!("og: no qr content for {slug}");
        return (StatusCode::NOT_FOUND, "Not found").into_response();
    };
    let payments = inst.supported_payment_vec();
    let (color, _) = crate::render::brand_color(Some(&payments));
    let png = crate::qrgen::og_institution_png(&inst.name, &qr_content, color);
    let mut resp = Response::new(axum::body::Body::from(png));
    resp.headers_mut().insert("content-type", "image/png".parse().unwrap());
    resp.headers_mut().insert("cache-control", "public, max-age=86400".parse().unwrap());
    resp
}

#[derive(Deserialize)]
pub struct OgRamadhanQuery {
    pub year: Option<i64>,
}

pub async fn og_ramadhan_day(
    State(state): State<AppState>,
    Path(day): Path<i64>,
    Query(q): Query<OgRamadhanQuery>,
) -> Response {
    let year = q.year.unwrap_or_else(|| Utc::now().year() as i64);
    if !(1..=30).contains(&day) {
        return (StatusCode::BAD_REQUEST, "Invalid day").into_response();
    }
    let Some((camp, inst)) = ramadhan_og_day(&state.pool, year, day).await.ok().flatten() else {
        return (StatusCode::NOT_FOUND, "Not found").into_response();
    };
    let payments = inst.supported_payment_vec();
    let (color, _) = crate::render::brand_color(Some(&payments));
    let qr_ok = match &inst.qr_content {
        Some(c) => !c.is_empty(),
        None => inst.qr_image.clone().map(|i| i.starts_with("http")).unwrap_or(false),
    };
    let _ = &camp;
    let png = crate::qrgen::og_ramadhan_png(day, &inst.name, qr_ok, color);
    let mut resp = Response::new(axum::body::Body::from(png));
    resp.headers_mut().insert("content-type", "image/png".parse().unwrap());
    resp.headers_mut().insert("cache-control", "public, max-age=86400".parse().unwrap());
    resp
}

// ---------- Onboarding tour ----------

pub async fn onboarding_tour_get(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Response {
    use sqlx::Row;
    let Some((_s, user)) = get_session_from_headers(&state.pool, &headers).await.ok().flatten() else {
        return json_error_status(json!({"error":"Unauthorized"}), StatusCode::UNAUTHORIZED);
    };
    let row = sqlx::query(
        "SELECT onboarding_tour_state, onboarding_tour_current_route, onboarding_tour_current_step::bigint AS onboarding_tour_current_step FROM users WHERE id = $1",
    )
    .bind(&user.id)
    .fetch_optional(&state.pool)
    .await;
    let Some(row) = row.ok().flatten() else {
        return json_error_status(json!({"error":"User not found"}), StatusCode::NOT_FOUND);
    };
    let s_state: String = row.try_get(0).unwrap_or_else(|_| "completed".into());
    let route: Option<String> = row.try_get(1).unwrap_or(None);
    let step: Option<i64> = row.try_get(2).unwrap_or(None);
    Json(tour_snapshot(&s_state, &route, step)).into_response()
}

pub async fn onboarding_tour_patch(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(body): Json<serde_json::Value>,
) -> Response {
    let Some((_s, user)) = get_session_from_headers(&state.pool, &headers).await.ok().flatten() else {
        return json_error_status(json!({"error":"Unauthorized"}), StatusCode::UNAUTHORIZED);
    };
    let action = body.get("action").and_then(|v| v.as_str()).unwrap_or("");
    let route = body.get("route").and_then(|v| v.as_str()).map(String::from);
    let step = body.get("step").and_then(|v| v.as_i64());
    let invalid = || {
        let mut resp = json_error_status(json!({"error":"Invalid action"}), StatusCode::BAD_REQUEST);
        resp
    };
    match action {
        "start" => {
            let Some(route) = route else { return invalid() };
            if !["/contribute", "/my-contributions", "/leaderboard"].contains(&route.as_str()) {
                return invalid();
            }
            let _ = sqlx::query(
                "UPDATE users SET onboarding_tour_state='in_progress', onboarding_tour_current_route=$1, onboarding_tour_current_step=0, onboarding_tour_started_at=now(), onboarding_tour_completed_at=NULL, onboarding_tour_skipped_at=NULL WHERE id=$2",
            )
            .bind(&route)
            .bind(&user.id)
            .execute(&state.pool)
            .await;
        }
        "advance" => {
            let Some(route) = route else { return invalid() };
            if !["/contribute", "/my-contributions", "/leaderboard"].contains(&route.as_str()) {
                return invalid();
            }
            let step = step.unwrap_or(0).clamp(0, 3);
            advance_step(&state, &user.id, &route, step).await;
        }
        "skip" => {
            let _ = sqlx::query(
                "UPDATE users SET onboarding_tour_state='skipped', onboarding_tour_skipped_at=now() WHERE id=$1",
            )
            .bind(&user.id)
            .execute(&state.pool)
            .await;
        }
        "complete" => {
            let _ = sqlx::query(
                "UPDATE users SET onboarding_tour_state='completed', onboarding_tour_completed_at=now() WHERE id=$1",
            )
            .bind(&user.id)
            .execute(&state.pool)
            .await;
        }
        "resume" => {
            let _ = sqlx::query(
                "UPDATE users SET onboarding_tour_state='in_progress' WHERE id=$1 AND onboarding_tour_state <> 'completed'",
            )
            .bind(&user.id)
            .execute(&state.pool)
            .await;
            let _ = sqlx::query(
                "UPDATE users SET onboarding_tour_state='in_progress', onboarding_tour_current_route='/contribute', onboarding_tour_current_step=0, onboarding_tour_started_at=now() WHERE id=$1 AND onboarding_tour_state='not_started'",
            )
            .bind(&user.id)
            .execute(&state.pool)
            .await;
        }
        _ => return invalid(),
    }
    // Return fresh snapshot
    let row = sqlx::query(
        "SELECT onboarding_tour_state, onboarding_tour_current_route, onboarding_tour_current_step::bigint AS onboarding_tour_current_step FROM users WHERE id = $1",
    )
    .bind(&user.id)
    .fetch_one(&state.pool)
    .await;
    use sqlx::Row as R;
    if let Ok(row) = row {
        let s_state: String = row.try_get(0).unwrap_or_else(|_| "completed".into());
        let route: Option<String> = row.try_get(1).unwrap_or(None);
        let step: Option<i64> = row.try_get(2).unwrap_or(None);
        return Json(tour_snapshot(&s_state, &route, step)).into_response();
    }
    invalid()
}

async fn advance_step(state: &AppState, user_id: &str, route: &str, step: i64) {
    let order = crate::routes::public::ROUTE_ORDER;
    let idx = order.iter().position(|r| *r == route).unwrap_or(0);
    let steps_for_route = [4, 3, 3][idx].min(3);
    let is_last_route = idx == order.len() - 1;
    if is_last_route && step >= steps_for_route - 1 {
        let _ = sqlx::query(
            "UPDATE users SET onboarding_tour_state='completed', onboarding_tour_completed_at=now() WHERE id=$1",
        )
        .bind(user_id)
        .execute(&state.pool)
        .await;
        return;
    }
    if step >= steps_for_route - 1 {
        // move to next route, step 0
        let next_route = order[idx + 1];
        let _ = sqlx::query(
            "UPDATE users SET onboarding_tour_current_route=$1, onboarding_tour_current_step=0 WHERE id=$2",
        )
        .bind(next_route)
        .bind(user_id)
        .execute(&state.pool)
        .await;
    } else {
        let _ = sqlx::query(
            "UPDATE users SET onboarding_tour_current_step=$1 WHERE id=$2",
        )
        .bind(step + 1)
        .bind(user_id)
        .execute(&state.pool)
        .await;
    }
}

fn tour_snapshot(s_state: &str, route: &Option<String>, step: Option<i64>) -> serde_json::Value {
    let eligible = s_state != "completed";
    json!({
        "state": s_state,
        "currentRoute": route,
        "currentStep": step,
        "isEligible": eligible,
    })
}

// ---------- MCP (Streamable HTTP JSON-RPC) ----------

pub async fn mcp_endpoint(
    State(state): State<AppState>,
    Json(req): Json<serde_json::Value>,
) -> Response {
    let method = req.get("method").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let id = req.get("id").cloned();
    let version = req.get("params").and_then(|p| p.get("protocolVersion")).and_then(|v| v.as_str());
    let _ = version;
    match method.as_str() {
        "initialize" => {
            let mut resp = Json(json!({
                "jsonrpc":"2.0","id": id,
                "result": {
                    "protocolVersion": "2025-03-26",
                    "capabilities": { "tools": {} },
                    "serverInfo": { "name": "sedekah-je", "version": "1.0.0" }
                }
            }));
            let mut r = resp.into_response();
            r.headers_mut().insert("content-type", "application/json".parse().unwrap());
            apply_mcp_headers(&mut r);
            r
        }
        "tools/list" => {
            let tools = json!([
                {"name":"list_filter_options","description":"List available filter options","inputSchema":{"type":"object","properties":{}}},
                {"name":"search_institutions","description":"Search approved institutions","inputSchema":{"type":"object","properties":{"search":{"type":"string"},"category":{"type":"string"},"state":{"type":"string"},"page":{"type":"integer"},"limit":{"type":"integer"}}}},
                {"name":"get_institution","description":"Get one institution by slug","inputSchema":{"type":"object","properties":{"slug":{"type":"string"},"required":["slug"]}}},
                {"name":"get_random_institution","description":"Get a random approved institution","inputSchema":{"type":"object","properties":{}}}
            ]);
            let mut r = Json(json!({"jsonrpc":"2.0","id": id,"result":{"tools": tools}})).into_response();
            apply_mcp_headers(&mut r);
            r
        }
        "tools/call" => {
            let name = req.get("params").and_then(|p| p.get("name")).and_then(|v| v.as_str()).unwrap_or("").to_string();
            let args = req.get("params").and_then(|p| p.get("arguments")).cloned().unwrap_or(json!({}));
            let result = call_tool(&state, &name, &args).await;
            let mut r = Json(json!({"jsonrpc":"2.0","id": id,"result":{"content":[{ "type":"text","text":result }]}})).into_response();
            apply_mcp_headers(&mut r);
            r
        }
        _ => {
            let mut r = Json(json!({"jsonrpc":"2.0","id": id,"error":{"code":-32601,"message":"method not found"}})).into_response();
            *r.status_mut() = StatusCode::METHOD_NOT_ALLOWED;
            apply_mcp_headers(&mut r);
            r
        }
    }
}

fn apply_mcp_headers(r: &mut Response) {
    r.headers_mut().insert("mcp-session-id", "1".parse().unwrap());
}

async fn call_tool(state: &AppState, name: &str, args: &serde_json::Value) -> String {
    use sqlx::Row as _;
    let get = |k: &str| args.get(k).and_then(|v| v.as_str()).map(String::from);
    match name {
        "list_filter_options" => json!({
            "categories": crate::constants::CATEGORIES,
            "states": crate::constants::STATES,
            "payment_methods": crate::constants::SUPPORTED_PAYMENTS,
        })
        .to_string(),
        "search_institutions" => {
            let search = get("search").and_then(|s| (!s.is_empty()).then_some(s));
            let category = get("category").and_then(|s| (!s.is_empty()).then_some(s));
            let state_s = get("state").and_then(|s| (!s.is_empty()).then_some(s));
            let page = args.get("page").and_then(|v| v.as_i64()).unwrap_or(1).clamp(1, 1000);
            let limit = args.get("limit").and_then(|v| v.as_i64()).unwrap_or(20).clamp(1, 100);
            let filter = PublicFilter { search, categories: category.map(|c| vec![crain(c)]).unwrap_or_default(), state: state_s };
            match get_public_institutions_page(&state.pool, &filter, page, limit).await {
                Ok(p) => json!({"institutions": p.institutions, "pagination": p.pagination}).to_string(),
                Err(_) => json!({"error":"Failed to search"}).to_string(),
            }
        }
        "get_institution" => {
            let slug = get("slug").unwrap_or_default();
            match get_institution_by_slug(&state.pool, &slug).await {
                Ok(Some(i)) => json!({"id": i.id, "name": i.name, "slug": i.slug, "description": i.description, "category": i.category, "state": i.state, "city": i.city, "address": i.address, "qrImage": i.qr_image, "qrContent": i.qr_content, "supportedPayment": i.supported_payment_vec(), "coords": i.coords, "socialMedia": i.social_media}).to_string(),
                _ => json!({"error":"Institution not found","slug": slug}).to_string(),
            }
        }
        "get_random_institution" => {
            match sqlx::query("SELECT id, name, slug, category, state, city, qr_image, qr_content, supported_payment, coords FROM institutions WHERE status='approved' ORDER BY RANDOM() LIMIT 1").fetch_optional(&state.pool).await.ok().flatten() {
                Some(r) => json!({"id": r.try_get::<i64,_>("id").unwrap_or(0), "name": r.try_get::<String,_>("name").unwrap_or_default(), "slug": r.try_get::<String,_>("slug").unwrap_or_default(), "category": r.try_get::<String,_>("category").unwrap_or_default(), "state": r.try_get::<String,_>("state").unwrap_or_default(), "city": r.try_get::<String,_>("city").unwrap_or_default(), "qrImage": r.try_get::<Option<String>,_>("qr_image").ok().flatten(), "qrContent": r.try_get::<Option<String>,_>("qr_content").ok().flatten(), "supportedPayment": r.try_get::<serde_json::Value,_>("supported_payment").unwrap_or(json!(null)), "coords": r.try_get::<serde_json::Value,_>("coords").unwrap_or(json!(null))}).to_string(),
                None => json!({"error":"No institutions found"}).to_string(),
            }
        }
        _ => json!({"error":"Unknown tool"}).to_string(),
    }
}

fn crain(c: String) -> String {
    crate::constants::normalize_institution_category(&c).to_string()
}

// ---------- Admin export ----------

pub async fn admin_export(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(q): Query<ExportQuery>,
) -> Response {
    use sqlx::Row;
    let Some(user) = crate::session::require_admin(&state.pool, &headers).await.ok().flatten() else {
        return (StatusCode::UNAUTHORIZED, Json(json!({"error":"Unauthorized"}))).into_response();
    };
    let _ = user;
    let format = q.format.clone().unwrap_or_else(|| "json".into());
    let rows = sqlx::query(
        "SELECT slug, name, description, category, state, city, address, coords, supported_payment, qr_content FROM institutions WHERE status = 'approved' ORDER BY name ASC, id ASC",
    )
    .fetch_all(&state.pool)
    .await;
    let base = state.cfg.app_url.clone();
    let mut data = Vec::new();
    if let Ok(rows) = rows {
        for r in rows {
            let slug: String = r.try_get("slug").unwrap_or_default();
            let name: String = r.try_get("name").unwrap_or_default();
            let description: Option<String> = r.try_get("description").unwrap_or(None);
            let category: String = r.try_get("category").unwrap_or_default();
            let stat_: String = r.try_get("state").unwrap_or_default();
            let city: String = r.try_get("city").unwrap_or_default();
            let address: Option<String> = r.try_get("address").unwrap_or(None);
            let coords: Option<serde_json::Value> = r.try_get("coords").unwrap_or(None);
            let supported_payment: Option<serde_json::Value> = r.try_get("supported_payment").unwrap_or(None);
            let qr_content: Option<String> = r.try_get("qr_content").unwrap_or(None);
            data.push(json!({
                "slug": slug, "name": name, "description": description, "category": category,
                "state": stat_, "city": city, "address": address, "coords": coords,
                "supportedPayment": supported_payment, "qrContent": qr_content,
                "institutionUrl": format!("{}/{}/{}", base, category, slug),
                "embedUrl": format!("{}/embed/{}", base, slug),
            }));
        }
    }
    let date = Utc::now().format("%Y-%m-%d");
    if format == "csv" {
        let mut out = String::from("slug,name,description,category,state,city,address,coords,supportedPayment,qrContent,institutionUrl,embedUrl\n");
        for d in &data {
            let row = vec![
                str(&d["slug"]), str(&d["name"]), str(&d["description"]), str(&d["category"]),
                str(&d["state"]), str(&d["city"]), str(&d["address"]), str(&d["coords"]),
                str(&d["supportedPayment"]), str(&d["qrContent"]), str(&d["institutionUrl"]), str(&d["embedUrl"]),
            ];
            out.push_str(&row.iter().map(|c| format!(r#""{}""#, c.replace('"', "\"\""))).collect::<Vec<_>>().join(","));
            out.push('\n');
        }
        let mut resp = Response::new(axum::body::Body::from(out));
        resp.headers_mut().insert("content-type", "text/csv; charset=utf-8".parse().unwrap());
        resp.headers_mut().insert("content-disposition", format!("attachment; filename=\"sedekah-je-approved-institutions-{date}.csv\"").parse().unwrap());
        resp
    } else {
        let body = json!({"exportedAt": Utc::now().to_rfc3339(), "count": data.len(), "data": data}).to_string();
        let mut resp = Response::new(axum::body::Body::from(body));
        resp.headers_mut().insert("content-type", "application/json".parse().unwrap());
        resp.headers_mut().insert("content-disposition", format!("attachment; filename=\"sedekah-je-approved-institutions-{date}.json\"").parse().unwrap());
        resp
    }
}

fn str(v: &serde_json::Value) -> String {
    v.as_str().unwrap_or("").to_string()
}

#[derive(Deserialize)]
pub struct ExportQuery {
    pub format: Option<String>,
}

pub async fn opcje_mcp(State(_state): State<AppState>) -> Response {
    let mut resp = axum::response::Response::new(axum::body::Body::empty());
    *resp.status_mut() = StatusCode::NO_CONTENT;
    apply_mcp_headers(&mut resp);
    resp
}
