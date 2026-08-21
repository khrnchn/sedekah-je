use std::sync::Arc;

use axum::extract::State;
use axum::http::{HeaderValue, StatusCode};
use axum::response::{Html, IntoResponse, Redirect, Response};
use axum::routing::{get, post};
use axum::Router;
use sedekahje::routes::{admin, api, public};
use sedekahje::cache::Cache;
use sedekahje::AppState;
use tower_http::compression::CompressionLayer;

use tower_http::trace::TraceLayer;

async fn admin_root() -> Response {
    Redirect::to("/admin/dashboard").into_response()
}

async fn health() -> Response {
    "ok".into_response()
}

async fn handle_options() -> Response {
    let mut resp = Response::new(axum::body::Body::empty());
    *resp.status_mut() = StatusCode::NO_CONTENT;
    resp.headers_mut().insert("allow", HeaderValue::from_static("GET, POST, OPTIONS"));
    resp
}

async fn sitemap(State(state): State<AppState>) -> Response {
    use sqlx::Row;
    let mut urls = String::new();
    let inst = sqlx::query("SELECT category, slug, updated_at FROM institutions WHERE status='approved'")
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();
    for r in inst {
        let category: String = r.try_get(0).unwrap_or_default();
        let slug: String = r.try_get(1).unwrap_or_default();
        let _: Option<chrono::DateTime<chrono::Utc>> = r.try_get(2).unwrap_or(None);
        urls.push_str(&format!(
            "<url><loc>https://sedekah.je/{}/{}</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>",
            category, slug
        ));
    }
    let pages = [
        ("https://sedekah.je", "yearly", "1"),
        ("https://sedekah.je/rawak", "monthly", "0.8"),
        ("https://sedekah.je/blog", "weekly", "0.8"),
        ("https://sedekah.je/quest", "monthly", "0.7"),
        ("https://sedekah.je/ramadhan", "monthly", "0.7"),
    ];
    for (u, c, p) in pages {
        urls.push_str(&format!("<url><loc>{u}</loc><changefreq>{c}</changefreq><priority>{p}</priority></url>"));
    }
    let posts = sqlx::query("SELECT slug FROM blog_posts WHERE status='published'")
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();
    for p in posts {
        let slug: String = p.try_get(0).unwrap_or_default();
        urls.push_str(&format!("<url><loc>https://sedekah.je/blog/{slug}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>"));
    }
    let xml = format!(
        r#"<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>"#
    );
    xml.into_response()
}

async fn robots() -> Response {
    "User-agent: *
Allow: /
Disallow: /api/
Disallow: /_next/
Disallow: /public/

Sitemap: https://sedekah.je/sitemap.xml"
        .into_response()
}

