use crate::constants::*;
use crate::queries::*;
use crate::render::*;
use crate::session::get_session_from_headers;
use crate::state::AppState;
use crate::utils::*;
use axum::extract::{Form, Path, Query, State};
use axum::http::HeaderMap;
use axum::response::{Html, IntoResponse, Redirect, Response};
use chrono::Datelike;
use serde::Deserialize;
use serde_json::json;
use sqlx::Row;

pub const ROUTE_ORDER: [&str; 3] = ["/contribute", "/my-contributions", "/leaderboard"];

#[derive(Deserialize)]
pub struct HomeQuery {
    pub search: Option<String>,
    pub category: Option<String>,
    pub state: Option<String>,
    pub page: Option<i64>,
}

fn parse_categories(s: Option<&String>) -> Vec<String> {
    match s {
        Some(v) => v
            .split(',')
            .filter(|c| !c.is_empty())
            .map(|c| normalize_institution_category(c).to_string())
            .collect(),
        None => Vec::new(),
    }
}

pub async fn shell_for(
    state: &AppState,
    headers: &HeaderMap,
) -> (Shell, Option<crate::models::User>) {
    let user = get_session_from_headers(&state.pool, headers)
        .await
        .ok()
        .flatten()
        .map(|(_, u)| u);
    let is_admin = user.as_ref().map(|u| u.role == "admin").unwrap_or(false);
    let mut shell = Shell::default();
    shell.logged_in = user.is_some();
    shell.is_admin = is_admin;
    (shell, user)
}

// ---------- Home ----------

pub async fn home(
    State(state): State<AppState>,
    Query(q): Query<HomeQuery>,
    headers: HeaderMap,
) -> Response {
    let (mut shell, _user) = shell_for(&state, &headers).await;
    let categories = parse_categories(q.category.as_ref());
    let page = q.page.unwrap_or(1).max(1);
    let filter = PublicFilter {
        search: q.search.clone(),
        categories: categories.clone(),
        state: q.state.clone(),
    };
    let page_data = match get_public_institutions_page(&state.pool, &filter, page, 50).await {
        Ok(p) => p,
        Err(_) => InstitutionPage {
            institutions: vec![],
            pagination: Pagination {
                page,
                limit: 50,
                total: 0,
                has_more: false,
                total_pages: 0,
            },
            facets: Facets {
                category_counts: serde_json::Map::new(),
            },
        },
    };
    let banner = home_banner(&state).await;
    let card_html: Vec<String> = match get_public_rows(&state.pool, &filter, 1, 50).await {
        Ok(rows) => rows.iter().map(|r| institution_card(r)).collect(),
        Err(_) => vec![],
    };

    let content = format!(
        r#"<div class="container home-page">
{banner}
<div class="home-content">
  <aside class="filters-panel">
    <div class="filter-search">
      <input id="q" type="search" class="search-input" placeholder="Cari masjid/surau/institusi..." value="{q}" autocomplete="off" />
    </div>
    <div class="filter-group">
      <div class="filter-label">Kategori</div>
      <div class="filter-cats">{cat_buttons}</div>
    </div>
    <div class="filter-group">
      <div class="filter-label">Negeri</div>
      <select id="state" class="select-input">{state_options}</select>
    </div>
    <div class="filter-actions">
      <button id="reset-filters" class="btn btn-ghost">Set semula tapisan</button>
    </div>
  </aside>
  <section class="results-panel">
    <div id="results-meta" class="results-meta">
      <span id="filtered-count" class="filtered-count">Jumlah hasil tapisan</span>
      <span id="count-chip" class="count-chip">{total}</span>
    </div>
    <div id="results-grid" class="cards-grid">{cards}</div>
    <div id="results-end" class="results-end"></div>
    <div id="results-empty" class="empty-state" hidden>
      <div class="empty-icon">🔍</div>
      <h3>Tiada institusi dijumpai.</h3>
      <p>Cuba kosongkan carian atau tapis semula senarai QR.</p>
      <div class="empty-actions">
        <button class="btn btn-primary" id="reset-empty">Set semula carian</button>
        <a class="btn btn-outline" href="/contribute">Sumbang QR</a>
      </div>
    </div>
  </section>
</div>
<a class="rawak-footer-link" href="/rawak">Sedekah Rawak</a>
</div>"#,
        banner = banner,
        q = esc(&q.search.clone().unwrap_or_default()),
        cat_buttons = category_buttons(&categories, &page_data.facets.category_counts),
        state_options = states_options(&q.state),
        total = page_data.pagination.total,
        cards = card_html.join(""),
    );

    shell.meta.title = "Sedekah Je - Platform Sedekah QR Malaysia".to_string();
    shell.meta.description =
        "Platform digital untuk memudahkan sedekah ke masjid, surau dan institusi di Malaysia, dengan hanya satu imbasan QR.".to_string();
    Html(begin_page(&shell, content)).into_response()
}

fn category_buttons(selected: &[String], counts: &serde_json::Map<String, serde_json::Value>) -> String {
    let mut out = String::new();
    for cat in CATEGORIES {
        let is_sel = selected.iter().any(|c| c == cat);
        let sel = if is_sel { " active" } else { "" };
        let count = counts.get(cat).and_then(|v| v.as_i64()).unwrap_or(0);
        out.push_str(&format!(
            r#"<button class="cat-button{sel}" data-cat="{}" type="button" aria-pressed="{}">{icon}<span class="cat-label">{label}</span><span class="cat-count">{count}</span></button>"#,
            cat,
            if is_sel { "true" } else { "false" },
            icon = category_icon_lil(cat),
            label = category_label(cat),
            count = count,
        ));
    }
    out
}

pub fn category_icon_lil(category: &str) -> String {
    category_icon(category)
}

