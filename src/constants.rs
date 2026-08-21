pub const CATEGORIES: [&str; 5] = ["masjid", "surau", "tahfiz", "kebajikan", "lain-lain"];

pub const STATES: [&str; 16] = [
    "Johor",
    "Kedah",
    "Kelantan",
    "Melaka",
    "Negeri Sembilan",
    "Pahang",
    "Perak",
    "Perlis",
    "Pulau Pinang",
    "Sabah",
    "Sarawak",
    "Selangor",
    "Terengganu",
    "W.P. Kuala Lumpur",
    "W.P. Labuan",
    "W.P. Putrajaya",
];

pub const SUPPORTED_PAYMENTS: [&str; 4] = ["duitnow", "tng", "boost", "toyyibpay"];

pub const INSTITUTION_STATUSES: [&str; 3] = ["pending", "approved", "rejected"];

pub const USER_ROLES: [&str; 2] = ["user", "admin"];

/// The special email that can claim unclaimed institutions (legacy behaviour).
pub const CLAIMABLE_CONTRIBUTOR_EMAIL: &str = "khairin13chan@gmail.com";

pub const SOURCE_WALTER_BULK_IMPORT: &str = "walter-university-bulk-import";

pub const EXCLUDED_CONTRIBUTOR_NAME: &str = "Akrimi Nasir";

pub const BLOG_PAGE_SIZE: i64 = 10;

pub fn category_label(category: &str) -> &str {
    match category {
        "masjid" => "Masjid",
        "surau" => "Surau",
        "tahfiz" => "Tahfiz",
        "kebajikan" => "Kebajikan",
        _ => "Lain-lain",
    }
}

pub fn category_color(category: &str) -> &str {
    match category {
        "masjid" => "#10b981",
        "surau" => "#3b82f6",
        "tahfiz" => "#f59e0b",
        "kebajikan" => "#f97316",
        _ => "#8b5cf6",
    }
}

/// Normalize a legacy/institutional category string to a canonical one.
pub fn normalize_institution_category(category: &str) -> &'static str {
    match category.trim().to_lowercase().as_str() {
        "mosque" => "masjid",
        "others" => "lain-lain",
        "masjid" => "masjid",
        "surau" => "surau",
        "tahfiz" => "tahfiz",
        "kebajikan" => "kebajikan",
        _ => "lain-lain",
    }
}

/// toTitleCase respecting acronyms and dotted words like "W.P." / "IIUM".
pub fn title_case(s: &str) -> String {
    capitalize_words(s)
}

fn capitalize_words(s: &str) -> String {
    // Split on spaces but keep dots/hyphens handling within tokens.
    let tokens: Vec<&str> = s.split(' ').collect();
    let mut out = Vec::with_capacity(tokens.len());
    for t in tokens {
        if t.is_empty() {
            out.push(String::new());
            continue;
        }
        // Handle recursive parentheses by capitalizing inner words too.
        if let Some(open) = t.find('(') {
            if t.ends_with(')') {
                let inner = &t[open + 1..t.len() - 1];
                let prefix = &t[..open];
                let joined = format!(
                    "{}({})",
                    capitalize_words(prefix).trim(),
                    capitalize_words(inner).trim()
                );
                out.push(joined);
                continue;
            }
        }
        out.push(capitalize_token(t));
    }
    out.join(" ")
}

fn is_all_caps(word: &str) -> bool {
    let letters: Vec<char> = word.chars().filter(|c| c.is_ascii_alphabetic()).collect();
    !letters.is_empty() && letters.iter().all(|c| c.is_uppercase())
}

fn capitalize_token(t: &str) -> String {
    // Dotted acronyms like "w.p." -> "W.P."
    if t.contains('.') && !is_all_caps(t) {
        let parts: Vec<String> = t
            .split('.')
            .filter(|p| !p.is_empty())
            .map(|p| {
                let mut chars = p.chars();
                match chars.next() {
                    Some(f) if f.is_lowercase() => format!("{}{}", f.to_uppercase(), chars.as_str()),
                    _ => p.to_string(),
                }
            })
            .collect();
        return parts.join(".");
    }
    if is_all_caps(t) {
        return t.to_string();
    }
    if t.contains('-') {
        return t
            .split('-')
            .map(|p| {
                if p.is_empty() {
                    String::from("-")
                } else {
                    let mut c = p.chars();
                    match c.next() {
                        Some(f) => format!("{}{}", f.to_uppercase(), c.as_str()),
                        None => String::new(),
                    }
                }
            })
            .collect::<Vec<_>>()
            .join("-");
    }
    let mut c = t.chars();
    match c.next() {
        Some(f) => format!("{}{}", f.to_uppercase(), c.as_str()),
        None => String::new(),
    }
}

/// toSentenceCase — first char upper, rest lower.
pub fn sentence_case(s: &str) -> String {
    let trimmed = s.trim();
    if trimmed.is_empty() {
        return String::new();
    }
    let mut c = trimmed.chars();
    let first = c.next().unwrap();
    first.to_uppercase().collect::<String>() + &c.as_str().to_lowercase()
}

/// slugify — lowercase, spaces to dash, strip non [a-z0-9-]
pub fn slugify(s: &str) -> String {
    let mut out = String::new();
    for ch in s.to_lowercase().chars() {
        if ch.is_ascii_alphanumeric() {
            out.push(ch);
        } else if ch.is_whitespace() {
            if !out.ends_with('-') {
                out.push('-');
            }
        } else if ch == '-' {
            out.push('-');
        }
    }
    while out.ends_with('-') {
        out.pop();
    }
    out
}

pub fn sanitize_slug(s: &str) -> String {
    slugify(s)
}

pub fn is_http_url(s: &str) -> bool {
    s.starts_with("http://") || s.starts_with("https://")
}

pub fn html_escape(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&#39;"),
            _ => out.push(c),
        }
    }
    out
}

pub fn attr_escape(s: &str) -> String {
    html_escape(s)
}

/// Compute a haversine distance in metres between two coordinates.
pub fn distance_meters(lat1: f64, lon1: f64, lat2: f64, lon2: f64) -> f64 {
    const EARTH_R: f64 = 6371000.0;
    let l1 = lat1.to_radians();
    let l2 = lat2.to_radians();
    let dlat = (lat2 - lat1).to_radians();
    let dlon = (lon2 - lon1).to_radians();
    let a = (dlat / 2.0).sin().powi(2)
        + l1.cos() * l2.cos() * (dlon / 2.0).sin().powi(2);
    EARTH_R * 2.0 * a.sqrt().asin()
}

pub fn format_distance_my(m: f64) -> String {
    if m >= 1000.0 {
        format!("{:.1} km", m / 1000.0)
    } else {
        format!("{} m", m.round() as i64)
    }
}
