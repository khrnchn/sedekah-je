use crate::constants::*;
use crate::models::*;
use chrono::{DateTime, Datelike, Duration, NaiveDate, Timelike, Utc};
use serde::Serialize;
use sqlx::{FromRow, PgPool, Row};

pub const PUB_SELECT: &str = r#"institutions.id::bigint AS id, institutions.name, institutions.slug,
 institutions.description, institutions.category, institutions.state, institutions.city,
 institutions.address, institutions.qr_image, institutions.qr_content,
 institutions.supported_payment, institutions.coords, institutions.social_media,
 institutions.status, institutions.contributor_id, institutions.contributor_remarks,
 institutions.source_url, institutions.reviewed_by, institutions.reviewed_at AT TIME ZONE 'UTC' AS reviewed_at,
 institutions.admin_notes, institutions.is_verified, institutions.is_active,
 institutions.created_at AT TIME ZONE 'UTC' AS created_at,
 institutions.updated_at AT TIME ZONE 'UTC' AS updated_at, users.email AS contributor_email"#;

pub const PUB_JOIN: &str = "LEFT JOIN users ON users.id = institutions.contributor_id";

#[derive(FromRow, Debug, Clone)]
pub struct InstitutionRow {
    pub id: i64,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub category: String,
    pub state: String,
    pub city: String,
    pub address: Option<String>,
    pub qr_image: Option<String>,
    pub qr_content: Option<String>,
    pub supported_payment: Option<serde_json::Value>,
    pub coords: Option<serde_json::Value>,
    pub social_media: Option<serde_json::Value>,
    pub status: String,
    pub contributor_id: Option<String>,
    pub contributor_remarks: Option<String>,
    pub source_url: Option<String>,
    pub reviewed_by: Option<String>,
    pub reviewed_at: Option<DateTime<Utc>>,
    pub admin_notes: Option<String>,
    pub is_verified: bool,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
    pub contributor_email: Option<String>,
}

impl From<InstitutionRow> for Institution {
    fn from(r: InstitutionRow) -> Self {
        Institution {
            id: r.id,
            name: r.name,
            slug: r.slug,
            description: r.description,
            category: r.category,
            state: r.state,
            city: r.city,
            address: r.address,
            qr_image: r.qr_image,
            qr_content: r.qr_content,
            supported_payment: r.supported_payment,
            coords: r.coords,
            social_media: r.social_media,
            status: r.status,
            contributor_id: r.contributor_id,
            contributor_remarks: r.contributor_remarks,
            source_url: r.source_url,
            reviewed_by: r.reviewed_by,
            reviewed_at: r.reviewed_at,
            admin_notes: r.admin_notes,
            is_verified: r.is_verified,
            is_active: r.is_active,
            created_at: r.created_at,
            updated_at: r.updated_at,
            contributor_email: r.contributor_email,
        }
    }
}

impl InstitutionRow {
    pub fn supported_payment_vec(&self) -> Vec<String> {
        self.supported_payment
            .as_ref()
            .and_then(|v| v.as_array())
            .map(|a| a.iter().filter_map(|x| x.as_str().map(String::from)).collect())
            .unwrap_or_default()
    }

    pub fn coords_pair(&self) -> Option<(f64, f64)> {
        self.coords.as_ref().and_then(|v| v.as_array()).and_then(|a| {
            if a.len() == 2 {
                let lat = a[0].as_f64()?;
                let lng = a[1].as_f64()?;
                Some((lat, lng))
            } else {
                None
            }
        })
    }

    pub fn claimable(&self) -> bool {
        self.contributor_id.is_none()
            || self
                .contributor_email
                .as_deref()
                .is_some_and(|e| e == CLAIMABLE_CONTRIBUTOR_EMAIL)
    }

    pub fn public(&self) -> InstitutionPublic {
        InstitutionPublic {
            id: self.id,
            name: self.name.clone(),
            slug: self.slug.clone(),
            description: self.description.clone(),
            category: self.category.clone(),
            state: self.state.clone(),
            city: self.city.clone(),
            qr_image: self.qr_image.clone(),
            qr_content: self.qr_content.clone(),
            supported_payment: self.supported_payment.clone(),
            coords: self.coords.clone(),
            contributor_id: self.contributor_id.clone(),
            claimable: self.contributor_id.is_none()
                || self
                    .contributor_email
                    .as_deref()
                    .is_some_and(|e| e == CLAIMABLE_CONTRIBUTOR_EMAIL),
        }
    }
    pub fn into_model(self) -> Institution {
        self.into()
    }
}

fn campaign_row_from_sql(r: &sqlx::postgres::PgRow) -> Result<(RamadhanCampaignRow, InstitutionRow), sqlx::Error> {
    let institution = InstitutionRow::from_row(r)?;
    let c = RamadhanCampaignRow {
        id: r.try_get("id")?,
        year: r.try_get("year")?,
        day_number: r.try_get("day_number")?,
        featured_date: r.try_get("featured_date")?,
        institution_id: r.try_get("institution_id")?,
        caption: r.try_get("caption")?,
        curated_by: r.try_get("curated_by")?,
    };
    Ok((c, institution))
}

#[derive(Default)]
pub struct PublicFilter {
    pub search: Option<String>,
    pub categories: Vec<String>,
    pub state: Option<String>,
}

