use crate::constants::*;
use crate::queries::InstitutionRow;
use crate::queries::InstitutionViewRow;

pub fn esc(s: &str) -> String {
    crate::constants::html_escape(s)
}

pub fn asset_url(path: &str) -> String {
    path.to_string()
}

// ---------- payment brands ----------

pub fn brand_color(payment: Option<&Vec<String>>) -> (&'static str, &'static str) {
    let first = payment.and_then(|p| p.first()).map(String::as_str);
    match first {
        Some("tng") => ("#015ABF", "Touch 'n Go"),
        Some("boost") => ("#EE2E24", "Boost"),
        Some("toyyibpay") => ("#00847F", "ToyyibPay"),
        _ => ("#ED2C67", "DuitNow"),
    }
}

pub fn brand_logo(payment: Option<&Vec<String>>) -> &'static str {
    match payment.and_then(|p| p.first()).map(String::as_str) {
        Some("tng") => "/icons/square-tng.png",
        Some("boost") => "/icons/boost.png",
        Some("toyyibpay") => "/icons/toyyibpay-wordmark.png",
        _ => "/icons/duitnow.png",
    }
}

pub fn is_toyyibpay(qr_content: Option<&str>) -> bool {
    qr_content
        .map(|c| c.to_lowercase().contains("toyyibpay.com"))
        .unwrap_or(false)
}

// ---------- simple date formatting (BM) ----------

const BM_MONTHS_FULL: [&str; 12] = [
    "Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober",
    "November", "Disember",
];
const BM_MONTHS_SHORT: [&str; 12] = [
    "Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis",
];
const EN_MONTHS_FULL: [&str; 12] = [
    "January", "February", "March", "April", "May", "June", "July", "August", "September",
    "October", "November", "December",
];
const EN_MONTHS_SHORT: [&str; 12] = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

pub fn fmt_date_bm(iso: &str) -> String {
    // iso: YYYY-MM-DD
    if iso.len() < 10 {
        return iso.to_string();
    }
    let y = &iso[0..4];
    let m: usize = iso[5..7].parse().unwrap_or(1);
    let d: usize = iso[8..10].parse().unwrap_or(1);
    format!("{} {} {}", d, BM_MONTHS_FULL[m - 1], y)
}

pub fn fmt_date_bm_short(iso: &str) -> String {
    if iso.len() < 10 {
        return iso.to_string();
    }
    let m: usize = iso[5..7].parse().unwrap_or(1);
    let d: usize = iso[8..10].parse().unwrap_or(1);
    format!("{} {}", d, BM_MONTHS_SHORT[m - 1])
}

pub fn fmt_date_en(iso: &str) -> String {
    if iso.len() < 10 {
        return iso.to_string();
    }
    let y = &iso[0..4];
    let m: usize = iso[5..7].parse().unwrap_or(1);
    let d: usize = iso[8..10].parse().unwrap_or(1);
    format!("{} {} {}", d, EN_MONTHS_FULL[m - 1], y)
}

pub fn fmt_date_en_short(iso: &str) -> String {
    if iso.len() < 10 {
        return iso.to_string();
    }
    let m: usize = iso[5..7].parse().unwrap_or(1);
    let d: usize = iso[8..10].parse().unwrap_or(1);
    format!("{} {}", d, EN_MONTHS_SHORT[m - 1])
}

pub fn fmt_iso_from_naive(date: chrono::NaiveDate) -> String {
    date.format("%Y-%m-%d").to_string()
}

// ---------- layout ----------

pub struct PageMeta {
    pub title: String,
    pub description: String,
    pub canonical: String,
    pub og_image: String,
    pub og_type: String,
    pub noindex: bool,
    pub bare: bool,
    pub lang: &'static str,
    pub extra_head: String,
}

impl Default for PageMeta {
    fn default() -> Self {
        PageMeta {
            title: "Sedekah Je - Platform Sedekah QR Malaysia".to_string(),
            description: "Platform digital untuk memudahkan sedekah ke masjid, surau dan institusi di Malaysia, dengan hanya satu imbasan QR.".to_string(),
            canonical: "https://sedekah.je".to_string(),
            og_image: "https://sedekah.je/sedekahje-og-compressed.png".to_string(),
            og_type: "website".to_string(),
            noindex: false,
            bare: false,
            lang: "ms",
            extra_head: String::new(),
        }
    }
}

