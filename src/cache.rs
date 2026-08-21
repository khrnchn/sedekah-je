use std::collections::HashMap;
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::Mutex;

/// Simple in-memory keyed cache with TTL (seconds) and tag-based invalidation.
#[derive(Clone, Default)]
pub struct Cache {
    inner: Arc<Mutex<Inner>>,
}

#[derive(Default)]
struct Inner {
    entries: HashMap<String, Entry>,
    tags: HashMap<String, Vec<String>>,
}

struct Entry {
    value: Arc<String>,
    store_tag: String,
    created: Instant,
    expires: u64,
}

impl Cache {
    pub fn new() -> Self {
        Self::default()
    }

    pub async fn get(&self, key: &str) -> Option<Arc<String>> {
        let inner = self.inner.lock().await;
        let e = inner.entries.get(key)?;
        if e.created.elapsed().as_secs() > e.expires {
            return None;
        }
        Some(e.value.clone())
    }

    pub async fn set(&self, key: &str, tag: &str, ttl_secs: u64, value: String) {
        let mut inner = self.inner.lock().await;
        let entry = Entry {
            value: Arc::new(value),
            store_tag: tag.to_string(),
            created: Instant::now(),
            expires: ttl_secs,
        };
        if let Some(old) = inner.entries.remove(key) {
            if let Some(keys) = inner.tags.get_mut(&old.store_tag) {
                keys.retain(|k| k != key);
            }
        }
        let keys = inner.tags.entry(tag.to_string()).or_default();
        if !keys.iter().any(|k| k == key) {
            keys.push(key.to_string());
        }
        inner.entries.insert(key.to_string(), entry);
    }

    pub async fn revalidate_tag(&self, tag: &str) {
        let mut inner = self.inner.lock().await;
        let keys = inner.tags.remove(tag).unwrap_or_default();
        for k in keys {
            inner.entries.remove(&k);
        }
    }
}
