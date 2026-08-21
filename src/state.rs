use crate::cache::Cache;
use crate::config::Config;
use crate::db::DbPool;
use crate::r2::R2;
use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub pool: DbPool,
    pub cfg: Arc<Config>,
    pub cache: Cache,
    pub r2: Option<Arc<R2>>,
}