pub struct Shell {
    pub meta: PageMeta,
    pub logged_in: bool,
    pub is_admin: bool,
    pub show_header: bool,
    pub show_footer: bool,
    pub body_class: String,
}

impl Default for Shell {
    fn default() -> Self {
        Shell {
            meta: PageMeta::default(),
            logged_in: false,
            is_admin: false,
            show_header: true,
            show_footer: true,
            body_class: String::new(),
        }
    }
}

pub fn begin_page(shell: &Shell, content: String) -> String {
    let m = &shell.meta;
    let extra_head = &m.extra_head;
    let robots = if m.noindex {
        "<meta name=\"robots\" content=\"noindex,nofollow\" />"
    } else {
        ""
    };
    let head_extra = if m.bare {
        String::new()
    } else {
        format!(
            r##"<meta name="keywords" content="sedekah, sedekah qr, sedekah jumaat, sedekah malaysia, sedekahje, sedekah je, qr sedekah malaysia, derma digital, pembayaran digital masjid, sumbangan digital, masjid malaysia, surau malaysia, qr code masjid, donation qr">
<link rel="canonical" href="{}" />
<meta name="theme-color" content="#007d70" />
<meta name="manifest" content="/manifest.json" />
<meta property="og:type" content="{}" />
<meta property="og:title" content="{}" />
<meta property="og:description" content="{}" />
<meta property="og:url" content="{}" />
<meta property="og:image" content="{}" />
<meta property="og:locale" content="ms_MY" />
<meta property="og:site_name" content="Sedekah Je" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@asdfghjkhairin" />
<meta name="twitter:title" content="{}" />
<meta name="twitter:description" content="{}" />
<meta name="twitter:image" content="{}" />
<script defer data-domain="sedekah.je" src="https://umami-production-8fc8.up.railway.app/script.js" data-website-id="fc2662e6-e375-416a-9ff2-44d7f8e2b343" data-auto-track="true"></script>
<script type="application/ld+json">{}</script>
<link rel="icon" href="/favicon.ico" />
<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />"##,
            esc(&m.canonical),
            esc(&m.og_type),
            esc(&m.og_title_or(&m.title)),
            esc(&m.description),
            esc(&m.canonical),
            esc(&m.og_image),
            esc(&m.og_title_or(&m.title)),
            esc(&m.description),
            esc(&m.og_image),
            esc(&website_json_ld()),
        )
    };
    let body_class = shell.body_class.clone();
    let header = if shell.show_header && !m.bare {
        header_html(shell.logged_in, shell.is_admin)
    } else {
        String::new()
    };
    let footer = if shell.show_footer && !m.bare {
        footer_html()
    } else {
        String::new()
    };
    format!(
        r#"<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="description" content="{desc}" />
<title>{title}</title>
<link rel="stylesheet" href="/app.css" />
{robots}
{head_extra}
{extra_head} 
</head>
<body class="{body_class}">
{header}
<main class="main">{content}</main>
{footer}
<script src="/app.js" defer></script>
</body>
</html>"#,
        desc = esc(&m.description),
        title = esc(&m.title),
        lang = m.lang,
        robots = robots,
        head_extra = head_extra,
        header = header,
        content = content,
        footer = footer,
        body_class = body_class,
        extra_head = extra_head,
    )
}

pub fn website_json_ld() -> String {
    r#"{"@context":"https://schema.org","@type":"WebSite","url":"https://sedekah.je","potentialAction":{"@type":"SearchAction","target":"https://sedekah.je/search?q={search_term_string}","query-input":"required name=search_term_string"}}"#.to_string()
}

impl PageMeta {
    pub fn og_title_or(&self, fallback: &str) -> String {
        if self.og_type == "website" {
            "Sedekah Je".to_string()
        } else {
            fallback.to_string()
        }
    }
}

// ---------- header ----------

