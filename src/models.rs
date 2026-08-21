use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Institution {
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
    pub supported_payment: Option<Value>,
    pub coords: Option<Value>,
    pub social_media: Option<Value>,
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

impl Institution {
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

    /// Community sparsity rule: claimable when no contributor or the special email.
    pub fn claimable(&self) -> bool {
        match &self.contributor_email {
            None => self.contributor_id.is_none(),
            Some(e) => self.contributor_id.is_none() || e == super::constants::CLAIMABLE_CONTRIBUTOR_EMAIL,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstitutionPublic {
    pub id: i64,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub category: String,
    pub state: String,
    pub city: String,
    pub qr_image: Option<String>,
    pub qr_content: Option<String>,
    pub supported_payment: Option<Value>,
    pub coords: Option<Value>,
    pub contributor_id: Option<String>,
    pub claimable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: String,
    pub email: String,
    pub username: Option<String>,
    pub name: Option<String>,
    pub avatar_url: Option<String>,
    pub image: Option<String>,
    pub email_verified: bool,
    pub role: String,
    pub is_active: bool,
    pub banned: Option<bool>,
    pub ban_reason: Option<String>,
    pub ban_expires: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
    pub onboarding_tour_state: String,
    pub onboarding_tour_current_route: Option<String>,
    pub onboarding_tour_current_step: Option<i64>,
    pub onboarding_tour_started_at: Option<DateTime<Utc>>,
    pub onboarding_tour_completed_at: Option<DateTime<Utc>>,
    pub onboarding_tour_skipped_at: Option<DateTime<Utc>>,
}

impl User {
    pub fn display_name(&self) -> String {
        self.name
            .clone()
            .or_else(|| self.username.clone())
            .filter(|s| !s.is_empty())
            .unwrap_or_else(|| "Anonymous".to_string())
    }
    pub fn avatar(&self) -> Option<String> {
        self.image
            .clone()
            .or_else(|| self.avatar_url.clone())
            .or_else(|| self.name.clone().map(|n| avatar_from_name(&n)))
    }
}

/// GitHub-style initials avatar from a name.
pub fn avatar_from_name(name: &str) -> String {
    let initials: String = name
        .split_whitespace()
        .take(2)
        .filter_map(|w| w.chars().next())
        .map(|c| c.to_uppercase().to_string())
        .collect();
    format!("https://ui-avatars.com/api/?name={}&background=007d70&color=fff", initials)
}

#[derive(Debug, Clone, FromRow)]
pub struct Session {
    pub id: String,
    pub expires_at: DateTime<Utc>,
    pub token: String,
    pub user_id: String,
}

#[derive(Debug, Clone, FromRow)]
pub struct ClaimRequest {
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
}

#[derive(Debug, Clone, FromRow)]
pub struct QuestMosque {
    pub id: i64,
    pub name: String,
    pub address: Option<String>,
    pub district: String,
    pub jais_id: String,
    pub coords: Option<Value>,
    pub institution_id: Option<i64>,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, FromRow)]
pub struct RamadhanCampaignRow {
    pub id: i64,
    pub year: i64,
    pub day_number: i64,
    pub featured_date: chrono::NaiveDate,
    pub institution_id: i64,
    pub caption: Option<String>,
    pub curated_by: Option<String>,
}

#[derive(Debug, Clone, FromRow)]
pub struct BlogPost {
    pub id: i64,
    pub title: String,
    pub slug: String,
    pub excerpt: Option<String>,
    pub cover_image_url: Option<String>,
    pub content_json: Value,
    pub status: String,
    pub featured: bool,
    pub meta_title: Option<String>,
    pub meta_description: Option<String>,
    pub og_image_url: Option<String>,
    pub published_at: Option<DateTime<Utc>>,
    pub author_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
    pub author_name: Option<String>,
}

#[derive(Debug, Clone, FromRow)]
pub struct FridayRun {
    pub id: i64,
    pub featured_date: chrono::NaiveDate,
    pub institution_id: i64,
    pub source: String,
    pub selected_by: Option<String>,
}

#[derive(Debug, Clone, FromRow)]
pub struct FridayFavourite {
    pub id: i64,
    pub institution_id: i64,
    pub note: Option<String>,
    pub sort_order: i64,
    pub created_by: Option<String>,
    pub name: String,
    pub state: String,
    pub category: String,
}

#[derive(Debug, Clone, FromRow)]
pub struct FridaySettingsRow {
    pub id: i64,
    pub active_override_institution_id: Option<i64>,
    pub updated_by: Option<String>,
}

#[derive(Debug, Clone, FromRow)]
pub struct BlogAsset {
    pub id: i64,
    pub post_id: Option<i64>,
    pub url: String,
    pub mime_type: String,
    pub size_bytes: i64,
    pub alt: Option<String>,
    pub uploaded_by: Option<String>,
}
