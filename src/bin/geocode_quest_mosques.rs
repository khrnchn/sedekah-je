use sedekahje::db;
use serde::Deserialize;

#[derive(Deserialize)]
struct JaisRecord {
    jaisId: i64,
    nama: String,
    alamat: String,
    daerah: String,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    use sqlx::Row;
    let input = std::env::var("JAIS_DATA").unwrap_or_else(|_| "legacy/data/jais-petaling.json".into());
    let _ = std::fs::read_to_string(&input).ok();
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt().with_env_filter("info").init();
    let url = std::env::var("DATABASE_URL")?;
    let pool = db::connect(&url).await?;
    db::apply_schema(&pool).await?;
    let email = std::env::var("NOMINATIM_EMAIL").ok();
    let limit: usize = std::env::args()
        .find_map(|a| a.strip_prefix("--limit=").map(|v| v.parse().ok()).flatten())
        .unwrap_or(0);
    let pause_ms: u64 = std::env::args()
        .find_map(|a| a.strip_prefix("--pause-ms=").map(|v| v.parse().ok()).flatten())
        .unwrap_or(1100);
    let dry_run = std::env::args().any(|a| a == "--dry-run");

    let rows = sqlx::query("SELECT id, name, address, district, jais_id, coords FROM quest_mosques WHERE coords IS NULL")
        .fetch_all(&pool)
        .await?;
    let mut done = 0u64;
    let mut misses = 0u64;
    let client = reqwest::Client::new();
    for row in rows {
        if limit > 0 && (done + misses) >= limit as u64 {
            break;
        }
        let id: i64 = row.try_get(0)?;
        let name: String = row.try_get(1)?;
        let address: Option<String> = row.try_get(2)?;
        let district: String = row.try_get(3)?;
        let mut queries = vec![];
        if let Some(a) = &address {
            queries.push(format!("{a}, {district}, Selangor, Malaysia"));
        }
        queries.push(format!("{name}, {district}, Selangor, Malaysia"));
        for fallback in ["Petaling Jaya, Selangor", "Shah Alam, Selangor", "Subang Jaya, Selangor", "Puchong, Selangor"] {
            queries.push(format!("{name}, {fallback}"));
        }
        let mut found: Option<(f64, f64)> = None;
        for q in &queries {
            let url = format!(
                "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=my&q={}",
                urlencoding::encode(q)
            );
            let mut req = client.get(&url).header("User-Agent", "sedekahje-bot");
            if let Some(e) = &email {
                req = req.query(&[("email", e)]);
            }
            if let Ok(resp) = req.send().await {
                if let Ok(val) = resp.json::<serde_json::Value>().await {
                    if let Some(first) = val.get(0) {
                        if let (Some(lat), Some(lon)) = (first["lat"].as_str(), first["lon"].as_str()) {
                            if let (Ok(lat), Ok(lon)) = (lat.parse::<f64>(), lon.parse::<f64>()) {
                                found = Some((lat, lon));
                                break;
                            }
                        }
                    }
                }
            }
        }
        match found {
            Some((lat, lon)) => {
                if !dry_run {
                    let _ = sqlx::query("UPDATE quest_mosques SET coords = $2, updated_at = now() WHERE id = $1")
                        .bind(id)
                        .bind(serde_json::json!([lat, lon]))
                        .execute(&pool)
                        .await;
                }
                println!("[ok] #{id} {lat},{lon}");
                done += 1;
            }
            None => {
                println!("[miss] #{id} {name}");
                misses += 1;
            }
        }
        tokio::time::sleep(std::time::Duration::from_millis(pause_ms)).await;
    }
    println!("done: {done} ok, {misses} misses{}", if dry_run { " (dry-run)" } else { "" });
    Ok(())
}