fn states_options(selected: &Option<String>) -> String {
    let mut out = String::from(r#"<option value="">Semua Negeri</option>"#);
    for s in STATES {
        let sel = if selected.as_deref() == Some(s) { " selected" } else { "" };
        out.push_str(&format!(r#"<option value="{}"{}>{}</option>"#, esc(s), sel, esc(s)));
    }
    out
}

async fn home_banner(state: &AppState) -> String {
    // Ramadhan today's featured first.
    if let Some((camp, inst)) = ramadhan_todays_featured(&state.pool, crate::utils::islamic_today_myt()).await.ok().flatten() {
        let href = format!("/{}/{}", inst.category, inst.slug);
        return format!(
            r##"<a class="campaign-banner ramadhan" href="{href}">
  <div class="banner-eyebrow">QR Hari Ini — Hari ke-{day}/30</div>
  <div class="banner-name">{name}</div>
  <div class="banner-meta">{city}, {state}</div>
  <span class="btn btn-primary btn-sm">Lihat QR</span>
  <a class="banner-secondary" href="/ramadhan">Semua 30 Hari</a>
</a>"##,
            href = href,
            day = camp.day_number,
            name = esc(&inst.name),
            city = esc(&inst.city),
            state = esc(&inst.state),
        );
    }
    if let Some(inst) = get_current_friday_campaign(&state.pool).await.ok().flatten() {
        let href = format!("/{}/{}", inst.category, inst.slug);
        return format!(
            r##"<a class="campaign-banner friday" href="{href}">
  <div class="banner-eyebrow">QR Jumaat Pilihan</div>
  <div class="banner-name">{name}</div>
  <div class="banner-meta">{city}, {state}</div>
  <span class="btn btn-primary btn-sm">Lihat QR</span>
</a>"##,
            href = href,
            name = esc(&inst.name),
            city = esc(&inst.city),
            state = esc(&inst.state),
        );
    }
    String::new()
}

// ---------- Institution detail ----------

pub async fn institution_detail(
    State(state): State<AppState>,
    Path((_category, slug)): Path<(String, String)>,
    headers: HeaderMap,
) -> Response {
    let (mut shell, user) = shell_for(&state, &headers).await;
    let Some(inst) = get_institution_by_slug(&state.pool, &slug).await.ok().flatten() else {
        return not_found_page(state).await;
    };
    let name_caps = title_case(&inst.name);
    let city_caps = title_case(&inst.city);
    let state_caps = title_case(&inst.state);
    let payments = inst.supported_payment_vec();
    let (brand_color, brand_label) = brand_color(Some(&payments));

    shell.meta.title = format!("{} - Sedekah Digital", name_caps);
    shell.meta.description =
        format!("Salurkan sumbangan anda kepada {} melalui Sedekah Je dengan hanya satu imbasan QR.", name_caps);
    shell.meta.canonical = format!("https://sedekah.je/{}/{}", inst.category, inst.slug);
    shell.meta.og_image = format!("https://sedekah.je/api/og/{}", inst.slug);
    shell.meta.og_type = "website".to_string();
    shell.meta.extra_head = format!(
        r#"<script type="application/ld+json">{}</script>"#,
        esc(&format!(
            r#"{{"@context":"https://schema.org","@type":"Organization","name":"{}","url":"https://sedekah.je/{}","description":"Platform digital untuk sumbangan melalui QR kepada {}"}}"#,
            escape_json(&inst.name),
            escape_json(&inst.slug),
            escape_json(&inst.name),
        ))
    );

    let coords = inst.coords_pair();
    let map_block = if let Some((lat, lng)) = coords {
        format!(
            r#"<details class="map-details"><summary class="btn btn-outline">Tunjukkan Peta</summary>
<div id="map" class="map-leaflet" data-lat="{}" data-lng="{}" data-name="{}"></div>
</details>"#,
            lat, lng, esc(&name_caps)
        )
    } else {
        String::new()
    };

    // Copy/actions row
    let description_block = match &inst.description {
        Some(d) if !d.is_empty() => format!(
            r#"<details class="desc-details"><summary>Lagi maklumat</summary><p class="inst-description">{}</p></details>"#,
            esc(d)
        ),
        _ => String::new(),
    };

    let qr = qr_tile(&inst, 220, "page-qr");
    let claim_button = if user.is_some() && inst.claimable() {
        format!(
            r#"<form method="post" action="/claim/submit" class="inline-form">
  <input type="hidden" name="institutionId" value="{}" />
  <button class="btn btn-outline" type="submit">Tuntut</button>
</form>"#,
            inst.id
        )
    } else {
        String::new()
    };
    let share_links = format!(
        r#"<a class="btn btn-outline" target="_blank" href="https://x.com/intent/post?text={}">Kongsi ke X</a>
<a class="btn btn-outline" target="_blank" href="https://wa.me/?text={}">Kongsi ke WhatsApp</a>
<a class="btn btn-outline" href="/embed/{slug}">Sematkan</a>"#,
        urlencoding::encode(&format!("Sedekah untuk {} di sedekah.je", inst.name)),
        urlencoding::encode(&format!("Sedekah untuk {} di sedekah.je/{}/{}", inst.name, inst.category, inst.slug)),
        slug = inst.slug,
    );

    let content = format!(
        r#"<div class="container page-container">
{breadcrumb}
<div class="institution-page">
  <div class="institution-hero">
    <div class="cat-head">
      {chip}
      <h1 class="institution-name">{name}</h1>
      <span class="institution-location">📍 {city}, {state}</span>
    </div>
    {qr}
    <div class="brand-note">Dikuasakan oleh {brand_label}</div>
    <div class="inst-actions">{actions}</div>
    {map}
    {description}
  </div>
</div>
</div>"#,
        breadcrumb = breadcrumb(&[("Laman Utama", "/".into()), (name_caps.as_str(), String::new())]),
        chip = category_chip(&inst.category),
        name = esc(&name_caps),
        city = esc(&city_caps),
        state = esc(&state_caps),
        qr = qr,
        brand_label = brand_label,
        actions = format!("{share_links}{claim_button}"),
        map = map_block,
        description = description_block,
    );

    Html(begin_page(&shell, content)).into_response()
}

pub async fn not_found_page(_state: AppState) -> Response {
    let mut shell = Shell::default();    shell.meta.noindex = true;
    let content = format!(
        r#"<div class="container not-found">
  <h1>404 tidak dijumpai</h1>
  <p>tersesat? ikut saya <a href="/">Laman Utama</a></p>
</div>"#
    );
    Html(begin_page(&shell, content)).into_response()
}

// ---------- Rawak ----------

pub async fn rawak(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let (mut shell, _user) = shell_for(&state, &headers).await;
    let all = get_all_approved(&state.pool).await.unwrap_or_default();
    let rawak_json = serde_json::to_string(
        &all
            .iter()
            .map(|r| {
                json!({
                    "name": r.name,
                    "category": normalize_institution_category(&r.category),
                    "state": r.state,
                    "city": r.city,
                    "slug": r.slug,
                    "qrContent": r.qr_content,
                    "qrImage": r.qr_image,
                    "supportedPayment": r.supported_payment_vec(),
                    "coords": r.coords,
                })
            })
            .collect::<Vec<_>>(),
    )
    .unwrap_or_default();

    let content = format!(
        r#"<div class="container page-container">
{breadcrumb}
<div id="rawak-app" class="rawak-page" data-institutions='{rawak_json}'>
  <div class="rawak-filters card">
    <div class="filter-group">
      <div class="filter-label">Kategori</div>
      <div class="filter-cats" id="rawak-cats">{cat_buttons}</div>
    </div>
    <div class="filter-group">
      <div class="filter-label">Negeri</div>
      <select id="rawak-state" class="select-input">{states}</select>
    </div>
    <button id="rawak-generate" class="btn btn-primary">Jana QR Rawak</button>
    <button id="rawak-reset" class="btn btn-ghost" hidden>Set semula filter</button>
  </div>
  <div id="rawak-result" class="rawak-result empty-card">
    <div class="empty-icon">⬛</div>
    <p>Klik butang untuk menjana kod QR rawak.</p>
  </div>
  <p id="rawak-count" class="filtered-count" hidden></p>
  <div class="rawak-footer">
    <a href="/faq">Soalan Lazim</a>
    <a href="/data">Data Institusi</a>
  </div>
</div>
</div>"#,
        breadcrumb = breadcrumb(&[("Laman Utama", "/".into()), ("Sedekah Rawak".into(), String::new())]),
        cat_buttons = rawak_category_buttons(),
        states = states_options(&None),
    );

    shell.meta.title = "Sedekah Rawak".to_string();
    Html(begin_page(&shell, content)).into_response()
}

fn rawak_category_buttons() -> String {
    let mut out = String::new();
    for cat in CATEGORIES {
        out.push_str(&format!(
            r#"<button class="cat-button" data-cat="{}" type="button">{icon}<span class="cat-label">{label}</span></button>"#,
            cat,
            icon = category_icon_lil(cat),
            label = category_label(cat),
        ));
    }
    out
}

// ---------- FAQ ----------

pub async fn faq(headers: HeaderMap) -> Response {
    let (shell, _u) = shell_for_faq(&headers).await;
    let content = format!(
        r#"<div class="container page-container">
        {breadcrumb}
        <h2 class="page-title">Soalan Lazim</h2>
        <p>Jawapan ringkas tentang derma, keselamatan QR, dan cara menggunakan sedekah.je.</p>
        <div class="faq-search"><input type="search" id="faq-search" class="search-input" placeholder="Cari soalan…" aria-label="Cari soalan lazim" /></div>
        <div id="faq-list" class="faq-list">{items}</div>
        <div class="card faq-cta">
          <h3>Masih ada soalan?</h3>
          <p>Hantar mesej di X atau buka isu di GitHub jika anda perlukan bantuan atau ingin melaporkan masalah kod QR.</p>
          <div class="empty-actions">
            <a class="btn btn-primary" href="https://x.com/sedekahje" target="_blank">Hubungi Kami</a>
            <a class="btn btn-outline" href="https://github.com/khrnchn/sedekah-je/issues" target="_blank">Laporkan Isu Berkaitan Kod</a>
          </div>
        </div>
        </div>"#,
        breadcrumb = breadcrumb(&[("Laman Utama", "/".into()), ("Soalan Lazim".into(), String::new())]),
        items = faq_items(),
    );
    Html(begin_page(&shell, content)).into_response()
}

async fn shell_for_faq(_headers: &HeaderMap) -> (Shell, ()) {
    (Shell::default(), ())
}

fn h(s: &str) -> String {
    esc(s)
}

fn faq_items() -> String {
    let items = [
        (
            "faq-submit",
            "Sumbangan & Derma",
            "Bagaimana saya menghantar QR institusi?",
            "Log masuk dan pergi ke halaman <a href=\"/contribute\">Sumbang</a>. Muat naik gambar kod QR bersama nama dan lokasi institusi. Ia akan disemak sebelum dipaparkan.",
        ),
        (
            "faq-direct",
            "Sumbangan & Derma",
            "Adakah wang saya sampai terus ke institusi?",
            "Ya. Kami tidak terlibat dalam dana tersebut. Wang sedekah anda disalurkan terus oleh penyedia pembayaran kepada institusi yang anda imbaskan.",
        ),
        (
            "faq-fees",
            "Sumbangan & Derma",
            "Adakah sedekah.je mengenakan yuran?",
            "Tidak. Platform ini percuma dan tiada komisen. Ia ditanggung oleh komuniti dan bersifat open-source.",
        ),
        (
            "faq-filter",
            "Keselamatan & Privasi",
            "Bagaimana kod QR ditapis?",
            "Setiap kod QR disemak secara manual oleh pasukan pentadbir sebelum dipaparkan atas talian bagi memastikan ia sah.",
        ),
        (
            "faq-independent",
            "Keselamatan & Privasi",
            "Adakah anda bernaung di bawah mana-mana kerajaan?",
            "Tidak. Sedekah.je adalah inisiatif komuniti yang bebas dan open-source.",
        ),
        (
            "faq-who",
            "Mengenai Platform",
            "Siapa yang memulakan platform ini?",
            "Platform ini dimulakan oleh <a href=\"https://x.com/khrnchn\" target=\"_blank\">khairin</a> dan dikekalkan oleh komuniti.",
        ),
        (
            "faq-help",
            "Bantuan & Sokongan",
            "Bagaimana saya boleh dapatkan bantuan?",
            "Hubungi <a href=\"https://x.com/sedekahje\" target=\"_blank\">@sedekahje</a> di X atau <a href=\"https://www.threads.net/@sedekahje\" target=\"_blank\">@sedekahje</a> di Threads.",
        ),
    ];
    let mut cats: Vec<(&str, Vec<&(_, _, _, _)>)> = Vec::new();
    for it in items.iter() {
        if let Some(e) = cats.iter_mut().find(|(n, _)| *n == it.1) {
            e.1.push(&it);
        } else {
            cats.push((it.1, vec![&it]));
        }
    }
    let mut out = String::new();
    for (cat_name, cat_items) in cats {
        out.push_str(&format!(
            r##"<div class="faq-group"><h3 class="faq-cat-title">{cat} · {n}</h3>"##,
            cat = h(cat_name),
            n = cat_items.len()
        ));
        for (id, _cat, question, answer) in cat_items {
            out.push_str(&format!(
                r##"<details class="faq-item" id="{id}"><summary><span class="faq-q">{q}</span><span class="faq-chevron">▾</span></summary><div class="faq-a">{a}</div></details>"##,
                id = h(id),
                q = h(question),
                a = answer,
            ));
        }
        out.push_str("</div>");
    }
    out
}

// ---------- Quest ----------

pub async fn quest(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let (mut shell, user) = shell_for(&state, &headers).await;
    let logged = user.is_some();
    let mosques = quest_mosques(&state.pool).await.unwrap_or_default();
    let (unlocked, total) = quest_stats(&state.pool).await.unwrap_or((0, 0));
    let pct = if total > 0 { (unlocked as f64 / total as f64 * 100.0).round() as i64 } else { 0 };
    let rows = serde_json::to_string(
        &mosques
            .iter()
            .map(|m| {
                json!({
                    "id": m.id, "name": m.name, "address": m.address, "district": m.district,
                    "coords": m.coords, "status": m.inst_status,
                    "slug": m.inst_slug, "category": m.inst_category, "qrContent": m.inst_qr,
                })
            })
            .collect::<Vec<_>>(),
    )
    .unwrap_or_default();

    let content = format!(
        r#"<div class="container page-container quest-page">
{breadcrumb}
<div class="quest-top">
  <h1 class="page-title">Mosque Quest</h1>
  <span class="category-chip">Petaling</span>
  <div class="quest-progress"><div class="progress-track"><div class="progress-fill" style="width:{pct}%"></div></div><span>{unlocked}/{total} masjid</span><span class="count-chip">{pct}%</span></div>
</div>
<div class="quest-panels">
  <div class="quest-side">
    <div class="filter-cats" id="quest-filter">
      <button class="cat-button active" data-q="all">Semua</button>
      <button class="cat-button" data-q="unlocked">Tersedia</button>
      <button class="cat-button" data-q="pending">Dalam semakan</button>
      <button class="cat-button" data-q="locked">Belum</button>
    </div>
    <input id="quest-search" type="search" class="search-input" placeholder="Cari masjid..." />
    <select id="quest-sort" class="select-input"><option value="az">A-Z</option><option value="status">Status</option></select>
    <ul id="quest-list" class="quest-list"></ul>
    <p id="quest-count" class="filtered-count"></p>
  </div>
  <div>
    <div id="quest-map" class="map-leaflet quest-map" data-center="[3.1, 101.65]" data-boundary='{boundary}'></div>
    <div id="quest-detail" class="ramadhan-panel"><p class="placeholder">Pilih masjid untuk lihat butiran dan hantar QR.</p></div>
  </div>
</div>
<script>window.__QUEST__ = {rows};window.__QUEST_LOGGED__ = {logged};</script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" crossorigin="" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js" crossorigin="" defer></script>
</div>"#,
        breadcrumb = breadcrumb(&[("Laman Utama", "/".into()), ("Mosque Quest".into(), String::new())]),
        pct = pct,
        unlocked = unlocked,
        total = total,
        rows = rows,
        logged = if logged { "true" } else { "false" },
        boundary = serde_json::to_string(&petaling_boundary()).unwrap_or_default(),
    );
    shell.meta.title = "Mosque Quest".to_string();
    shell.meta.description = "Terokai masjid di daerah Petaling dan sumbang QR code mereka.".to_string();
    Html(begin_page(&shell, content)).into_response()
}

// ---------- Blog ----------

#[derive(Deserialize)]
pub struct BlogQuery {
    pub page: Option<i64>,
}

pub async fn blog(State(state): State<AppState>, Query(q): Query<BlogQuery>, headers: HeaderMap) -> Response {
    let (mut shell, _u) = shell_for(&state, &headers).await;
    let page = q.page.unwrap_or(1).max(1);
    let (posts, total) = published_blog_posts(&state.pool, page).await.unwrap_or_default();
    let featured = featured_blog_post(&state.pool).await.ok().flatten();
    let total_pages = (total + crate::constants::BLOG_PAGE_SIZE - 1) / crate::constants::BLOG_PAGE_SIZE;

    let featured_html = match featured.as_ref() {
        Some(p) => format!(
            r#"<section class="featured-post card">
  <div class="featured-badge">Pilihan</div>
  <a href="/blog/{slug}"><img class="blog-cover" src="{cover}" alt="{title}" /></a>
  <div class="featured-body">
    <h2><a href="/blog/{slug}">{title}</a></h2>
    <p class="blog-excerpt">{excerpt}</p>
    <span class="blog-meta">{date} · {author}</span>
  </div>
</section>"#,
            slug = &p.slug,
            cover = p.cover_image_url.clone().unwrap_or_else(|| "https://sedekah.je/sedekahje-og-compressed.png".into()),
            title = h(&p.title),
            excerpt = h(p.excerpt.as_deref().unwrap_or("")),
            date = fmt_date_bm(&format_date_only_myt(p.published_at.unwrap_or_else(chrono::Utc::now))),
            author = h(p.author_name.as_deref().unwrap_or("sedekah.je")),
        ),
        None => String::new(),
    };

    let grid = posts
        .iter()
        .filter(|p| Some(p.id) != featured.as_ref().map(|f| f.id))
        .map(|p| {
            format!(
                r#"<a class="blog-card card" href="/blog/{slug}">
  <img class="blog-cover" src="{cover}" alt="{title}" loading="lazy" />
  <div class="blog-body"><h3>{title}</h3><p class="blog-excerpt">{excerpt}</p><span class="blog-meta">{date} · {author}</span></div>
</a>"#,
                slug = &p.slug,
                cover = p.cover_image_url.clone().unwrap_or_else(|| "https://sedekah.je/sedekahje-og-compressed.png".into()),
                title = h(&p.title),
                excerpt = h(&p.excerpt.clone().unwrap_or_default().chars().take(140).collect::<String>()),
                date = fmt_date_bm(&format_date_only_myt(p.published_at.unwrap_or_else(chrono::Utc::now))),
                author = h(p.author_name.as_deref().unwrap_or("sedekah.je")),
            )
        })
        .collect::<String>();

    let pagination = if total_pages > 1 {
        let prev = if page > 1 {
            format!(r##"<a class="btn btn-outline" href="/blog?page={}">Sebelum</a>"##, page - 1)
        } else { String::new() };
        let next = if page < total_pages {
            format!(r##"<a class="btn btn-outline" href="/blog?page={}">Selepas</a>"##, page + 1)
        } else { String::new() };
        format!(
            r#"<nav class="pagination">{prev}<span>Halaman {page} daripada {total_pages}</span>{next}</nav>"#,
            prev = prev,
            next = next,
        )
    } else {
        String::new()
    };

    let content = format!(
        r#"<div class="container page-container">
{breadcrumb}
<div class="blog-page">
  <h2 class="page-title">Blog</h2>
  <p class="page-sub">Nota, kemas kini, dan cerita daripada sedekah.je.</p>
  {featured}
  {empty}
  <div class="blog-grid">{grid}</div>
  {pagination}
</div>
</div>"#,
        breadcrumb = breadcrumb(&[("Laman Utama", "/".into()), ("Blog".into(), String::new())]),
        featured = featured_html,
        empty = if posts.is_empty() { r#"<div class="empty-state"><h3>Belum ada post yang diterbitkan.</h3></div>"#.to_string() } else { String::new() },
        grid = grid,
        pagination = pagination,
    );
    shell.meta.title = "Blog".to_string();
    shell.meta.description = "Nota dan kemas kini daripada sedekah.je.".to_string();
    Html(begin_page(&shell, content)).into_response()
}

pub async fn blog_post(
    State(state): State<AppState>,
    Path(slug): Path<String>,
    headers: HeaderMap,
) -> Response {
    let (mut shell, _u) = shell_for(&state, &headers).await;
    let Some(post) = published_blog_by_slug(&state.pool, &slug).await.ok().flatten() else {
        return not_found_page(state).await;
    };
    let content_html = crate::blogrender::render_doc(&post.content_json);
    let content_html = if content_html.is_empty() { "<p>No content yet.</p>".to_string() } else { content_html };
    let title = post.meta_title.clone().unwrap_or_else(|| post.title.clone());
    let description = post
        .meta_description
        .clone()
        .or_else(|| post.excerpt.clone())
        .unwrap_or_else(|| "sedekah.je blog post".to_string());
    let og = post
        .og_image_url
        .clone()
        .or_else(|| post.cover_image_url.clone())
        .unwrap_or_else(|| "https://sedekah.je/sedekahje-og-compressed.png".to_string());

    shell.meta.title = title.clone();
    shell.meta.description = description.clone();
    shell.meta.canonical = format!("https://sedekah.je/blog/{}", post.slug);
    shell.meta.og_image = og.clone();
    shell.meta.og_type = "article".to_string();

    let content = format!(
        r#"<div class="container page-container blog-post-page">
<a class="back-link" href="/blog">← Back to blog</a>
<article class="blog-card card">
  {cover}
  <div class="blog-body">
    <h1 class="page-title">{h1}</h1>
    <p class="blog-meta">{date} · {author}</p>
    <div class="blog-rendered">{body}</div>
  </div>
</article>
</div>"#,
        cover = match &post.cover_image_url {
            Some(c) if !c.is_empty() => format!(r##"<img class="blog-cover" src="{}" alt="{}" />"##, h(c), h(&post.title)),
            _ => String::new(),
        },
        h1 = h(&post.title),
        date = fmt_date_en(&format_date_only_myt(post.published_at.unwrap_or_else(chrono::Utc::now))),
        author = h(post.author_name.as_deref().unwrap_or("sedekah.je")),
        body = content_html,
    );
    Html(begin_page(&shell, content)).into_response()
}

// ---------- Ramadhan ----------

pub async fn ramadhan(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let (mut shell, _u) = shell_for(&state, &headers).await;
    let year = chrono::Utc::now().year();
    let campaign = ramadhan_campaign_by_year(&state.pool, year as i64).await.unwrap_or_default();
    let today = fmt_iso_from_naive(crate::utils::islamic_today_myt());
    let first = campaign.first().map(|(c, _)| fmt_iso_from_naive(c.featured_date));
    let start = first.unwrap_or(format!("{}-03-01", year));
    let today_featured = ramadhan_todays_featured(&state.pool, crate::utils::islamic_today_myt())
        .await
        .ok()
        .flatten();

    let mut calendar = String::new();
    for day in 1..=30i64 {
        let date = date_plus_days(parse_date(&start), day - 1);
        let date_str = fmt_iso_from_naive(date);
        let filled = campaign.iter().find(|(c, _)| c.day_number == day);
        let cls = if date_str == today { "today" } else if date_str > today { "future" } else { "past" };
        calendar.push_str(&format!(
            r#"<div class="ramadhan-day {cls}" data-day="{}" data-name="{}" data-date="{}">
  <span class="day-num">Hari {day}</span>
  <span class="day-date">{}</span>
  <span class="day-name">{}</span>
</div>"#,
            day,
            esc(&filled.map(|(_, i)| i.name.clone()).unwrap_or_else(|| "".into())),
            date_str,
            fmt_date_bm_short(&date_str),
            fill_label(filled),
        ));
    }

    let today_card = match today_featured {
        Some((camp, inst)) => {
            let hiref = format!("/{}/{}", inst.category, inst.slug);
            let qr = qr_tile(&inst, 200, "page-qr");
            format!(
                r#"<section class="ramadhan-today card">
  <div class="banner-eyebrow">QR Hari Ini — Hari ke-{day}/30</div>
  <h3 class="ramadhan-name">{name}</h3>
  <p class="ramadhan-meta">{city}, {state}</p>
  {qr}
  {caption}
  <a class="btn btn-primary" href="{hiref}">Lihat institusi & derma</a>
</section>"#,
                day = camp.day_number,
                name = esc(&inst.name),
                city = esc(&inst.city),
                state = esc(&inst.state),
                qr = qr,
                caption = camp.caption.clone().map(|c| format!("<p class=\"ramadhan-caption\">{}</p>", esc(&c))).unwrap_or_default(),
                hiref = hiref,
            )
        }
        None => String::new(),
    };

    let content = format!(
        r#"<div class="container page-container ramadhan-page">
{breadcrumb}
<div class="ramadhan-header">
  <h1 class="page-title">30 Hari 30 QR — Kempen Ramadan {year}</h1>
  <p>Satu institusi, satu kod QR setiap hari sepanjang Ramadan. Jom bersedekah!</p>
</div>
{today_card}
<h2 class="section-title">Kalendar 30 Hari</h2>
<p class="page-sub">Pilih hari untuk lihat QR & butiran</p>
<div class="ramadhan-grid">{calendar}</div>
<div id="ramadhan-detail" class="ramadhan-panel">
  <p class="placeholder">Pilih hari dari kalendar di atas untuk lihat QR kod dan butiran institusi.</p>
</div>
<script>window.__RAMADHAN__ = {campaign_json};</script>
</div>"#,
        breadcrumb = breadcrumb(&[("Laman Utama", "/".into()), ("Ramadhan".into(), String::new())]),
        year = year,
        today_card = today_card,
        calendar = calendar,
        campaign_json = ramadhan_json(&campaign, &start),
    );
    shell.meta.title = format!("30 Hari 30 QR — Kempen Ramadan {year} | SedekahJe");
    shell.meta.description = "Ikuti kempen #SedekahJe 30 Hari 30 QR — satu institusi, satu kod QR setiap hari sepanjang Ramadan. Imbas kod QR dan tunaikan sedekah anda dengan mudah.".to_string();
    shell.meta.og_image = "https://sedekah.je/sedekahje-og-ramadhan.png".to_string();
    Html(begin_page(&shell, content)).into_response()
}

/// Rough Petaling district boundary polygon for the quest map.
fn petaling_boundary() -> serde_json::Value {
    serde_json::json!({
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "properties": {},
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [101.52, 3.05], [101.46, 3.08], [101.45, 3.13], [101.48, 3.18],
                    [101.55, 3.22], [101.64, 3.22], [101.69, 3.18], [101.70, 3.12],
                    [101.66, 3.06], [101.60, 3.02], [101.52, 3.05]
                ]]
            }
        }]
    })
}

fn parse_date(s: &str) -> chrono::NaiveDate {    chrono::NaiveDate::parse_from_str(s, "%Y-%m-%d").unwrap_or_else(|_| chrono::NaiveDate::from_ymd_opt(2026, 3, 1).unwrap())
}

fn fill_label(filled: Option<&(crate::models::RamadhanCampaignRow, InstitutionRow)>) -> String {
    match filled {
        Some((_, i)) => title_case(&i.name),
        None => String::from("Belum diisi"),
    }
}

fn ramadhan_json(
    campaign: &[(crate::models::RamadhanCampaignRow, InstitutionRow)],
    start: &str,
) -> String {
    let arr: Vec<serde_json::Value> = campaign
        .iter()
        .map(|(c, i)| {
            json!({
                "day": c.day_number,
                "date": fmt_iso_from_naive(c.featured_date),
                "name": i.name,
                "category": i.category,
                "slug": i.slug,
                "state": i.state,
                "city": i.city,
                "caption": c.caption,
                "qrContent": i.qr_content,
                "qrImage": i.qr_image,
                "supportedPayment": i.supported_payment_vec(),
                "start": start,
            })
        })
        .collect::<Vec<_>>();
    serde_json::to_string(&arr).unwrap_or_default()
}

// ---------- Ramadhan Wrapped ----------

pub async fn ramadhan_wrapped(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let (mut shell, _u) = shell_for(&state, &headers).await;
    let stats = wrapped_stats(&state).await;
    let content = format!(
        r#"<div class="container page-container wrapped-page">
  <div class="wrapped-hero"><span class="category-chip">Sedekah Je</span><h1 class="page-title">Ramadhan Wrapped 2026</h1><p>30 days of community, generosity, and open-source collaboration.</p></div>
  {sections}
</div>
"#,
        sections = wrapped_sections(&stats),
    );
    shell.meta.title = "Ramadhan Wrapped 2026 | Sedekah Je".to_string();
    shell.meta.description = "A snapshot of the Sedekah Je community during the Ramadhan 2026 campaign.".to_string();
    Html(begin_page(&shell, content)).into_response()
}

struct WrappedSummary {
    submissions: i64,
    approved: i64,
    pending: i64,
    rejected: i64,
    contributors: i64,
    new_users: i64,
    top: Vec<(String, i64)>,
    avg_per_day: f64,
    approval_rate: f64,
    top_states: Vec<(String, i64)>,
}

async fn wrapped_stats(state: &AppState) -> WrappedSummary {
    let start = chrono::DateTime::parse_from_rfc3339("2026-02-18T16:00:00Z")
        .unwrap()
        .with_timezone(&chrono::Utc);
    let end = chrono::DateTime::parse_from_rfc3339("2026-03-20T16:00:00Z")
        .unwrap()
        .with_timezone(&chrono::Utc);
    let row = sqlx::query(
        "SELECT COUNT(*), COUNT(*) FILTER (WHERE status='approved'), COUNT(*) FILTER (WHERE status='pending'), COUNT(*) FILTER (WHERE status='rejected')
         FROM institutions WHERE created_at >= $1 AND created_at < $2",
    )
    .bind(start)
    .bind(end)
    .fetch_one(&state.pool)
    .await;
    let (submissions, approved, pending, rejected) = row
        .map(|r| {
            (
                r.try_get::<i64, _>(0).unwrap_or(0),
                r.try_get::<i64, _>(1).unwrap_or(0),
                r.try_get::<i64, _>(2).unwrap_or(0),
                r.try_get::<i64, _>(3).unwrap_or(0),
            )
        })
        .unwrap_or((0, 0, 0, 0));
    let contributors = sqlx::query(
        "SELECT COUNT(DISTINCT contributor_id) FROM institutions WHERE created_at >= $1 AND created_at < $2",
    )
    .bind(start)
    .bind(end)
    .fetch_one(&state.pool)
    .await
    .map(|r| r.try_get::<i64, _>(0).unwrap_or(0))
    .unwrap_or(0);
    let new_users = sqlx::query("SELECT COUNT(*) FROM users WHERE created_at >= $1 AND created_at < $2")
        .bind(start)
        .bind(end)
        .fetch_one(&state.pool)
        .await
        .map(|r| r.try_get::<i64, _>(0).unwrap_or(0))
        .unwrap_or(0);
    let top: Vec<(String, i64)> = sqlx::query(
        "SELECT COALESCE(NULLIF(users.name,''), NULLIF(users.username,''), 'Anonymous') AS name, COUNT(*) AS n
         FROM institutions LEFT JOIN users ON institutions.contributor_id = users.id
         WHERE institutions.created_at >= $1 AND institutions.created_at < $2 AND institutions.contributor_id IS NOT NULL
         GROUP BY name ORDER BY n DESC, name ASC LIMIT 5",
    )
    .bind(start)
    .bind(end)
    .fetch_all(&state.pool)
    .await
    .map(|rows| {
        rows.iter()
            .map(|r| (r.try_get::<String, _>(0).unwrap_or_default(), r.try_get::<i64, _>(1).unwrap_or(0)))
            .collect()
    })
    .unwrap_or_default();
    let top_states: Vec<(String, i64)> = sqlx::query(
        "SELECT state, COUNT(*) AS n FROM institutions WHERE created_at >= $1 AND created_at < $2 GROUP BY state ORDER BY n DESC, state ASC LIMIT 5",
    )
    .bind(start)
    .bind(end)
    .fetch_all(&state.pool)
    .await
    .map(|rows| {
        rows.iter()
            .map(|r| (r.try_get::<String, _>(0).unwrap_or_default(), r.try_get::<i64, _>(1).unwrap_or(0)))
            .collect()
    })
    .unwrap_or_default();
    let days = 30f64;
    WrappedSummary {
        submissions,
        approved,
        pending,
        rejected,
        contributors,
        new_users,
        top,
        avg_per_day: if days > 0.0 { submissions as f64 / days } else { 0.0 },
        approval_rate: if submissions > 0 { approved as f64 / submissions as f64 * 100.0 } else { 0.0 },
        top_states,
    }
}

fn wrapped_sections(s: &WrappedSummary) -> String {
    let avg = format!("{:.1}", s.avg_per_day);
    let ar = format!("{:.1}", s.approval_rate);
    let top = s
        .top
        .iter()
        .enumerate()
        .map(|(i, (n, c))| format!(
            r#"<li class="leader-row"><span class="rank-badge">#{}</span><span class="leader-name">{}</span><span class="leader-count">{} submissions</span></li>"#,
            i + 1, h(n), c
        ))
        .collect::<String>();
    let top_states = s
        .top_states
        .iter()
        .map(|(n, c)| format!(r#"<li class="leader-row"><span class="leader-name">{}</span><span class="leader-count">{}</span></li>"#, h(n), c))
        .collect::<String>();
    format!(
        r#"<section class="wrapped-section card">
  <div class="banner-eyebrow">The count</div>
  <h2>This Ramadhan, the community showed up</h2>
  <p><b>{sub}</b> institutions were submitted in 30 days. That is {avg} per day on average.</p>
  <div class="stats-grid"><div class="stat-card"><div class="stat-value">{sub}</div><div class="stat-label">Institutions submitted</div></div><div class="stat-card"><div class="stat-value">{new_users}</div><div class="stat-label">New users</div></div><div class="stat-card"><div class="stat-value">{contributors}</div><div class="stat-label">Contributors</div></div><div class="stat-card"><div class="stat-value">{ar}%</div><div class="stat-label">Approval rate</div></div></div>
  <p class="page-sub">Approval breakdown: {appr} approved · {pend} pending · {rej} rejected.</p>
</section>
<section class="wrapped-section card">
  <div class="banner-eyebrow">The people</div>
  <h2>Behind every submission</h2>
  <p>{contributors} unique contributors kept the directory growing.</p>
  <h3>Top contributors</h3><ul class="leader-list">{top}</ul>
</section>
<section class="wrapped-section card">
  <div class="banner-eyebrow">Distribution</div>
  <h2>Where it happened</h2>
  <p>Submissions came from across Malaysia.</p>
  <h3>Top states</h3><ul class="leader-list">{states}</ul>
</section>
<section class="wrapped-section card">
  <div class="banner-eyebrow">Activity</div>
  <h2>The pulse of Ramadhan</h2>
  <p>Submissions ebbed and flowed with the days.</p>
  <div class="stats-grid"><div class="stat-card"><div class="stat-value">{avg}</div><div class="stat-label">Avg per day</div></div><div class="stat-card"><div class="stat-value">{sub}</div><div class="stat-label">Total submissions</div></div></div>
</section>"#,
        sub = s.submissions,
        avg = avg,
        new_users = s.new_users,
        contributors = s.contributors,
        ar = ar,
        appr = s.approved,
        pend = s.pending,
        rej = s.rejected,
        top = top,
        states = top_states,
    )
}

// ---------- Embed ----------

pub async fn embed(
    State(state): State<AppState>,
    Path(slug): Path<String>,
    Query(q): Query<EmbedQuery>,
) -> Response {
    let Some(inst) = get_institution_by_slug(&state.pool, &slug).await.ok().flatten() else {
        return not_found_page(state).await;
    };
    let payments = inst.supported_payment_vec();
    let (color, label) = brand_color(Some(&payments));
    let size = match q.size.as_deref() {
        Some("sm") => (260u32, 360u32, 196u32),
        Some("lg") => (340u32, 480u32, 284u32),
        _ => (300u32, 420u32, 236u32),
    };
    let _ = size;
    let qr = if inst.qr_content.is_some() {
        crate::qrgen::qr_svg(inst.qr_content.as_deref().unwrap_or(""), color, "#ffffff", false)
    } else if let Some(img) = &inst.qr_image {
        format!(r#"<img src="{}" alt="Kod QR" />"#, h(img))
    } else {
        String::new()
    };
    let href = format!("/{}/{}?utm_source=embed&utm_medium=iframe", inst.category, inst.slug);

    let mut meta = PageMeta {
        title: format!("Kod QR sedekah untuk {}", inst.name),
        description: String::new(),
        canonical: format!("https://sedekah.je/embed/{}", inst.slug),
        og_image: String::new(),
        og_type: "website".to_string(),
        noindex: true,
        bare: true,
        lang: "ms",
        extra_head: String::new(),
    };
    if q.theme.as_deref() == Some("auto") {
        meta.extra_head = r##"<script>if(window.matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.classList.add('dark')</script>"##.to_string();
    }
    let shell = Shell {
        meta,
        logged_in: false,
        is_admin: false,
        show_header: false,
        show_footer: false,
        body_class: "embed-body".into(),
    };
    let content = format!(
        r#"<div class="embed-card" style="--brand:{color}">
  <a href="{href}" class="embed-banner">
    <div class="embed-logos">
      <span class="embed-sedekah-logo">🕌</span>
      <span class="embed-brand-label">{label}</span>
    </div>
  </a>
  <div class="embed-qr-wrap">{qr}</div>
  <div class="embed-name">{name}</div>
  <div class="embed-location">{city}, {state} · {label}</div>
  <a class="embed-footer" href="https://sedekah.je">Dikuasakan oleh sedekah.je</a>
</div>"#,
        href = href,
        label = h(label),
        qr = qr,
        name = h(&title_case(&inst.name)),
        city = h(&title_case(&inst.city)),
        state = h(&title_case(&inst.state)),
    );
    Html(begin_page(&shell, content)).into_response()
}

#[derive(Deserialize)]
pub struct EmbedQuery {
    pub theme: Option<String>,
    pub size: Option<String>,
    pub compact: Option<String>,
}

// ---------- QR (chrome-less) ----------

pub async fn qr_page(
    State(state): State<AppState>,
    Path(slug): Path<String>,
) -> Response {
    let Some(inst) = get_institution_by_slug(&state.pool, &slug).await.ok().flatten() else {
        return not_found_page(state).await;
    };
    if inst.qr_content.is_none() {
        return Html("").into_response();
    }
    let payments = inst.supported_payment_vec();
    let (color, _label) = brand_color(Some(&payments));
    let qr_svg = crate::qrgen::qr_svg(inst.qr_content.as_deref().unwrap_or(""), color, "#ffffff", true);
    let meta = PageMeta {
        title: format!("QR Sedekah — {}", inst.name),
        description: String::new(),
        canonical: format!("https://sedekah.je/qr/{}", inst.slug),
        og_image: String::new(),
        og_type: "website".to_string(),
        noindex: false,
        bare: true,
        lang: "en",
        extra_head: String::new(),
    };
    let shell = Shell {
        meta,
        logged_in: false,
        is_admin: false,
        show_header: false,
        show_footer: false,
        body_class: "qr-body".into(),
    };
    let content = format!(
        r#"<div class="qr-page">
  <div class="qr-brand"><span class="brand-logo">🕌</span><span class="brand-text">Sedekah<b>Je</b></span></div>
  <div class="qr-card" style="background:{color}"><div class="qr-card-inner">{svg}</div></div>
  <div class="qr-name">{name}</div>
</div>"#,
        color = color,
        svg = qr_svg,
        name = h(&title_case(&inst.name)),
    );
    Html(begin_page(&shell, content)).into_response()
}

// ---------- static pages ----------

pub fn static_page(kind: &'static str) -> Response {
    let mut shell = Shell::default();
    let (title, heading, body) = match kind {
        "legal" => ("Legal", "Legal: Privacy & Terms", r#"<h2>Privacy Policy</h2><p>We do not sell your personal data. Data is shared only with infrastructure providers used to operate the platform.</p><p>To request deletion, email <a href="mailto:ask@sedekah.je">ask@sedekah.je</a>.</p><h2>Terms of Service</h2><p>The platform is provided "as is" without warranties. Content is moderated at our discretion.</p><h2>Contact</h2><p><a href="mailto:ask@sedekah.je">ask@sedekah.je</a></p>"#),
        "privacy" => ("Privacy Policy", "Privacy Policy for sedekah.je", r#"<p>Last updated: February 23, 2026</p><p>We do not sell your personal data. Data is shared only with infrastructure providers used to operate the platform.</p><p>To request deletion, email <a href="mailto:ask@sedekah.je">ask@sedekah.je</a>.</p>"#),
        _ => ("Terms of Service", "Terms of Service for sedekah.je", r#"<p>Last updated: February 23, 2026</p><p>The platform is provided "as is" without warranties. Content is moderated at our discretion.</p><p>We may update these terms from time to time.</p>"#),
    };
    shell.meta.title = title.to_string();
    shell.meta.description = title.to_string();
    let content = format!(
        r#"<div class="container page-container">
{breadcrumb}
<div class="legal-card">
  <h1>{heading}</h1>
  {body}
</div>
</div>"#,
        breadcrumb = breadcrumb(&[("Laman Utama", "/".into()), (title, String::new())]),
        heading = h(heading),
        body = body,
    );
    Html(begin_page(&shell, content)).into_response()
}

pub async fn offline_page() -> Response {
    let shell = Shell::default();
    let content = r#"<div class="container page-container center-empty">
  <div class="empty-state">
    <div class="empty-icon">📡</div>
    <h1>Anda Sedang Offline</h1>
    <p>Tiada sambungan internet. Sila semak sambungan anda dan cuba lagi.</p>
    <button class="btn btn-primary" onclick="location.reload()">Cuba Lagi</button>
  </div>
</div>"#.to_string();
    Html(begin_page(&shell, content)).into_response()
}

pub async fn data_page(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let (mut shell, _u) = shell_for(&state, &headers).await;
    let all = get_all_approved(&state.pool).await.unwrap_or_default();
    let rows = serde_json::to_string(
        &all
            .iter()
            .map(|r| {
                json!({
                    "name": r.name,
                    "category": normalize_institution_category(&r.category),
                    "state": r.state,
                    "city": r.city,
                    "qrImage": r.qr_image,
                    "qrContent": r.qr_content,
                    "supportedPayment": r.supported_payment_vec(),
                    "coords": r.coords,
                })
            })
            .collect::<Vec<_>>(),
    )
    .unwrap_or_default();
    let content = format!(
        r#"<div class="container page-container">
{breadcrumb}
<div class="data-page">
  <h2 class="page-title">Data Institusi</h2>
  <p class="page-sub">{n} institusi diluluskan. Data ini tersedia melalui <a href="/api/institutions">API</a> dan <a href="/docs">dokumentasi</a>.</p>
  <table class="data-table card" id="data-table">
    <thead><tr><th>Nama</th><th>Kategori</th><th>Negeri</th><th>Bandar</th></tr></thead>
    <tbody>{tbody}</tbody>
  </table>
  <script>window.__DATA__=null</script>
</div>
</div>"#,
        breadcrumb = breadcrumb(&[("Laman Utama", "/".into()), ("Data Institusi".into(), String::new())]),
        n = all.len(),
        tbody = all
            .iter()
            .take(200)
            .map(|r| format!(
                r#"<tr><td><a href="/{cat}/{slug}">{name}</a></td><td>{cat}</td><td>{state}</td><td>{city}</td></tr>"#,
                cat = r.category,
                slug = r.slug,
                name = h(&title_case(&r.name)),
                state = h(&r.state),
                city = h(&title_case(&r.city)),
            ))
            .collect::<String>(),
    );
    let _ = rows;
    shell.meta.title = "Data Institusi".to_string();
    Html(begin_page(&shell, content)).into_response()
}

// ---------- Auth pages ----------

#[derive(Deserialize)]
pub struct AuthQuery {
    pub next: Option<String>,
    pub redirect: Option<String>,
    pub reason: Option<String>,
}

pub async fn auth_page(
    State(state): State<AppState>,
    Query(q): Query<AuthQuery>,
    headers: HeaderMap,
) -> Response {
    let (mut shell, user) = shell_for(&state, &headers).await;
    if let Some(_u) = user {
        return Redirect::to("/").into_response();
    }
    let next = q.next.or(q.redirect).filter(|n| n.starts_with('/') && !n.starts_with("//"));
    let reason = q.reason.as_deref().unwrap_or("login_required");
    let desc = match reason {
        "submit_qr" | "view_submissions" => "Untuk hantar QR, tengok leaderboard, dan uruskan submission anda.",
        _ => "Untuk hantar QR, tengok leaderboard, dan uruskan submission anda.",
    };
    let next_url = urlencoding::encode(next.as_deref().unwrap_or("/contribute"));
    let content = format!(
        r##"<div class="container page-container auth-page">
  <div class="card auth-card">
    <h2 class="page-title">Log Masuk</h2>
    <p>{desc}</p>
    <a class="btn btn-google" href="/auth/google?next={next}">
      <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
      Log Masuk dengan Google
    </a>
  </div>
</div>"##,
        desc = esc(desc),
        next = next_url,
    );
    shell.meta.title = "Log Masuk".to_string();
    shell.meta.noindex = true;
    Html(begin_page(&shell, content)).into_response()
}

pub async fn google_start(
    State(state): State<AppState>,
    Query(q): Query<AuthQuery>,
) -> Response {
    let cfg = &state.cfg;
    if cfg.google_client_id.is_empty() || cfg.google_client_secret.is_empty() {
        return Redirect::to("/").into_response();
    }
    let next = q
        .next
        .or(q.redirect)
        .filter(|n| n.starts_with('/') && !n.starts_with("//"))
        .unwrap_or_else(|| "/contribute".to_string());
    let state_token = crate::session::encode_state(&next);
    let redirect = format!("{}/api/auth/callback/google", cfg.app_url);
    let url = format!(
        "https://accounts.google.com/o/oauth2/v2/auth?client_id={}&redirect_uri={}&response_type=code&scope=openid%20email%20profile&prompt=select_account&state={}",
        cfg.google_client_id,
        urlencoding::encode(&redirect),
        urlencoding::encode(&state_token)
    );
    let mut resp = Redirect::to(&url).into_response();
    let cookie = format!(
        "sedekahje_oauth={state_token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=300"
    );
    resp.headers_mut().insert("set-cookie", cookie.parse().unwrap());
    resp
}

pub async fn google_callback(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(params): Query<CallbackQuery>,
) -> Response {
    let cfg = state.cfg.clone();
    let cookie_val = headers
        .get("cookie")
        .and_then(|v| v.to_str().ok())
        .and_then(|raw| {
            raw.split(';').find_map(|p| {
                let (k, v) = p.trim().split_once('=')?;
                if k == "sedekahje_oauth" {
                    Some(v.to_string())
                } else {
                    None
                }
            })
        });
    let Some(code) = params.code.clone() else {
        return Redirect::to("/auth").into_response();
    };
    let callback = cookie_val
        .as_deref()
        .and_then(crate::session::decode_state)
        .unwrap_or_else(|| "/contribute".to_string());

    match crate::session::exchange_code_for_token(&cfg, &code).await {
        Ok((token_value, user_value)) => {
            let name = user_value.get("name").and_then(|v| v.as_str()).unwrap_or("Unknown").to_string();
            let email = user_value
                .get("email")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            match crate::session::upsert_google_user(&state.pool, &token_value, &user_value).await {
                Ok(user) => {
                    let is_first = false; // notify every login for visibility is noisy; keep to new user signal
                    let _ = is_first;
                    crate::telegram::log_new_user(&cfg, &user.id, &name, &email).await;
                    let ip = headers
                        .get("x-forwarded-for")
                        .and_then(|v| v.to_str().ok())
                        .map(|s| s.split(',').next().unwrap_or("").to_string());
                    let ua = headers
                        .get(axum::http::header::USER_AGENT)
                        .and_then(|v| v.to_str().ok())
                        .map(String::from);
                    match crate::session::create_session(&state.pool, &user.id, ip, ua).await {
                        Ok(token) => {
                            let mut resp = Redirect::to(&callback).into_response();
                            let secure = cfg.env != "development";
                            let cookie_name = if secure {
                                crate::session::SECURE_SESSION_COOKIE
                            } else {
                                crate::session::SESSION_COOKIE
                            };
                            let cookie = format!(
                                "{cookie_name}={token}; Path=/; HttpOnly; SameSite=Lax{secure_attr}",
                                secure_attr = if secure { "; Secure" } else { "" }
                            );
                            resp.headers_mut()
                                .insert("set-cookie", cookie.parse().unwrap());
                            resp
                        }
                        Err(_) => Redirect::to("/auth").into_response(),
                    }
                }
                Err(_) => Redirect::to("/auth").into_response(),
            }
        }
        Err(_) => Redirect::to("/auth").into_response(),
    }
}

#[derive(Deserialize)]
pub struct CallbackQuery {
    pub code: Option<String>,
    pub state: Option<String>,
    pub error: Option<String>,
    pub error_reason: Option<String>,
    pub error_description: Option<String>,
}

pub async fn logout(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Response {
    if let Some((_, token)) = crate::session::session_cookie_value(&headers) {
        let _ = crate::session::delete_session(&state.pool, &token).await;
    }
    let mut resp = Redirect::to("/").into_response();
    for name in [crate::session::SESSION_COOKIE, crate::session::SECURE_SESSION_COOKIE] {
        let cookie = format!("{name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
        resp.headers_mut().append("set-cookie", cookie.parse().unwrap());
    }
    resp
}

pub async fn claim_submit(
    State(state): State<AppState>,
    headers: HeaderMap,
    Form(form): Form<ClaimForm>,
) -> Response {
    use sqlx::Row;
    let Some((_sess, user)) = get_session_from_headers(&state.pool, &headers).await.ok().flatten() else {
        return Redirect::to("/auth?next=%2F&reason=login_required").into_response();
    };
    let pool = state.pool.clone();
    // rate limit 3/day for non-admins
    let is_admin = user.role == "admin";
    let day_ago = chrono::Utc::now() - chrono::Duration::days(1);
    if !is_admin {
        let recent: i64 = sqlx::query(
            "SELECT COUNT(*) FROM claim_requests WHERE user_id = $1 AND created_at >= $2",
        )
        .bind(&user.id)
        .bind(day_ago)
        .fetch_one(&pool)
        .await
        .map(|r| r.try_get::<i64, _>(0).unwrap_or(0))
        .unwrap_or(0);
        if recent >= 3 {
            return Redirect::to("/").into_response();
        }
    }
    let can_claim: bool = match sqlx::query(
        "SELECT i.id, u.email AS contributor_email FROM institutions i LEFT JOIN users u ON u.id = i.contributor_id WHERE i.id = $1 AND (i.contributor_id IS NULL OR u.email = $2)",
    )
    .bind(form.institution_id)
    .bind(crate::constants::CLAIMABLE_CONTRIBUTOR_EMAIL)
    .fetch_optional(&pool)
    .await
    {
        Ok(Some(_)) => true,
        _ => false,
    };
    if !can_claim {
        return Redirect::to("/").into_response();
    }
    let _ = sqlx::query(
        "INSERT INTO claim_requests (institution_id, user_id, source_url, description, status) VALUES ($1, $2, $3, $4, 'pending')",
    )
    .bind(form.institution_id)
    .bind(&user.id)
    .bind(&form.source_url)
    .bind(&form.description)
    .execute(&pool)
    .await;
    crate::telegram::log_institution_claim(
        &state.cfg,
        &form.institution_id.to_string(),
        &user.name.clone().unwrap_or_else(|| "Anonymous".into()),
    )
    .await;
    Redirect::to("/").into_response()
}

#[derive(Deserialize)]
pub struct ClaimForm {
    pub institution_id: i64,
    pub source_url: Option<String>,
    pub description: Option<String>,
}

pub fn escape_json(s: &str) -> String {
    s.chars()
        .map(|c| match c {
            '\\' => "\\\\".to_string(),
            '"' => "\\\"".to_string(),
            '\n' => "\\n".to_string(),
            '\r' => "\\r".to_string(),
            '\t' => "\\t".to_string(),
            _ => c.to_string(),
        })
        .collect()
}

// ---------- Contribute ----------

pub async fn contribute_page(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let (mut shell, user) = shell_for(&state, &headers).await;
    let logged_in = user.is_some();
    let cooldown = if let Some(u) = &user {
        contribution_cooldown(&state.pool, &u.id, u.role == "admin")
            .await
            .ok()
            .flatten()
    } else {
        None
    };
    shell.meta.title = "Tambah Institusi".to_string();
    shell.meta.canonical = "https://sedekah.je/contribute".to_string();
    let content = format!(
        r#"<div class="container page-container contribute-page">
{breadcrumb}
<div class="user-layout">
  <div class="user-header">
    <h2 class="page-title">Tambah Institusi</h2>
    <p>Sumbang kepada komuniti sedekah.je dengan menambah institusi baru.</p>
  </div>
  {notice}
  <form method="post" action="/contribute/submit" enctype="multipart/form-data" class="card stack contribute-form">
    <input type="hidden" name="qrContent" id="qrContent" value="" />
    <section class="form-section">
      <h3>1. Gambar QR</h3>
      <p>Ambil gambar terus dari kamera atau pilih imej yang jelas dari galeri.</p>
      <div class="field">
        <label for="qrImage">Gambar Kod QR *</label>
        <input type="file" id="qrImage" name="qrImage" accept="image/*" capture="environment" required />
        <p class="helper">Saiz maksimum 5MB. Format yang disokong: JPG, PNG, WebP.</p>
      </div>
    </section>
    <section class="form-section">
      <h3>2. Maklumat institusi</h3>
      <div class="field">{name_field}</div>
      <div class="field">{category_field}</div>
    </section>
    <section class="form-section">
      <h3>3. Lokasi</h3><p>Lokasi membantu penyumbang lain cari institusi yang betul.</p>
      <div class="field">{state_field}</div>
      <div class="field">{city_field}</div>
      <div class="field-row">
        <div class="field">{lat_field}</div>
        <div class="field">{lon_field}</div>
      </div>
    </section>
    <details class="form-section">
      <summary>Maklumat Tambahan (Opsional)</summary>
      <div class="field">{address_field}</div>
      <div class="field">{remarks_field}</div>
      <div class="field">{fb_field}</div>
      <div class="field">{ig_field}</div>
      <div class="field">{web_field}</div>
      <div class="field">{source_field}</div>
    </details>
    {cooldown_block}
    {submit_block}
  </form>
</div>
</div>"#,
        breadcrumb = breadcrumb(&[("Laman Utama", "/".into()), ("Tambah Institusi".into(), String::new())]),
        notice = if logged_in {
            String::new()
        } else {
            r#"<div class="alert alert-info">Log masuk diperlukan sebelum submission boleh dihantar. <a href="/auth?next=%2Fcontribute&reason=submit_qr">Log Masuk</a></div>"#.to_string()
        },
        name_field = form_text_field("name", "Nama institusi *", "", "Contoh: Masjid Al-Falah", true),
        category_field = contrib_select("category", "Kategori *", "", &[( "masjid".to_string(),"Masjid".to_string()),("surau".to_string(),"Surau".to_string()),("tahfiz".to_string(),"Tahfiz".to_string()),("kebajikan".to_string(),"Kebajikan".to_string()),("lain-lain".to_string(),"Lain-lain".to_string())]),
        state_field = contrib_select("state", "Negeri *", "", &STATES.iter().map(|s| (s.to_string(), s.to_string())).collect::<Vec<_>>()),
        city_field = form_text_field("city", "Bandar *", "", "Contoh: Shah Alam", true),
        lat_field = form_text_field("lat", "Latitud", "", "3.0733", false),
        lon_field = form_text_field("lon", "Longitud", "", "101.5185", false),
        address_field = textarea_public("address", "Alamat", ""),
        remarks_field = textarea_public("contributorRemarks", "Info tambahan", ""),
        fb_field = form_text_field("facebook", "Facebook", "", "Pautan Facebook", false),
        ig_field = form_text_field("instagram", "Instagram", "", "Pautan Instagram", false),
        web_field = form_text_field("website", "Website", "", "Pautan laman web", false),
        source_field = form_text_field("sourceUrl", "Sumber (URL)", "", "https://facebook.com/post/123 atau URL Instagram", false),
        cooldown_block = match cooldown {
            Some(until) => format!(
                r#"<div class="alert alert-warning">Anda telah mencapai had 3 submission sehari. Anda boleh menghantar semula dalam <strong>{}</strong>.</div>"#,
                crate::utils::human_cooldown(until)
            ),
            None => String::new(),
        },
        submit_block = format!(
            r#"<button class="btn btn-primary btn-lg" type="submit" {disabled}>Hantar untuk semakan</button>
<p class="helper">QR akan disemak secara manual selepas dihantar.</p>"#,
            disabled = if logged_in && cooldown.is_none() { "" } else { "disabled" },
        ),
    );
    Html(begin_page(&shell, content)).into_response()
}

fn contrib_select(name: &str, label: &str, selected: &str, options: &[(String, String)]) -> String {
    let mut opts = String::from(r#"<option value="">Pilih</option>"#);
    for (v, l) in options {
        let sel = if v == selected { " selected" } else { "" };
        opts.push_str(&format!(r#"<option value="{v}"{sel}>{l}</option>"#, v = h(v), l = h(l)));
    }
    format!(
        r#"<label for="{name}">{label}</label><select id="{name}" name="{name}" class="select-input" required>{opts}</select>"#,
        name = name,
        label = h(label),
        opts = opts,
    )
}

fn textarea_public(name: &str, label: &str, value: &str) -> String {
    format!(
        r#"<label for="{name}">{label}</label><textarea id="{name}" name="{name}" rows="3">{value}</textarea>"#,
        name = name,
        label = h(label),
        value = h(value),
    )
}

pub async fn contribute_submit(
    State(state): State<AppState>,
    headers: HeaderMap,
    mut multipart: axum::extract::Multipart,
) -> Response {
    use sqlx::Row;
    let Some((_sess, user)) = get_session_from_headers(&state.pool, &headers).await.ok().flatten() else {
        return Redirect::to("/auth?next=%2Fcontribute&reason=submit_qr").into_response();
    };
    let is_admin = user.role == "admin";
    let cooldown = contribution_cooldown(&state.pool, &user.id, is_admin).await.ok().flatten();
    if cooldown.is_some() {
        return Redirect::to("/contribute").into_response();
    }
    let mut fields: std::collections::HashMap<String, String> = std::collections::HashMap::new();
    let mut file_bytes: Vec<u8> = Vec::new();
    let mut file_name: Option<String> = None;
    let mut file_type: Option<String> = None;
    while let Some(field) = multipart.next_field().await.unwrap_or(None) {
        let fname = field.name().unwrap_or("").to_string();
        if fname == "qrImage" {
            file_name = field.file_name().map(String::from);
            file_type = field.content_type().map(String::from);
            file_bytes = field.bytes().await.unwrap_or_default().to_vec();
        } else if let Ok(v) = field.text().await {
            fields.insert(fname, v);
        }
    }
    let g = |k: &str| fields.get(k).cloned().unwrap_or_default();
    let name = g("name").trim().to_string();
    let category = g("category").trim().to_string();
    let st = g("state").trim().to_string();
    let city = g("city").trim().to_string();
    if name.is_empty() {
        return Redirect::to("/contribute").into_response();
    }
    if file_bytes.is_empty() || file_bytes.len() > 5 * 1024 * 1024 {
        return Redirect::to("/contribute").into_response();
    }
    let is_image = file_type.as_deref().map(|t| t.starts_with("image/")).unwrap_or(false);
    if !is_image {
        return Redirect::to("/contribute").into_response();
    }
    let qr_content = g("qrContent").trim().to_string();
    if !qr_content.is_empty() && qr_content_exists(&state.pool, &qr_content).await.unwrap_or(false) {
        return Redirect::to("/my-contributions").into_response();
    }
    let Some(r2) = state.r2.as_ref() else {
        return Redirect::to("/contribute").into_response();
    };
    let original_name = file_name.unwrap_or_else(|| "qr.png".to_string());
    let qr_url = match r2.upload_file(&file_bytes, &original_name).await {
        Ok(u) => u,
        Err(_) => return Redirect::to("/contribute").into_response(),
    };
    let slug = match generate_unique_slug(&state.pool, &name, None).await {
        Ok(s) => s,
        Err(_) => return Redirect::to("/contribute").into_response(),
    };
    let coords = match (g("lat").trim().parse::<f64>().ok(), g("lon").trim().parse::<f64>().ok()) {
        (Some(lat), Some(lon)) if (-90.0..=90.0).contains(&lat) && (-180.0..=180.0).contains(&lon) => {
            Some(serde_json::json!([lat, lon]))
        }
        _ => crate::geocode::geocode_institution_with_fallback(&state.cfg, &name, &city, &st)
            .await
            .map(|(lat, lng)| serde_json::json!([lat, lng])),
    };
    let social = if g("facebook").is_empty() && g("instagram").is_empty() && g("website").is_empty() {
        None
    } else {
        Some(serde_json::json!({
            "facebook": g("facebook"),
            "instagram": g("instagram"),
            "website": g("website"),
        }))
    };
    let supported: serde_json::Value = if crate::render::is_toyyibpay(Some(&qr_content)) {
        json!(["toyyibpay"])
    } else {
        json!(["duitnow"])
    };
    let address = g("address").trim().to_string();
    let source = g("sourceUrl").trim().to_string();
    let remarks = g("contributorRemarks").trim().to_string();
    let res = sqlx::query(
        "INSERT INTO institutions (name, slug, category, state, city, address, qr_image, qr_content, supported_payment, coords, social_media, source_url, contributor_id, contributor_remarks, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'pending') RETURNING id",
    )
    .bind(&name)
    .bind(&slug)
    .bind(if category.is_empty() { "lain-lain" } else { &category })
    .bind(if st.is_empty() { "Selangor" } else { &st })
    .bind(&city)
    .bind(if address.is_empty() { None } else { Some(&address) })
    .bind(&qr_url)
    .bind(if qr_content.is_empty() { None } else { Some(&qr_content) })
    .bind(&supported)
    .bind(coords)
    .bind(social)
    .bind(if source.is_empty() { None } else { Some(&source) })
    .bind(&user.id)
    .bind(if remarks.is_empty() { None } else { Some(&remarks) })
    .fetch_one(&state.pool)
    .await;
    match res {
        Ok(row) => {
            let id: i64 = row.try_get(0).unwrap_or(0);
            crate::telegram::log_new_institution(&state.cfg, id, &name, &category).await;
            Redirect::to("/my-contributions").into_response()
        }
        Err(_) => Redirect::to("/contribute").into_response(),
    }
}

// ---------- My contributions ----------

pub async fn my_contributions_page(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let Some((_s, user)) = get_session_from_headers(&state.pool, &headers).await.ok().flatten() else {
        return Redirect::to("/auth?next=%2Fmy-contributions&reason=view_submissions").into_response();
    };
    let (mut shell, _u) = shell_for(&state, &headers).await;
    shell.meta.title = "Submission Saya".to_string();
    shell.meta.noindex = true;
    let stats = my_contribution_stats(&state.pool, &user.id).await.unwrap_or(MyContributionStats {
        total_contributions: 0,
        approved_contributions: 0,
        pending_contributions: 0,
        rejected_contributions: 0,
    });
    let list = my_contributions(&state.pool, &user.id).await.unwrap_or_default();
    let stat_cards = format!(
        r#"<div class="stats-grid">
  <div class="stat-card"><div class="stat-value">{total}</div><div class="stat-label">Jumlah submission</div></div>
  <div class="stat-card success"><div class="stat-value">{approved}</div><div class="stat-label">Diluluskan</div></div>
  <div class="stat-card warning"><div class="stat-value">{pending}</div><div class="stat-label">Pending</div></div>
  <div class="stat-card danger"><div class="stat-value">{rejected}</div><div class="stat-label">Ditolak</div></div>
</div>"#,
        total = stats.total_contributions,
        approved = stats.approved_contributions,
        pending = stats.pending_contributions,
        rejected = stats.rejected_contributions,
    );
    let list_html = if list.is_empty() {
        r#"<div class="empty-state"><h3>Belum ada submission</h3><p>Submission QR yang anda hantar akan dipaparkan di sini selepas ia masuk ke semakan komuniti.</p><a class="btn btn-primary" href="/contribute">Hantar submission</a></div>"#.to_string()
    } else {
        list.iter().map(|c| {
            let note = c.admin_notes.clone().map(|n| format!(r##"<div class="subtext">Catatan: {}</div>"##, h(&n))).unwrap_or_default();
            let action = if c.status == "approved" {
                format!(r##"<a class="btn btn-sm btn-primary" href="/{cat}/{slug}">Lihat QR</a>"##, cat = normalize_institution_category(&c.category), slug = c.slug)
            } else if c.status == "rejected" {
                r##"<a class="btn btn-sm btn-outline" href="/contribute">Edit semula</a>"##.to_string()
            } else {
                String::new()
            };
            format!(
                r#"<li class="contribution-row card"><div class="row-main"><div class="contribution-name">{name}</div>{note}<div class="subtext">{date}</div></div><div class="row-side">{chip}{action}</div></li>"#,
                name = h(&title_case(&c.name)),
                note = note,
                date = fmt_date_bm(&format_date_only_myt(c.created_at)),
                chip = status_chip(&c.status),
                action = action,
            )
        }).collect::<String>()
    };
    let content = format!(
        r#"<div class="container page-container user-layout">
{breadcrumb}
<div class="user-header"><h2 class="page-title">Submission Saya</h2><p>Uruskan submission anda kepada komuniti sedekah.je</p></div>
{stat_cards}
<div class="card"><h3>Sejarah Submission</h3><ul class="contribution-list">{list}</ul></div>
</div>"#,
        breadcrumb = breadcrumb(&[("Laman Utama", "/".into()), ("Submission Saya".into(), String::new())]),
        stat_cards = stat_cards,
        list = list_html,
    );
    Html(begin_page(&shell, content)).into_response()
}

// ---------- Leaderboard ----------

pub async fn leaderboard_page(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let (mut shell, user) = shell_for(&state, &headers).await;
    shell.meta.title = "Carta Penghantar QR".to_string();
    shell.meta.description = "Lihat pengguna paling aktif menghantar QR institusi ke sedekah.je. Carta ini berdasarkan QR yang diluluskan, bukan jumlah wang sedekah.".to_string();
    let stats = leaderboard_stats(&state.pool).await.unwrap_or(LeaderboardStats {
        total_contributors: 0,
        total_contributions: 0,
        most_active_contributions: 0,
        approval_rate: 0.0,
    });
    let top = leaderboard_top(&state.pool).await.unwrap_or_default();
    let your_rank = match &user {
        Some(u) => leaderboard_rank_for_user(&state.pool, &u.id).await.ok().flatten(),
        None => None,
    };
    let stat_cards = format!(
        r#"<div class="stats-grid">
  <div class="stat-card"><div class="stat-value">{contributors}</div><div class="stat-label">Penghantar QR</div></div>
  <div class="stat-card success"><div class="stat-value">{approved}</div><div class="stat-label">QR Diluluskan</div></div>
  <div class="stat-card"><div class="stat-value">{topc}</div><div class="stat-label">Rekod Tertinggi</div></div>
  <div class="stat-card"><div class="stat-value">{ar}%</div><div class="stat-label">Kadar Diluluskan</div></div>
</div>"#,
        contributors = stats.total_contributors,
        approved = stats.total_contributions,
        topc = stats.most_active_contributions,
        ar = format!("{:.1}", stats.approval_rate),
    );
    let rank_card = match &your_rank {
        Some(r) => format!(
            r#"<div class="card"><h3>Kedudukan Anda</h3><div class="big-name">#{rank}</div><p class="subtext">· {count} QR diluluskan</p></div>"#,
            rank = r.rank,
            count = r.contributions,
        ),
        None => String::new(),
    };
    let top_html = top.iter().map(|c| format!(
        r#"<li class="leader-row"><span class="rank-badge">#{r}</span><span class="leader-name">{name}</span><span class="leader-count">{n} QR diluluskan</span></li>"#,
        r = c.rank,
        name = h(&c.name),
        n = c.contributions,
    )).collect::<String>();
    let top_empty = if top.is_empty() {
        r#"<div class="empty-state"><h3>Belum Ada QR Diluluskan</h3><p>Hantar QR institusi untuk membantu komuniti dan mula membina carta penghantar QR.</p></div>"#.to_string()
    } else {
        String::new()
    };
    let content = format!(
        r#"<div class="container page-container user-layout">
{breadcrumb}
<div class="user-header"><h2 class="page-title">Carta Penghantar QR</h2><p>Kedudukan komuniti berdasarkan QR institusi yang dihantar dan diluluskan. Ini bukan carta jumlah wang sedekah.</p></div>
{stat_cards}
{rank_card}
<div class="card"><h3>20 Penghantar QR Teratas</h3><p class="subtext">Dikira daripada QR institusi yang sudah diluluskan oleh penyemak.</p>{top_empty}<ul class="leader-list">{top}</ul></div>
</div>"#,
        breadcrumb = breadcrumb(&[("Laman Utama", "/".into()), ("Carta Penghantar QR".into(), String::new())]),
        stat_cards = stat_cards,
        rank_card = rank_card,
        top_empty = top_empty,
        top = top_html,
    );
    Html(begin_page(&shell, content)).into_response()
}

// ---------- Quest submission ----------

pub async fn quest_submit(
    State(state): State<AppState>,
    headers: HeaderMap,
    mut multipart: axum::extract::Multipart,
) -> Response {
    use sqlx::Row;
    let Some((_s, user)) = get_session_from_headers(&state.pool, &headers).await.ok().flatten() else {
        return Redirect::to("/quest").into_response();
    };
    let mut fields: std::collections::HashMap<String, String> = std::collections::HashMap::new();
    let mut file_bytes: Vec<u8> = Vec::new();
    let mut file_name: Option<String> = None;
    let mut file_type: Option<String> = None;
    while let Some(field) = multipart.next_field().await.unwrap_or(None) {
        let fname = field.name().unwrap_or("").to_string();
        if fname == "qrImage" {
            file_name = field.file_name().map(String::from);
            file_type = field.content_type().map(String::from);
            file_bytes = field.bytes().await.unwrap_or_default().to_vec();
        } else if let Ok(v) = field.text().await {
            fields.insert(fname, v);
        }
    }
    let g = |k: &str| fields.get(k).cloned().unwrap_or_default();
    let mosque_id: i64 = g("questMosqueId").parse().unwrap_or(0);
    let source_url = g("sourceUrl").trim().to_string();
    if mosque_id == 0 {
        return Redirect::to("/quest").into_response();
    }
    let Some(mosque) = get_quest_mosque_by_id(&state.pool, mosque_id).await.ok().flatten() else {
        return Redirect::to("/quest").into_response();
    };
    if mosque.institution_id.is_some() {
        return Redirect::to("/quest").into_response();
    }
    if file_bytes.is_empty() || file_bytes.len() > 5 * 1024 * 1024 {
        return Redirect::to("/quest").into_response();
    }
    if !file_type.as_deref().map(|t| t.starts_with("image/")).unwrap_or(false) {
        return Redirect::to("/quest").into_response();
    }
    let qr_content = g("qrContent").trim().to_string();
    if !qr_content.is_empty() && qr_content_exists(&state.pool, &qr_content).await.unwrap_or(false) {
        return Redirect::to("/quest").into_response();
    }
    let Some(r2) = state.r2.as_ref() else { return Redirect::to("/quest").into_response() };
    let qr_url = match r2.upload_file(&file_bytes, file_name.as_deref().unwrap_or("qr.png")).await {
        Ok(u) => u,
        Err(_) => return Redirect::to("/quest").into_response(),
    };
    let name = mosque.name.clone();
    let slug = match generate_unique_slug(&state.pool, &name, None).await {
        Ok(s) => s,
        Err(_) => return Redirect::to("/quest").into_response(),
    };
    let supported = if crate::render::is_toyyibpay(Some(&qr_content)) {
        json!(["toyyibpay"])
    } else {
        json!(["duitnow"])
    };
    let remark = format!("Quest contribution for mosque ID {} (JAIS: {})", mosque.id, mosque.jais_id);
    let res = sqlx::query(
        "INSERT INTO institutions (name, slug, category, state, city, address, coords, qr_image, qr_content, supported_payment, source_url, contributor_id, contributor_remarks, status)
         VALUES ($1,$2,'masjid','Selangor',$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending') RETURNING id",
    )
    .bind(&name)
    .bind(&slug)
    .bind(&mosque.district)
    .bind(mosque.address.as_ref())
    .bind(mosque.coords.as_ref())
    .bind(&qr_url)
    .bind(if qr_content.is_empty() { None } else { Some(&qr_content) })
    .bind(&supported)
    .bind(if source_url.is_empty() || !crate::constants::is_http_url(&source_url) { None } else { Some(source_url.clone()) })
    .bind(&user.id)
    .bind(&remark)
    .fetch_one(&state.pool)
    .await;
    match res {
        Ok(row) => {
            let inst_id: i64 = row.try_get(0).unwrap_or(0);
            let _ = sqlx::query("UPDATE quest_mosques SET institution_id = $1, updated_at=now() WHERE id = $2")
                .bind(inst_id)
                .bind(mosque_id)
                .execute(&state.pool)
                .await;
            crate::telegram::log_new_institution(&state.cfg, inst_id, &name, "masjid").await;
            Redirect::to("/quest").into_response()
        }
        Err(_) => {
            let _ = r2.delete_file(&qr_url).await;
            Redirect::to("/quest").into_response()
        }
    }
}
