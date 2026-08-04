-- Run this only if the NEXTFB database user cannot CREATE TABLE automatically.
-- The API also creates this table on first use.
CREATE TABLE IF NOT EXISTS website_matches (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  league_id BIGINT NOT NULL,
  league_slug VARCHAR(32) NOT NULL,
  home_team_name VARCHAR(128) NOT NULL,
  away_team_name VARCHAR(128) NOT NULL,
  home_score INT NULL,
  away_score INT NULL,
  match_date DATETIME NULL,
  status ENUM('scheduled','live','finished') NOT NULL DEFAULT 'scheduled',
  round_name VARCHAR(128) NOT NULL,
  venue VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX website_matches_league_status_date_idx (league_id, status, match_date),
  INDEX website_matches_slug_status_date_idx (league_slug, status, match_date),
  CONSTRAINT website_matches_distinct_teams CHECK (home_team_name <> away_team_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Run this once on existing installations created before optional dates were supported.
ALTER TABLE website_matches MODIFY COLUMN match_date DATETIME NULL;