async fn manifest() -> Response {
    let body = serde_json::json!({
        "id": "/",
        "name": "Sedekah Je - Platform Sedekah QR Malaysia",
        "short_name": "Sedekah Je",
        "description": "Platform digital untuk memudahkan sedekah ke masjid, surau dan institusi di Malaysia, dengan hanya satu imbasan QR.",
        "start_url": "/",
        "scope": "/",
        "display": "standalone",
        "background_color": "#f2fafb",
        "theme_color": "#007d70",
        "lang": "ms-MY",
        "icons": [
            {"src": "/pwa-64x64.png", "sizes": "64x64", "type": "image/png"},
            {"src": "/pwa-192x192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "/pwa-512x512.png", "sizes": "512x512", "type": "image/png"},
            {"src": "/maskable-icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
            {"src": "/apple-touch-icon-180x180.png", "sizes": "180x180", "type": "image/png"}
        ]
    });
    let mut resp = axum::Json(body).into_response();
    resp.headers_mut().insert("cache-control", HeaderValue::from_static("public, max-age=86400"));
    resp
}

async fn docs() -> Response {
    let shell = sedekahje::render::Shell::default();
    let content = r#"<div class="container page-container">
  <h2 class="page-title">sedekah.je API Docs</h2>
  <p>Public API and MCP server for sedekah.je — a directory of QR codes for mosques, suraus, and religious institutions in Malaysia.</p>
  <h3>Endpoints</h3>
  <ul>
    <li><code>GET /api/institutions</code> — list approved institutions (<code>search</code>, <code>category</code>, <code>state</code>, <code>mode=page|markers</code>, <code>page</code>, <code>limit</code>)</li>
    <li><code>GET /api/random</code> — random approved institution</li>
    <li><code>GET /api/getdoa</code> &amp; <code>/api/getdoa/random</code> — doa proxy</li>
    <li><code>POST /api/mcp</code> — MCP (Streamable HTTP) with tools <code>list_filter_options</code>, <code>search_institutions</code>, <code>get_institution</code>, <code>get_random_institution</code></li>
  </ul>
  <pre><code>{
  "institutions": [{ "id": 1, "name": "Masjid Negara", "slug": "masjid-negara", "category": "masjid", "state": "W.P. Kuala Lumpur", "city": "Kuala Lumpur", "qrImage": null, "supportedPayment": ["duitnow"], "coords": [3.1412, 101.6865], "claimable": true }],
  "pagination": { "page": 1, "limit": 15, "total": 120, "hasMore": true, "totalPages": 8 },
  "facets": { "categoryCounts": { "masjid": 72, "surau": 36, "tahfiz": 12, "kebajikan": 0, "lain-lain": 0 } }
}</code></pre>
</div>"#.to_string();
    Html(sedekahje::render::begin_page(&shell, content)).into_response()
}

async fn not_found(state: AppState) -> Response {
    public::not_found_page(state).await
}

fn mime_for(path: &str) -> &'static str {
    if path.ends_with(".css") {
        "text/css; charset=utf-8"
    } else if path.ends_with(".js") || path.ends_with(".mjs") {
        "text/javascript; charset=utf-8"
    } else if path.ends_with(".png") {
        "image/png"
    } else if path.ends_with(".jpg") || path.ends_with(".jpeg") {
        "image/jpeg"
    } else if path.ends_with(".svg") {
        "image/svg+xml"
    } else if path.ends_with(".ico") {
        "image/x-icon"
    } else if path.ends_with(".webp") {
        "image/webp"
    } else if path.ends_with(".gz") {
        "application/gzip"
    } else {
        "application/octet-stream"
    }
}

fn serve_file(path: &str) -> Response {
    match std::fs::read(path) {
        Ok(bytes) => {
            let mime = mime_for(path);
            let mut resp = Response::new(axum::body::Body::from(bytes));
            resp.headers_mut()
                .insert("content-type", HeaderValue::from_static(mime));
            resp.headers_mut()
                .insert("cache-control", HeaderValue::from_static("public, max-age=604800"));
            resp
        }
        Err(_) => (StatusCode::NOT_FOUND, "not found").into_response(),
    }
}

async fn serve_icons(axum::extract::Path(p): axum::extract::Path<String>) -> Response {
    serve_file(&format!("static/icons/{p}"))
}

async fn serve_flags(axum::extract::Path(p): axum::extract::Path<String>) -> Response {
    serve_file(&format!("static/flags/{p}"))
}

async fn serve_images(axum::extract::Path(p): axum::extract::Path<String>) -> Response {
    serve_file(&format!("static/images/{p}"))
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,tower_http=debug,sqlx=warn".into()),
        )
        .init();

    let cfg = sedekahje::config::load_config();
    let pool = sedekahje::db::connect(&cfg.database_url).await?;
    sedekahje::db::apply_schema(&pool).await?;
    tracing::info!("database ready");

    let r2 = match sedekahje::r2::R2::new(&cfg) {
        Ok(r) if !cfg.r2_endpoint.is_empty() => Some(Arc::new(r)),
        _ => {
            tracing::warn!("R2 not configured; uploads will fail");
            None
        }
    };

    let state = AppState {
        pool,
        cfg: Arc::new(cfg),
        cache: Cache::new(),
        r2,
    };

    // Copy static assets from ./static (already populated) — served at root via fallback.
    let web = Router::new()
        // Public pages
        .route("/", get(public::home))
        .route("/{category}/{slug}", get(public::institution_detail))
        .route("/rawak", get(public::rawak))
        .route("/quest", get(public::quest))
        .route("/quest/submit", post(public::quest_submit))
        .route("/blog", get(public::blog))
        .route("/blog/{slug}", get(public::blog_post))
        .route("/ramadhan", get(public::ramadhan))
        .route("/ramadhan-wrapped-2026", get(public::ramadhan_wrapped))
        .route("/data", get(public::data_page))
        .route("/faq", get(public::faq))
        .route("/offline", get(public::offline_page))
        .route("/legal", get(|| async { public::static_page("legal") }))
        .route("/privacy", get(|| async { public::static_page("privacy") }))
        .route("/terms", get(|| async { public::static_page("terms") }))
        .route("/docs", get(docs))
        .route("/auth", get(public::auth_page))
        .route("/auth/google", get(public::google_start))
        .route("/api/auth/callback/google", get(public::google_callback))
        .route("/login", get(public::google_start))
        .route("/logout", post(public::logout))
        .route("/claim/submit", post(public::claim_submit))
        .route("/contribute", get(public::contribute_page))
        .route("/contribute/submit", post(public::contribute_submit))
        .route("/my-contributions", get(public::my_contributions_page))
        .route("/leaderboard", get(public::leaderboard_page))
        .route("/embed/{slug}", get(public::embed))
        .route("/qr/{slug}", get(public::qr_page))
        // API
        .route("/api/institutions", get(api::institutions_api))
        .route(
            "/api/institutions/submit",
            post(api::submit_institution).options(handle_options),
        )
        .route("/api/random", get(api::random_api))
        .route("/api/institutions/random", get(api::random_api))
        .route("/api/getdoa", get(api::getdoa_list))
        .route("/api/getdoa/random", get(api::getdoa_random))
        .route("/api/meta/oauth/start", get(api::meta_oauth_start))
        .route("/api/meta/oauth/callback", get(api::meta_oauth_callback))
        .route("/api/meta/data-deletion", get(api::meta_data_deletion).post(api::meta_data_deletion))
        .route("/api/meta/data-deletion/status/{id}", get(api::meta_data_deletion_status))
        .route("/api/meta/deauthorize", get(api::meta_deauthorize).post(api::meta_deauthorize))
        .route("/api/og/{slug}", get(api::og_institution))
        .route("/api/og/ramadhan/{day}", get(api::og_ramadhan_day))
        .route("/api/onboarding-tour", get(api::onboarding_tour_get).patch(api::onboarding_tour_patch))
        .route("/api/mcp", post(api::mcp_endpoint).options(api::opcje_mcp))
        .route("/api/admin/institutions/export", get(api::admin_export))
        // SEO
        .route("/sitemap.xml", get(sitemap))
        .route("/robots.txt", get(robots))
        .route("/manifest.json", get(manifest))
        .route("/manifest.webmanifest", get(manifest))
        .route("/health", get(health))
        // Admin
        .route("/admin", get(admin_root))
        .route("/admin/dashboard", get(admin::dashboard))
        .route("/admin/institutions/pending", get(admin::institutions_pending))
        .route("/admin/institutions/pending/{id}", get(admin::institution_review))
        .route("/admin/institutions/approved", get(admin::institutions_approved))
        .route("/admin/institutions/approved/{id}", get(admin::institution_review))
        .route("/admin/institutions/rejected", get(admin::institutions_rejected))
        .route("/admin/institutions/{id}/approve", post(admin::approve_institution))
        .route("/admin/institutions/{id}/reject", post(admin::reject_institution))
        .route("/admin/institutions/{id}/save", post(admin::save_institution))
        .route("/admin/institutions/{id}/undo", post(admin::undo_approval))
        .route("/admin/institutions/{id}/unreject", post(admin::undo_rejection))
        .route("/admin/claim-requests", get(admin::claim_requests))
        .route("/admin/claim-requests/{id}/approve", post(admin::approve_claim))
        .route("/admin/claim-requests/{id}/reject", post(admin::reject_claim))
        .route("/admin/users", get(admin::users))
        .route("/admin/users/{id}/promote", post(admin::user_promote))
        .route("/admin/users/{id}/demote", post(admin::user_demote))
        .route("/admin/friday", get(admin::friday_admin))
        .route("/admin/friday/override", post(admin::set_override))
        .route("/admin/friday/favourite", post(admin::add_favourite))
        .route("/admin/friday/favourite/{id}/remove", post(admin::remove_favourite))
        .route("/admin/ramadhan", get(admin::ramadhan_admin))
        .route("/admin/ramadhan/save", post(admin::ramadhan_save))
        .route("/admin/blog", get(admin::blog_admin))
        .route("/admin/blog/new", get(admin::blog_new))
        .route("/admin/blog/save", post(admin::blog_save))
        .route("/admin/blog/{id}", get(admin::blog_editor))
        .route("/admin/blog/{id}/publish", post(admin::blog_publish))
        .route("/admin/blog/{id}/unpublish", post(admin::blog_unpublish))
        .route("/admin/blog/{id}/delete", post(admin::blog_delete))
        .route("/admin/threads", get(admin::threads_admin))
        .route("/admin/threads/publish", post(admin::threads_publish))
        // Static assets
        .route("/app.css", get(|| async { serve_file("static/app.css") }))
        .route("/app.js", get(|| async { serve_file("static/app.js") }))
        .route("/favicon.ico", get(|| async { serve_file("static/favicon.ico") }))
        .route("/apple-touch-icon-180x180.png", get(|| async { serve_file("static/apple-touch-icon-180x180.png") }))
        .route("/maskable-icon-512x512.png", get(|| async { serve_file("static/maskable-icon-512x512.png") }))
        .route("/pwa-64x64.png", get(|| async { serve_file("static/pwa-64x64.png") }))
        .route("/pwa-192x192.png", get(|| async { serve_file("static/pwa-192x192.png") }))
        .route("/pwa-512x512.png", get(|| async { serve_file("static/pwa-512x512.png") }))
        .route("/sedekahje-og-compressed.png", get(|| async { serve_file("static/sedekahje-og-compressed.png") }))
        .route("/sedekahje-og.png", get(|| async { serve_file("static/sedekahje-og.png") }))
        .route("/sedekahje-og-ramadhan.png", get(|| async { serve_file("static/sedekahje-og-ramadhan.png") }))
        .route("/sedekahje-twitter.png", get(|| async { serve_file("static/sedekahje-twitter.png") }))
        .route("/man-getting-lost.png", get(|| async { serve_file("static/man-getting-lost.png") }))
        .route("/friday-campaign-banner.png", get(|| async { serve_file("static/friday-campaign-banner.png") }))
        .route("/masjid.svg", get(|| async { serve_file("static/masjid.svg") }))
        .route("/icons/{*path}", get(serve_icons))
        .route("/flags/{*path}", get(serve_flags))
        .route("/images/{*path}", get(serve_images))
        .with_state(state)
        .layer(CompressionLayer::new())
        .layer(
            tower_http::set_header::SetResponseHeaderLayer::overriding(
                axum::http::header::X_CONTENT_TYPE_OPTIONS,
                HeaderValue::from_static("nosniff"),
            ),
        )
        .layer(TraceLayer::new_for_http());

    // Security headers for /qr and /embed via a middleware layer.
    let app = web.layer(SecurityHeadersLayer);

    let port = match std::env::var("PORT") {
        Ok(p) => p.parse::<u16>().unwrap_or(3000),
        Err(_) => 3000,
    };
    let addr = std::net::SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("listening on {addr}");
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}

