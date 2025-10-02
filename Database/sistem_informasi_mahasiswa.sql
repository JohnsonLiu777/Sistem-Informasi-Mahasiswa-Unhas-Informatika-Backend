-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 02, 2025 at 02:26 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sistem_informasi_mahasiswa`
--

-- --------------------------------------------------------

--
-- Table structure for table `dosen`
--

CREATE TABLE `dosen` (
  `id` int(11) NOT NULL,
  `nip` varchar(20) NOT NULL,
  `nama` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `dosen`
--

INSERT INTO `dosen` (`id`, `nip`, `nama`) VALUES
(1, '1234567890', 'Dr. John Doe'),
(2, '19800202', 'Dr. Ani Lestari'),
(3, '19800303', 'Dr. Rahmat Hidayat'),
(4, '12345678930', 'Dr. John Doedf'),
(5, '123456789dd0', 'Dr. John Robert'),
(6, '12345678dfdf', 'Dr. aefefe'),
(8, 'D233', 'Dr. Jackson'),
(9, 'D121231313Updatedwew', 'Dr. Jackson Updated2ewewew'),
(16, 'fadfa', 'fadfa'),
(17, 'qw', 'qwqwq');

-- --------------------------------------------------------

--
-- Table structure for table `kategori_matakuliah`
--

CREATE TABLE `kategori_matakuliah` (
  `id` int(11) NOT NULL,
  `nama_kategori` varchar(100) NOT NULL,
  `detail` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `kategori_matakuliah`
--

INSERT INTO `kategori_matakuliah` (`id`, `nama_kategori`, `detail`) VALUES
(1, 'Matakuliah Wajib', 'Matakuliah yang wajib diambil oleh seluruh mahasiswa dalam program studi ini.'),
(2, 'Matakuliah Pilihan', 'Matakuliah pilihan yang dapat diambil oleh mahasiswa sesuai dengan minat atau kebutuhan jurusan.'),
(3, 'Kerja Praktek', 'Program praktikum yang dilakukan oleh mahasiswa di dunia industri atau lembaga untuk mendapatkan pengalaman kerja.'),
(4, 'Seminar Hasil', 'Matakuliah yang diambil mahasiswa untuk mempresentasikan hasil penelitian atau topik yang relevan dalam seminar.'),
(5, 'Skripsi', 'Matakuliah yang terkait dengan penulisan dan penyelesaian tugas akhir atau skripsi mahasiswa.'),
(8, 'Matakuliah terupdate', 'Kategori matakuliah pilihan yang dapat diambil oleh mahasiswa sesuai dengan minat.');

-- --------------------------------------------------------

--
-- Table structure for table `kp`
--

CREATE TABLE `kp` (
  `id` int(11) NOT NULL,
  `mahasiswa_id` int(11) NOT NULL,
  `tempat_kp` varchar(100) NOT NULL,
  `tgl_mulai` date NOT NULL,
  `tgl_selesai` date NOT NULL,
  `dosen_pembimbing_kp_id` int(11) NOT NULL,
  `nama_supervisor` varchar(100) DEFAULT NULL,
  `matakuliah_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `kp`
--

INSERT INTO `kp` (`id`, `mahasiswa_id`, `tempat_kp`, `tgl_mulai`, `tgl_selesai`, `dosen_pembimbing_kp_id`, `nama_supervisor`, `matakuliah_id`) VALUES
(16, 2, 'Perusahaan A', '2023-06-01', '2023-09-01', 1, 'Supervisor A', 7),
(23, 15, 'Perusahaan Abang', '2023-06-01', '2023-09-01', 1, 'Supervisor A', 15),
(24, 1, 'sadfadsf', '2025-07-29', '2025-08-27', 2, 'sadfasdf', 7);

-- --------------------------------------------------------

--
-- Table structure for table `magang`
--

