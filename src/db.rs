use sqlx::postgres::PgPoolOptions;
use sqlx::{PgPool, Postgres};

pub async fn connect(database_url: &str) -> Result<PgPool, sqlx::Error> {
    let pool = PgPoolOptions::new()
        .max_connections(25)
        .min_connections(1)
        .acquire_timeout(std::time::Duration::from_secs(10))
        .connect(database_url)
        .await?;
    Ok(pool)
}

pub async fn apply_schema(pool: &PgPool) -> Result<(), sqlx::Error> {
    let sql = include_str!("../migrations/0001_init.sql");
    sqlx::raw_sql(sql).execute(pool).await?;
    Ok(())
}

pub type DbPool = PgPool;
pub type Tx<'a> = sqlx::Transaction<'a, Postgres>;
