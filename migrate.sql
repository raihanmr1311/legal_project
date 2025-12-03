-- Migration for Tugas-Skilvul-BMI-Website
-- Creates `users` and `laporan` tables
-- Migration for Legal Project
-- Create `perseroan` (company) table, `users`, and `laporan` tables

CREATE TABLE IF NOT EXISTS `perseroan` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `perseroan` VARCHAR(255) NOT NULL UNIQUE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default perseroan values (idempotent)
INSERT IGNORE INTO `perseroan` (`perseroan`) VALUES
  ('BSP Corporate'),
  ('PT. Bakrie Sumatera Plantations - Kisaran'),
  ('PT. Grahadura Leidong Prima'),
  ('PT. Bakrie Pasaman Plantations'),
  ('PT. Ciptalaras Cipta Indonesia'),
  ('PT. Agrowiyana'),
  ('PT. Sumbertama Nusa Pertiwi'),
  ('PT. Agro Mitra Madani'),
  ('PT. Huma Indah Mekar'),
  ('PT. Monrad Intan Barakat'),
  ('PT. Air Muring');

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `perseroan` VARCHAR(255) DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('user','admin') NOT NULL DEFAULT 'user',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Laporan table: create if missing, otherwise add required columns/indexes/constraints
CREATE TABLE IF NOT EXISTS `laporan` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `perseroan` INT UNSIGNED NULL,
  `jenis_laporan` VARCHAR(255) NOT NULL,
  `periode_laporan` VARCHAR(50) NOT NULL,
  `tahun_laporan` YEAR NOT NULL,
  `instansi_tujuan` VARCHAR(255) NOT NULL,
  `tanggal_dikirim` DATE NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `keterangan` TEXT NULL,
  `file` VARCHAR(255) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `reminder_h1_bulan_sent` TINYINT(1) NOT NULL DEFAULT 0,
  `reminder_h2_minggu_sent` TINYINT(1) NOT NULL DEFAULT 0,
  `reminder_h1_minggu_7_sent` TINYINT(1) NOT NULL DEFAULT 0,
  `reminder_h1_minggu_5_sent` TINYINT(1) NOT NULL DEFAULT 0,
  `reminder_h1_minggu_3_sent` TINYINT(1) NOT NULL DEFAULT 0,
  `reminder_h1_sent` TINYINT(1) NOT NULL DEFAULT 0,
  `reminder_h_sent` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tanggal` (`tanggal_dikirim`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Ensure required columns exist (compatible with older MySQL versions)
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'laporan' AND column_name = 'perseroan');
SET @add_col_sql := IF(@col_exists = 0, 'ALTER TABLE laporan ADD COLUMN perseroan INT UNSIGNED NULL', 'SELECT 1');
PREPARE stmt_col1 FROM @add_col_sql; EXECUTE stmt_col1; DEALLOCATE PREPARE stmt_col1;

SET @col_exists_email := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'laporan' AND column_name = 'email');
SET @add_col_email_sql := IF(@col_exists_email = 0, 'ALTER TABLE laporan ADD COLUMN email VARCHAR(255) DEFAULT NULL', 'SELECT 1');
PREPARE stmt_col2 FROM @add_col_email_sql; EXECUTE stmt_col2; DEALLOCATE PREPARE stmt_col2;
-- If perseroan column exists but is not INT UNSIGNED, attempt to convert it to INT UNSIGNED
-- (this will coerce non-numeric values to 0; review data before applying in production)
SET @col_check := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'laporan' AND column_name = 'perseroan' AND DATA_TYPE = 'int' AND LOCATE('unsigned', COLUMN_TYPE) > 0);
SET @mod_sql := IF(@col_check = 0, 'ALTER TABLE laporan MODIFY COLUMN perseroan INT UNSIGNED NULL', 'SELECT 1');
PREPARE stmt_modcol FROM @mod_sql; EXECUTE stmt_modcol; DEALLOCATE PREPARE stmt_modcol;

-- Ensure an index on perseroan exists
SET @ix_count := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'laporan' AND index_name = 'idx_perseroan');
SET @create_ix_sql := IF(@ix_count = 0, 'CREATE INDEX idx_perseroan ON laporan (perseroan)', 'SELECT 1');
PREPARE stmt_ix FROM @create_ix_sql; EXECUTE stmt_ix; DEALLOCATE PREPARE stmt_ix;

-- Ensure foreign key constraint exists
SET @fk_count := (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_schema = DATABASE() AND table_name = 'laporan' AND constraint_name = 'fk_laporan_perseroan');
SET @add_fk_sql := IF(@fk_count = 0, 'ALTER TABLE laporan ADD CONSTRAINT fk_laporan_perseroan FOREIGN KEY (perseroan) REFERENCES perseroan(id) ON UPDATE CASCADE ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt_fk FROM @add_fk_sql; EXECUTE stmt_fk; DEALLOCATE PREPARE stmt_fk;

-- If perseroan column exists but is not INT UNSIGNED, attempt to convert it to INT UNSIGNED
-- (this will coerce non-numeric values to 0; review data before applying in production)
SET @col_check := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE table_schema = DATABASE() AND table_name = 'laporan' AND column_name = 'perseroan' AND DATA_TYPE = 'int' AND LOCATE('unsigned', COLUMN_TYPE) > 0);
SET @mod_sql := IF(@col_check = 0, 'ALTER TABLE laporan MODIFY COLUMN perseroan INT UNSIGNED NULL', 'SELECT 1');
PREPARE stmt_modcol FROM @mod_sql; EXECUTE stmt_modcol; DEALLOCATE PREPARE stmt_modcol;
