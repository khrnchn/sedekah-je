use image::{Rgb, RgbImage};
use qrcode::render::svg;
use qrcode::QrCode;

/// Render a quiet-zone-free QR as an SVG string with the given module color.
pub fn qr_svg(content: &str, fg: &str, bg: &str, quiet: bool) -> String {
    match QrCode::new(content.as_bytes()) {
        Ok(code) => code
            .render::<svg::Color>()
            .dark_color(svg::Color(fg))
            .light_color(svg::Color(bg))
            .quiet_zone(quiet)
            .build(),
        Err(_) => String::from("<svg />"),
    }
}

/// Generate QR raster pixels (grayscale raw bytes), one byte per pixel.
pub fn qr_raster(content: &str) -> Option<(u32, u32, Vec<u8>)> {
    let code = QrCode::new(content.as_bytes()).ok()?;
    let img = code
        .render::<image::Luma<u8>>()
        .dark_color(image::Luma([0]))
        .light_color(image::Luma([255]))
        .build();
    let (w, h) = img.dimensions();
    Some((w, h, img.into_raw()))
}

// ---------- OG image (1200x630 PNG) ----------

pub const OG_W: u32 = 1200;
pub const OG_H: u32 = 630;

fn draw_text(img: &mut RgbImage, x: i64, y: i64, scale: u32, text: &str, color: [u8; 3]) {
    use font8x8::UnicodeFonts;
    let mut cursor_x = x;
    let scale = scale.max(1);
    for ch in text.chars() {
        if ch == '\n' {
            break;
        }
        let glyph = match font8x8::BASIC_FONTS.get(ch) {
            Some(g) => g,
            None => continue,
        };
        for (row, byte) in glyph.iter().enumerate() {
            for col in 0..8 {
                if byte & (1 << (7 - col)) != 0 {
                    let px = cursor_x + (col as i64) * (scale as i64);
                    let py = y + (row as i64) * (scale as i64);
                    for sy in 0..scale as i64 {
                        for sx in 0..scale as i64 {
                            let (xx, yy) = (px + sx, py + sy);
                            if xx >= 0 && yy >= 0 && xx < OG_W as i64 && yy < OG_H as i64 {
                                img.put_pixel(xx as u32, yy as u32, Rgb(color));
                            }
                        }
                    }
                }
            }
        }
        cursor_x += 8 * scale as i64;
    }
}

fn draw_qr_centered(img: &mut RgbImage, qr: &(u32, u32, Vec<u8>), cx: u32, cy: u32, max_size: u32) {
    let (w, h, data) = qr;
    let w = *w;
    let h = *h;
    let dim = w.min(h).min(max_size);
    if dim == 0 {
        return;
    }
    let x0 = cx.saturating_sub(dim / 2);
    let y0 = cy.saturating_sub(dim / 2);
    for y in 0..dim {
        for x in 0..dim {
            let sx = (x as u64 * w as u64 / dim as u64) as u32;
            let sy = (y as u64 * h as u64 / dim as u64) as u32;
            let idx = (sy * w + sx) as usize;
            if idx < data.len() {
                let v = data[idx];
                let c = if v < 128 { [10, 10, 10] } else { [255, 255, 255] };
                img.put_pixel(x0 + x, y0 + y, Rgb(c));
            }
        }
    }
}

