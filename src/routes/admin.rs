use crate::constants::*;
use crate::queries::*;
use crate::render::*;
use crate::session::require_admin;
use sqlx::Row;
use crate::state::AppState;
use crate::utils::*;
use chrono::Datelike;
use axum::extract::{Multipart, Path, Query, State};
use axum::http::HeaderMap;
use axum::response::{Html, IntoResponse, Redirect, Response};
use serde::Deserialize;
use serde_json::json;

async fn admin_shell(state: &AppState, headers: &HeaderMap) -> Result<Shell, ()> {
    let Some(user) = require_admin(&state.pool, headers).await.ok().flatten() else {
        return Err(());
    };
    let mut shell = Shell::default();
    shell.logged_in = true;
    shell.is_admin = true;
    shell.meta.noindex = true;
    let _ = user;
    Ok(shell)
}

fn redirect_flash(url: &str, msg: &str) -> Response {
    if msg.is_empty() {
        Redirect::to(url).into_response()
    } else {
        let sep = if url.contains('?') { "&" } else { "?" };
        Redirect::to(&format!("{url}{sep}msg={}", urlencoding::encode(msg))).into_response()
    }
}

fn read_msg(q: &AdminListQuery) -> String {
    q.msg.clone().unwrap_or_default()
}

#[derive(Deserialize)]
pub struct AdminListQuery {
    pub msg: Option<String>,
    pub q: Option<String>,
    pub category: Option<String>,
    pub state: Option<String>,
    pub page: Option<i64>,
    pub limit: Option<i64>,
    pub include_automated: Option<String>,
    pub status: Option<String>,
    pub year: Option<i64>,
}

// ---------- Dashboard ----------

pub async fn dashboard(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let Ok(shell) = admin_shell(&state, &headers).await else {
        return Redirect::to("/").into_response();
    };
    let stats = dashboard_stats(&state.pool).await.unwrap_or(DashboardStats {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
    });
    let recent = recent_activities(&state.pool).await.unwrap_or_default();
    let by_cat = institutions_by_category(&state.pool).await.unwrap_or_default();
    let by_state = institutions_by_state(&state.pool).await.unwrap_or_default();
    let months = monthly_growth(&state.pool).await.unwrap_or_default();
    let leaders = leaderboard_top(&state.pool).await.unwrap_or_default();

    let stat_cards = format!(
        r#"<div class="stats-grid">
  <div class="stat-card"><div class="stat-value">{total}</div><div class="stat-label">Total Institutions</div></div>
  <div class="stat-card warning"><div class="stat-value">{pending}</div><div class="stat-label">Pending Review</div></div>
  <div class="stat-card success"><div class="stat-value">{approved}</div><div class="stat-label">Approved</div></div>
  <div class="stat-card danger"><div class="stat-value">{rejected}</div><div class="stat-label">Rejected</div></div>
</div>"#,
        total = stats.total, pending = stats.pending, approved = stats.approved, rejected = stats.rejected,
    );

    let recent_rows = recent.iter().map(|r| {
        let link = r.view_link();
        let status_link = format!("/admin/institutions/{}", r.status);
        format!(
            r#"<tr><td><a href="{status_link}">ID: {id}</a></td><td><a href="{link}">{name}</a></td><td>{cat}</td><td>{city}, {state}</td><td>{chip}</td><td>{by}</td><td>{created}</td></tr>"#,
            status_link = status_link,
            link = link,
            id = r.id,
            name = esc(&title_case(&r.name)),
            cat = category_chip(&r.category),
            city = esc(&r.city),
            state = esc(&r.state),
            chip = status_chip(&r.status),
            by = esc(&r.contributor_name.clone().unwrap_or_else(|| "Anonymous".into())),
            created = format_datetime_myt(r.created_at),
        )
    }).collect::<String>();
    let recent_table = admin_table(&["ID", "Institution", "Category", "Location", "Status", "Contributor", "Created"], recent_rows, "No institutions found");

    let cat_rows = by_cat.iter().map(|c| format!(
        r#"<li class="leader-row"><span class="leader-name">{name}</span><span class="leader-count">{n}</span></li>"#,
        name = category_label(&c.category),
        n = c.count,
    )).collect::<String>();
    let state_rows = by_state.iter().map(|s| format!(
        r#"<li class="leader-row"><span class="leader-name">{name}</span><span class="leader-count">{n}</span></li>"#,
        name = esc(&s.state),
        n = s.count,
    )).collect::<String>();
    let leader_rows = leaders.iter().map(|l| format!(
        r#"<li class="leader-row"><span class="rank-badge">#{r}</span><span class="leader-name">{name}</span><span class="leader-count">{count}</span></li>"#,
        r = l.rank,
        name = esc(&l.name),
        count = l.contributions,
    )).collect::<String>();
    let growth_html = months.iter().map(|m| format!(
        r#"<li class="leader-row"><span class="leader-name">{m}</span><span class="leader-count">{total} ({a} approved)</span></li>"#,
        m = esc(&m.month),
        total = m.total,
        a = m.approved,
    )).collect::<String>();

    let content = format!(
        r#"<div class="admin-dashboard">
{stat_cards}
<div class="dashboard-grid">
  <section class="card dash-main">
    <h3 class="card-title-sm">Recent Institutions</h3>
    {recent_table}
  </section>
  <aside class="dash-side">
    <div class="card"><h3 class="card-title-sm">Category</h3><ul class="leader-list">{cats}</ul></div>
    <div class="card"><h3 class="card-title-sm">Top States</h3><ul class="leader-list">{states}</ul></div>
    <div class="card"><h3 class="card-title-sm">Top Contributors</h3><ul class="leader-list">{leaders}</ul></div>
    <div class="card"><h3 class="card-title-sm">Monthly Growth</h3><ul class="leader-list">{growth}</ul></div>
  </aside>
</div>
</div>"#,
        stat_cards = stat_cards,
        recent_table = recent_table,
        cats = cat_rows,
        states = state_rows,
        leaders = leader_rows,
        growth = growth_html,
    );

    Html(render_admin(shell, "Dashboard", "Overview of the platform", content)).into_response()
}

fn render_admin(shell: Shell, title: &str, desc: &str, content: String) -> String {
    crate::render::admin_shell(shell, title, desc, content)
}

// ---------- Institutions ----------

pub async fn institutions_pending(State(state): State<AppState>, Query(q): Query<AdminListQuery>, headers: HeaderMap) -> Response {
    let Ok(shell) = admin_shell(&state, &headers).await else {
        return Redirect::to("/").into_response();
    };
    let include_automated = q.include_automated.as_deref() == Some("true");
    let rows = pending_institutions_for_list(&state.pool, include_automated).await.unwrap_or_default();
    let automated_count = count_pending_automated(&state.pool).await.unwrap_or(0);
    let msg = read_msg(&q);
    let title = "Pending Institutions";
    let rows_html = rows.iter().map(|r| {
        format!(
            r#"<tr>
  <td class="mono">{id}</td>
  <td><a href="/admin/institutions/pending/{id}">{name}</a></td>
  <td>{cat}</td><td>{state}</td><td>{city}</td>
  <td>{contributor}</td><td>{created}</td>
  <td>
    <form method="post" action="/admin/institutions/{id}/approve" class="inline-form">
      <button class="btn btn-sm btn-success" type="submit">Approve</button>
    </form>
    <form method="post" action="/admin/institutions/{id}/reject" class="inline-form">
      <button class="btn btn-sm btn-danger" type="submit">Reject</button>
    </form>
  </td>
</tr>"#,
            id = r.id,
            name = esc(&title_case(&r.name)),
            cat = category_chip(&r.category),
            state = esc(&r.state),
            city = esc(&r.city),
            contributor = esc(&r.contributor_email.clone().or_else(|| r.contributor_id.clone()).unwrap_or_else(|| "-".into())),
            created = format_datetime_myt(r.created_at),
        )
    }).collect::<String>();
    let table = admin_table(&["ID", "Name", "Category", "State", "City", "Contributor", "Date", "Actions"], rows_html, "All caught up! No pending institutions.");
    let auto_extra = if automated_count > 0 {
        let checked = if include_automated { "" } else { "checked" };
        format!(
            r#"<label class="check-label"><input type="checkbox" form="pending-form" name="include_automated" value="true" {checked}/> Hide automated imports ({n})</label>"#,
            checked = checked,
            n = automated_count,
        )
    } else {
        String::new()
    };
    let flash = flash_banner(&msg);
    let content = format!(
        r#"<form id="pending-form" method="get" action="/admin/institutions/pending" class="filter-bar">{auto_extra}<input class="search-input" type="search" name="q" placeholder="Search institutions..." value="{q}" /><button class="btn btn-ghost" type="submit">Filter</button></form>
{flash}{table}"#,
        auto_extra = auto_extra,
        q = esc(&q.q.clone().unwrap_or_default()),
        flash = flash,
        table = table,
    );
    Html(render_admin(shell, title, "Review and manage institutions awaiting approval", content)).into_response()
}

