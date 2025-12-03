-- Migration for Tugas-Skilvul-BMI-Website
-- Creates `users` and `laporan` tables
-- Migration for Legal Project
-- Create `perseroan` (company) table, `users`, and `laporan` tables

CREATE TABLE IF NOT EXISTS `perseroan` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `perseroan` VARCHAR(255) NOT NULL UNIQUE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `perseroan` VARCHAR(255) DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('user','admin') NOT NULL DEFAULT 'user',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Laporan table: schema used by the application (includes email column)
CREATE TABLE IF NOT EXISTS `laporan` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  -- store numeric perseroan id referencing `perseroan.id` when available
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
  KEY `idx_tanggal` (`tanggal_dikirim`),
  KEY `idx_perseroan` (`perseroan`),
  CONSTRAINT `fk_laporan_perseroan` FOREIGN KEY (`perseroan`) REFERENCES `perseroan`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
