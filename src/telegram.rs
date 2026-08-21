use crate::config::Config;

/// Fire-and-forget Telegram notification (no-op when token/channel missing).
pub async fn log_to_telegram(cfg: &Config, level: &str, title: &str, description: Option<&str>) {
    let (Some(token), Some(chat_id)) = (&cfg.telegram_bot_token, &cfg.telegram_chat_id) else {
        return;
    };
    if token.is_empty() || chat_id.is_empty() {
        return;
    }
    let (emoji, level_tag) = match level {
        "error" => ("❌", "ERROR"),
        "warn" => ("⚠️", "WARN"),
        "success" => ("✅", "SUCCESS"),
        _ => ("ℹ️", "INFO"),
    };
    let now = chrono::Utc::now() + chrono::Duration::hours(8);
    let text = format!(
        "{emoji} *{level_tag}* · *{title}*\n{}\n{}",
        now.format("%Y-%m-%d %H:%M MYT"),
        description.unwrap_or("")
    );
    let client = reqwest::Client::new();
    let url = format!("https://api.telegram.org/bot{token}/sendMessage");
    let _ = client
        .post(&url)
        .form(&[
            ("chat_id", chat_id.as_str()),
            ("text", text.as_str()),
            ("parse_mode", "Markdown"),
            ("disable_web_page_preview", "true"),
        ])
        .send()
        .await;
}

pub async fn log_new_user(cfg: &Config, id: &str, name: &str, email: &str) {
    log_to_telegram(
        cfg,
        "info",
        "New User",
        Some(&format!("id: `{id}`\nname: {name}\nemail: {email}")),
    )
    .await;
}

pub async fn log_new_institution(cfg: &Config, id: i64, name: &str, category: &str) {
    let emoji = match category {
        "masjid" => "🕌",
        "surau" => "🏢",
        "tahfiz" => "📚",
        "kebajikan" => "🤝",
        _ => "🏛️",
    };
    log_to_telegram(
        cfg,
        "info",
        "New Institution",
        Some(&format!("id: `{id}`\n{emoji} {name}")),
    )
    .await;
}

pub async fn log_institution_claim(cfg: &Config, institution: &str, user: &str) {
    log_to_telegram(
        cfg,
        "info",
        "Institution Claim",
        Some(&format!("institution: {institution}\nuser: {user}")),
    )
    .await;
}

pub async fn log_institution_submission_failure(cfg: &Config, error_type: &str) {
    log_to_telegram(
        cfg,
        "error",
        "Institution Submission Failure",
        Some(&format!("errorType: `{error_type}`")),
    )
    .await;
}
