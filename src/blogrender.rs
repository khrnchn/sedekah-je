use crate::constants::html_escape;
use serde_json::Value;

/// Render a ProseMirror-like doc ({type:"doc", content:[...]}) to HTML.
pub fn render_doc(doc: &Value) -> String {
    if doc.get("type").and_then(|t| t.as_str()) != Some("doc") {
        return String::new();
    }
    let content = doc.get("content").and_then(|c| c.as_array());
    let Some(content) = content else {
        return String::new();
    };
    if content.is_empty() {
        return String::new();
    }
    let mut out = String::new();
    for node in content {
        render_node(node, &mut out);
    }
    out
}

fn render_children(node: &Value, out: &mut String) {
    if let Some(children) = node.get("content").and_then(|c| c.as_array()) {
        for child in children {
            render_node(child, out);
        }
    }
}

fn render_inline_text(node: &Value) -> String {
    let text = node.get("text").and_then(|t| t.as_str()).unwrap_or("").to_string();
    let mut html = html_escape(&text);
    if let Some(marks) = node.get("marks").and_then(|m| m.as_array()) {
        for mark in marks {
            let ty = mark.get("type").and_then(|t| t.as_str()).unwrap_or("");
            match ty {
                "bold" => html = format!("<strong>{}</strong>", html),
                "italic" => html = format!("<em>{}</em>", html),
                "link" => {
                    if let Some(href) = mark.get("attrs").and_then(|a| a.get("href")).and_then(|h| h.as_str()) {
                        let external = href.starts_with("http://") || href.starts_with("https://");
                        if external {
                            html = format!(
                                r#"<a href="{}" target="_blank" rel="noopener noreferrer">{}</a>"#,
                                crate::constants::attr_escape(href),
                                html
                            );
                        } else {
                            html = format!(r#"<a href="{}">{}</a>"#, crate::constants::attr_escape(href), html);
                        }
                    }
                }
                _ => {}
            }
        }
    }
    html
}

fn render_node(node: &Value, out: &mut String) {
    let ty = node.get("type").and_then(|t| t.as_str()).unwrap_or("");
    match ty {
        "paragraph" => {
            out.push_str("<p>");
            render_children(node, out);
            out.push_str("</p>");
        }
        "heading" => {
            let level = node
                .get("attrs")
                .and_then(|a| a.get("level"))
                .and_then(|l| l.as_i64())
                .unwrap_or(2);
            let tag = if level == 3 { "h3" } else { "h2" };
            out.push_str(&format!("<{tag}>"));
            render_children(node, out);
            out.push_str(&format!("</{tag}>"));
        }
        "blockquote" => {
            out.push_str("<blockquote>");
            render_children(node, out);
            out.push_str("</blockquote>");
        }
        "bulletList" => {
            out.push_str("<ul>");
            render_children(node, out);
            out.push_str("</ul>");
        }
        "orderedList" => {
            out.push_str("<ol>");
            render_children(node, out);
            out.push_str("</ol>");
        }
        "listItem" => {
            out.push_str("<li>");
            render_children(node, out);
            out.push_str("</li>");
        }
        "codeBlock" => {
            let text = node
                .get("content")
                .and_then(|c| c.as_array())
                .map(|arr| {
                    arr.iter()
                        .filter_map(|n| n.get("text").and_then(|t| t.as_str()))
                        .collect::<Vec<_>>()
                        .join("\n")
                })
                .unwrap_or_default();
            out.push_str(&format!("<pre><code>{}</code></pre>", html_escape(&text)));
        }
        "horizontalRule" => out.push_str("<hr />"),
        "image" => {
            let src = node
                .get("attrs")
                .and_then(|a| a.get("src"))
                .and_then(|s| s.as_str())
                .unwrap_or("");
            let alt = node
                .get("attrs")
                .and_then(|a| a.get("alt"))
                .and_then(|s| s.as_str())
                .unwrap_or("Blog image");
            out.push_str(&format!(
                r#"<figure class="blog-image"><img src="{}" alt="{}" loading="lazy" /></figure>"#,
                crate::constants::attr_escape(src),
                crate::constants::attr_escape(alt)
            ));
        }
        "text" => out.push_str(&render_inline_text(node)),
        _ => {}
    }
}

pub fn is_valid_doc(doc: &Value) -> bool {
    doc.get("type").and_then(|t| t.as_str()) == Some("doc")
        && doc.get("content").map(|c| c.is_array()).unwrap_or(false)
}
