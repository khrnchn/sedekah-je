use crate::config::Config;
use object_store::aws::AmazonS3Builder;
use object_store::path::Path;
use object_store::{ObjectStore, PutPayload};

pub struct R2 {
    store: object_store::aws::AmazonS3,
    pub bucket: String,
    pub public_url: String,
}

impl R2 {
    pub fn new(cfg: &Config) -> Result<Self, String> {
        let store = AmazonS3Builder::new()
            .with_bucket_name(&cfg.r2_bucket_name)
            .with_region("auto")
            .with_endpoint(&cfg.r2_endpoint)
            .with_access_key_id(&cfg.r2_access_key_id)
            .with_secret_access_key(&cfg.r2_secret_access_key)
            .build()
            .map_err(|e| e.to_string())?;
        let bucket = cfg.r2_bucket_name.clone();
        let public_url = cfg.r2_public_url.trim_end_matches('/').to_string();
        Ok(R2 {
            store,
            bucket: bucket.clone(),
            public_url,
        })
    }

    fn content_type_for(ext: &str) -> &'static str {
        match ext {
            "png" => "image/png",
            "jpg" | "jpeg" => "image/jpeg",
            "gif" => "image/gif",
            "webp" => "image/webp",
            "bmp" => "image/bmp",
            "svg" => "image/svg+xml",
            _ => "application/octet-stream",
        }
    }

    /// Upload bytes under `uploads/<uuid>.<ext>`, returns the public URL.
    pub async fn upload_file(&self, data: &[u8], original_filename: &str) -> Result<String, String> {
        let ext = original_filename
            .rsplit('.')
            .next()
            .map(|e| e.to_lowercase())
            .filter(|e| !e.is_empty())
            .unwrap_or_else(|| "png".to_string());
        let filename = format!("uploads/{}.{}", uuid::Uuid::new_v4(), ext);
        let path = Path::from(filename.as_str());
        let payload = PutPayload::from_bytes(data.to_vec().into());
        self.store
            .put(&path, payload)
            .await
            .map_err(|e| e.to_string())?;
        Ok(format!("{}/{}", self.public_url, filename))
    }

    /// Delete an object given its full public URL (parses key from last two segments).
    pub async fn delete_file(&self, url: &str) -> Result<(), String> {
        let segments: Vec<&str> = url.split('/').collect();
        if segments.len() < 2 {
            return Err("invalid url".into());
        }
        let n = segments.len();
        let key = format!("{}/{}", segments[n - 2], segments[n - 1]);
        let path = Path::from(key.as_str());
        self.store.delete(&path).await.map_err(|e| e.to_string())
    }
}
