use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::json;

#[derive(Debug)]
pub enum AppError {
    NotFound,
    Unauthorized,
    Forbidden,
    BadRequest(String),
    Db(sqlx::Error),
    Reqwest(reqwest::Error),
    Json(serde_json::Error),
    Io(std::io::Error),
    Other(String),
}

impl From<sqlx::Error> for AppError {
    fn from(e: sqlx::Error) -> Self {
        AppError::Db(e)
    }
}
impl From<reqwest::Error> for AppError {
    fn from(e: reqwest::Error) -> Self {
        AppError::Reqwest(e)
    }
}
impl From<serde_json::Error> for AppError {
    fn from(e: serde_json::Error) -> Self {
        AppError::Json(e)
    }
}
impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        AppError::Io(e)
    }
}
impl From<Box<dyn std::error::Error + Send + Sync>> for AppError {
    fn from(e: Box<dyn std::error::Error + Send + Sync>) -> Self {
        AppError::Other(e.to_string())
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        tracing::error!("app error: {self:?}");
        match self {
            AppError::NotFound => (StatusCode::NOT_FOUND, Json(json!({"message": "Not found"}))).into_response(),
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, Json(json!({"message": "Unauthorized"}))).into_response(),
            AppError::Forbidden => (StatusCode::FORBIDDEN, Json(json!({"message": "Forbidden"}))).into_response(),
            AppError::BadRequest(msg) => (StatusCode::BAD_REQUEST, Json(json!({"message": msg}))).into_response(),
            AppError::Db(_) | AppError::Reqwest(_) | AppError::Json(_) | AppError::Io(_) | AppError::Other(_) => {
                (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"message": "Internal server error"}))).into_response()
            }
        }
    }
}

pub type AppResult<T> = Result<T, AppError>;