fn flash_banner(msg: &str) -> String {
    if msg.is_empty() {
        String::new()
    } else {
        format!(r#"<div class="alert alert-info">{}</div>"#, h2(msg))
    }
}

fn h2(s: &str) -> String {
    html_escape(s)
}

async fn set_institution_status(pool: &crate::db::DbPool, id: i64, status: &str, admin_id: &str, notes: Option<&str>) -> Result<(), String> {
    sqlx::query(
        "UPDATE institutions SET status=$1, reviewed_by=$2, reviewed_at=now(), admin_notes=$3, updated_at=now() WHERE id=$4 AND status = ($5)",
    )
    .bind(status)
    .bind(admin_id)
    .bind(notes)
    .bind(id)
    .bind(if status == "approved" { "pending" } else { "pending" })
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;
    if status == "rejected" {
        let _ = sqlx::query("UPDATE quest_mosques SET institution_id = NULL WHERE institution_id = $1")
            .bind(id)
            .execute(pool)
            .await;
    }
    Ok(())
}

#[derive(Deserialize)]
pub struct NotesForm {
    pub notes: Option<String>,
    pub id: Option<i64>,
}

pub async fn approve_institution(State(state): State<AppState>, Path(id): Path<i64>, headers: HeaderMap, Form(f): Form<NotesForm>) -> Response {
    let Some(user) = require_admin(&state.pool, &headers).await.ok().flatten() else {
        return Redirect::to("/").into_response();
    };
    let notes = f.notes.as_deref();
    match set_institution_status(&state.pool, id, "approved", &user.id, notes).await {
        Ok(_) => redirect_flash("/admin/institutions/pending", "Institution approved"),
        Err(_) => redirect_flash("/admin/institutions/pending", "Institution not found or not pending"),
    }
}

pub async fn reject_institution(State(state): State<AppState>, Path(id): Path<i64>, headers: HeaderMap, Form(f): Form<NotesForm>) -> Response {
    let Some(user) = require_admin(&state.pool, &headers).await.ok().flatten() else {
        return Redirect::to("/").into_response();
    };
    let notes = f.notes.as_deref();
    match set_institution_status(&state.pool, id, "rejected", &user.id, notes).await {
        Ok(_) => redirect_flash("/admin/institutions/pending", "Institution rejected"),
        Err(_) => redirect_flash("/admin/institutions/pending", "Institution not found or not pending"),
    }
}

pub async fn institutions_approved(State(state): State<AppState>, Query(q): Query<AdminListQuery>, headers: HeaderMap) -> Response {
    let Ok(shell) = admin_shell(&state, &headers).await else { return Redirect::to("/").into_response() };
    let page = q.page.unwrap_or(1).max(1);
    let limit = q.limit.unwrap_or(10).clamp(1, 100);
    let (rows, total) = match admin_paginated(&state.pool, "approved", q.q.as_deref().unwrap_or(""), q.category.as_deref().unwrap_or(""), q.state.as_deref().unwrap_or(""), page, limit).await {
        Ok(v) => v,
        Err(_) => (vec![], 0),
    };
    let total_pages = (total + limit - 1) / limit;
    let rows_html = rows.iter().map(|r| format!(
        r#"<tr>
  <td class="mono">{id}</td>
  <td><a href="/admin/institutions/approved/{id}">{name}</a></td>
  <td>{cat}</td><td>{state}</td><td>{city}</td>
  <td>{contributor}</td><td>{reviewer}</td><td>{reviewed}</td>
  <td class="row-actions">
    <form method="post" action="/admin/institutions/{id}/undo" class="inline-form"><button class="btn btn-sm btn-danger" type="submit">Undo</button></form>
  </td>
</tr>"#,
        id = r.id,
        name = esc(&title_case(&r.name)),
        cat = category_chip(&r.category),
        state = esc(&r.state),
        city = esc(&r.city),
        contributor = esc(&r.contributor_name.clone().or_else(|| r.contributor_id.clone()).unwrap_or_else(|| "-".into())),
        reviewer = esc(&r.reviewer_name.clone().unwrap_or_else(|| "-".into())),
        reviewed = r.reviewed_at.map(format_datetime_myt).unwrap_or_else(|| "-".into()),
    )).collect::<String>();
    let pagination = if total_pages > 1 {
        let mut out = String::from(r#"<nav class="pagination">"#);
        if page > 1 { out.push_str(&format!(r##"<a class="btn btn-sm" href="/admin/institutions/approved?page={}">Prev</a>"##, page - 1)); }
        out.push_str(&format!("<span>Page {page} of {total_pages}</span>"));
        if page < total_pages { out.push_str(&format!(r##"<a class="btn btn-sm" href="/admin/institutions/approved?page={}">Next</a>"##, page + 1)); }
        out.push_str("</nav>");
        out
    } else { String::new() };
    let content = format!(
        r#"<div class="filter-bar">
  <form method="get" action="/admin/institutions/approved" class="inline-form">
    <input class="search-input" type="search" name="q" placeholder="Search..." value="{q}" />
    <select class="select-input" name="category"><option value="">All Categories</option>{cats}</select>
    <select class="select-input" name="state"><option value="">All States</option>{states}</select>
    <button class="btn btn-ghost" type="submit">Filter</button>
    <a class="btn btn-outline" href="/api/admin/institutions/export?format=json">Export JSON</a>
  </form>
</div>
{flash}{table}{pagination}"#,
        q = esc(&q.q.clone().unwrap_or_default()),
        cats = category_options(q.category.as_deref()),
        states = state_options_admin(q.state.as_deref()),
        flash = flash_banner(&read_msg(&q)),
        table = admin_table(&["ID", "Name", "Category", "State", "City", "Contributor", "Reviewed By", "Date Approved", "Actions"], rows_html, "No approved institutions found."),
        pagination = pagination,
    );
    Html(render_admin(shell, "Approved Institutions", "View and manage approved institutions", content)).into_response()
}

fn category_options(selected: Option<&str>) -> String {
    let mut out = String::new();
    for c in CATEGORIES {
        let sel = if selected == Some(c) { " selected" } else { "" };
        out.push_str(&format!(r#"<option value="{c}"{sel}>{label}</option>"#, c = c, label = category_label(c)));
    }
    out
}

fn state_options_admin(selected: Option<&str>) -> String {
    let mut out = String::new();
    for s in STATES {
        let sel = if selected == Some(s) { " selected" } else { "" };
        out.push_str(&format!(r#"<option value="{s}"{sel}>{s}</option>"#, s = s));
    }
    out
}

pub async fn institutions_rejected(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let Ok(shell) = admin_shell(&state, &headers).await else { return Redirect::to("/").into_response() };
    let rows = sqlx::query_as::<_, InstitutionRow>(
        &format!("SELECT {PUB_SELECT} FROM institutions {PUB_JOIN} WHERE institutions.status = 'rejected' ORDER BY institutions.created_at DESC LIMIT 1000"),
    )
    .fetch_all(&state.pool)
    .await
    .unwrap_or_default();
    let rows_html = rows.iter().map(|r| {
        let note = r.admin_notes.clone().map(|n| format!(r##"<div class="italic subtext">Catatan: {}</div>"##, h2(&n))).unwrap_or_default();
        format!(
            r#"<tr><td class="mono">{id}</td><td><a href="/admin/institutions/pending/{id}">{name}</a>{note}</td><td>{cat}</td><td>{state}</td><td>{city}</td><td>{contributor}</td><td>{reviewed}</td>
  <td class="row-actions"><form method="post" action="/admin/institutions/{id}/unreject" class="inline-form"><button class="btn btn-sm" type="submit">Undo Rejection</button></form></td></tr>"#,
            id = r.id,
            name = esc(&title_case(&r.name)),
            note = note,
            cat = category_chip(&r.category),
            state = esc(&r.state),
            city = esc(&r.city),
            contributor = esc(&r.contributor_email.clone().or_else(|| r.contributor_id.clone()).unwrap_or_else(|| "-".into())),
            reviewed = r.reviewed_at.map(format_datetime_myt).unwrap_or_else(|| "-".into()),
        )
    }).collect::<String>();
    let content = admin_table(&["ID", "Name", "Category", "State", "City", "Contributor", "Date Rejected", "Actions"], rows_html, "No rejected institutions found.");
    Html(render_admin(shell, "Rejected Institutions", "Review and manage institutions that have been rejected", content)).into_response()
}

pub async fn undo_approval(State(state): State<AppState>, Path(id): Path<i64>, headers: HeaderMap) -> Response {
    let Some(user) = require_admin(&state.pool, &headers).await.ok().flatten() else { return Redirect::to("/").into_response() };
    let _ = sqlx::query("UPDATE institutions SET status='rejected', reviewed_by=$1, reviewed_at=now(), admin_notes='Approval undone (duplicate)', updated_at=now() WHERE id=$2")
        .bind(&user.id).bind(id).execute(&state.pool).await;
    let _ = sqlx::query("UPDATE quest_mosques SET institution_id = NULL WHERE institution_id = $1").bind(id).execute(&state.pool).await;
    redirect_flash("/admin/institutions/approved", "Approval undone")
}

pub async fn undo_rejection(State(state): State<AppState>, Path(id): Path<i64>, headers: HeaderMap) -> Response {
    let Some(_user) = require_admin(&state.pool, &headers).await.ok().flatten() else { return Redirect::to("/").into_response() };
    let _ = sqlx::query("UPDATE institutions SET status='pending', reviewed_by=NULL, reviewed_at=NULL, admin_notes=NULL, updated_at=now() WHERE id=$1").bind(id).execute(&state.pool).await;
    redirect_flash("/admin/institutions/rejected", "Rejection undone")
}

pub async fn institution_review(
    State(state): State<AppState>,
    Path(id): Path<i64>,
    Query(q): Query<AdminListQuery>,
    headers: HeaderMap,
) -> Response {
    let Ok(shell) = admin_shell(&state, &headers).await else { return Redirect::to("/").into_response() };
    let Some(inst) = admin_institution_by_id(&state.pool, id).await.ok().flatten() else {
        return Redirect::to("/admin/institutions/pending").into_response();
    };
    let msg = read_msg(&q);
    let (pos, total) = pending_position(&state.pool, id).await.unwrap_or((1, 1));
    let (prev, next) = prev_next_pending_ids(&state.pool, id).await.unwrap_or((None, None));
    let prev_link = prev.map(|p| format!(r##"<a class="btn btn-sm" href="/admin/institutions/pending/{p}">‹ Prev</a>"##)).unwrap_or_default();
    let next_link = next.map(|n| format!(r##"<a class="btn btn-sm" href="/admin/institutions/pending/{n}">Next ›</a>"##)).unwrap_or_default();
    let payments = inst.supported_payment_vec();
    let (brand_color, _) = brand_color(Some(&payments));

    let form_html = format!(
        r##"<form method="post" action="/admin/institutions/{id}/save" class="review-form">
  <div class="field">{name_field}</div>
  <div class="field-row">
    <div class="field">{category_select}</div>
    <div class="field">{state_select}</div>
    <div class="field">{city_field}</div>
  </div>
  <div class="field">{address_field}</div>
  <div class="field-row">
    <div class="field">{lat_field}</div>
    <div class="field">{lng_field}</div>
  </div>
  <div class="field">{qr_field}</div>
  <div class="field">{notes_field}</div>
  <button class="btn btn-primary" type="submit">Save Changes</button>
</form>"##,
        name_field = form_text_field("name", "Name", &inst.name, "Institution name", true),
        category_select = select_field("category", "Category", &inst.category, &CATEGORIES.iter().map(|c| (c.to_string(), category_label(c).to_string())).collect::<Vec<_>>()),
        state_select = select_field("state", "State", &inst.state, &STATES.iter().map(|s| (s.to_string(), s.to_string())).collect::<Vec<_>>()),
        city_field = form_text_field("city", "City", &inst.city, "City", true),
        address_field = textarea_field("address", "Address", inst.address.as_deref().unwrap_or("")),
        lat_field = form_text_field("lat", "Latitude", &format!("{}", inst.coords_pair().map(|(l, _)| l).unwrap_or(0.0).to_string().trim_end_matches(".0")), "", false),
        lng_field = form_text_field("lon", "Longitude", &format!("{}", inst.coords_pair().map(|(_, l)| l).unwrap_or(0.0).to_string().trim_end_matches(".0")), "", false),
        qr_field = textarea_field("qrContent", "QR Content", inst.qr_content.as_deref().unwrap_or("")),
        notes_field = textarea_field("adminNotes", "Admin Notes", inst.admin_notes.as_deref().unwrap_or("")),
    );

    let qr_block = match &inst.qr_content {
        Some(c) if !c.is_empty() => format!(
            r#"<div class="card qr-panel" style="--brand:{brand_color}">
  <h4>QR Code</h4>
  <div class="qr-svg-box">{svg}</div>
  <code class="qr-raw">{raw}</code>
</div>"#,
            brand_color = brand_color,
            svg = crate::qrgen::qr_svg(c, brand_color, "#ffffff", true),
            raw = esc(c),
        ),
        _ => match &inst.qr_image {
            Some(img) => format!(
                r#"<div class="card qr-panel"><h4>QR Image</h4><a href="{img}" target="_blank"><img class="qr-img-preview" src="{img}" alt="QR" /></a><p><a href="{img}" target="_blank">Open original</a> · <a href="https://qrcoderaptor.com/?img={enc}" target="_blank">Open in QRaptor</a></p></div>"#,
                img = img, enc = urlencoding::encode(img),
            ),
            None => String::new(),
        },
    };

    let content = format!(
        r#"<div class="review-layout">
  <div class="review-bar">
    <span>Reviewing {pos} of {total}</span>
    <div class="row-actions">{prev}{next}</div>
  </div>
  {flash}
  <div class="review-grid">
    <div class="review-fields">{form_html}</div>
    <div class="review-side">{qr_block}
      <div class="card">
        <h4>Contributor</h4>
        <p>{contributor}</p>
        <p class="subtext">Submitted {created}</p>
      </div>
      <div class="row-actions" style="margin-top:8px">
        <form method="post" action="/admin/institutions/{id}/approve" class="inline-form"><button class="btn btn-success" type="submit">Approve</button></form>
        <form method="post" action="/admin/institutions/{id}/reject" class="inline-form"><button class="btn btn-danger" type="submit">Reject</button></form>
      </div>
    </div>
  </div>
</div>"#,
        pos = pos, total = total, prev = prev_link, next = next_link,
        flash = flash_banner(&msg),
        form_html = form_html,
        qr_block = qr_block,
        contributor = esc(&inst.contributor_email.clone().or_else(|| inst.contributor_id.clone()).unwrap_or_else(|| "-".into())),
        created = format_datetime_myt(inst.created_at),
    );
    Html(render_admin(shell, &inst.name, "Review pending institution", content)).into_response()
}

fn select_field(name: &str, label: &str, selected: &str, options: &[(String, String)]) -> String {
    let mut opts = String::new();
    for (v, l) in options {
        let sel = if v == selected { " selected" } else { "" };
        opts.push_str(&format!(r#"<option value="{v}"{sel}>{l}</option>"#, v = h3(v), l = h3(l)));
    }
    format!(
        r#"<div class="field"><label for="{name}">{label}</label><select id="{name}" name="{name}" class="select-input">{opts}</select></div>"#,
        name = name, label = h3(label),
    )
}

fn h3(s: &str) -> String {
    html_escape(s)
}

fn textarea_field(name: &str, label: &str, value: &str) -> String {
    format!(
        r#"<div class="field"><label for="{name}">{label}</label><textarea id="{name}" name="{name}" rows="3">{value}</textarea></div>"#,
        name = name,
        label = html_escape(label),
        value = html_escape(value),
    )
}

#[derive(Deserialize)]
pub struct SaveForm {
    pub name: String,
    pub category: String,
    pub state: String,
    pub city: String,
    pub address: Option<String>,
    pub lat: Option<String>,
    pub lon: Option<String>,
    pub qr_content: Option<String>,
    pub admin_notes: Option<String>,
}

pub async fn save_institution(State(state): State<AppState>, Path(id): Path<i64>, headers: HeaderMap, Form(f): Form<SaveForm>) -> Response {
    let Some(user) = require_admin(&state.pool, &headers).await.ok().flatten() else { return Redirect::to("/").into_response() };
    let _ = user;
    let category = crate::constants::normalize_institution_category(&f.category).to_string();
    let coords = match (f.lat.clone(), f.lon.clone()) {
        (Some(lat), Some(lon)) => {
            let lat = lat.trim().parse::<f64>().ok().filter(|v| (-90.0..=90.0).contains(v));
            let lon = lon.trim().parse::<f64>().ok().filter(|v| (-180.0..=180.0).contains(v));
            match (lat, lon) {
                (Some(lat), Some(lon)) => Some(json!([lat, lon])),
                _ => None,
            }
        }
        _ => None,
    };
    let slug = match generate_unique_slug(&state.pool, &f.name, Some(id)).await {
        Ok(s) => s,
        Err(_) => return redirect_flash(&format!("/admin/institutions/pending/{id}"), "Failed to generate slug"),
    };
    let social = {
        // preserve existing social from DB if any; not captured in this form
        None::<serde_json::Value>
    };
    let _ = social;
    // Save fields that are present; coords/address only when provided
    let qr_content = f.qr_content.clone().filter(|s| !s.trim().is_empty());
    let address = f.address.clone().filter(|s| !s.trim().is_empty());
    let _ = &coords;
    let _ = &qr_content;
    match sqlx::query(
        "UPDATE institutions SET name=$1, slug=$2, category=$3, state=$4, city=$5, address=$6, coords=$7, qr_content=$8, admin_notes=$9, updated_at=now() WHERE id=$10 AND status IN ('pending','approved','rejected')",
    )
    .bind(&f.name)
    .bind(&slug)
    .bind(&category)
    .bind(&f.state)
    .bind(&f.city)
    .bind(address)
    .bind(coords)
    .bind(qr_content)
    .bind(f.admin_notes.clone().filter(|s| !s.trim().is_empty()))
    .bind(id)
    .execute(&state.pool)
    .await
    {
        Ok(_) => redirect_flash(&format!("/admin/institutions/pending/{id}"), "Changes saved"),
        Err(_) => redirect_flash(&format!("/admin/institutions/pending/{id}"), "Failed to save changes"),
    }
}

// ---------- Claim requests ----------

pub async fn claim_requests(State(state): State<AppState>, Query(q): Query<AdminListQuery>, headers: HeaderMap) -> Response {
    let Ok(shell) = admin_shell(&state, &headers).await else { return Redirect::to("/").into_response() };
    let page = q.page.unwrap_or(1).max(1);
    let limit = q.limit.unwrap_or(20).clamp(1, 100);
    let status = q.status.clone().unwrap_or_default();
    let (rows, total) = match claim_requests_paginated(&state.pool, q.q.as_deref().unwrap_or(""), &status, page, limit).await {
        Ok(v) => v,
        Err(_) => (vec![], 0),
    };
    let rows_html = rows.iter().map(|c| {
        let review_col = if c.status == "pending" {
            format!(
                r#"<form method="post" action="/admin/claim-requests/{id}/approve" class="inline-form"><button class="btn btn-sm btn-success" type="submit">Luluskan</button></form>
<form method="post" action="/admin/claim-requests/{id}/reject" class="inline-form"><input name="adminNotes" placeholder="Sebab penolakan" /><button class="btn btn-sm btn-danger" type="submit">Tolak</button></form>"#,
                id = c.id,
            )
        } else {
            c.reviewer_name.clone().unwrap_or_else(|| "-".to_string())
        };
        format!(
            r#"<tr><td class="mono">{id}</td><td><a href="/{cat}/{slug_hint}">{name}</a></td><td>{cat_chip}</td><td>{user}</td><td>{chip}</td><td>{created}</td><td>{reviewed}</td><td class="row-actions">{actions}</td></tr>"#,
            id = c.id,
            cat = c.institution_category,
            slug_hint = c.institution_id,
            name = esc(&title_case(&c.institution_name)),
            cat_chip = category_chip(&c.institution_category),
            user = esc(&c.user_name.clone().map(|n| if n.is_empty() { c.user_email.clone() } else { format!("{n} ({})", c.user_email) }).unwrap_or_else(|| c.user_email.clone())),
            chip = status_chip(&c.status),
            created = format_datetime_myt(c.created_at),
            reviewed = c.reviewed_at.map(format_datetime_myt).unwrap_or_else(|| "-".into()),
            actions = review_col,
        )
    }).collect::<String>();
    let content = format!(
        r#"<div class="filter-bar"><form method="get" action="/admin/claim-requests" class="inline-form">
  <input class="search-input" type="search" name="q" placeholder="Cari institusi atau pemohon..." value="{q}" />
  <select class="select-input" name="status"><option value="">Semua</option><option value="pending" {sp}>Pending</option><option value="approved" {sa}>Diluluskan</option><option value="rejected" {sr}>Ditolak</option></select>
  <button class="btn btn-ghost" type="submit">Cari</button></form></div>
{flash}{table}"#,
        q = esc(&q.q.clone().unwrap_or_default()),
        sp = if status == "pending" { "selected" } else { "" },
        sa = if status == "approved" { "selected" } else { "" },
        sr = if status == "rejected" { "selected" } else { "" },
        flash = flash_banner(&read_msg(&q)),
        table = admin_table(&["ID", "Institusi", "Kategori", "Pemohon", "Status", "Tarikh Mohon", "Disemak Oleh", "Actions"], rows_html, "Tiada tuntutan dijumpai."),
    );
    Html(render_admin(shell, "Tuntutan Institusi", "Semak dan luluskan tuntutan pemilikan institusi dari pengguna", content)).into_response()
}

pub async fn approve_claim(State(state): State<AppState>, Path(id): Path<i64>, headers: HeaderMap, Form(f): Form<ClaimActionForm>) -> Response {
    use sqlx::Row;
    let Some(user) = require_admin(&state.pool, &headers).await.ok().flatten() else { return Redirect::to("/").into_response() };
    let claim = sqlx::query("SELECT institution_id, user_id FROM claim_requests WHERE id=$1").bind(id).fetch_optional(&state.pool).await.ok().flatten();
    let Some(c) = claim else { return redirect_flash("/admin/claim-requests", "Tuntutan tidak dijumpai") };
    let inst_id: i64 = c.try_get(0).unwrap_or(0);
    let claim_user: String = c.try_get(1).unwrap_or_default();
    let result = sqlx::query(
        "UPDATE institutions SET contributor_id=$1, updated_at=now(), source_url=COALESCE(source_url, $2), contributor_remarks=COALESCE(contributor_remarks, $3) WHERE id=$4",
    )
    .bind(&claim_user)
    .bind(&f.source_url)
    .bind(&f.description)
    .bind(inst_id)
    .execute(&state.pool)
    .await;
    if result.is_err() { return redirect_flash("/admin/claim-requests", "Gagal mengemaskini") }
    let _ = sqlx::query("UPDATE claim_requests SET status='approved', admin_notes=$1, reviewed_by=$2, reviewed_at=now(), updated_at=now() WHERE id=$3")
        .bind(&f.admin_notes).bind(&user.id).bind(id).execute(&state.pool).await;
    redirect_flash("/admin/claim-requests", "Tuntutan telah diluluskan dan institusi telah diberikan kepada pengguna")
}

#[derive(Deserialize)]
pub struct ClaimActionForm {
    pub admin_notes: Option<String>,
    pub source_url: Option<String>,
    pub description: Option<String>,
}

pub async fn reject_claim(State(state): State<AppState>, Path(id): Path<i64>, headers: HeaderMap, Form(f): Form<ClaimActionForm>) -> Response {
    let Some(user) = require_admin(&state.pool, &headers).await.ok().flatten() else { return Redirect::to("/").into_response() };
    let notes = f.admin_notes.clone().unwrap_or_default();
    if notes.trim().is_empty() {
        return redirect_flash("/admin/claim-requests", "Nota admin diperlukan untuk menolak tuntutan");
    }
    let _ = sqlx::query("UPDATE claim_requests SET status='rejected', admin_notes=$1, reviewed_by=$2, reviewed_at=now(), updated_at=now() WHERE id=$3")
        .bind(&notes).bind(&user.id).bind(id).execute(&state.pool).await;
    redirect_flash("/admin/claim-requests", "Tuntutan telah ditolak")
}

// ---------- Users ----------

pub async fn users(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let Ok(shell) = admin_shell(&state, &headers).await else { return Redirect::to("/").into_response() };
    let all = all_users(&state.pool).await.unwrap_or_default();
    let mut rows_html = String::new();
    for u in &all {
        let stats = my_contribution_stats(&state.pool, &u.id).await.unwrap_or(MyContributionStats { total_contributions: 0, approved_contributions: 0, pending_contributions: 0, rejected_contributions: 0 });
        let role_action = if u.role == "admin" {
            format!(r##"<form method="post" action="/admin/users/{id}/demote" class="inline-form"><button class="btn btn-sm" type="submit">Remove admin</button></form>"##, id = u.id)
        } else {
            format!(r##"<form method="post" action="/admin/users/{id}/promote" class="inline-form"><button class="btn btn-sm" type="submit">Make admin</button></form>"##, id = u.id)
        };
        rows_html.push_str(&format!(
            r#"<tr><td>{name}</td><td>{email}</td><td>{role_badge}</td>
<td>{approved} ✅ / {pending} ⏳ / {rejected} ❌</td><td>{created}</td><td class="row-actions">{role_action}</td></tr>"#,
            name = esc(&u.name.clone().unwrap_or_else(|| "Anonymous".into())),
            email = esc(&u.email),
            role_badge = if u.role == "admin" { label_span("admin", "tag-primary") } else { label_span("user", "tag-secondary") },
            approved = stats.approved_contributions,
            pending = stats.pending_contributions,
            rejected = stats.rejected_contributions,
            created = format_date_only_myt(u.created_at),
            role_action = role_action,
        ));
    }
    let content = admin_table(&["Name", "Email", "Role", "Contributions (✓/⏳/✗)", "Created", "Actions"], rows_html, "No users found.");
    Html(render_admin(shell, "User Management", "Here you can manage all the users.", content)).into_response()
}

pub async fn user_promote(State(state): State<AppState>, Path(id): Path<String>, headers: HeaderMap) -> Response {
    let Some(admin) = require_admin(&state.pool, &headers).await.ok().flatten() else { return Redirect::to("/").into_response() };
    if admin.id == id {
        return redirect_flash("/admin/users", "Cannot change your own role");
    }
    let _ = sqlx::query("UPDATE users SET role='admin', updated_at=now() WHERE id=$1").bind(&id).execute(&state.pool).await;
    redirect_flash("/admin/users", "Admin role granted")
}

pub async fn user_demote(State(state): State<AppState>, Path(id): Path<String>, headers: HeaderMap) -> Response {
    let Some(admin) = require_admin(&state.pool, &headers).await.ok().flatten() else { return Redirect::to("/").into_response() };
    if admin.id == id {
        // Last admin guard
        let admins: i64 = sqlx::query("SELECT COUNT(*) FROM users WHERE role='admin'").fetch_one(&state.pool).await.map(|r| r.try_get(0).unwrap_or(1)).unwrap_or(1);
        if admins <= 1 {
            return redirect_flash("/admin/users", "Cannot remove admin role from yourself as you are the last admin user");
        }
    }
    let _ = sqlx::query("UPDATE users SET role='user', updated_at=now() WHERE id=$1").bind(&id).execute(&state.pool).await;
    redirect_flash("/admin/users", "Admin role removed")
}

// ---------- Friday ----------

pub async fn friday_admin(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let Ok(shell) = admin_shell(&state, &headers).await else { return Redirect::to("/").into_response() };
    let (current, favourites, _date) = get_admin_friday_data(&state.pool).await.unwrap_or((None, vec![], None));
    let status_card = match &current {
        Some(inst) => {
            let (source, featured) = friday_run_info(&state, inst.id).await;
            format!(
                r#"<div class="card"><h3>Status Kempen Jumaat</h3><div class="big-name">{name}</div><p class="subtext">{state} • {date} • {source}</p></div>"#,
                name = esc(&title_case(&inst.name)),
                state = esc(&inst.state),
                date = featured,
                source = if source == "override" { "Override" } else { "Random" },
            )
        }
        None => format!(r#"<div class="card"><h3>Status Kempen Jumaat</h3><p>Tiada kempen aktif sekarang. Window aktif dari Khamis 7:00 PM hingga Jumaat 6:59 PM MYT.</p></div>"#),
    };
    let fav_rows = favourites.iter().map(|f| format!(
        r#"<li class="leader-row"><span class="leader-name">{name}</span><span class="leader-count">{state} • {cat}</span>
  <form method="post" action="/admin/friday/favourite/{id}/remove" class="inline-form"><button class="btn btn-sm btn-danger" type="submit">Buang</button></form></li>"#,
        name = esc(&title_case(&f.name)),
        state = esc(&f.state),
        cat = category_label(&f.category),
        id = f.id,
    )).collect::<String>();
    let content = format!(
        r#"<div class="admin-grid">
{status}
<div class="card">
  <h3>Override Aktif</h3>
  <form method="post" action="/admin/friday/override" class="stack">
    <select class="select-input" name="institutionId">
      <option value="">Pilih override...</option>{approved_opts}
    </select>
    <button class="btn btn-primary" type="submit">Simpan override</button>
    <button class="btn btn-ghost" type="submit" name="clear" value="1">Kosongkan override</button>
  </form>
</div>
<div class="card">
  <h3>Favourites</h3>
  <form method="post" action="/admin/friday/favourite" class="stack">
    <select class="select-input" name="institutionId"><option value="">Tambah favourite...</option>{approved_opts}</select>
    <button class="btn btn-ghost" type="submit">Tambah</button>
  </form>
  <ul class="leader-list">{favs}</ul>
  <p class="subtext">Sumber pantas — tekan <b>Buang</b> untuk keluarkan.</p>
</div>
</div>"#,
        status = status_card,
        approved_opts = approved_options(&state).await,
        favs = if fav_rows.is_empty() { String::from("<p class=\"subtext\">Belum ada favourite.</p>") } else { fav_rows },
    );
    Html(render_admin(shell, "Kempen Jumaat", "Urus QR Jumaat random dan favourite override", content)).into_response()
}

async fn friday_run_info(state: &AppState, institution_id: i64) -> (String, String) {
    use sqlx::Row;
    let row = sqlx::query(
        "SELECT source, featured_date::text FROM friday_campaign_runs WHERE institution_id = $1 ORDER BY id DESC LIMIT 1",
    )
    .bind(institution_id)
    .fetch_optional(&state.pool)
    .await
    .ok()
    .flatten();
    match row {
        Some(r) => (
            r.try_get("source").unwrap_or_else(|_| "random".into()),
            r.try_get("featured_date").unwrap_or_else(|_| "".into()),
        ),
        None => ("random".into(), "".into()),
    }
}

async fn approved_options(state: &AppState) -> String {
    let rows = get_all_approved(&state.pool).await.unwrap_or_default();
    rows.iter().map(|i| format!(
        r#"<option value="{id}">{name} — {city}</option>"#,
        id = i.id,
        name = esc(&title_case(&i.name)),
        city = esc(&i.city),
    )).collect()
}

#[derive(Deserialize)]
pub struct FridayAction {
    pub institution_id: Option<i64>,
    pub clear: Option<String>,
}

pub async fn set_override(State(state): State<AppState>, headers: HeaderMap, Form(f): Form<FridayAction>) -> Response {
    let Some(user) = require_admin(&state.pool, &headers).await.ok().flatten() else { return Redirect::to("/").into_response() };
    if f.clear.as_deref() == Some("1") {
        let _ = set_friday_override(&state.pool, None, &user.id).await;
        redirect_flash("/admin/friday", "Override kempen Jumaat dikosongkan.")
    } else {
        match set_friday_override(&state.pool, f.institution_id, &user.id).await {
            Ok(_) => redirect_flash("/admin/friday", "Override kempen Jumaat disimpan."),
            Err(_) => redirect_flash("/admin/friday", "Institution not found or not approved."),
        }
    }
}

pub async fn add_favourite(State(state): State<AppState>, headers: HeaderMap, Form(f): Form<FridayAction>) -> Response {
    let Some(user) = require_admin(&state.pool, &headers).await.ok().flatten() else { return Redirect::to("/").into_response() };
    if let Some(id) = f.institution_id {
        let _ = add_friday_favourite(&state.pool, id, &user.id).await;
    }
    redirect_flash("/admin/friday", "Favourite ditambah.")
}

pub async fn remove_favourite(State(state): State<AppState>, Path(id): Path<i64>, headers: HeaderMap) -> Response {
    let Some(_user) = require_admin(&state.pool, &headers).await.ok().flatten() else { return Redirect::to("/").into_response() };
    let _ = remove_friday_favourite(&state.pool, id).await;
    redirect_flash("/admin/friday", "Favourite dibuang.")
}

// ---------- Ramadhan ----------

pub async fn ramadhan_admin(State(state): State<AppState>, Query(q): Query<AdminListQuery>, headers: HeaderMap) -> Response {
    let Ok(shell) = admin_shell(&state, &headers).await else { return Redirect::to("/").into_response() };
    let year = q.year.unwrap_or_else(|| crate::utils::today_myt().year() as i64).clamp(2020, 2050);
    let campaign = ramadhan_campaign_by_year(&state.pool, year).await.unwrap_or_default();
    let mut rows = String::new();
    let start_date = campaign.first().map(|(c, _)| fmt_iso_from_naive(c.featured_date));
    for day in 1..=30i64 {
        let filled = campaign.iter().find(|(c, _)| c.day_number == day);
        rows.push_str(&format!(
            r#"<tr>
  <td>Hari {day}</td>
  <td>{date}</td>
  <td><select class="select-input" name="day_{day}_institution"><option value="">Tiada</option>{opts}</select></td>
  <td><input class="search-input" name="day_{day}_caption" value="{caption}" placeholder="Mesej harian (pilihan)" maxlength="500" /></td>
</tr>"#,
            day = day,
            date = filled.map(|(c, _)| fmt_date_bm(&fmt_iso_from_naive(c.featured_date))).unwrap_or_else(|| fmt_date_bm(&start_date.clone().unwrap_or_default())),
            opts = day_institution_options(&state, filled.map(|(_, i)| i.id)).await,
            caption = esc(filled.and_then(|(c, _)| c.caption.clone()).unwrap_or_default().as_str()),
        ));
    }
    let years = (crate::utils::today_myt().year() as i64 - 2..=crate::utils::today_myt().year() as i64 + 8).map(|y| {
        let sel = if y == year { " selected" } else { "" };
        format!(r#"<option value="{y}"{sel}>{y}</option>"#)
    }).collect::<String>();
    let content = format!(
        r#"<form method="post" action="/admin/ramadhan/save" class="stack">
  <div class="filter-bar">
    <select class="select-input" name="_year" onchange="this.form.action='/admin/ramadhan?year='+this.value;this.form.method='get';this.form.submit()">{years}</select>
    <input type="date" class="search-input" name="startDate" value="{start}" />
    <button class="btn btn-primary" type="submit">Simpan</button>
  </div>
  <table class="data-table card"><thead><tr><th>Hari</th><th>Tarikh</th><th>Institusi</th><th>Kapsyen</th></tr></thead><tbody>{rows}</tbody></table>
</form>
{flash}"#,
        years = years,
        start = start_date.unwrap_or_default(),
        rows = rows,
        flash = flash_banner(&read_msg(&q)),
    );
    Html(render_admin(shell, &format!("Kempen Ramadan — 30 Hari 30 QR ({year})"), "Urus kempen QR sehari untuk bulan Ramadan", content)).into_response()
}

async fn day_institution_options(state: &AppState, selected: Option<i64>) -> String {
    let rows = get_all_approved(&state.pool).await.unwrap_or_default();
    rows.iter().map(|i| {
        let sel = if selected == Some(i.id) { " selected" } else { "" };
        format!(r#"<option value="{id}"{sel}>{name} — {city}, {state}</option>"#, id = i.id, name = esc(&title_case(&i.name)), city = esc(&i.city), state = esc(&i.state))
    }).collect()
}

#[derive(Deserialize)]
pub struct RamadhanSave {
    pub _year: Option<i64>,
    pub year: Option<i64>,
    pub startDate: String,
    #[serde(flatten)]
    pub days: std::collections::HashMap<String, String>,
}

pub async fn ramadhan_save(State(state): State<AppState>, headers: HeaderMap, Form(f): Form<RamadhanSave>) -> Response {
    let Some(user) = require_admin(&state.pool, &headers).await.ok().flatten() else { return Redirect::to("/").into_response() };
    let year = f.year.or(f._year).unwrap_or(crate::utils::today_myt().year() as i64).clamp(2020, 2050);
    let Ok(start) = chrono::NaiveDate::parse_from_str(f.startDate.trim(), "%Y-%m-%d") else {
        return redirect_flash(&format!("/admin/ramadhan?year={year}"), "Invalid start date");
    };
    // delete all for year
    let _ = sqlx::query("DELETE FROM ramadhan_campaigns WHERE year = $1").bind(year).execute(&state.pool).await;
    for day in 1..=30i64 {
        let inst_raw = f.days.get(&format!("day_{day}_institution")).cloned().unwrap_or_default();
        let caption = f.days.get(&format!("day_{day}_caption")).cloned().unwrap_or_default();
        if let Ok(inst_id) = inst_raw.parse::<i64>() {
            let featured_date = start.checked_add_signed(chrono::Duration::days(day - 1)).unwrap_or(start);
            let _ = sqlx::query(
                "INSERT INTO ramadhan_campaigns (year, day_number, featured_date, institution_id, caption, curated_by) VALUES ($1, $2, $3, $4, $5, $6)",
            )
            .bind(year)
            .bind(day)
            .bind(featured_date)
            .bind(inst_id)
            .bind(if caption.is_empty() { None } else { Some(caption.clone()) })
            .bind(&user.id)
            .execute(&state.pool)
            .await;
        }
    }
    redirect_flash(&format!("/admin/ramadhan?year={year}"), "Kempen Ramadan berjaya disimpan.")
}

// ---------- Blog admin ----------

pub async fn blog_admin(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let Ok(shell) = admin_shell(&state, &headers).await else { return Redirect::to("/").into_response() };
    let posts = all_blog_posts(&state.pool).await.unwrap_or_default();
    let rows_html = posts.iter().map(|p| format!(
        r#"<tr><td><a href="/admin/blog/{id}">{title}</a><div class="subtext">/{slug}</div></td><td>{chip}</td><td>{featured}</td><td>{updated}</td><td>{published}</td><td><a class="btn btn-sm" href="/admin/blog/{id}">Edit</a></td></tr>"#,
        id = p.id,
        title = esc(&p.title),
        slug = esc(&p.slug),
        chip = if p.status == "published" { label_span("published", "tag-primary") } else { label_span("draft", "tag-secondary") },
        featured = if p.featured { "Yes" } else { "No" },
        updated = p.updated_at.map(format_date_only_myt).unwrap_or_else(|| "-".into()),
        published = p.published_at.map(format_date_only_myt).unwrap_or_else(|| "-".into()),
    )).collect::<String>();
    let content = format!(
        r#"<div class="admin-toolbar"><a class="btn btn-primary" href="/admin/blog/new">Create Post</a></div>
{table}"#,
        table = admin_table(&["Title", "Status", "Featured", "Updated", "Published", "Actions"], rows_html, "No posts yet."),
    );
    Html(render_admin(shell, "Blog", "Manage blog posts, drafts, and publishing.", content)).into_response()
}

#[derive(Deserialize)]
pub struct BlogForm {
    pub post_id: Option<i64>,
    pub title: String,
    pub slug: String,
    pub excerpt: Option<String>,
    pub cover_image_url: Option<String>,
    pub og_image_url: Option<String>,
    pub meta_title: Option<String>,
    pub meta_description: Option<String>,
    pub featured: Option<String>,
    pub content_json: Option<String>,
}

pub async fn blog_editor(State(state): State<AppState>, Path(id): Path<i64>, headers: HeaderMap) -> Response {
    let Ok(shell) = admin_shell(&state, &headers).await else { return Redirect::to("/").into_response() };
    let Some(post) = blog_post_by_id(&state.pool, id).await.ok().flatten() else {
        return Redirect::to("/admin/blog").into_response();
    };
    let action_buttons = if post.status == "published" {
        format!(r##"<form method="post" action="/admin/blog/{id}/unpublish" class="inline-form"><button class="btn btn-ghost" type="submit">Unpublish</button></form>"##, id = id)
    } else {
        format!(r##"<form method="post" action="/admin/blog/{id}/publish" class="inline-form"><button class="btn btn-ghost" type="submit">Publish</button></form>"##, id = id)
    };
    let content = format!(
        r#"<div class="filter-bar">{action_buttons}<form method="post" action="/admin/blog/{id}/delete" class="inline-form"><button class="btn btn-danger" type="submit">Delete</button></form></div>
<form method="post" action="/admin/blog/save" class="stack card editor-form">
  <input type="hidden" name="post_id" value="{id}" />
  {title_field}
  {slug_field}
  {excerpt_field}
  {cover_field}
  {og_field}
  {meta_title_field}
  {meta_desc_field}
  <label class="check-label"><input type="checkbox" name="featured" value="1" {feat}/> Feature this post</label>
  <div class="field"><label for="content_json">Content (JSON)</label><textarea id="content_json" name="content_json" rows="14" class="mono">{content_json}</textarea></div>
  <button class="btn btn-primary" type="submit">Save Draft</button>
</form>"#,
        action_buttons = action_buttons,
        id = id,
        title_field = form_text_field("title", "Title", &post.title, "Post title", true),
        slug_field = form_text_field("slug", "Slug", &post.slug, "post-slug", false),
        excerpt_field = textarea_field("excerpt", "Excerpt", post.excerpt.as_deref().unwrap_or("")),
        cover_field = form_text_field("cover_image_url", "Cover Image URL", post.cover_image_url.as_deref().unwrap_or(""), "https://...", false),
        og_field = form_text_field("og_image_url", "OG Image URL", post.og_image_url.as_deref().unwrap_or(""), "https://...", false),
        meta_title_field = form_text_field("meta_title", "Meta Title", post.meta_title.as_deref().unwrap_or(""), "", false),
        meta_desc_field = form_text_field("meta_description", "Meta Description", post.meta_description.as_deref().unwrap_or(""), "", false),
        feat = if post.featured { "checked" } else { "" },
        content_json = esc(&post.content_json.to_string()),
    );
    Html(render_admin(shell, &post.title, "Edit post details, content, and publishing status.", content)).into_response()
}

pub async fn blog_new(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let Ok(shell) = admin_shell(&state, &headers).await else { return Redirect::to("/").into_response() };
    let content = format!(
        r#"<form method="post" action="/admin/blog/save" class="stack card editor-form">
  {title_field}
  {slug_field}
  {excerpt_field}
  <div class="field"><label for="content_json">Content (JSON)</label><textarea id="content_json" name="content_json" rows="14" class="mono">{default_content}</textarea></div>
  <button class="btn btn-primary" type="submit">Save Draft</button>
</form>"#,
        title_field = form_text_field("title", "Title", "", "Post title", true),
        slug_field = form_text_field("slug", "Slug", "", "post-slug", false),
        excerpt_field = textarea_field("excerpt", "Excerpt", ""),
        default_content = r#"{"type":"doc","content":[{"type":"paragraph","content":[]}]}"#,
    );
    Html(render_admin(shell, "New Blog Post", "Create a draft and publish when ready.", content)).into_response()
}

pub async fn blog_save(State(state): State<AppState>, headers: HeaderMap, Form(f): Form<BlogForm>) -> Response {
    let Some(user) = require_admin(&state.pool, &headers).await.ok().flatten() else { return Redirect::to("/").into_response() };
    let content_json: serde_json::Value = match f.content_json.as_deref().map(serde_json::from_str) {
        Some(Ok(v)) => v,
        _ => return redirect_flash("/admin/blog", "Invalid JSON content."),
    };
    if !crate::blogrender::is_valid_doc(&content_json) {
        return redirect_flash("/admin/blog", "Invalid blog document");
    }
    let slug_base = crate::constants::sanitize_slug(&f.slug);
    let mut slug = slug_base.clone();
    let mut n = 1;
    while blog_slug_exists(&state.pool, &slug, f.post_id).await.unwrap_or(false) {
        n += 1;
        slug = format!("{slug_base}-{n}");
    }
    let featured = f.featured.as_deref() == Some("1");
    if featured {
        let _ = sqlx::query("UPDATE blog_posts SET featured = false WHERE status = 'published' AND featured = true")
            .execute(&state.pool)
            .await;
    }
    match f.post_id {
        Some(id) => {
            let _ = sqlx::query(
                "UPDATE blog_posts SET title=$1, slug=$2, excerpt=$3, cover_image_url=$4, og_image_url=$5, meta_title=$6, meta_description=$7, content_json=$8, featured=$9, updated_at=now() WHERE id=$10",
            )
            .bind(&f.title)
            .bind(&slug)
            .bind(f.excerpt.clone().filter(|s| !s.trim().is_empty()))
            .bind(f.cover_image_url.clone().filter(|s| !s.trim().is_empty()))
            .bind(f.og_image_url.clone().filter(|s| !s.trim().is_empty()))
            .bind(f.meta_title.clone().filter(|s| !s.trim().is_empty()))
            .bind(f.meta_description.clone().filter(|s| !s.trim().is_empty()))
            .bind(&content_json)
            .bind(featured)
            .bind(id)
            .execute(&state.pool)
            .await;
            redirect_flash(&format!("/admin/blog/{id}"), "Draft saved")
        }
        None => {
            let res = sqlx::query(
                "INSERT INTO blog_posts (title, slug, excerpt, cover_image_url, og_image_url, meta_title, meta_description, content_json, featured, status, author_id, created_at, updated_at)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'draft',$10,now(),now()) RETURNING id",
            )
            .bind(&f.title)
            .bind(&slug)
            .bind(f.excerpt.clone().filter(|s| !s.trim().is_empty()))
            .bind(f.cover_image_url.clone().filter(|s| !s.trim().is_empty()))
            .bind(f.og_image_url.clone().filter(|s| !s.trim().is_empty()))
            .bind(f.meta_title.clone().filter(|s| !s.trim().is_empty()))
            .bind(f.meta_description.clone().filter(|s| !s.trim().is_empty()))
            .bind(&content_json)
            .bind(featured)
            .bind(&user.id)
            .fetch_one(&state.pool)
            .await;
            match res {
                Ok(_row) => redirect_flash("/admin/blog", "Draft created"),
                Err(_) => redirect_flash("/admin/blog", "Failed to create post"),
            }
        }
    }
}

pub async fn blog_publish(State(state): State<AppState>, Path(id): Path<i64>, headers: HeaderMap) -> Response {
    let Some(_user) = require_admin(&state.pool, &headers).await.ok().flatten() else { return Redirect::to("/").into_response() };
    let _ = sqlx::query(
        "UPDATE blog_posts SET status='published', published_at = COALESCE(published_at, now()), updated_at=now() WHERE id=$1",
    )
    .bind(id)
    .execute(&state.pool)
    .await;
    redirect_flash(&format!("/admin/blog/{id}"), "Post published")
}

pub async fn blog_unpublish(State(state): State<AppState>, Path(id): Path<i64>, headers: HeaderMap) -> Response {
    let Some(_user) = require_admin(&state.pool, &headers).await.ok().flatten() else { return Redirect::to("/").into_response() };
    let _ = sqlx::query("UPDATE blog_posts SET status='draft', updated_at=now() WHERE id=$1").bind(id).execute(&state.pool).await;
    redirect_flash(&format!("/admin/blog/{id}"), "Post unpublished")
}

pub async fn blog_delete(State(state): State<AppState>, Path(id): Path<i64>, headers: HeaderMap) -> Response {
    let Some(_user) = require_admin(&state.pool, &headers).await.ok().flatten() else { return Redirect::to("/").into_response() };
    let _ = sqlx::query("DELETE FROM blog_posts WHERE id=$1").bind(id).execute(&state.pool).await;
    redirect_flash("/admin/blog", "Post deleted")
}

// ---------- Threads ----------

pub async fn threads_admin(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let Ok(shell) = admin_shell(&state, &headers).await else { return Redirect::to("/").into_response() };
    let has_creds = !state.cfg.threads_access_token.as_deref().unwrap_or("").is_empty()
        || !state.cfg.threads_user_id.as_deref().unwrap_or("").is_empty();
    let warning = r#"<div class="alert alert-warning">please be careful, this will be posted using khairin's account</div>"#;
    let content = format!(
        r#"{warning}
{creds}
<div class="card stack">
  <h3>Publish to Threads</h3>
  <form method="post" action="/admin/threads/publish" enctype="multipart/form-data" class="stack">
    <div class="field"><label for="text">Post text (max 500)</label><textarea id="text" name="text" maxlength="500" rows="6"></textarea></div>
    <div class="field"><label for="image">Attach image (optional)</label><input type="file" id="image" name="image" accept="image/*" /></div>
    <div class="field"><label for="reply_to_id">Reply to post ID (optional)</label><input id="reply_to_id" name="reply_to_id" class="search-input" /></div>
    <button class="btn btn-primary" type="submit">Publish to Threads</button>
  </form>
</div>
<script>window.__THREADS_OK__=true</script>"#,
        warning = warning,
        creds = if has_creds { String::new() } else { r#"<div class="alert alert-warning">Missing Threads credentials. Set THREADS_USER_ID and THREADS_ACCESS_TOKEN or reconnect Meta OAuth first.</div>"#.to_string() },
    );
    Html(render_admin(shell, "Threads Posting", "Create a new post or add to an existing thread chain.", content)).into_response()
}

pub async fn threads_publish(State(state): State<AppState>, headers: HeaderMap, mut multipart: Multipart) -> Response {
    use sqlx::Row;
    let Some(_user) = require_admin(&state.pool, &headers).await.ok().flatten() else { return Redirect::to("/").into_response() };
    let mut text = String::new();
    let mut reply_to_id: Option<String> = None;
    let mut image_bytes: Vec<u8> = Vec::new();
    let mut image_name: Option<String> = None;
    let mut image_type: Option<String> = None;
    while let Some(field) = multipart.next_field().await.unwrap_or(None) {
        match field.name().unwrap_or("") {
            "text" => text = field.text().await.unwrap_or_default(),
            "reply_to_id" => reply_to_id = field.text().await.ok().filter(|s| !s.is_empty()),
            "image" => {
                image_name = field.file_name().map(String::from);
                image_type = field.content_type().map(String::from);
                image_bytes = field.bytes().await.unwrap_or_default().to_vec();
            }
            _ => {}
        }
    }
    if text.is_empty() && image_bytes.is_empty() {
        return redirect_flash("/admin/threads", "Text or image required");
    }
    if text.chars().count() > 500 {
        return redirect_flash("/admin/threads", "Post text must be 500 characters or fewer.");
    }
    // Resolve credentials: env preferred, fallback to stored OAuth token.
    let (user_id, access_token) = if let (Some(uid), Some(tok)) = (state.cfg.threads_user_id.clone(), state.cfg.threads_access_token.clone()) {
        (uid, tok)
    } else {
        let row = sqlx::query("SELECT value FROM verifications WHERE id='meta-threads-oauth-token'")
            .fetch_optional(&state.pool).await.ok().flatten();
        match row {
            Some(r) => {
                let value: String = r.try_get(0).unwrap_or_default();
                let parsed: serde_json::Value = serde_json::from_str(&value).unwrap_or(json!({}));
                (parsed.get("user_id").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                 parsed.get("access_token").and_then(|v| v.as_str()).unwrap_or("").to_string())
            }
            None => (String::new(), String::new()),
        }
    };
    if user_id.is_empty() || access_token.is_empty() {
        return redirect_flash("/admin/threads", "Missing Threads credentials.");
    }
    // Upload image (if any) to R2
    let mut image_url: Option<String> = None;
    if !image_bytes.is_empty() {
        if !image_type.as_deref().map(|t| t.starts_with("image/")).unwrap_or(false) {
            return redirect_flash("/admin/threads", "Attached file must be an image.");
        }
        if image_bytes.len() > 10 * 1024 * 1024 {
            return redirect_flash("/admin/threads", "Image must be <= 10MB.");
        }
        if let Some(r2) = state.r2.as_ref() {
            image_url = r2.upload_file(&image_bytes, image_name.as_deref().unwrap_or("post.png")).await.ok();
        }
        if image_url.is_none() {
            return redirect_flash("/admin/threads", "Failed to upload image.");
        }
    }
    let client = reqwest::Client::new();
    let mut form = Vec::new();
    if let Some(url) = &image_url {
        form.push(("media_type", "IMAGE"));
        form.push(("image_url", url.as_str()));
    } else {
        form.push(("media_type", "TEXT"));
        form.push(("text", text.as_str()));
    }
    if let Some(r) = &reply_to_id {
        form.push(("reply_to_id", r.as_str()));
    }
    form.push(("access_token", access_token.as_str()));
    let container_url = format!("https://graph.threads.net/v1.0/{user_id}/threads");
    let container_resp = client.post(&container_url).form(&form).send().await;
    let creation_id = match container_resp {
        Ok(r) => {
            let v: serde_json::Value = r.json().await.unwrap_or(json!({}));
            match v.get("id").and_then(|x| x.as_str()).map(String::from) {
                Some(id) => id,
                None => {
                    let msg = v.get("message").or_else(|| v.get("error_message")).and_then(|x| x.as_str()).unwrap_or("Unknown error");
                    return redirect_flash("/admin/threads", &format!("Threads API: {msg}"));
                }
            }
        }
        Err(e) => return redirect_flash("/admin/threads", &format!("Threads API request failed: {e}")),
    };
    let publish_url = format!("https://graph.threads.net/v1.0/{user_id}/threads_publish");
    let pub_resp = client.post(&publish_url).form(&[("creation_id", creation_id.as_str()), ("access_token", access_token.as_str())]).send().await;
    match pub_resp {
        Ok(_) => redirect_flash("/admin/threads", if image_url.is_some() { "Image post published successfully." } else { "Post published successfully." }),
        Err(e) => redirect_flash("/admin/threads", &format!("Publish failed: {e}")),
    }
}

// ---------- posting routes used by main ----------

use axum::extract::Form;

pub async fn _unreachable() {}
