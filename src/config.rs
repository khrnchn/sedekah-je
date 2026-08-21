use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub auth_secret: String,
    pub app_url: String,
    pub google_client_id: String,
    pub google_client_secret: String,
    pub r2_endpoint: String,
    pub r2_access_key_id: String,
    pub r2_secret_access_key: String,
    pub r2_bucket_name: String,
    pub r2_public_url: String,
    pub telegram_bot_token: Option<String>,
    pub telegram_chat_id: Option<String>,
    pub google_geocoding_api_key: Option<String>,
    pub threads_user_id: Option<String>,
    pub threads_access_token: Option<String>,
    pub threads_api_client_id: Option<String>,
    pub threads_api_client_secret: Option<String>,
    pub threads_app_secret: Option<String>,
    pub meta_callback_base: Option<String>,
    pub mailersend_api_key: Option<String>,
    pub mailersend_from_email: String,
    pub mailersend_from_name: String,
    pub mailersend_template_id: Option<String>,
    pub nominatim_email: Option<String>,
    pub extension_id: Option<String>,
    pub umami_database_url: Option<String>,
    pub port: u16,
    pub host: String,
    pub env: String,
}

const DEFAULT_APP_URL: &str = "https://sedekah.je";

pub fn app_url() -> String {
    env::var("NEXT_PUBLIC_APP_URL")
        .or_else(|_| env::var("BETTER_AUTH_URL"))
        .unwrap_or_else(|_| DEFAULT_APP_URL.to_string())
        .trim_end_matches('/')
        .to_string()
}

pub fn load_config() -> Config {
    let _ = dotenvy::dotenv();
    Config {
        database_url: env::var("DATABASE_URL").expect("DATABASE_URL must be set"),
        auth_secret: env::var("BETTER_AUTH_SECRET").expect("BETTER_AUTH_SECRET must be set"),
        app_url: app_url(),
        google_client_id: env::var("GOOGLE_CLIENT_ID").unwrap_or_default(),
        google_client_secret: env::var("GOOGLE_CLIENT_SECRET").unwrap_or_default(),
        r2_endpoint: env::var("R2_ENDPOINT").unwrap_or_default(),
        r2_access_key_id: env::var("R2_ACCESS_KEY_ID").unwrap_or_default(),
        r2_secret_access_key: env::var("R2_SECRET_ACCESS_KEY").unwrap_or_default(),
        r2_bucket_name: env::var("R2_BUCKET_NAME").unwrap_or_default(),
        r2_public_url: env::var("R2_PUBLIC_URL")
            .unwrap_or_else(|_| "https://pub-713906db9ee448e4af59aa8fb2e44c84.r2.dev".into()),
        telegram_bot_token: env::var("TELEGRAM_BOT_TOKEN").ok(),
        telegram_chat_id: env::var("TELEGRAM_CHAT_ID").ok(),
        google_geocoding_api_key: env::var("GOOGLE_GEOCODING_API_KEY").ok(),
        threads_user_id: env::var("THREADS_USER_ID").ok(),
        threads_access_token: env::var("THREADS_ACCESS_TOKEN").ok(),
        threads_api_client_id: env::var("THREADS_API_CLIENT_ID").ok(),
        threads_api_client_secret: env::var("THREADS_API_CLIENT_SECRET").ok(),
        threads_app_secret: env::var("THREADS_APP_SECRET").ok(),
        meta_callback_base: env::var("META_CALLBACK_BASE").ok(),
        mailersend_api_key: env::var("MAILERSEND_API_KEY").ok(),
        mailersend_from_email: env::var("MAILERSEND_FROM_EMAIL")
            .unwrap_or_else(|_| "noreply@mail.sedekah.je".into()),
        mailersend_from_name: env::var("MAILERSEND_FROM_NAME")
            .unwrap_or_else(|_| "SedekahJe".into()),
        mailersend_template_id: env::var("MAILERSEND_APPROVAL_TEMPLATE_ID").ok(),
        nominatim_email: env::var("NOMINATIM_EMAIL").ok(),
        extension_id: env::var("EXTENSION_ID").ok(),
        umami_database_url: env::var("UMAMI_DATABASE_URL").ok(),
        port: env::var("PORT")
            .ok()
            .and_then(|p| p.parse().ok())
            .unwrap_or(3000),
        host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".into()),
        env: env::var("NODE_ENV").unwrap_or_else(|_| "production".into()),
    }
}
