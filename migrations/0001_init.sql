-- sedekah.je schema bootstrap (idempotent).
-- Mirrors the legacy Drizzle schema; safe to run against an existing database.

CREATE TABLE IF NOT EXISTS users (
    id text PRIMARY KEY,
    email varchar(255) NOT NULL UNIQUE,
    username varchar(100) UNIQUE,
    name varchar(255),
    avatar_url text,
    image text,
    email_verified boolean NOT NULL DEFAULT false,
    role varchar(20) NOT NULL DEFAULT 'user',
    is_active boolean NOT NULL DEFAULT true,
    banned boolean DEFAULT false,
    ban_reason text,
    ban_expires timestamp,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp,
    onboarding_tour_state varchar(50) NOT NULL DEFAULT 'completed',
    onboarding_tour_current_route varchar(100),
    onboarding_tour_current_step integer,
    onboarding_tour_started_at timestamp,
    onboarding_tour_completed_at timestamp,
    onboarding_tour_skipped_at timestamp
);

CREATE TABLE IF NOT EXISTS sessions (
    id text PRIMARY KEY,
    expires_at timestamp NOT NULL,
    token text NOT NULL UNIQUE,
    ip_address text,
    user_agent text,
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp
);

CREATE TABLE IF NOT EXISTS accounts (
    id text PRIMARY KEY,
    account_id text NOT NULL,
    provider_id text NOT NULL,
    user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token text,
    refresh_token text,
    id_token text,
    access_token_expires_at timestamp,
    refresh_token_expires_at timestamp,
    scope text,
    password text,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp
);

CREATE TABLE IF NOT EXISTS verifications (
    id text PRIMARY KEY,
    identifier text NOT NULL,
    value text NOT NULL,
    expires_at timestamp NOT NULL,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp
);

CREATE TABLE IF NOT EXISTS institutions (
    id serial PRIMARY KEY,
    name varchar(255) NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    category varchar(50) NOT NULL,
    state varchar(100) NOT NULL,
    city varchar(100) NOT NULL,
    address text,
    qr_image text,
    qr_content text,
    supported_payment jsonb,
    coords jsonb,
    social_media jsonb,
    status varchar(20) NOT NULL DEFAULT 'pending',
    contributor_id text REFERENCES users(id),
    contributor_remarks text,
    source_url text,
    reviewed_by text REFERENCES users(id),
    reviewed_at timestamp,
    admin_notes text,
    is_verified boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp
);

CREATE INDEX IF NOT EXISTS institutions_status_idx ON institutions(status);
CREATE INDEX IF NOT EXISTS institutions_status_state_cat_idx ON institutions(status, state, category);
CREATE INDEX IF NOT EXISTS institutions_contributor_id_idx ON institutions(contributor_id);
CREATE INDEX IF NOT EXISTS institutions_created_at_idx ON institutions(created_at);

CREATE TABLE IF NOT EXISTS claim_requests (
    id serial PRIMARY KEY,
    institution_id integer NOT NULL REFERENCES institutions(id),
    user_id text NOT NULL REFERENCES users(id),
    source_url text,
    description text,
    status varchar(20) NOT NULL DEFAULT 'pending',
    admin_notes text,
    reviewed_by text REFERENCES users(id),
    reviewed_at timestamp,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp
);

CREATE INDEX IF NOT EXISTS claim_requests_status_idx ON claim_requests(status);

CREATE TABLE IF NOT EXISTS quest_mosques (
    id serial PRIMARY KEY,
    name varchar(255) NOT NULL,
    address text,
    district varchar(100) NOT NULL,
    jais_id varchar(50) NOT NULL UNIQUE,
    coords jsonb,
    institution_id integer REFERENCES institutions(id),
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp
);

CREATE TABLE IF NOT EXISTS ramadhan_campaigns (
    id serial PRIMARY KEY,
    year integer NOT NULL,
    day_number integer NOT NULL,
    featured_date date NOT NULL,
    institution_id integer NOT NULL REFERENCES institutions(id),
    caption text,
    curated_by text REFERENCES users(id),
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp,
    CONSTRAINT ramadhan_campaigns_year_day_number_unique UNIQUE (year, day_number),
    CONSTRAINT ramadhan_campaigns_year_institution_id_unique UNIQUE (year, institution_id)
);

CREATE TABLE IF NOT EXISTS blog_posts (
    id serial PRIMARY KEY,
    title varchar(255) NOT NULL,
    slug text NOT NULL UNIQUE,
    excerpt text,
    cover_image_url text,
    content_json jsonb NOT NULL,
    status varchar(20) NOT NULL DEFAULT 'draft',
    featured boolean NOT NULL DEFAULT false,
    meta_title varchar(255),
    meta_description varchar(320),
    og_image_url text,
    published_at timestamp,
    author_id text REFERENCES users(id),
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp
);

CREATE INDEX IF NOT EXISTS blog_posts_status_published_at_idx ON blog_posts(status, published_at);
CREATE INDEX IF NOT EXISTS blog_posts_featured_status_idx ON blog_posts(featured, status);

CREATE TABLE IF NOT EXISTS blog_assets (
    id serial PRIMARY KEY,
    post_id integer REFERENCES blog_posts(id) ON DELETE SET NULL,
    url text NOT NULL UNIQUE,
    mime_type varchar(100) NOT NULL,
    size_bytes integer NOT NULL,
    alt varchar(255),
    uploaded_by text REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp
);

CREATE INDEX IF NOT EXISTS blog_assets_post_id_idx ON blog_assets(post_id);

CREATE TABLE IF NOT EXISTS friday_campaign_favourites (
    id serial PRIMARY KEY,
    institution_id integer NOT NULL REFERENCES institutions(id) UNIQUE,
    note text,
    sort_order integer NOT NULL DEFAULT 0,
    created_by text REFERENCES users(id),
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp
);

CREATE TABLE IF NOT EXISTS friday_campaign_settings (
    id integer PRIMARY KEY DEFAULT 1,
    active_override_institution_id integer REFERENCES institutions(id),
    updated_by text REFERENCES users(id),
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp
);

CREATE TABLE IF NOT EXISTS friday_campaign_runs (
    id serial PRIMARY KEY,
    featured_date date NOT NULL UNIQUE,
    institution_id integer NOT NULL REFERENCES institutions(id),
    source varchar(20) NOT NULL,
    selected_by text REFERENCES users(id),
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp
);
