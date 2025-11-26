-- Migration for Tugas-Skilvul-BMI-Website
-- Creates `users` and `laporan` tables

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('user','admin') NOT NULL DEFAULT 'user',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `laporan` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `pj` VARCHAR(150) NOT NULL,
  `email` VARCHAR(200) NOT NULL,
  `nama_laporan` VARCHAR(255) NOT NULL,
  `periode_laporan` VARCHAR(50) NOT NULL,
  `tahun_pelaporan` YEAR NOT NULL,
  `instansi_tujuan` VARCHAR(255) NOT NULL,
  `tanggal_pelaporan` DATE NOT NULL,
  `keterangan` TEXT,
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
  KEY `idx_tanggal` (`tanggal_pelaporan`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
