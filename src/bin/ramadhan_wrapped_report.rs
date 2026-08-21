use sedekahje::db;
use sedekahje::state::AppState;
use sedekahje::cache::Cache;
use std::sync::Arc;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt().with_env_filter("info").init();
    let url = std::env::var("DATABASE_URL")?;
    let pool = db::connect(&url).await?;
    db::apply_schema(&pool).await?;
    let cfg = sedekahje::config::load_config();
    let state = AppState {
        pool,
        cfg: Arc::new(cfg),
        cache: Cache::new(),
        r2: None,
    };
    let out_dir = std::env::args().find_map(|a| {
        a.strip_prefix("--outDir")
            .or_else(|| a.strip_prefix("--outDir="))
            .filter(|_| a.contains('='))
            .map(|v| v.to_string())
    }).or_else(|| std::env::args().nth(1)).unwrap_or_else(|| "./reports".into());

    // Reuse the page's wrapped stats computation.
    let stats = wrapped_stats(&state).await;
    let report = serde_json::json!({
        "generatedAt": chrono::Utc::now().to_rfc3339(),
        "summary": {
            "submissions": stats.submissions,
            "approved": stats.approved,
            "pending": stats.pending,
            "rejected": stats.rejected,
            "contributors": stats.contributors,
            "newUsers": stats.new_users,
            "avgPerDay": format!("{:.1}", stats.avg_per_day),
            "approvalRate": format!("{:.1}", stats.approval_rate),
            "topContributors": stats.top,
            "topStates": stats.top_states,
        }
    });
    let md = format!(
        r#"# Ramadhan Wrapped 2026 — Sedekah Je

## Headline numbers
- Institutions submitted: {sub}
- Approved: {appr} · Pending: {pending} · Rejected: {rej}
- Unique contributors: {contributors}
- New users: {new_users}
- Avg per day: {avg}
- Approval rate: {ar}%

## Top 5 contributors
{top}

## Top states
{states}

_Generated: {generated}_
"#,
        sub = stats.submissions,
        appr = stats.approved,
        pending = stats.pending,
        rej = stats.rejected,
        contributors = stats.contributors,
        new_users = stats.new_users,
        avg = format!("{:.1}", stats.avg_per_day),
        ar = format!("{:.1}", stats.approval_rate),
        top = stats
            .top
            .iter()
            .enumerate()
            .map(|(i, (n, c))| format!("{i}. {n} — {c} submissions"))
            .collect::<Vec<_>>()
            .join("\n"),
        states = stats
            .top_states
            .iter()
            .map(|(n, c)| format!("- {n}: {c}"))
            .collect::<Vec<_>>()
            .join("\n"),
        generated = chrono::Utc::now().to_rfc3339(),
    );
    std::fs::create_dir_all(&out_dir)?;
    let tag = "ramadhan-wrapped-2026-2026-02-19_to_2026-03-20";
    std::fs::write(format!("{out_dir}/{tag}.json"), serde_json::to_string_pretty(&report)?)?;
    std::fs::write(format!("{out_dir}/{tag}.md"), md)?;
    println!("report written to {out_dir}");
    Ok(())
}

struct WrappedSummary {
    submissions: i64,
    approved: i64,
    pending: i64,
    rejected: i64,
    contributors: i64,
    new_users: i64,
    top: Vec<(String, i64)>,
    top_states: Vec<(String, i64)>,
    avg_per_day: f64,
    approval_rate: f64,
}

async fn wrapped_stats(state: &AppState) -> WrappedSummary {
    use sqlx::Row;
    let start = chrono::DateTime::parse_from_rfc3339("2026-02-18T16:00:00Z").unwrap().with_timezone(&chrono::Utc);
    let end = chrono::DateTime::parse_from_rfc3339("2026-03-20T16:00:00Z").unwrap().with_timezone(&chrono::Utc);
    let row = sqlx::query(
        "SELECT COUNT(*), COUNT(*) FILTER (WHERE status='approved'), COUNT(*) FILTER (WHERE status='pending'), COUNT(*) FILTER (WHERE status='rejected')
         FROM institutions WHERE created_at >= $1 AND created_at < $2",
    )
    .bind(start).bind(end).fetch_one(&state.pool).await;
    let (submissions, approved, pending, rejected) = row
        .map(|r| (r.try_get::<i64,_>(0).unwrap_or(0), r.try_get::<i64,_>(1).unwrap_or(0), r.try_get::<i64,_>(2).unwrap_or(0), r.try_get::<i64,_>(3).unwrap_or(0)))
        .unwrap_or((0, 0, 0, 0));
    let contributors = sqlx::query("SELECT COUNT(DISTINCT contributor_id) FROM institutions WHERE created_at >= $1 AND created_at < $2").bind(start).bind(end).fetch_one(&state.pool).await.map(|r| r.try_get::<i64,_>(0).unwrap_or(0)).unwrap_or(0);
    let new_users = sqlx::query("SELECT COUNT(*) FROM users WHERE created_at >= $1 AND created_at < $2").bind(start).bind(end).fetch_one(&state.pool).await.map(|r| r.try_get::<i64,_>(0).unwrap_or(0)).unwrap_or(0);
    let top = fetch_pairs(&state, "SELECT COALESCE(NULLIF(users.name,''),'Anonymous') AS k, COUNT(*)::bigint AS n, users.name AS ord
         FROM institutions LEFT JOIN users ON institutions.contributor_id=users.id
         WHERE institutions.created_at >= $1 AND institutions.created_at < $2 AND institutions.contributor_id IS NOT NULL
         GROUP BY k, users.name ORDER BY n DESC, k ASC LIMIT 5", &start, &end).await;
    let top_states = fetch_pairs(&state, "SELECT state AS k, COUNT(*)::bigint AS n FROM institutions WHERE created_at >= $1 AND created_at < $2 GROUP BY k ORDER BY n DESC, k ASC LIMIT 5", &start, &end).await;
    WrappedSummary { submissions, approved, pending, rejected, contributors, new_users, top, top_states, avg_per_day: submissions as f64 / 30.0, approval_rate: if submissions>0 { approved as f64 / submissions as f64 * 100.0 } else { 0.0 } }
}

async fn fetch_pairs(state: &AppState, sql: &str, start: &chrono::DateTime<chrono::Utc>, end: &chrono::DateTime<chrono::Utc>) -> Vec<(String, i64)> {
    use sqlx::Row;
    sqlx::query(sql).bind(start).bind(end).fetch_all(&state.pool).await.map(|rows| {
        rows.iter().map(|r| (r.try_get::<String,_>("k").unwrap_or_default(), r.try_get::<i64,_>("n").unwrap_or(0))).collect()
    }).unwrap_or_default()
}