#[derive(Clone, Default)]
struct SecurityHeadersLayer;

impl<S> tower::Layer<S> for SecurityHeadersLayer {
    type Service = SecurityHeaders<S>;
    fn layer(&self, inner: S) -> Self::Service {
        SecurityHeaders { next: inner }
    }
}

#[derive(Clone)]
struct SecurityHeaders<S> {
    next: S,
}

impl<S> tower::Service<axum::http::Request<axum::body::Body>> for SecurityHeaders<S>
where
    S: tower::Service<axum::http::Request<axum::body::Body>, Response = axum::http::Response<axum::body::Body>>
        + Clone
        + Send
        + 'static,
    S::Error: Send,
    S::Future: Send + 'static,
{
    type Response = axum::http::Response<axum::body::Body>;
    type Error = S::Error;
    type Future = futures::future::BoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(&mut self, cx: &mut std::task::Context<'_>) -> std::task::Poll<Result<(), Self::Error>> {
        self.next.poll_ready(cx)
    }

    fn call(&mut self, req: axum::http::Request<axum::body::Body>) -> Self::Future {
        let path = req.uri().path().to_string();
        let mut this = self.clone();
        let fut = this.next.call(req);
        Box::pin(async move {
            let mut resp = fut.await?;
            if path.starts_with("/qr/") {
                resp.headers_mut().insert("cross-origin-embedder-policy", HeaderValue::from_static("require-corp"));
                resp.headers_mut().insert("cross-origin-opener-policy", HeaderValue::from_static("same-origin"));
            }
            if path.starts_with("/embed/") {
                resp.headers_mut().insert("content-security-policy", HeaderValue::from_static("frame-ancestors *"));
            }
            Ok(resp)
        })
    }
}