pub fn header_html(logged_in: bool, is_admin: bool) -> String {
    let auth_section = if logged_in {
        let mut links = String::new();
        if is_admin {
            links.push_str(r##"<a class="nav-link" href="/admin/dashboard">Admin</a>"##);
        }
        links.push_str(&format!(
            r##"<a class="nav-link" href="/my-contributions">Submission Saya</a>
<a class="nav-link" href="/leaderboard">Carta</a>
<form method="post" action="/logout" class="inline-form"><button class="nav-link" type="submit">Log Keluar</button></form>"##
        ));
        links
    } else {
        r##"<a class="nav-link" href="/auth?next=%2Fcontribute&reason=submit_qr">Log Masuk</a>"##.to_string()
    };
    format!(
        r##"<header class="site-header">
<div class="container header-inner">
  <a class="brand" href="/">
    <span class="brand-logo">
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true"><path d="M12 2a7 7 0 0 0-4.95 11.95c1.3 1.3 2.3 2.9 2.45 4.55h5c.15-1.65 1.15-3.25 2.45-4.55A7 7 0 0 0 12 2zm-1 16h2v2h-2v-2zm0-14.5v2a1 1 0 1 0 2 0v-2A4.5 4.5 0 0 0 11 3.5z"/></svg>
    </span>
    <span class="brand-text">Sedekah<b>Je</b></span>
  </a>
  <nav class="desktop-nav">
    <a class="nav-link" href="/">Laman Utama</a>
    <a class="nav-link" href="/blog">Blog</a>
    <a class="nav-link" href="/rawak">Sedekah Rawak</a>
    <a class="nav-link" href="/faq">Soalan Lazim</a>
    {auth_section}
  </nav>
  <a class="mobile-nav-toggle" href="#nav" aria-label="Menu">☰</a>
</div>
<nav class="mobile-nav" id="nav">
  <a class="nav-link" href="/">Laman Utama</a>
  <a class="nav-link" href="/blog">Blog</a>
  <a class="nav-link" href="/rawak">Sedekah Rawak</a>
  <a class="nav-link" href="/faq">Soalan Lazim</a>
  {auth_section2}
</nav>
</header>"##,
        auth_section = auth_section,
        auth_section2 = auth_section,
    )
}

pub fn footer_html() -> String {
    r#"<footer class="site-footer">
<div class="container footer-inner">
  <div class="footer-brand">
    <a href="/" class="brand"><span class="brand-logo">🕌</span><span class="brand-text">Sedekah<b>Je</b></span></a>
    <p class="footer-tagline">Senarai QR code masjid, surau dan institusi di Malaysia yang dikumpul dan disumbang oleh komuniti.</p>
  </div>
  <div class="footer-cols">
    <div class="footer-col">
      <h4>Pelayaran</h4>
      <a href="/">Laman Utama</a>
      <a href="/rawak">Sedekah Rawak</a>
      <a href="/blog">Blog</a>
      <a href="/faq">Soalan Lazim</a>
      <a href="/quest">Mosque Quest</a>
      <a href="/ramadhan">Kempen Ramadhan</a>
    </div>
    <div class="footer-col">
      <h4>Sumbang</h4>
      <a href="/contribute">Tambah Institusi</a>
      <a href="/my-contributions">Submission Saya</a>
      <a href="/leaderboard">Carta Penghantar QR</a>
      <a href="/data">Data Institusi</a>
    </div>
    <div class="footer-col">
      <h4>Legasi</h4>
      <a href="/privacy">Privasi</a>
      <a href="/terms">Terma</a>
      <a href="/legal">Legal</a>
      <a href="/docs">API Docs</a>
      <a href="https://github.com/khrnchn/sedekah-je">GitHub</a>
      <a href="https://x.com/sedekahje">X/Twitter</a>
    </div>
  </div>
</div>
<div class="container footer-bottom">
  <span>© <span id="year">2026</span> sedekah.je</span>
  <span>Dibina dengan ❤ oleh komuniti</span>
</div>
</footer>"#.to_string()
}

// ---------- shared components ----------

pub fn breadcrumb(items: &[(&str, String)]) -> String {
    // items: (label, href) last item is current (no link)
    let mut out = String::from(r##"<nav class="breadcrumb" aria-label="Breadcrumb">"##);
    for (i, (label, href)) in items.iter().enumerate() {
        if i + 1 == items.len() {
            out.push_str(&format!(r##"<span class="crumb current">{}</span>"##, esc(label)));
        } else {
            out.push_str(&format!(
                r##"<a class="crumb" href="{}">{}</a><span class="crumb-sep">/</span>"##,
                esc(href),
                esc(label)
            ));
        }
    }
    out.push_str("</nav>");
    out
}

pub fn page_header(title: &str, show_header: bool) -> String {
    if show_header {
        format!(
            r#"{}<h2 class="page-title">{}</h2>"#,
            breadcrumb(&[
                ("Laman Utama", "/".into()),
                (title, String::new()),
            ]),
            esc(title)
        )
    } else {
        format!(r#"<h2 class="page-title">{}</h2>"#, esc(title))
    }
}

pub fn category_chip(category: &str) -> String {
    let label = category_label(category);
    let color = category_color(category);
    format!(
        r##"<span class="category-chip" style="--cat:{color}">{}</span>"##,
        esc(label)
    )
}

pub fn status_chip(status: &str) -> String {
    let (label, cls) = match status {
        "approved" => ("Diluluskan", "status-approved"),
        "pending" => ("Pending", "status-pending"),
        "rejected" => ("Ditolak", "status-rejected"),
        _ => (status, ""),
    };
    format!(r##"<span class="status-chip {}">{}</span>"##, cls, esc(label))
}

pub fn payment_logo_first(inst: &InstitutionRow, size: u32) -> String {
    let payments = inst.supported_payment_vec();
    let (_, label) = brand_color(Some(&payments));
    let logo = brand_logo(Some(&payments));
    format!(
        r#"<img src="{}" alt="{}" width="{size}" height="{size}" loading="lazy" />"#,
        asset_url(logo),
        esc(label)
    )
}

pub fn qr_tile(inst: &InstitutionRow, size: u32, class: &str) -> String {
    let payments = inst.supported_payment_vec();
    let (color, _label) = brand_color(Some(&payments));
    match &inst.qr_content {
        Some(content) => {
            let svg = crate::qrgen::qr_svg(content, color, "#ffffff", false);
            format!(
                r#"<div class="qr-tile {class}" style="background:{color};width:{size}px;height:{size}px">
<div class="qr-inner">{svg}</div></div>"#
            )
        }
        None => match &inst.qr_image {
            Some(img) => format!(
                r#"<div class="qr-tile {class} qr-img"><img src="{}" width="{size}" height="{size}" alt="Kod QR" /></div>"#,
                esc(img)
            ),
            None => String::from(r#"<div class="qr-tile qr-empty">—</div>"#),
        },
    }
}

pub fn institution_card(inst: &InstitutionRow) -> String {
    let name_caps = title_case(&inst.name);
    let city_caps = title_case(&inst.city);
    let state_caps = title_case(&inst.state);
    let href = format!("/{}/{}", inst.category, inst.slug);
    format!(
        r#"<a class="institution-card" href="{href}" aria-label="Buka halaman {aria}">
  <div class="card-top">
    <div class="card-cat-icon">{icon}</div>
    <div class="card-title-wrap">
      <h3 class="card-title">{title}</h3>
      <span class="card-location">📍 {city}, {state}</span>
    </div>
    {chip}
  </div>
  <div class="card-bottom">
    {qr}
  </div>
</a>"#,
        href = href,
        aria = esc(&name_caps),
        icon = category_icon(&inst.category),
        title = esc(&name_caps),
        city = esc(&city_caps),
        state = esc(&state_caps),
        chip = category_chip(&inst.category),
        qr = qr_tile(inst, 120, "card-qr"),
    )
}

pub fn category_icon(category: &str) -> String {
    match category {
        "masjid" => r#"<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M12 3 2 9h20L12 3zm-8 8h16v10h-5v-5a3 3 0 0 0-6 0v5H4V11z"/></svg>"#.to_string(),
        "surau" => r#"<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M4 4h16v4H4V4zm0 6h16v4H4v-4zm0 6h7v4H4v-4zm10 0h6v4h-6v-4z"/></svg>"#.to_string(),
        "tahfiz" => r#"<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M12 3 2 6v14l10-3 10 3V6L12 3zm-1 13.3V8.7L5 10.3v7.6l6-1.6zm2 0 6-1.6v-7.6l-6 1.6v7.6z"/></svg>"#.to_string(),
        "kebajikan" => r#"<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>"#.to_string(),
        _ => r#"<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 9h10v2H7V9zm0 4h8v2H7v-2z"/></svg>"#.to_string(),
    }
}

pub fn skeleton_grid(n: i64) -> String {
    let mut out = String::from(r#"<div class="cards-grid skeleton-grid">"#);
    for _ in 0..n {
        out.push_str(r#"<div class="card skeleton"><div class="skeleton-block"></div></div>"#);
    }
    out.push_str("</div>");
    out
}

// ---------- admin chrome ----------

pub fn admin_shell(shell: Shell, title: &str, description: &str, content: String) -> String {
    let mut s = shell;
    s.meta.title = format!("{} | Sedekah Je", title);
    s.meta.description = description.to_string();
    s.meta.noindex = true;
    let sidebar = admin_sidebar(s.is_admin);
    let inner = format!(
        r#"<div class="admin-layout">
{sidebar}
<div class="admin-main">
  <div class="admin-breadcrumb">{}</div>
  <div class="admin-header">
    <h1 class="admin-title">{}</h1>
    <p class="admin-desc">{}</p>
  </div>
  {content}
</div>
</div>"#,
        breadcrumb(&[
            ("Dashboard", "/admin/dashboard".into()),
            (title, String::new()),
        ]),
        esc(title),
        esc(description),
    );
    s.body_class = "admin-page".into();
    begin_page(&s, inner)
}

fn admin_sidebar(is_admin: bool) -> String {
    let admin_link = if is_admin { "" } else { "" };
    let _ = admin_link;
    format!(
        r##"<aside class="admin-sidebar">
  <div class="admin-brand"><a href="/admin/dashboard">sedekah.je <b>Admin</b></a></div>
  <nav class="admin-nav">
    <a class="admin-nav-link" href="/">Home</a>
    <a class="admin-nav-link" href="/admin/dashboard">Dashboard</a>
    <a class="admin-nav-link" href="/admin/users">Users</a>
    <div class="admin-nav-group">Campaign</div>
    <a class="admin-nav-link" href="/admin/ramadhan">Ramadhan</a>
    <a class="admin-nav-link" href="/admin/friday">Friday</a>
    <a class="admin-nav-link" href="/admin/threads">Threads</a>
    <a class="admin-nav-link" href="/admin/blog">Blog</a>
    <div class="admin-nav-group">Institutions</div>
    <a class="admin-nav-link" href="/admin/institutions/pending">Pending Review</a>
    <a class="admin-nav-link" href="/admin/institutions/approved">Approved</a>
    <a class="admin-nav-link" href="/admin/institutions/rejected">Rejected</a>
    <a class="admin-nav-link" href="/admin/claim-requests">Claims</a>
  </nav>
  <div class="admin-sidebar-foot">
    <a class="btn btn-primary btn-block" href="/contribute" target="_blank">Quick Create</a>
  </div>
</aside>"##
    )
}

pub fn admin_table(headers: &[&str], rows_html: String, empty: &str) -> String {
    if rows_html.is_empty() {
        let ths = headers
            .iter()
            .map(|h| format!("<th>{}</th>", esc(h)))
            .collect::<String>();
        return format!(
            r#"<div class="card"><div class="table-wrap"><table class="data-table"><thead><tr>{ths}</tr></thead><tbody></tbody></table></div><div class="table-empty">{}</div></div>"#,
            esc(empty)
        );
    }
    let ths = headers
        .iter()
        .map(|h| format!("<th>{}</th>", esc(h)))
        .collect::<String>();
    format!(
        r#"<div class="card"><div class="table-wrap"><table class="data-table"><thead><tr>{ths}</tr></thead><tbody>{}</tbody></table></div></div>"#,
        rows_html
    )
}

pub fn label_span(text: &str, class: &str) -> String {
    format!(r##"<span class="label {}">{}</span>"##, class, esc(text))
}

pub fn form_text_field(name: &str, label: &str, value: &str, placeholder: &str, required: bool) -> String {
    let req = if required { " *" } else { "" };
    let req_attr = if required { " required" } else { "" };
    format!(
        r#"<div class="field">
  <label for="{name}">{label}{req}</label>
  <input id="{name}" name="{name}" type="text" value="{value}" placeholder="{placeholder}"{req_attr} />
</div>"#,
        name = name,
        label = esc(label),
        req = req,
        value = esc(value),
        placeholder = esc(placeholder),
        req_attr = req_attr,
    )
}

impl InstitutionViewRow {
    pub fn view_link(&self) -> String {
        format!("/admin/institutions/{}/{}", self.status, self.id)
    }
}