/// Build a 1200x630 institution OG PNG.
pub fn og_institution_png(name: &str, qr_content: &str, brand_color: &str) -> Vec<u8> {
    let mut img = RgbImage::new(OG_W, OG_H);
    // Radial-ish gradient approximation: lighter top, white bottom.
    for y in 0..OG_H {
        let t = y as f32 / OG_H as f32;
        let r = (249.0 + (255.0 - 249.0) * t) as u8;
        let g = (250.0 + (255.0 - 250.0) * t) as u8;
        let b = (251.0 + (255.0 - 251.0) * t) as u8;
        for x in 0..OG_W {
            img.put_pixel(x, y, Rgb([r, g, b]));
        }
    }
    // Brand-colored container (380 px wide) on the right-ish centre.
    let brand = parse_hex(brand_color);
    let box_x = 740u32;
    let box_y = 125u32;
    let box_w = 380u32;
    let box_h = 380u32;
    for y in box_y..box_y + box_h {
        for x in box_x..box_x + box_w {
            img.put_pixel(x, y, Rgb(brand));
        }
    }
    // QR inside container.
    if let Some(qr) = qr_raster(qr_content) {
        draw_qr_centered(&mut img, &qr, box_x + box_w / 2, box_y + box_h / 2, 284);
    }
    // Name (scaled, wrapped if needed).
    draw_text(&mut img, 60, 340, 4, &truncate(name, 20), [17, 24, 39]);
    draw_text(&mut img, 60, 420, 2, "Sedekah Je", [3, 125, 112]);
    // Calibrate row: QR corner label
    draw_text(&mut img, 60, 480, 2, "Imbas kod QR dan bersedekah", [75, 85, 99]);
    into_png(img)
}

fn into_png(img: RgbImage) -> Vec<u8> {
    let mut out = std::io::Cursor::new(Vec::new());
    image::DynamicImage::ImageRgb8(img)
        .write_to(&mut out, image::ImageFormat::Png)
        .expect("png encode");
    out.into_inner()
}

fn truncate(s: &str, max_chars: usize) -> String {
    if s.chars().count() <= max_chars {
        s.to_string()
    } else {
        let mut out: String = s.chars().take(max_chars - 1).collect();
        out.push('…');
        out
    }
}

/// Build a 1200x630 Ramadhan OG PNG (green gradient, white QR box).
pub fn og_ramadhan_png(day: i64, name: &str, qr_src_ok: bool, brand_color: &str) -> Vec<u8> {
    let mut img = RgbImage::new(OG_W, OG_H);
    let cols = [parse_hex("#34d399"), parse_hex("#0d9488"), parse_hex("#0f766e")];
    let n_bm = 3;
    for y in 0..OG_H {
        let t = y as f32 / OG_H as f32;
        let seg = (t * n_bm as f32).floor().min((n_bm - 1) as f32) as usize;
        let seg_t = (t * n_bm as f32) - seg as f32;
        let c = lerp(cols[seg], cols[(seg + 1).min(n_bm - 1)], seg_t);
        for x in 0..OG_W {
            img.put_pixel(x, y, Rgb(c));
        }
    }
    let _ = brand_color;
    draw_text(&mut img, 60, 60, 4, &format!("30 Hari 30 QR — Hari ke-{day} Ramadan"), [255, 255, 255]);
    // White QR box
    let box_x = 110u32;
    let box_y = 220u32;
    let box_w = 380u32;
    let box_h = 380u32;
    for y in box_y..box_y + box_h {
        for x in box_x..box_x + box_w {
            img.put_pixel(x, y, Rgb([255, 255, 255]));
        }
    }
    if qr_src_ok {
        if let Some(qr) = qr_raster("sedekah.je/qr") {
            draw_qr_centered(&mut img, &qr, box_x + box_w / 2, box_y + box_h / 2, 300);
        }
    }
    draw_text(&mut img, 60, 280, 3, &truncate(name, 24), [255, 255, 255]);
    draw_text(&mut img, 60, 490, 2, "sedekah.je", [255, 255, 255]);
    into_png(img)
}

fn parse_hex(s: &str) -> [u8; 3] {
    let s = s.trim_start_matches('#');
    let n = u32::from_str_radix(s, 16).unwrap_or(0);
    [((n >> 16) & 0xff) as u8, ((n >> 8) & 0xff) as u8, (n & 0xff) as u8]
}

fn lerp(a: [u8; 3], b: [u8; 3], t: f32) -> [u8; 3] {
    [
        (a[0] as f32 + (b[0] as f32 - a[0] as f32) * t) as u8,
        (a[1] as f32 + (b[1] as f32 - a[1] as f32) * t) as u8,
        (a[2] as f32 + (b[2] as f32 - a[2] as f32) * t) as u8,
    ]
}
