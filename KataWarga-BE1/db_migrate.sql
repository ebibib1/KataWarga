-- ============================================================
-- KataWarga DB Fix Migration
-- Run this to fix schema issues preventing report submission
-- ============================================================

USE db_KataWarga;

-- 1. Add missing columns to public_reports (resolveReport bug)
ALTER TABLE public_reports
  ADD COLUMN IF NOT EXISTS is_resolved_by_user TINYINT(1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP NULL DEFAULT NULL;

-- 2. Fix categories.icon column type (was TIMESTAMP, should be VARCHAR)
-- (Only run if icon is still TIMESTAMP type)
-- ALTER TABLE categories MODIFY COLUMN icon VARCHAR(255) DEFAULT NULL;

-- 3. Verify notifications.message column exists (not 'massage')
-- Already confirmed it's 'message' in the DB - no action needed

-- Show results
DESCRIBE public_reports;
SELECT * FROM categories;
