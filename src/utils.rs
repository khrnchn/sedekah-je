use chrono::{Duration, NaiveDate, Timelike, Utc};

/// Current date string (YYYY-MM-DD) in the MYT timezone.
pub fn today_myt() -> NaiveDate {
    (Utc::now() + Duration::hours(8)).date_naive()
}

/// Islamic-day-aware "today": MYT date, rolled forward after 19:00 MYT.
pub fn islamic_today_myt() -> NaiveDate {
    let myt = Utc::now() + Duration::hours(8);
    let date = myt.date_naive();
    if myt.hour() >= 19 {
        date.succ_opt().unwrap_or(date)
    } else {
        date
    }
}

pub fn date_plus_days(date: NaiveDate, days: i64) -> NaiveDate {
    date.checked_add_signed(Duration::days(days)).unwrap_or(date)
}

/// Format an Instant timestamp to a "d MMM yyyy" style MYT date.
pub fn format_date_only_myt(t: chrono::DateTime<Utc>) -> String {
    let myt = t + Duration::hours(8);
    myt.format("%Y-%m-%d").to_string()
}

pub fn format_datetime_myt(t: chrono::DateTime<Utc>) -> String {
    let myt = t + Duration::hours(8);
    myt.format("%Y-%m-%d %H:%M").to_string()
}

/// "X jam yang lalu" style relative time (in Bahasa Malaysia).
pub fn time_ago_myt(t: chrono::DateTime<Utc>) -> String {
    let now = Utc::now();
    let delta = now.signed_duration_since(t);
    let secs = delta.num_seconds().max(0);
    if secs < 60 {
        return "baru sahaja".to_string();
    }
    let mins = secs / 60;
    if mins < 60 {
        return format!("{} minit yang lalu", mins);
    }
    let hours = mins / 60;
    if hours < 24 {
        return format!("{} jam yang lalu", hours);
    }
    let days = hours / 24;
    if days < 30 {
        return format!("{} hari yang lalu", days);
    }
    format!("{} bulan yang lalu", days / 30)
}

pub fn human_cooldown(until: chrono::DateTime<Utc>) -> String {
    let now = Utc::now();
    let delta = until.signed_duration_since(now).num_seconds().max(0);
    let hours = delta / 3600;
    let mins = (delta % 3600) / 60;
    if hours > 0 {
        format!("{} jam {} minit", hours, mins)
    } else if mins > 0 {
        format!("{} minit", mins)
    } else {
        "kurang dari 1 minit".to_string()
    }
}