fn public_where(filter: &PublicFilter) -> (String, Vec<String>) {
    let mut sql = String::from("institutions.status = 'approved'");
    let mut args: Vec<String> = Vec::new();
    if let Some(q) = filter.search.as_ref() {
        let q = q.trim();
        if !q.is_empty() {
            args.push(format!("%{}%", q.to_lowercase()));
            sql.push_str(&format!(
                " AND (LOWER(institutions.name) LIKE ${} OR LOWER(COALESCE(institutions.description,'')) LIKE ${} OR LOWER(institutions.city) LIKE ${})",
                args.len(), args.len(), args.len()
            ));
        }
    }
    if !filter.categories.is_empty() {
        let n = args.len();
        let mut placeholders = Vec::new();
        for c in &filter.categories {
            args.push(c.clone());
            placeholders.push(format!("${}", args.len()));
        }
        let _ = n;
        sql.push_str(&format!(
            " AND institutions.category IN ({})",
            placeholders.join(", ")
        ));
    }
    if let Some(state) = filter.state.as_ref() {
        if !state.is_empty() {
            args.push(state.clone());
            sql.push_str(&format!(" AND institutions.state = ${}", args.len()));
        }
    }
    (sql, args)
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Pagination {
    pub page: i64,
    pub limit: i64,
    pub total: i64,
    pub has_more: bool,
    pub total_pages: i64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Facets {
    pub category_counts: serde_json::Map<String, serde_json::Value>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstitutionPage {
    pub institutions: Vec<InstitutionPublic>,
    pub pagination: Pagination,
    pub facets: Facets,
}

impl Pagination {
    fn new(page: i64, limit: i64, total: i64) -> Self {
        let total_pages = if total == 0 { 0 } else { (total + limit - 1) / limit };
        Pagination {
            page,
            limit,
            total,
            has_more: page < total_pages,
            total_pages,
        }
    }
}

pub async fn get_public_institutions_page(
    pool: &PgPool,
    filter: &PublicFilter,
    page: i64,
    limit: i64,
) -> Result<InstitutionPage, sqlx::Error> {
    let rows = get_public_rows(pool, filter, page, limit).await?;
    let (where_sql, args) = public_where(filter);

    let count_sql = format!(
        "SELECT COUNT(*) FROM institutions WHERE {}",
        where_sql
    );
    let mut qc = sqlx::query(&count_sql);
    for a in &args {
        qc = qc.bind(a);
    }
    let total: i64 = qc.fetch_one(pool).await?.try_get(0)?;

    // Facets: category counts using search+state conditions but not category filter.
    let mut facet_filter = PublicFilter {
        search: filter.search.clone(),
        categories: vec![],
        state: filter.state.clone(),
    };
    let (facet_sql, fargs) = public_where(&mut facet_filter);
    let fcount_sql = format!(
        "SELECT institutions.category, COUNT(*) FROM institutions WHERE {} GROUP BY institutions.category",
        facet_sql
    );
    let mut qf = sqlx::query(&fcount_sql);
    for a in &fargs {
        qf = qf.bind(a);
    }
    let mut category_counts = serde_json::Map::new();
    for cat in CATEGORIES {
        category_counts.insert(cat.to_string(), serde_json::Value::from(0));
    }
    let facet_rows = qf.fetch_all(pool).await?;
    for row in facet_rows {
        let cat: String = row.try_get(0)?;
        let count: i64 = row.try_get(1)?;
        category_counts.insert(normalize_institution_category(&cat).to_string(), count.into());
    }

    Ok(InstitutionPage {
        institutions: rows.iter().map(|r| r.public()).collect(),
        pagination: Pagination::new(page, limit, total),
        facets: Facets { category_counts },
    })
}

/// Full-row paginated approved institutions (used for server-rendered cards).
pub async fn get_public_rows(
    pool: &PgPool,
    filter: &PublicFilter,
    page: i64,
    limit: i64,
) -> Result<Vec<InstitutionRow>, sqlx::Error> {
    let (where_sql, mut args) = public_where(filter);
    let offset = (page - 1) * limit;
    let sql = format!(
        "SELECT {} FROM institutions {PUB_JOIN} WHERE {} ORDER BY LOWER(BTRIM(institutions.name)) ASC, institutions.id ASC LIMIT ${} OFFSET ${}",
        PUB_SELECT, where_sql, args.len() + 1, args.len() + 2
    );
    let mut q = sqlx::query_as::<_, InstitutionRow>(&sql);
    for a in &args {
        q = q.bind(a);
    }
    let rows = q.bind(limit).bind(offset).fetch_all(pool).await?;
    Ok(rows)
}

pub async fn get_public_institution_markers(
    pool: &PgPool,
    filter: &PublicFilter,
) -> Result<Vec<InstitutionPublic>, sqlx::Error> {
    let (where_sql, args) = public_where(filter);
    let sql = format!(
        "SELECT {} FROM institutions {PUB_JOIN} WHERE {} AND institutions.coords IS NOT NULL ORDER BY LOWER(BTRIM(institutions.name)) ASC, institutions.id ASC",
        PUB_SELECT, where_sql
    );
    let mut q = sqlx::query_as::<_, InstitutionRow>(&sql);
    for a in &args {
        q = q.bind(a);
    }
    let rows: Vec<InstitutionRow> = q.fetch_all(pool).await?;
    Ok(rows.iter().map(|r| r.public()).collect())
}

pub async fn get_all_approved(pool: &PgPool) -> Result<Vec<InstitutionRow>, sqlx::Error> {
    let sql = format!(
        "SELECT {} FROM institutions {PUB_JOIN} WHERE institutions.status = 'approved' ORDER BY LOWER(BTRIM(institutions.name)) ASC, institutions.id ASC",
        PUB_SELECT
    );
    let rows = sqlx::query_as::<_, InstitutionRow>(&sql)
        .fetch_all(pool)
        .await?;
    Ok(rows)
}

pub async fn get_institution_by_slug(
    pool: &PgPool,
    slug: &str,
) -> Result<Option<InstitutionRow>, sqlx::Error> {
    let sql = format!(
        "SELECT {} FROM institutions {PUB_JOIN} WHERE institutions.slug = $1 AND institutions.status = 'approved' LIMIT 1",
        PUB_SELECT
    );
    sqlx::query_as::<_, InstitutionRow>(&sql)
        .bind(slug)
        .fetch_optional(pool)
        .await
}

pub async fn get_institution_by_id(
    pool: &PgPool,
    id: i64,
) -> Result<Option<InstitutionRow>, sqlx::Error> {
    let sql = format!(
        "SELECT {} FROM institutions {PUB_JOIN} WHERE institutions.id = $1 LIMIT 1",
        PUB_SELECT
    );
    sqlx::query_as::<_, InstitutionRow>(&sql)
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn count_institutions(pool: &PgPool) -> Result<i64, sqlx::Error> {
    let row = sqlx::query("SELECT COUNT(*) FROM institutions")
        .fetch_one(pool)
        .await?;
    row.try_get(0)
}

pub async fn slug_exists(pool: &PgPool, slug: &str) -> Result<bool, sqlx::Error> {
    let row = sqlx::query("SELECT EXISTS(SELECT 1 FROM institutions WHERE slug = $1)")
        .bind(slug)
        .fetch_one(pool)
        .await?;
    row.try_get(0)
}

pub async fn generate_unique_slug(
    pool: &PgPool,
    slug: &str,
    exclude_id: Option<i64>,
) -> Result<String, sqlx::Error> {
    let base = slugify(slug);
    if base.is_empty() {
        return Ok(default_slug());
    }
    let mut candidate = base.clone();
    let mut n = 1;
    loop {
        let row = sqlx::query(
            "SELECT EXISTS(SELECT 1 FROM institutions WHERE slug = $1 AND ($2::bigint IS NULL OR id <> $2))",
        )
        .bind(&candidate)
        .bind(exclude_id)
        .fetch_one(pool)
        .await?;
        let exists: bool = row.try_get(0)?;
        if !exists {
            return Ok(slugify(&candidate));
        }
        n += 1;
        candidate = format!("{}-{}", base, n);
    }
}

fn default_slug() -> String {
    "institusi".to_string()
}

pub async fn qr_content_exists(pool: &PgPool, qr: &str) -> Result<bool, sqlx::Error> {
    let row = sqlx::query("SELECT EXISTS(SELECT 1 FROM institutions WHERE qr_content = $1)")
        .bind(qr.trim())
        .fetch_one(pool)
        .await?;
    row.try_get(0)
}

pub async fn get_user_by_id(pool: &PgPool, id: &str) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as::<_, User>(
        r#"SELECT id, email, username, name, avatar_url, image, email_verified, role, is_active,
           banned, ban_reason, ban_expires, created_at AT TIME ZONE 'UTC' AS created_at, updated_at AT TIME ZONE 'UTC' AS updated_at, onboarding_tour_state,
           onboarding_tour_current_route, onboarding_tour_current_step::bigint AS onboarding_tour_current_step,
           onboarding_tour_started_at AT TIME ZONE 'UTC' AS onboarding_tour_started_at, onboarding_tour_completed_at AT TIME ZONE 'UTC' AS onboarding_tour_completed_at, onboarding_tour_skipped_at AT TIME ZONE 'UTC' AS onboarding_tour_skipped_at
           FROM users WHERE id = $1"#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn get_user_by_email(pool: &PgPool, email: &str) -> Result<Option<User>, sqlx::Error> {
    sqlx::query_as::<_, User>(
        r#"SELECT id, email, username, name, avatar_url, image, email_verified, role, is_active,
           banned, ban_reason, ban_expires, created_at AT TIME ZONE 'UTC' AS created_at, updated_at AT TIME ZONE 'UTC' AS updated_at, onboarding_tour_state,
           onboarding_tour_current_route, onboarding_tour_current_step::bigint AS onboarding_tour_current_step,
           onboarding_tour_started_at AT TIME ZONE 'UTC' AS onboarding_tour_started_at, onboarding_tour_completed_at AT TIME ZONE 'UTC' AS onboarding_tour_completed_at, onboarding_tour_skipped_at AT TIME ZONE 'UTC' AS onboarding_tour_skipped_at
           FROM users WHERE email = $1"#,
    )
    .bind(email)
    .fetch_optional(pool)
    .await
}

pub async fn count_users(pool: &PgPool) -> Result<i64, sqlx::Error> {
    let row = sqlx::query("SELECT COUNT(*) FROM users")
        .fetch_one(pool)
        .await?;
    row.try_get(0)
}

// ---------- Friday campaign ----------

pub fn friday_campaign_window_now() -> Option<NaiveDate> {
    // Active window: Thursday 19:00 MYT through Friday 19:00 MYT.
    // Comparing in MYT requires UTC<->MYT (+8, no DST) math.
    let utc_now = chrono::Utc::now();
    let myt = utc_now + Duration::hours(8);
    let myt_date = myt.date_naive();
    let hour = myt.hour();
    let weekday = myt_date.weekday().num_days_from_monday(); // Friday = 4
    if hour >= 19 {
        let rolled = myt_date.succ_opt().unwrap_or(myt_date);
        if rolled.weekday().num_days_from_monday() == 4 {
            return Some(rolled);
        }
        return None;
    }
    if weekday == 4 {
        return Some(myt_date);
    }
    None
}

pub async fn get_friday_campaign_settings(
    pool: &PgPool,
) -> Result<Option<FridaySettingsRow>, sqlx::Error> {
    sqlx::query_as::<_, FridaySettingsRow>(
        "SELECT id::bigint AS id, active_override_institution_id::bigint AS active_override_institution_id, updated_by FROM friday_campaign_settings WHERE id = 1",
    )
    .fetch_optional(pool)
    .await
}

pub async fn get_current_friday_campaign(
    pool: &PgPool,
) -> Result<Option<InstitutionRow>, sqlx::Error> {
    let Some(date) = friday_campaign_window_now() else {
        return Ok(None);
    };
    // Existing run?
    let run_row = sqlx::query_as::<_, FridayRun>(
        "SELECT id::bigint AS id, featured_date, institution_id::bigint AS institution_id, source, selected_by FROM friday_campaign_runs WHERE featured_date = $1",
    )
    .bind(date)
    .fetch_optional(pool)
    .await?;

    let (institution_id, source, selected_by) = if let Some(run) = run_row {
        (run.institution_id, run.source, run.selected_by)
    } else if let Some(settings) = get_friday_campaign_settings(pool).await? {
        if let Some(ov) = settings.active_override_institution_id {
            // Upsert override run
            let _ = sqlx::query(
                r#"INSERT INTO friday_campaign_runs (featured_date, institution_id, source, selected_by)
                   VALUES ($1, $2, 'override', $3)
                   ON CONFLICT (featured_date) DO UPDATE SET institution_id = EXCLUDED.institution_id,
                     source = EXCLUDED.source, selected_by = EXCLUDED.selected_by, updated_at = now()"#,
            )
            .bind(date)
            .bind(ov)
            .bind(&settings.updated_by)
            .execute(pool)
            .await?;
            (ov, "override".to_string(), settings.updated_by)
        } else {
            // Random pick (first hit only, ON CONFLICT DO NOTHING)
            let row = sqlx::query(
                "SELECT id FROM institutions WHERE status = 'approved' ORDER BY RANDOM() LIMIT 1",
            )
            .fetch_optional(pool)
            .await?;
            let Some(r) = row else { return Ok(None) };
            let inst_id: i64 = r.try_get(0)?;
            let _ = sqlx::query(
                r#"INSERT INTO friday_campaign_runs (featured_date, institution_id, source)
                   VALUES ($1, $2, 'random') ON CONFLICT (featured_date) DO NOTHING"#,
            )
            .bind(date)
            .bind(inst_id)
            .execute(pool)
            .await?;
            (inst_id, "random".to_string(), None)
        }
    } else {
        let row = sqlx::query(
            "SELECT id FROM institutions WHERE status = 'approved' ORDER BY RANDOM() LIMIT 1",
        )
        .fetch_optional(pool)
        .await?;
        let Some(r) = row else { return Ok(None) };
        let inst_id: i64 = r.try_get(0)?;
        let _ = sqlx::query(
            r#"INSERT INTO friday_campaign_runs (featured_date, institution_id, source)
               VALUES ($1, $2, 'random') ON CONFLICT (featured_date) DO NOTHING"#,
        )
        .bind(date)
        .bind(inst_id)
        .execute(pool)
        .await?;
        (inst_id, "random".to_string(), None)
    };
    let _ = source;
    let _ = selected_by;
    get_institution_by_id(pool, institution_id).await
}

pub async fn get_admin_friday_data(
    pool: &PgPool,
) -> Result<(Option<InstitutionRow>, Vec<FridayFavourite>, Option<NaiveDate>), sqlx::Error> {
    let current = get_current_friday_campaign(pool).await?;
    let date = friday_campaign_window_now();
    let favourites = sqlx::query_as::<_, FridayFavourite>(
        r#"SELECT f.id::bigint AS id, f.institution_id::bigint AS institution_id, f.note, f.sort_order::bigint AS sort_order, f.created_by,
           i.name, i.state, i.category
           FROM friday_campaign_favourites f
           JOIN institutions i ON i.id = f.institution_id
           ORDER BY f.sort_order ASC, i.name ASC"#,
    )
    .fetch_all(pool)
    .await?;
    Ok((current, favourites, date))
}

pub async fn set_friday_override(
    pool: &PgPool,
    institution_id: Option<i64>,
    updated_by: &str,
) -> Result<(), sqlx::Error> {
    if let Some(id) = institution_id {
        let row = sqlx::query(
            "SELECT EXISTS(SELECT 1 FROM institutions WHERE id = $1 AND status = 'approved')",
        )
        .bind(id)
        .fetch_one(pool)
        .await?;
        let ok: bool = row.try_get(0)?;
        if !ok {
            return Err(sqlx::Error::RowNotFound);
        }
    }
    sqlx::query(
        r#"INSERT INTO friday_campaign_settings (id, active_override_institution_id, updated_by, updated_at)
           VALUES (1, $1, $2, now())
           ON CONFLICT (id) DO UPDATE SET active_override_institution_id = EXCLUDED.active_override_institution_id,
             updated_by = EXCLUDED.updated_by, updated_at = now()"#,
    )
    .bind(institution_id)
    .bind(updated_by)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn add_friday_favourite(
    pool: &PgPool,
    institution_id: i64,
    created_by: &str,
) -> Result<(), sqlx::Error> {
    let row = sqlx::query(
        "SELECT EXISTS(SELECT 1 FROM institutions WHERE id = $1 AND status = 'approved')",
    )
    .bind(institution_id)
    .fetch_one(pool)
    .await?;
    let ok: bool = row.try_get(0)?;
    if !ok {
        return Err(sqlx::Error::RowNotFound);
    }
    sqlx::query(
        "INSERT INTO friday_campaign_favourites (institution_id, created_by) VALUES ($1, $2) ON CONFLICT (institution_id) DO NOTHING",
    )
    .bind(institution_id)
    .bind(created_by)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn remove_friday_favourite(pool: &PgPool, favourite_id: i64) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM friday_campaign_favourites WHERE id = $1")
        .bind(favourite_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn search_approved(conn: &PgPool, query: &str) -> Result<Vec<InstitutionRow>, sqlx::Error> {
    let sql = format!(
        "SELECT {} FROM institutions {PUB_JOIN} WHERE institutions.status = 'approved' AND (LOWER(institutions.name) LIKE $1 OR LOWER(institutions.slug) LIKE $1 OR LOWER(institutions.city) LIKE $1 OR LOWER(institutions.state) LIKE $1 OR LOWER(institutions.category) LIKE $1) ORDER BY LOWER(institutions.name) ASC, institutions.id ASC LIMIT 30",
        PUB_SELECT
    );
    let q = format!("%{}%", query.to_lowercase());
    let rows = sqlx::query_as::<_, InstitutionRow>(&sql)
        .bind(q)
        .fetch_all(conn)
        .await?;
    Ok(rows)
}

// ---------- Ramadhan ----------

pub async fn ramadhan_campaign_by_year(
    pool: &PgPool,
    year: i64,
) -> Result<Vec<(RamadhanCampaignRow, InstitutionRow)>, sqlx::Error> {
    let sql = format!(
        "SELECT c.id, c.year, c.day_number, c.featured_date, c.institution_id, c.caption, c.curated_by, {PUB_SELECT}
         FROM ramadhan_campaigns c JOIN institutions ON institutions.id = c.institution_id
         WHERE c.year = $1 ORDER BY c.day_number ASC",
    );
    let rows = sqlx::query(&sql).bind(year).fetch_all(pool).await?;
    let mut out = Vec::new();
    for r in rows {
        out.push(campaign_row_from_sql(&r)?);
    }
    Ok(out)
}

pub async fn ramadhan_todays_featured(
    pool: &PgPool,
    date: NaiveDate,
) -> Result<Option<(RamadhanCampaignRow, InstitutionRow)>, sqlx::Error> {
    let sql = format!(
        "SELECT c.id, c.year, c.day_number, c.featured_date, c.institution_id, c.caption, c.curated_by, {PUB_SELECT}
         FROM ramadhan_campaigns c JOIN institutions ON institutions.id = c.institution_id
         WHERE c.featured_date = $1 LIMIT 1",
    );
    let rows = sqlx::query(&sql).bind(date).fetch_all(pool).await?;
    for r in rows {
        return Ok(Some(campaign_row_from_sql(&r)?));
    }
    Ok(None)
}

pub async fn ramadhan_og_day(
    pool: &PgPool,
    year: i64,
    day: i64,
) -> Result<Option<(RamadhanCampaignRow, InstitutionRow)>, sqlx::Error> {
    let sql = format!(
        "SELECT c.id, c.year, c.day_number, c.featured_date, c.institution_id, c.caption, c.curated_by, {PUB_SELECT}
         FROM ramadhan_campaigns c JOIN institutions ON institutions.id = c.institution_id
         WHERE c.year = $1 AND c.day_number = $2 LIMIT 1",
    );
    let rows = sqlx::query(&sql).bind(year).bind(day).fetch_all(pool).await?;
    for r in rows {
        return Ok(Some(campaign_row_from_sql(&r)?));
    }
    Ok(None)
}

// ---------- Quest ----------

pub async fn quest_mosques(pool: &PgPool) -> Result<Vec<QuestMosqueRow>, sqlx::Error> {
    sqlx::query_as::<_, QuestMosqueRow>(
        "SELECT q.id::bigint AS id, q.name, q.address, q.district, q.jais_id, q.coords, q.institution_id::bigint AS institution_id,
                i.status AS inst_status, i.slug AS inst_slug, i.category AS inst_category,
                i.qr_content AS inst_qr, q.created_at AT TIME ZONE 'UTC' AS created_at, q.updated_at AT TIME ZONE 'UTC' AS updated_at
         FROM quest_mosques q LEFT JOIN institutions i ON i.id = q.institution_id
         ORDER BY q.name ASC",
    )
    .fetch_all(pool)
    .await
}

#[derive(FromRow, Debug, Clone)]
pub struct QuestMosqueRow {
    pub id: i64,
    pub name: String,
    pub address: Option<String>,
    pub district: String,
    pub jais_id: String,
    pub coords: Option<serde_json::Value>,
    pub institution_id: Option<i64>,
    pub inst_status: Option<String>,
    pub inst_slug: Option<String>,
    pub inst_category: Option<String>,
    pub inst_qr: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
}

impl QuestMosqueRow {
    pub fn state(&self) -> &str {
        self.inst_status.as_deref().unwrap_or("unlinked")
    }
    pub fn is_unlocked(&self) -> bool {
        self.inst_status.as_deref() == Some("approved")
    }
    pub fn is_pending(&self) -> bool {
        self.inst_status.as_deref() == Some("pending")
    }
    pub fn coords_pair(&self) -> Option<(f64, f64)> {
        self.coords
            .as_ref()
            .and_then(|v| v.as_array())
            .and_then(|a| {
                if a.len() == 2 {
                    Some((a[0].as_f64()?, a[1].as_f64()?))
                } else {
                    None
                }
            })
    }
}

pub async fn get_quest_mosque_by_id(pool: &PgPool, id: i64) -> Result<Option<QuestMosque>, sqlx::Error> {
    sqlx::query_as::<_, QuestMosque>(
        "SELECT id::bigint AS id, name, address, district, jais_id, coords, institution_id::bigint AS institution_id, created_at AT TIME ZONE 'UTC' AS created_at, updated_at AT TIME ZONE 'UTC' AS updated_at FROM quest_mosques WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn quest_stats(pool: &PgPool) -> Result<(i64, i64), sqlx::Error> {
    let row = sqlx::query(
        "SELECT COUNT(*) AS total, COUNT(i.id) FILTER (WHERE i.status = 'approved') AS unlocked
         FROM quest_mosques q LEFT JOIN institutions i ON i.id = q.institution_id",
    )
    .fetch_one(pool)
    .await?;
    let total: i64 = row.try_get(0)?;
    let unlocked: i64 = row.try_get(1)?;
    Ok((unlocked, total))
}

pub async fn quest_leaderboard(pool: &PgPool) -> Result<Vec<QuestLeaderRow>, sqlx::Error> {
    sqlx::query_as::<_, QuestLeaderRow>(
        "SELECT count(q.id)::bigint AS count,
                coalesce(NULLIF(u.name,''), NULLIF(u.username,''), 'Anonymous') AS name,
                coalesce(u.image, u.avatar_url) AS avatar, i.contributor_id AS contributor_id
         FROM quest_mosques q JOIN institutions i ON i.id = q.institution_id
         LEFT JOIN users u ON u.id = i.contributor_id
         WHERE i.contributor_id IS NOT NULL AND i.status = 'approved'
         GROUP BY i.contributor_id, u.name, u.username, u.image, u.avatar_url
         ORDER BY count DESC, name ASC, i.contributor_id ASC LIMIT 10",
    )
    .fetch_all(pool)
    .await
}

#[derive(FromRow, Debug, Clone)]
pub struct QuestLeaderRow {
    pub count: i64,
    pub name: String,
    pub avatar: Option<String>,
    pub contributor_id: String,
}

// ---------- Blog ----------

pub async fn published_blog_posts(
    pool: &PgPool,
    page: i64,
) -> Result<(Vec<BlogPost>, i64), sqlx::Error> {
    let per = BLOG_PAGE_SIZE;
    let off = (page - 1) * per;
    let rows = sqlx::query_as::<_, BlogPost>(
        r#"SELECT p.id::bigint AS id, p.title, p.slug, p.excerpt, p.cover_image_url, p.content_json, p.status,
           p.featured, p.meta_title, p.meta_description, p.og_image_url, p.published_at AT TIME ZONE 'UTC' AS published_at,
           p.author_id, p.created_at AT TIME ZONE 'UTC' AS created_at, p.updated_at AT TIME ZONE 'UTC' AS updated_at, u.name AS author_name
           FROM blog_posts p LEFT JOIN users u ON u.id = p.author_id
           WHERE p.status = 'published'
           ORDER BY p.published_at DESC, p.id DESC
           LIMIT $1 OFFSET $2"#,
    )
    .bind(per)
    .bind(off)
    .fetch_all(pool)
    .await?;
    let row = sqlx::query("SELECT COUNT(*) FROM blog_posts WHERE status = 'published'")
        .fetch_one(pool)
        .await?;
    let total: i64 = row.try_get(0)?;
    Ok((rows, total))
}

pub async fn featured_blog_post(pool: &PgPool) -> Result<Option<BlogPost>, sqlx::Error> {
    sqlx::query_as::<_, BlogPost>(
        r#"SELECT p.id::bigint AS id, p.title, p.slug, p.excerpt, p.cover_image_url, p.content_json, p.status,
           p.featured, p.meta_title, p.meta_description, p.og_image_url, p.published_at AT TIME ZONE 'UTC' AS published_at,
           p.author_id, p.created_at AT TIME ZONE 'UTC' AS created_at, p.updated_at AT TIME ZONE 'UTC' AS updated_at, u.name AS author_name
           FROM blog_posts p LEFT JOIN users u ON u.id = p.author_id
           WHERE p.status = 'published' AND p.featured = true
           ORDER BY p.published_at DESC LIMIT 1"#,
    )
    .fetch_optional(pool)
    .await
}

pub async fn published_blog_by_slug(pool: &PgPool, slug: &str) -> Result<Option<BlogPost>, sqlx::Error> {
    sqlx::query_as::<_, BlogPost>(
        r#"SELECT p.id::bigint AS id, p.title, p.slug, p.excerpt, p.cover_image_url, p.content_json, p.status,
           p.featured, p.meta_title, p.meta_description, p.og_image_url, p.published_at AT TIME ZONE 'UTC' AS published_at,
           p.author_id, p.created_at AT TIME ZONE 'UTC' AS created_at, p.updated_at AT TIME ZONE 'UTC' AS updated_at, u.name AS author_name
           FROM blog_posts p LEFT JOIN users u ON u.id = p.author_id
           WHERE p.status = 'published' AND p.slug = $1 LIMIT 1"#,
    )
    .bind(slug)
    .fetch_optional(pool)
    .await
}

pub async fn all_blog_posts(pool: &PgPool) -> Result<Vec<BlogPost>, sqlx::Error> {
    sqlx::query_as::<_, BlogPost>(
        r#"SELECT p.id::bigint AS id, p.title, p.slug, p.excerpt, p.cover_image_url, p.content_json, p.status,
           p.featured, p.meta_title, p.meta_description, p.og_image_url, p.published_at AT TIME ZONE 'UTC' AS published_at,
           p.author_id, p.created_at AT TIME ZONE 'UTC' AS created_at, p.updated_at AT TIME ZONE 'UTC' AS updated_at, u.name AS author_name
           FROM blog_posts p LEFT JOIN users u ON u.id = p.author_id
           ORDER BY p.updated_at DESC, p.created_at DESC"#,
    )
    .fetch_all(pool)
    .await
}

pub async fn blog_post_by_id(pool: &PgPool, id: i64) -> Result<Option<BlogPost>, sqlx::Error> {
    sqlx::query_as::<_, BlogPost>(
        r#"SELECT p.id::bigint AS id, p.title, p.slug, p.excerpt, p.cover_image_url, p.content_json, p.status,
           p.featured, p.meta_title, p.meta_description, p.og_image_url, p.published_at AT TIME ZONE 'UTC' AS published_at,
           p.author_id, p.created_at AT TIME ZONE 'UTC' AS created_at, p.updated_at AT TIME ZONE 'UTC' AS updated_at, u.name AS author_name
           FROM blog_posts p LEFT JOIN users u ON u.id = p.author_id
           WHERE p.id = $1 LIMIT 1"#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn blog_slug_exists(pool: &PgPool, slug: &str, exclude_id: Option<i64>) -> Result<bool, sqlx::Error> {
    let row = sqlx::query(
        "SELECT EXISTS(SELECT 1 FROM blog_posts WHERE slug = $1 AND ($2::bigint IS NULL OR id <> $2))",
    )
    .bind(slug)
    .bind(exclude_id)
    .fetch_one(pool)
    .await?;
    row.try_get(0)
}

// ---------- Leaderboard ----------

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LeaderboardStats {
    pub total_contributors: i64,
    pub total_contributions: i64,
    pub most_active_contributions: i64,
    pub approval_rate: f64,
}

pub async fn leaderboard_stats(pool: &PgPool) -> Result<LeaderboardStats, sqlx::Error> {
    let row = sqlx::query(
        "SELECT COUNT(*), COUNT(DISTINCT contributor_id)
         FROM institutions WHERE is_active = true AND status = 'approved'",
    )
    .fetch_one(pool)
    .await?;
    let total_contributions: i64 = row.try_get(0)?;
    let total_contributors: i64 = row.try_get(1)?;

    let row2 = sqlx::query(
        "SELECT status, COUNT(*) FROM institutions
         WHERE is_active = true AND status IN ('approved','rejected')
         GROUP BY status",
    )
    .fetch_all(pool)
    .await?;
    let mut approved = 0i64;
    let mut rejected = 0i64;
    for r in row2 {
        let status: String = r.try_get(0)?;
        let c: i64 = r.try_get(1)?;
        if status == "approved" {
            approved = c;
        } else {
            rejected = c;
        }
    }
    let approval_rate = if approved + rejected > 0 {
        (approved as f64 / (approved + rejected) as f64) * 100.0
    } else {
        0.0
    };

    let row3 = sqlx::query(
        "SELECT COUNT(*) FROM institutions
         WHERE is_active = true AND status = 'approved'
         GROUP BY contributor_id ORDER BY COUNT(*) DESC LIMIT 1",
    )
    .fetch_optional(pool)
    .await?;
    let most_active_contributions = match row3 {
        Some(r) => r.try_get::<i64, _>(0)?,
        None => 0,
    };

    Ok(LeaderboardStats {
        total_contributors,
        total_contributions,
        most_active_contributions,
        approval_rate,
    })
}

#[derive(Serialize, Clone)]
pub struct TopContributor {
    pub rank: i64,
    pub name: String,
    pub contributions: i64,
    pub avatar: Option<String>,
    pub contributor_id: Option<String>,
}

pub async fn leaderboard_top(pool: &PgPool) -> Result<Vec<TopContributor>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT institutions.contributor_id, COUNT(*) AS contribution_count, users.name, users.avatar_url
         FROM institutions LEFT JOIN users ON institutions.contributor_id = users.id
         WHERE institutions.is_active = true AND institutions.status = 'approved'
           AND institutions.contributor_id IS NOT NULL
         GROUP BY institutions.contributor_id, users.name, users.avatar_url
         ORDER BY COUNT(*) DESC LIMIT 20",
    )
    .fetch_all(pool)
    .await?;
    let mut out = Vec::new();
    for (i, r) in rows.iter().enumerate() {
        let contributor_id: String = r.try_get(0)?;
        let count: i64 = r.try_get(1)?;
        let name: Option<String> = r.try_get(2)?;
        let avatar: Option<String> = r.try_get(3)?;
        out.push(TopContributor {
            rank: (i + 1) as i64,
            name: name.filter(|s| !s.is_empty()).unwrap_or_else(|| "Anonymous".into()),
            contributions: count,
            avatar,
            contributor_id: Some(contributor_id),
        });
    }
    Ok(out)
}

#[derive(Serialize)]
pub struct UserRank {
    pub rank: i64,
    pub contributions: i64,
}

pub async fn leaderboard_rank_for_user(
    pool: &PgPool,
    user_id: &str,
) -> Result<Option<UserRank>, sqlx::Error> {
    let rows = sqlx::query(
        "SELECT institutions.contributor_id, COUNT(*) AS contribution_count
         FROM institutions
         WHERE institutions.is_active = true AND institutions.status = 'approved'
           AND institutions.contributor_id IS NOT NULL
         GROUP BY institutions.contributor_id
         ORDER BY COUNT(*) DESC",
    )
    .fetch_all(pool)
    .await?;
    for (i, r) in rows.iter().enumerate() {
        let cid: String = r.try_get(0)?;
        if cid == user_id {
            let contributions: i64 = r.try_get(1)?;
            return Ok(Some(UserRank {
                rank: (i + 1) as i64,
                contributions,
            }));
        }
    }
    Ok(None)
}

// ---------- My contributions ----------

#[derive(Serialize, Clone, FromRow)]
pub struct MyContribution {
    pub id: i64,
    pub name: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub category: String,
    pub slug: String,
    pub admin_notes: Option<String>,
}

pub async fn my_contributions(
    pool: &PgPool,
    user_id: &str,
) -> Result<Vec<MyContribution>, sqlx::Error> {
    let rows = sqlx::query_as::<_, MyContribution>(
        "SELECT id::bigint AS id, name, status, created_at AT TIME ZONE 'UTC' AS created_at, category, slug, admin_notes
         FROM institutions WHERE contributor_id = $1 ORDER BY created_at DESC",
    )
    .bind(user_id)
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

#[derive(Serialize)]
pub struct MyContributionStats {
    pub total_contributions: i64,
    pub approved_contributions: i64,
    pub pending_contributions: i64,
    pub rejected_contributions: i64,
}

pub async fn my_contribution_stats(
    pool: &PgPool,
    user_id: &str,
) -> Result<MyContributionStats, sqlx::Error> {
    let row = sqlx::query(
        "SELECT COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status = 'approved') AS approved,
                COUNT(*) FILTER (WHERE status = 'pending') AS pending,
                COUNT(*) FILTER (WHERE status = 'rejected') AS rejected
         FROM institutions WHERE contributor_id = $1",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    Ok(MyContributionStats {
        total_contributions: row.try_get(0)?,
        approved_contributions: row.try_get(1)?,
        pending_contributions: row.try_get(2)?,
        rejected_contributions: row.try_get(3)?,
    })
}

/// 3/day rate limit (admins bypass). Returns None when allowed, else cooldown end timestamp.
pub async fn contribution_cooldown(
    pool: &PgPool,
    user_id: &str,
    is_admin: bool,
) -> Result<Option<DateTime<Utc>>, sqlx::Error> {
    if is_admin {
        return Ok(None);
    }
    let day_ago = Utc::now() - Duration::days(1);
    let rows = sqlx::query(
        "SELECT created_at FROM institutions
         WHERE contributor_id = $1 AND created_at >= $2
         ORDER BY created_at DESC",
    )
    .bind(user_id)
    .bind(day_ago)
    .fetch_all(pool)
    .await?;
    if rows.len() < 3 {
        return Ok(None);
    }
    let times: Vec<DateTime<Utc>> = rows.iter().map(|r| r.get::<DateTime<Utc>, _>(0)).collect();
    let newest = times[0];
    let oldest = *times.last().unwrap();
    let a = newest + Duration::hours(12);
    let b = oldest + Duration::hours(24);
    Ok(Some(a.max(b)))
}

// ---------- Admin ----------

#[derive(Serialize)]
pub struct DashboardStats {
    pub total: i64,
    pub pending: i64,
    pub approved: i64,
    pub rejected: i64,
}

pub async fn dashboard_stats(pool: &PgPool) -> Result<DashboardStats, sqlx::Error> {
    let row = sqlx::query(
        "SELECT COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status = 'pending') AS pending,
                COUNT(*) FILTER (WHERE status = 'approved') AS approved,
                COUNT(*) FILTER (WHERE status = 'rejected') AS rejected
         FROM institutions",
    )
    .fetch_one(pool)
    .await?;
    Ok(DashboardStats {
        total: row.try_get(0)?,
        pending: row.try_get(1)?,
        approved: row.try_get(2)?,
        rejected: row.try_get(3)?,
    })
}

impl RecentActivity {
    pub fn view_link(&self) -> String {
        format!("/admin/institutions/{}/{}", self.status, self.id)
    }
}

#[derive(FromRow, Serialize)]
pub struct RecentActivity {
    pub id: i64,
    pub name: String,
    pub status: String,
    pub category: String,
    pub state: String,
    pub city: String,
    pub contributor_name: Option<String>,
    pub created_at: DateTime<Utc>,
    pub reviewed_at: Option<DateTime<Utc>>,
}

pub async fn recent_activities(pool: &PgPool) -> Result<Vec<RecentActivity>, sqlx::Error> {
    sqlx::query_as::<_, RecentActivity>(
        r#"SELECT i.id::bigint AS id, i.name, i.status, i.category, i.state, i.city, u.name AS contributor_name,
           i.created_at AT TIME ZONE 'UTC' AS created_at, i.reviewed_at AT TIME ZONE 'UTC' AS reviewed_at
           FROM institutions i LEFT JOIN users u ON u.id = i.contributor_id
           ORDER BY i.created_at DESC LIMIT 10"#,
    )
    .fetch_all(pool)
    .await
}

#[derive(FromRow, Serialize)]
pub struct CategoryCount {
    pub category: String,
    pub count: i64,
}

pub async fn institutions_by_category(pool: &PgPool) -> Result<Vec<CategoryCount>, sqlx::Error> {
    sqlx::query_as::<_, CategoryCount>(
        "SELECT category, COUNT(*) FROM institutions WHERE status = 'approved' GROUP BY category ORDER BY COUNT(*) DESC",
    )
    .fetch_all(pool)
    .await
}

#[derive(FromRow, Serialize)]
pub struct StateCount {
    pub state: String,
    pub count: i64,
}

pub async fn institutions_by_state(pool: &PgPool) -> Result<Vec<StateCount>, sqlx::Error> {
    sqlx::query_as::<_, StateCount>(
        "SELECT state, COUNT(*) FROM institutions WHERE status = 'approved' GROUP BY state ORDER BY COUNT(*) DESC",
    )
    .fetch_all(pool)
    .await
}

#[derive(Serialize, FromRow)]
pub struct MonthlyGrowth {
    pub month: String,
    pub total: i64,
    pub pending: i64,
    pub approved: i64,
    pub rejected: i64,
}

pub async fn monthly_growth(pool: &PgPool) -> Result<Vec<MonthlyGrowth>, sqlx::Error> {
    sqlx::query_as::<_, MonthlyGrowth>(
        "SELECT TO_CHAR(created_at, 'YYYY-MM') AS month,
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status='pending') AS pending,
                COUNT(*) FILTER (WHERE status='approved') AS approved,
                COUNT(*) FILTER (WHERE status='rejected') AS rejected
         FROM institutions GROUP BY month ORDER BY month ASC",
    )
    .fetch_all(pool)
    .await
}

pub async fn institutions_with_coords(pool: &PgPool) -> Result<Vec<InstitutionRow>, sqlx::Error> {
    let sql = format!(
        "SELECT {} FROM institutions {PUB_JOIN} WHERE institutions.status='approved' AND institutions.coords IS NOT NULL",
        PUB_SELECT
    );
    sqlx::query_as::<_, InstitutionRow>(&sql).fetch_all(pool).await
}

pub async fn pending_institutions(pool: &PgPool) -> Result<Vec<InstitutionRow>, sqlx::Error> {
    let sql = format!(
        "SELECT {} FROM institutions {PUB_JOIN} WHERE institutions.status = 'pending' ORDER BY institutions.created_at DESC LIMIT 1000",
        PUB_SELECT
    );
    sqlx::query_as::<_, InstitutionRow>(&sql).fetch_all(pool).await
}

pub async fn pending_institutions_for_list(
    pool: &PgPool,
    include_automated: bool,
) -> Result<Vec<InstitutionRow>, sqlx::Error> {
    let sql = if include_automated {
        format!("SELECT {} FROM institutions {PUB_JOIN} WHERE institutions.status = 'pending' ORDER BY institutions.created_at DESC LIMIT 1000", PUB_SELECT)
    } else {
        format!("SELECT {} FROM institutions {PUB_JOIN} WHERE institutions.status = 'pending' AND (institutions.source_url IS NULL OR institutions.source_url = '' OR institutions.source_url LIKE 'http%') ORDER BY institutions.created_at DESC LIMIT 1000", PUB_SELECT)
    };
    sqlx::query_as::<_, InstitutionRow>(&sql).fetch_all(pool).await
}

pub async fn count_by_status(pool: &PgPool, status: &str) -> Result<i64, sqlx::Error> {
    let row = sqlx::query("SELECT COUNT(*) FROM institutions WHERE status = $1")
        .bind(status)
        .fetch_one(pool)
        .await?;
    row.try_get(0)
}

pub async fn count_pending_automated(pool: &PgPool) -> Result<i64, sqlx::Error> {
    let row = sqlx::query(
        "SELECT COUNT(*) FROM institutions WHERE status = 'pending' AND source_url IS NOT NULL AND source_url <> '' AND source_url NOT LIKE 'http%'",
    )
    .fetch_one(pool)
    .await?;
    row.try_get(0)
}

pub async fn admin_paginated(
    pool: &PgPool,
    status: &str,
    q: &str,
    category: &str,
    state: &str,
    page: i64,
    limit: i64,
) -> Result<(Vec<InstitutionViewRow>, i64), sqlx::Error> {
    let offset = (page - 1) * limit;
    let mut where_sql = format!("institutions.status = $1");
    let mut n = 1;
    let mut args: Vec<String> = vec![status.to_string()];
    if !q.trim().is_empty() {
        n += 1;
        args.push(format!("%{}%", q.trim().to_lowercase()));
        where_sql.push_str(&format!(
            " AND LOWER(institutions.name) LIKE ${}",
            n
        ));
    }
    if !category.is_empty() && CATEGORIES.contains(&category) {
        n += 1;
        args.push(category.to_string());
        where_sql.push_str(&format!(" AND institutions.category = ${}", n));
    }
    if !state.is_empty() && STATES.contains(&state) {
        n += 1;
        args.push(state.to_string());
        where_sql.push_str(&format!(" AND institutions.state = ${}", n));
    }
    let sql = format!(
        "SELECT institutions.id::bigint AS id, institutions.name, institutions.slug, institutions.category,
                institutions.state, institutions.city, institutions.status,
                institutions.qr_image, institutions.qr_content, institutions.supported_payment,
                institutions.coords, institutions.address, institutions.description,
                institutions.admin_notes, institutions.contributor_id,
                institutions.reviewed_by, institutions.reviewed_at AT TIME ZONE 'UTC' AS reviewed_at, institutions.created_at AT TIME ZONE 'UTC' AS created_at,
                u.name AS contributor_name, ur.name AS reviewer_name
         FROM institutions
         LEFT JOIN users u ON u.id = institutions.contributor_id
         LEFT JOIN users ur ON ur.id = institutions.reviewed_by
         WHERE {} ORDER BY institutions.created_at DESC, institutions.id DESC LIMIT ${} OFFSET ${}",
        where_sql, n + 1, n + 2
    );
    let mut q = sqlx::query_as::<_, InstitutionViewRow>(&sql);
    for a in &args {
        q = q.bind(a);
    }
    let rows = q.bind(limit).bind(offset).fetch_all(pool).await?;

    let count_sql = format!(
        "SELECT COUNT(*) FROM institutions WHERE {}",
        where_sql
    );
    let mut qc = sqlx::query(&count_sql);
    for a in &args {
        qc = qc.bind(a);
    }
    let total: i64 = qc.fetch_one(pool).await?.try_get(0)?;
    Ok((rows, total))
}

#[derive(FromRow, Serialize, Clone)]
pub struct InstitutionViewRow {
    pub id: i64,
    pub name: String,
    pub slug: String,
    pub category: String,
    pub state: String,
    pub city: String,
    pub status: String,
    pub qr_image: Option<String>,
    pub qr_content: Option<String>,
    pub supported_payment: Option<serde_json::Value>,
    pub coords: Option<serde_json::Value>,
    pub address: Option<String>,
    pub description: Option<String>,
    pub admin_notes: Option<String>,
    pub contributor_id: Option<String>,
    pub reviewed_by: Option<String>,
    pub reviewed_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub contributor_name: Option<String>,
    pub reviewer_name: Option<String>,
}

pub async fn admin_institution_by_id(pool: &PgPool, id: i64) -> Result<Option<InstitutionRow>, sqlx::Error> {
    get_institution_by_id(pool, id).await
}

pub async fn prev_next_pending_ids(
    pool: &PgPool,
    current_id: i64,
) -> Result<(Option<i64>, Option<i64>), sqlx::Error> {
    let prev = sqlx::query(
        "SELECT id FROM institutions WHERE status='pending' AND id < $1 ORDER BY id DESC LIMIT 1",
    )
    .bind(current_id)
    .fetch_optional(pool)
    .await?;
    let next = sqlx::query(
        "SELECT id FROM institutions WHERE status='pending' AND id > $1 ORDER BY id ASC LIMIT 1",
    )
    .bind(current_id)
    .fetch_optional(pool)
    .await?;
    let p = match prev {
        Some(r) => r.try_get::<i64, _>(0).ok(),
        None => None,
    };
    let nx = match next {
        Some(r) => r.try_get::<i64, _>(0).ok(),
        None => None,
    };
    Ok((p, nx))
}

pub async fn pending_position(pool: &PgPool, id: i64) -> Result<(i64, i64), sqlx::Error> {
    let row = sqlx::query(
        "SELECT COUNT(*) FROM institutions WHERE status='pending' AND id < $1",
    )
    .bind(id)
    .fetch_one(pool)
    .await?;
    let before: i64 = row.try_get(0)?;
    let total = count_by_status(pool, "pending").await?;
    Ok((before + 1, total))
}

pub async fn claim_requests_paginated(
    pool: &PgPool,
    q: &str,
    status: &str,
    page: i64,
    limit: i64,
) -> Result<(Vec<ClaimViewRow>, i64), sqlx::Error> {
    let offset = (page - 1) * limit;
    let mut where_sql = String::new();
    let mut n = 0;
    let mut args: Vec<String> = Vec::new();
    if !q.trim().is_empty() {
        n += 1;
        args.push(format!("%{}%", q.trim().to_lowercase()));
        where_sql.push_str(&format!(
            " AND (LOWER(i.name) LIKE ${} OR LOWER(COALESCE(u.name,'')) LIKE ${})",
            n, n
        ));
    }
    if !status.is_empty() && ["pending", "approved", "rejected"].contains(&status) {
        n += 1;
        args.push(status.to_string());
        where_sql.push_str(&format!(" AND c.status = ${}", n));
    }
    let sql = format!(
        "SELECT c.id::bigint AS id, c.institution_id::bigint AS institution_id, c.user_id, c.source_url, c.description, c.status,
                c.admin_notes, c.reviewed_by, c.reviewed_at AT TIME ZONE 'UTC' AS reviewed_at, c.created_at AT TIME ZONE 'UTC' AS created_at, c.updated_at AT TIME ZONE 'UTC' AS updated_at,
                i.name AS institution_name, i.category AS institution_category,
                u.name AS user_name, u.email AS user_email, r.name AS reviewer_name
         FROM claim_requests c
         JOIN institutions i ON i.id = c.institution_id
         JOIN users u ON u.id = c.user_id
         LEFT JOIN users r ON r.id = c.reviewed_by
         WHERE 1=1 {} ORDER BY c.created_at DESC LIMIT ${} OFFSET ${}",
        where_sql, n + 1, n + 2
    );
    let mut q = sqlx::query_as::<_, ClaimViewRow>(&sql);
    for a in &args {
        q = q.bind(a);
    }
    let rows = q.bind(limit).bind(offset).fetch_all(pool).await?;
    let count_sql = format!(
        "SELECT COUNT(*) FROM claim_requests c JOIN institutions i ON i.id = c.institution_id JOIN users u ON u.id = c.user_id WHERE 1=1 {}",
        where_sql
    );
    let mut qc = sqlx::query(&count_sql);
    for a in &args {
        qc = qc.bind(a);
    }
    let total: i64 = qc.fetch_one(pool).await?.try_get(0)?;
    Ok((rows, total))
}

#[derive(FromRow, Serialize, Clone)]
pub struct ClaimViewRow {
    pub id: i64,
    pub institution_id: i64,
    pub user_id: String,
    pub source_url: Option<String>,
    pub description: Option<String>,
    pub status: String,
    pub admin_notes: Option<String>,
    pub reviewed_by: Option<String>,
    pub reviewed_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
    pub institution_name: String,
    pub institution_category: String,
    pub user_name: Option<String>,
    pub user_email: String,
    pub reviewer_name: Option<String>,
}

pub async fn count_pending_claims(pool: &PgPool) -> Result<i64, sqlx::Error> {
    let row = sqlx::query("SELECT COUNT(*) FROM claim_requests WHERE status = 'pending'")
        .fetch_one(pool)
        .await?;
    row.try_get(0)
}

pub async fn all_users(pool: &PgPool) -> Result<Vec<User>, sqlx::Error> {
    sqlx::query_as::<_, User>(
        r#"SELECT id, email, username, name, avatar_url, image, email_verified, role, is_active,
           banned, ban_reason, ban_expires, created_at AT TIME ZONE 'UTC' AS created_at, updated_at AT TIME ZONE 'UTC' AS updated_at, onboarding_tour_state,
           onboarding_tour_current_route, onboarding_tour_current_step::bigint AS onboarding_tour_current_step,
           onboarding_tour_started_at AT TIME ZONE 'UTC' AS onboarding_tour_started_at, onboarding_tour_completed_at AT TIME ZONE 'UTC' AS onboarding_tour_completed_at, onboarding_tour_skipped_at AT TIME ZONE 'UTC' AS onboarding_tour_skipped_at
           FROM users ORDER BY created_at DESC"#,
    )
    .fetch_all(pool)
    .await
}

#[derive(Serialize)]
pub struct UserWithStats {
    pub user: User,
    pub contribution_stats: MyContributionStats,
}

pub async fn user_contributions(pool: &PgPool, user_id: &str) -> Result<Vec<MyContribution>, sqlx::Error> {
    my_contributions(pool, user_id).await
}
