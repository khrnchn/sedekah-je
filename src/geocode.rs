use crate::config::{app_url, Config};

/// Geocode an institution name/city/state into [lat, lng] using Google first,
/// then Nominatim as fallback. Returns None on failure.
pub async fn geocode_institution_with_fallback(
    cfg: &Config,
    name: &str,
    city: &str,
    state: &str,
) -> Option<(f64, f64)> {
    if let Some(key) = cfg.google_geocoding_api_key.as_ref() {
        if !key.is_empty() {
            if let Some(c) = geocode_google(cfg, name, city, state).await {
                return Some(c);
            }
        }
    }
    geocode_nominatim(cfg, name, city, state).await
}

async fn geocode_google(
    cfg: &Config,
    name: &str,
    city: &str,
    state: &str,
) -> Option<(f64, f64)> {
    let key = cfg.google_geocoding_api_key.clone()?;
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .ok()?;
    let query = format!("{name}, {city}, {state}");
    let url = format!(
        "https://maps.googleapis.com/maps/api/geocode/json?address={}&components=country:MY&region=my&language=ms&key={}",
        urlencoding::encode(&query),
        urlencoding::encode(&key)
    );
    let resp: serde_json::Value = client.get(&url).send().await.ok()?.json().await.ok()?;
    let loc = &resp["results"][0]["geometry"]["location"];
    let lat = loc["lat"].as_f64()?;
    let lng = loc["lng"].as_f64()?;
    Some((lat, lng))
}

async fn geocode_nominatim(cfg: &Config, name: &str, city: &str, state: &str) -> Option<(f64, f64)> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(8))
        .build()
        .ok()?;
    let query = format!("{name}, {city}, {state}, Malaysia");
    let url = format!(
        "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=my&q={}",
        urlencoding::encode(&query)
    );
    let mut rb = client.get(&url);
    if let Some(email) = &cfg.nominatim_email {
        rb = rb.query(&[("email", email)]);
    }
    let resp: serde_json::Value = rb
        .header("User-Agent", "sedekahje-bot")
        .send()
        .await
        .ok()?
        .json()
        .await
        .ok()?;
    let first = resp.get(0)?.clone();
    let lat = first["lat"].as_str()?.parse().ok()?;
    let lng = first["lon"].as_str()?.parse().ok()?;
    Some((lat, lng))
}

/// Reverse geocode coords to an address (Google, fallback Nominatim).
pub async fn reverse_geocode(cfg: &Config, lat: f64, lng: f64) -> Option<String> {
    if let Some(key) = cfg.google_geocoding_api_key.as_ref() {
        if !key.is_empty() {
            let client = reqwest::Client::new();
            let url = format!(
                "https://maps.googleapis.com/maps/api/geocode/json?latlng={},{}&key={}&components=country:MY&region=my&language=ms",
                lat, lng, urlencoding::encode(key)
            );
            let resp: serde_json::Value = client.get(&url).send().await.ok()?.json().await.ok()?;
            let addr = resp["results"][0]["formatted_address"].as_str()?;
            if !addr.is_empty() {
                return Some(addr.to_string());
            }
        }
    }
    let client = reqwest::Client::new();
    let url = format!(
        "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={}&lon={}",
        lat, lng
    );
    let mut rb = client.get(&url);
    if let Some(email) = &cfg.nominatim_email {
        rb = rb.query(&[("email", email)]);
    }
    let resp: serde_json::Value = rb
        .header("User-Agent", "sedekahje-bot")
        .send()
        .await
        .ok()?
        .json()
        .await
        .ok()?;
    resp["display_name"].as_str().map(String::from)
}

/// Public helper to build a link to an approved institution page.
pub fn institution_link(category: &str, slug: &str) -> String {
    format!("{}/{}/{}", app_url(), category, slug)
}

#[allow(dead_code)]
pub fn unused_placeholder() {}