CREATE TABLE `magang` (
  `id` int(11) NOT NULL,
  `mahasiswa_id` int(11) NOT NULL,
  `tempat_magang` varchar(100) NOT NULL,
  `tgl_mulai` date NOT NULL,
  `tgl_selesai` date NOT NULL,
  `nama_supervisor` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `magang`
--

INSERT INTO `magang` (`id`, `mahasiswa_id`, `tempat_magang`, `tgl_mulai`, `tgl_selesai`, `nama_supervisor`) VALUES
(35, 7, 'Perusahaan X', '2025-06-01', '2025-12-01', 'John Doe'),
(37, 5, 'Perusahaan X', '2025-06-01', '2025-12-01', 'John Doe'),
(38, 5, 'Perusahaan X', '2025-06-01', '2025-12-01', 'John Doe'),
(39, 5, 'Perusahaan X', '2025-06-01', '2025-12-01', 'John Doe'),
(40, 5, 'Perusahaan X', '2025-06-01', '2025-12-01', 'John Doe'),
(41, 5, 'Perusahaan X', '2025-06-01', '2025-12-01', 'John Doe'),
(42, 5, 'Perusahaan X', '2025-06-01', '2025-12-01', 'John Doe'),
(43, 6, 'Perusahaan X', '2025-06-01', '2025-12-01', 'John Doe'),
(45, 5, 'Perusahaan X', '2025-06-01', '2025-12-01', 'John Doe'),
(51, 6, 'Perusahaan X', '2025-06-01', '2025-12-01', 'John Doe'),
(54, 6, 'Perusahaan X', '2025-06-01', '2025-12-01', 'John Doe'),
(57, 6, 'Perusahaan X', '2025-06-01', '2025-12-01', 'John Doe'),
(60, 6, 'Perusahaan X', '2025-06-01', '2025-12-01', 'John Doe'),
(63, 6, 'Perusahaan X', '2025-06-01', '2025-12-01', 'John Doe'),
(66, 6, 'Perusahaan X', '2025-06-01', '2025-12-01', 'John Doe'),
(70, 6, 'Perusahaan X', '2025-06-01', '2025-12-01', 'John Doe'),
(71, 6, 'Perusahaan X', '2025-06-01', '2025-12-01', 'John Doe'),
(72, 6, 'Perusahaan X', '2025-06-01', '2025-12-01', 'John Doe'),
(73, 6, 'Perusahaan XYZ', '2025-07-01', '2025-12-01', 'John Doe'),
(74, 6, 'Perusahaan X', '2025-06-01', '2025-12-01', 'John Doe'),
(75, 6, 'Perusahaan X', '2025-06-01', '2025-12-01', 'John Doe'),
(76, 6, 'Perusahaan X', '2025-06-01', '2025-12-01', 'John Doe'),
(77, 7, 'Perusahaan X', '2025-06-01', '2025-12-01', 'John Doe'),
(81, 7, 'Perusahaan X', '2025-06-01', '2025-12-01', 'John Doe'),
(85, 3, 'Perusahaan XYZ', '2025-07-01', '2025-12-01', 'John Doe'),
(92, 4, 'Perusahaan XYZ', '2025-07-01', '2025-12-01', 'John Doe'),
(96, 5, 'Perusahaan XYZ', '2025-07-01', '2025-12-01', 'John Doe'),
(97, 5, 'Perusahaan XYZ', '2025-07-01', '2025-12-01', 'John Doe'),
(101, 3, 'adfasdf', '2025-08-05', '2025-08-06', 'afdadsfa'),
(105, 24, 'Perusahaan XYZ', '2025-07-01', '2025-12-01', 'John Doe'),
(106, 3, 'Perusahaan XYZ', '2025-07-01', '2025-12-01', 'John Doe'),
(107, 10, 'Perusahaan XYZ', '2025-07-01', '2025-12-01', 'John Doe Update');

-- --------------------------------------------------------

--
-- Table structure for table `mahasiswa`
--

CREATE TABLE `mahasiswa` (
  `id` int(11) NOT NULL,
  `nim` varchar(20) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `tanggal_lahir` date DEFAULT NULL,
  `angkatan` year(4) DEFAULT NULL,
  `no_telp` varchar(15) DEFAULT NULL,
  `no_telp_ortu` varchar(15) DEFAULT NULL,
  `alamat` text DEFAULT NULL,
  `dosen_pa_id` int(11) DEFAULT NULL,
  `status` enum('Belum Lulus','Lulus','Drop Off') DEFAULT 'Belum Lulus'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `mahasiswa`
--

INSERT INTO `mahasiswa` (`id`, `nim`, `nama`, `tanggal_lahir`, `angkatan`, `no_telp`, `no_telp_ortu`, `alamat`, `dosen_pa_id`, `status`) VALUES
(1, '20220001', 'Ahmad Fajar', NULL, '2022', '081234567890', '081234567890', 'Jl. Merdeka No. 1', 1, 'Belum Lulus'),
(2, '20220002', 'Siti Nurhaliza', NULL, '2022', '082345678901', '081234567890', 'Jl. Mawar No. 2', 1, 'Belum Lulus'),
(3, '20220003', 'Rizky Maulana', NULL, '2022', '083456789012', '081234567890', 'Jl. Melati No. 3', 2, 'Belum Lulus'),
(4, '12345', 'Budi Santoso', '2000-05-20', '2022', '08123456789', NULL, 'Jl. Merdeka No.1', 1, 'Drop Off'),
(5, 'Ayah', 'fdfdfd dfdfdfd', '2000-05-15', '2023', '08123456789', '08234567890', 'Jl. Merdeka No.1', 3, 'Belum Lulus'),
(6, 'Rob', 'fdfdfd dfdfdfd', '2000-05-15', '2023', '08123456789', '08234567890', 'Jl. Merdeka No.1', 3, 'Belum Lulus'),
(7, 'Rob2', 'fdfdfd dfdfdfd', '2000-05-15', '2023', '08123456789', '08234567890', 'Jl. Merdeka No.1', 3, 'Belum Lulus'),
(8, '22000sdsd4', 'Budi Santoso', NULL, '2022', '081234567890', NULL, 'Jl. Merdeka No. 45', NULL, 'Belum Lulus'),
(10, 'D121211044', 'Jacob Hilmawan', NULL, '2023', '081234567890', NULL, 'Jl. Merdeka No. 45', 1, 'Belum Lulus'),
(13, '3434343', 'jogaja', '2000-04-28', '2020', '81234568', '81234568', 'Jakarta', 2, 'Belum Lulus'),
(15, 'D3113232', 'jogaja', '2000-04-28', '2020', '81234568', '81234568', 'Jakarta', 2, 'Belum Lulus'),
(16, 'D1212111044', 'Ribert', NULL, '2024', '121212121212', NULL, 'dfdfdfd', 6, 'Belum Lulus'),
(17, 'D121211033', 'dfdfdfdfd', NULL, '2025', '1213143', NULL, '343434334', 8, 'Belum Lulus'),
(18, 'tesss', '23232', NULL, '2024', '43434', NULL, 'dfdfad', 3, 'Belum Lulus'),
(19, 'D32323223', 'Jacob Hilmawan', NULL, '2030', '081234567890', NULL, 'Jl. Merdeka No. 45', 4, 'Belum Lulus'),
(21, 'DTest34343', 'TEsting', NULL, '0000', '34343', NULL, 'jl.mememme', 2, 'Belum Lulus'),
(22, 'Ddfdfd', 'dfafdafda', NULL, '0000', '43343434', NULL, 'dfdafda', 3, 'Belum Lulus'),
(23, 'wwerere', 'dafda', NULL, '0000', 'dfadf343', NULL, 'asdfadf', 3, 'Belum Lulus'),
(24, '34343434545', 'tester', NULL, '0000', '329392932', NULL, 'testint', 2, 'Belum Lulus'),
(25, '433434', 'tesssss', NULL, '0000', '35454', NULL, '4545', 2, 'Belum Lulus'),
(26, '12121', 'dfdfd', NULL, '0000', '34343', NULL, 'dfdasfas', 2, 'Belum Lulus'),
(27, 'ererere', '545454', NULL, '0000', '25425324', NULL, 'afadfas', 2, 'Belum Lulus'),
(28, 'fadfad', 'dsafaf', NULL, '0000', '32323', NULL, 'fdsgsgfsdf', 2, 'Belum Lulus'),
(29, 'D1212Tes', '34343dfadfa', NULL, '0000', 'fdadfda', NULL, 'fadfafdafda', 2, 'Belum Lulus'),
(30, 'dfadad', 'dfadfadf', NULL, '0000', 'afdadf', NULL, 'dfadfadf', 2, 'Belum Lulus'),
(31, '34343', 'dfadf', NULL, '0000', 'afadfa', NULL, 'adfadfadf', 2, 'Belum Lulus'),
(32, 'dfadf', 'afadfa', NULL, '2038', 'afda', NULL, 'dadfa', 2, 'Belum Lulus'),
(33, 'dfdfdfdfd', 'Jacob Hilmawan', NULL, '0000', '081234567890', NULL, 'Jl. Merdeka No. 45', 4, 'Belum Lulus'),
(34, 'D1212110444545', 'Johnson Liu', NULL, '2025', '223232', NULL, 'jalan sarap', 2, 'Belum Lulus'),
(41, 'eqreqerq', 'dfadfa', NULL, '0000', '542542', NULL, 'gfssdgfsg', 2, 'Belum Lulus'),
(48, 'D1219219291', 'adfafd', NULL, '0000', 'afasdfa', NULL, 'asfadfsafa', 2, 'Belum Lulus'),
(49, 'afadfa', 'asfddadfa', NULL, '0000', 'afdafd', NULL, 'dasfasdf', 3, 'Belum Lulus'),
(50, 'TEs', 'Jacobooboab', NULL, '0000', '232321', NULL, 'jalan merdeka', 2, 'Belum Lulus'),
(51, 'adfasf', 'fdADF', NULL, '0000', 'AFADSF', NULL, 'ADFASDF', 2, 'Belum Lulus'),
(53, 'AFDAFDS', 'jogaja', '2000-04-28', '2020', '81234568', '81234568', 'Jakarta', 2, 'Belum Lulus');

-- --------------------------------------------------------

--
-- Table structure for table `mahasiswa_matakuliah`
--

CREATE TABLE `mahasiswa_matakuliah` (
  `mahasiswa_id` int(11) NOT NULL,
  `matakuliah_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `mahasiswa_matakuliah`
--

INSERT INTO `mahasiswa_matakuliah` (`mahasiswa_id`, `matakuliah_id`) VALUES
(1, 4),
(1, 5),
(1, 6),
(1, 7),
(1, 10),
(1, 11),
(2, 4),
(2, 5),
(2, 6),
(2, 7),
(3, 2),
(3, 4),
(3, 5),
(3, 6),
(3, 7),
(3, 16),
(3, 17),
(4, 5),
(4, 7),
(5, 2),
(5, 4),
(5, 5),
(5, 7),
(5, 9),
(5, 10),
(6, 2),
(6, 7),
(7, 7),
(10, 4),
(10, 5),
(10, 6),
(10, 14),
(13, 4),
(15, 4),
(15, 7),
(15, 15),
(24, 7),
(51, 17),
(53, 17);

-- --------------------------------------------------------

--
-- Table structure for table `matakuliah`
--

CREATE TABLE `matakuliah` (
  `id` int(11) NOT NULL,
  `kode_mk` varchar(20) DEFAULT NULL,
  `nama_mk` varchar(100) NOT NULL,
  `sks` int(11) NOT NULL,
  `kurikulum` year(4) DEFAULT NULL,
  `kategori_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `matakuliah`
--

INSERT INTO `matakuliah` (`id`, `kode_mk`, `nama_mk`, `sks`, `kurikulum`, `kategori_id`) VALUES
(2, 'dfdfddfdfd', 'Algoritma dan Pemrograman Updated', 4, '2023', 1),
(4, 'MK4', 'Matematika Diskrit', 3, '2020', 1),
(5, 'MK5', 'Matematika', 3, '2023', 1),
(6, 'MK3101', 'Mekanika', 4, '2023', 1),
(7, 'KP002', 'Kerja Praktek Update', 4, '2023', 3),
(9, 'dfdfdfdfdfdfdd', 'Algoritma dan Pemrograman Updated', 4, '2023', 1),
(10, 'SEMHA1', 'Semhas update', 4, '2023', 4),
(11, 'SKRIPSI22', 'Skripsi', 4, '2023', 5),
(14, 'IF108', 'Skripsi 2', 3, '2024', 5),
(15, 'K343434', 'Kerja Praktek II', 4, '2023', 3),
(16, 'IF110', 'Analisis dan Perancangan Sistem', 3, '2023', 2),
(17, 'IF107', 'Keamanan Jaringan', 2, '2024', 2),
(18, 'Semhas2', 'semhas22', 4, '2024', 4),
(20, 'kerja123', '394934', 3, '2023', 1),
(21, '3r34r3', 'fadfa', 3, '2032', 2);

-- --------------------------------------------------------

--
-- Table structure for table `matakuliah_magang`
--

CREATE TABLE `matakuliah_magang` (
  `magang_id` int(11) NOT NULL,
  `matakuliah_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `matakuliah_magang`
--

INSERT INTO `matakuliah_magang` (`magang_id`, `matakuliah_id`) VALUES
(73, 2),
(74, 7),
(81, 7),
(92, 7),
(96, 2),
(97, 7),
(101, 16),
(101, 17),
(105, 7),
(106, 7),
(107, 5),
(107, 6);

-- --------------------------------------------------------

--
-- Table structure for table `skripsi`
--

CREATE TABLE `skripsi` (
  `id` int(11) NOT NULL,
  `mahasiswa_id` int(11) NOT NULL,
  `status` enum('belum_proposal','sudah_proposal','sudah_hasil','sudah_tutup') DEFAULT 'belum_proposal',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `skripsi`
--

INSERT INTO `skripsi` (`id`, `mahasiswa_id`, `status`, `created_at`, `updated_at`) VALUES
(1, 5, 'sudah_hasil', '2025-07-04 03:14:39', '2025-07-09 05:10:53'),
(3, 1, 'sudah_tutup', '2025-07-10 02:28:26', '2025-10-02 00:01:02'),
(4, 3, 'sudah_proposal', '2025-08-01 03:38:36', '2025-08-01 06:11:14');

-- --------------------------------------------------------

--
-- Table structure for table `skripsi_tahap`
--

CREATE TABLE `skripsi_tahap` (
  `id` int(11) NOT NULL,
  `skripsi_id` int(11) NOT NULL,
  `tahap` enum('proposal','hasil','tutup') NOT NULL,
  `judul` varchar(255) DEFAULT NULL,
  `tanggal` date DEFAULT NULL,
  `dosen_pembimbing_id` int(11) DEFAULT NULL,
  `dosen_penguji_1_id` int(11) DEFAULT NULL,
  `dosen_penguji_2_id` int(11) DEFAULT NULL,
  `matakuliah_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `skripsi_tahap`
--

INSERT INTO `skripsi_tahap` (`id`, `skripsi_id`, `tahap`, `judul`, `tanggal`, `dosen_pembimbing_id`, `dosen_penguji_1_id`, `dosen_penguji_2_id`, `matakuliah_id`) VALUES
(6, 1, 'proposal', 'Perancangan Aplikasi E-Learning', '2025-08-15', 2, 1, 3, NULL),
(16, 1, 'hasil', 'Analisis Pengembangan Sistem Informasi', '2025-09-10', 4, 3, 5, 10),
(18, 3, 'proposal', 'Perancangan Aplikasi E-Learning', '2025-08-15', 1, 2, 3, NULL),
(19, 3, 'hasil', 'Pengembangan Sistem Informasi Manajemen', '2025-09-01', 2, 3, 4, 10),
(36, 4, 'proposal', 'Analisis Sistem Informasi Akademik', '2025-08-01', 2, 3, 4, NULL),
(49, 3, 'tutup', 'Pengembangan Sistem Informasi Manajemen', '2025-11-01', 2, 3, 4, 11);

-- --------------------------------------------------------

--
-- Table structure for table `ta`
--

CREATE TABLE `ta` (
  `id` int(11) NOT NULL,
  `mahasiswa_nim` varchar(20) NOT NULL,
  `status_ta` enum('Belum Proposal','Sudah Proposal','Seminar Hasil','Seminar Tutup') NOT NULL,
  `judul` text DEFAULT NULL,
  `tgl_seminar` datetime DEFAULT NULL,
  `dosen_penguji_id` int(11) DEFAULT NULL,
  `sk_path` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ta`
--

INSERT INTO `ta` (`id`, `mahasiswa_nim`, `status_ta`, `judul`, `tgl_seminar`, `dosen_penguji_id`, `sk_path`) VALUES
(1, '20220001', 'Sudah Proposal', 'Sistem Informasi Akademik', '2024-01-15 09:00:00', 3, 'sk/20220001.pdf');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('super_admin','admin','dosen') NOT NULL,
  `dosen_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `role`, `dosen_id`) VALUES
(1, 'superbaru', 'test123', 'super_admin', NULL),
(2, 'admin123', 'index633', 'admin', NULL),
(3, 'john_doe_updated', 'passwordbaru123', 'dosen', 1),
(4, 'dosenta1', 'hashed_password4', 'dosen', 2),
(5, 'dosenbaru', 'gantisendiri', 'dosen', 3),
(9, 'adminbaru1232', 'admin12345', 'admin', NULL),
(10, 'Dosen4', 'Dosen4', 'dosen', 4),
(11, 'D233', 'D233', 'dosen', 8),
(12, 'D121231313 Updateere', '111111', 'dosen', 9),
(19, 'fadfa', 'fadfa', 'dosen', 16),
(20, 'qw', 'qw', 'dosen', 17),
(23, 'Robert', 'Minasa', 'admin', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `dosen`
--
ALTER TABLE `dosen`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nip` (`nip`);

--
-- Indexes for table `kategori_matakuliah`
--
ALTER TABLE `kategori_matakuliah`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nama_kategori` (`nama_kategori`),
  ADD UNIQUE KEY `unique_nama_kategori` (`nama_kategori`);

--
-- Indexes for table `kp`
--
ALTER TABLE `kp`
  ADD PRIMARY KEY (`id`),
  ADD KEY `mahasiswa_id` (`mahasiswa_id`),
  ADD KEY `dosen_pembimbing_kp_id` (`dosen_pembimbing_kp_id`),
  ADD KEY `fk_matakuliah_id` (`matakuliah_id`);

--
-- Indexes for table `magang`
--
ALTER TABLE `magang`
  ADD PRIMARY KEY (`id`),
  ADD KEY `mahasiswa_id` (`mahasiswa_id`);

--
-- Indexes for table `mahasiswa`
--
ALTER TABLE `mahasiswa`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nim` (`nim`),
  ADD KEY `idx_mahasiswa_pa` (`dosen_pa_id`);

--
-- Indexes for table `mahasiswa_matakuliah`
--
ALTER TABLE `mahasiswa_matakuliah`
  ADD PRIMARY KEY (`mahasiswa_id`,`matakuliah_id`),
  ADD KEY `matakuliah_id` (`matakuliah_id`);

--
-- Indexes for table `matakuliah`
--
ALTER TABLE `matakuliah`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `kode_mk` (`kode_mk`),
  ADD KEY `kategori_id` (`kategori_id`);

--
-- Indexes for table `matakuliah_magang`
--
ALTER TABLE `matakuliah_magang`
  ADD PRIMARY KEY (`magang_id`,`matakuliah_id`),
  ADD KEY `matakuliah_id` (`matakuliah_id`);

--
-- Indexes for table `skripsi`
--
ALTER TABLE `skripsi`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `mahasiswa_id` (`mahasiswa_id`);

--
-- Indexes for table `skripsi_tahap`
--
ALTER TABLE `skripsi_tahap`
  ADD PRIMARY KEY (`id`),
  ADD KEY `skripsi_id` (`skripsi_id`),
  ADD KEY `matakuliah_id` (`matakuliah_id`),
  ADD KEY `dosen_pembimbing_id` (`dosen_pembimbing_id`),
  ADD KEY `dosen_penguji_1_id` (`dosen_penguji_1_id`),
  ADD KEY `dosen_penguji_2_id` (`dosen_penguji_2_id`);

--
-- Indexes for table `ta`
--
ALTER TABLE `ta`
  ADD PRIMARY KEY (`id`),
  ADD KEY `mahasiswa_nim` (`mahasiswa_nim`),
  ADD KEY `dosen_penguji_id` (`dosen_penguji_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `dosen_id` (`dosen_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `dosen`
--
ALTER TABLE `dosen`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `kategori_matakuliah`
--
ALTER TABLE `kategori_matakuliah`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `kp`
--
ALTER TABLE `kp`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `magang`
--
ALTER TABLE `magang`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=131;

--
-- AUTO_INCREMENT for table `mahasiswa`
--
ALTER TABLE `mahasiswa`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT for table `matakuliah`
--
ALTER TABLE `matakuliah`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `skripsi`
--
ALTER TABLE `skripsi`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `skripsi_tahap`
--
ALTER TABLE `skripsi_tahap`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT for table `ta`
--
ALTER TABLE `ta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `kp`
--
ALTER TABLE `kp`
  ADD CONSTRAINT `fk_matakuliah_id` FOREIGN KEY (`matakuliah_id`) REFERENCES `matakuliah` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `kp_ibfk_1` FOREIGN KEY (`mahasiswa_id`) REFERENCES `mahasiswa` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `kp_ibfk_2` FOREIGN KEY (`dosen_pembimbing_kp_id`) REFERENCES `dosen` (`id`);

--
-- Constraints for table `magang`
--
ALTER TABLE `magang`
  ADD CONSTRAINT `magang_ibfk_1` FOREIGN KEY (`mahasiswa_id`) REFERENCES `mahasiswa` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `mahasiswa`
--
ALTER TABLE `mahasiswa`
  ADD CONSTRAINT `mahasiswa_ibfk_1` FOREIGN KEY (`dosen_pa_id`) REFERENCES `dosen` (`id`);

--
-- Constraints for table `mahasiswa_matakuliah`
--
ALTER TABLE `mahasiswa_matakuliah`
  ADD CONSTRAINT `mahasiswa_matakuliah_ibfk_1` FOREIGN KEY (`mahasiswa_id`) REFERENCES `mahasiswa` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `mahasiswa_matakuliah_ibfk_2` FOREIGN KEY (`matakuliah_id`) REFERENCES `matakuliah` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `matakuliah`
--
ALTER TABLE `matakuliah`
  ADD CONSTRAINT `matakuliah_ibfk_1` FOREIGN KEY (`kategori_id`) REFERENCES `kategori_matakuliah` (`id`);

--
-- Constraints for table `matakuliah_magang`
--
ALTER TABLE `matakuliah_magang`
  ADD CONSTRAINT `matakuliah_magang_ibfk_1` FOREIGN KEY (`magang_id`) REFERENCES `magang` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `matakuliah_magang_ibfk_2` FOREIGN KEY (`matakuliah_id`) REFERENCES `matakuliah` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `skripsi`
--
ALTER TABLE `skripsi`
  ADD CONSTRAINT `skripsi_ibfk_1` FOREIGN KEY (`mahasiswa_id`) REFERENCES `mahasiswa` (`id`);

--
-- Constraints for table `skripsi_tahap`
--
ALTER TABLE `skripsi_tahap`
  ADD CONSTRAINT `skripsi_tahap_ibfk_1` FOREIGN KEY (`skripsi_id`) REFERENCES `skripsi` (`id`),
  ADD CONSTRAINT `skripsi_tahap_ibfk_2` FOREIGN KEY (`matakuliah_id`) REFERENCES `matakuliah` (`id`),
  ADD CONSTRAINT `skripsi_tahap_ibfk_3` FOREIGN KEY (`dosen_pembimbing_id`) REFERENCES `dosen` (`id`),
  ADD CONSTRAINT `skripsi_tahap_ibfk_4` FOREIGN KEY (`dosen_penguji_1_id`) REFERENCES `dosen` (`id`),
  ADD CONSTRAINT `skripsi_tahap_ibfk_5` FOREIGN KEY (`dosen_penguji_2_id`) REFERENCES `dosen` (`id`);

--
-- Constraints for table `ta`
--
ALTER TABLE `ta`
  ADD CONSTRAINT `ta_ibfk_1` FOREIGN KEY (`mahasiswa_nim`) REFERENCES `mahasiswa` (`nim`) ON DELETE CASCADE,
  ADD CONSTRAINT `ta_ibfk_2` FOREIGN KEY (`dosen_penguji_id`) REFERENCES `dosen` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`dosen_id`) REFERENCES `dosen` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
