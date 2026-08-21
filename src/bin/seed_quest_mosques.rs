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
    let input = std::env::var("JAIS_DATA").unwrap_or_else(|_| "legacy/data/jais-petaling.json".into());
    let raw = std::fs::read_to_string(&input)?;
    let records: Vec<JaisRecord> = serde_json::from_str(&raw)?;
    tracing_subscriber::fmt().with_env_filter("info").init();
    dotenvy::dotenv().ok();
    let url = std::env::var("DATABASE_URL")?;
    let pool = db::connect(&url).await?;
    db::apply_schema(&pool).await?;
    let mut inserted = 0u64;
    for r in &records {
        let res = sqlx::query(
            "INSERT INTO quest_mosques (name, address, district, jais_id) VALUES ($1, $2, $3, $4)
             ON CONFLICT (jais_id) DO NOTHING",
        )
        .bind(&r.nama)
        .bind(&r.alamat)
        .bind(&r.daerah)
        .bind(r.jaisId.to_string())
        .execute(&pool)
        .await?;
        inserted += res.rows_affected();
    }
    println!("done: {inserted} quest mosques inserted");
    Ok(())
}
