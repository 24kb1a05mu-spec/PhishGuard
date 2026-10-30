-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 30, 2026 at 04:57 PM
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
-- Database: `phishguard1_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `call_checks`
--

CREATE TABLE `call_checks` (
  `id` int(11) NOT NULL,
  `phone_number` varchar(30) NOT NULL,
  `call_description` text DEFAULT NULL,
  `risk_score` int(11) NOT NULL DEFAULT 0,
  `status` varchar(30) NOT NULL,
  `findings` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `call_checks`
--

INSERT INTO `call_checks` (`id`, `phone_number`, `call_description`, `risk_score`, `status`, `findings`, `created_at`) VALUES
(1, '9014710153', 'ask me send otp', 0, 'Low Risk', '[\"No listed scam indicators were detected in the description. This does not prove the call is safe.\"]', '2026-10-27 16:34:10'),
(2, '9014710153', 'the caller said my bank account would be blocked and ask me to share otp', 35, 'Low Risk', '[\"The caller may be requesting a sensitive OTP.\"]', '2026-10-27 16:37:57'),
(3, '99999999999', 'the caller said my bank account would be blocked and ask me to share otp', 35, 'Low Risk', '[\"The caller may be requesting a sensitive OTP.\"]', '2026-10-27 16:41:57'),
(4, '99999999999', 'the caller said my bank account would be blocked and ask me to share otp', 35, 'Low Risk', '[\"The caller may be requesting a sensitive OTP.\"]', '2026-10-27 16:42:03'),
(5, '99999999999', 'the caller said my bank account would be blocked and ask me to share otp', 55, 'Suspicious', '[\"The number contains only repeated digits.\",\"The caller may be requesting a sensitive OTP.\"]', '2026-10-27 16:52:39'),
(6, '12345678901', 'the caller said my bank account would be blocked and ask me to share otp', 35, 'Low Risk', '[\"The caller may be requesting a sensitive OTP.\"]', '2026-10-27 16:54:22'),
(7, '9989966744', 'the caller said my bank account would be blocked and ask me to share otp', 35, 'Low Risk', '[\"The caller may be requesting a sensitive OTP.\"]', '2026-10-27 16:57:44'),
(8, '+1 202-555-0147', 'The caller claims my bank account will be blocked unless I share my OTP immediately', 60, 'High Risk', '[\"The caller mentions an OTP.\",\"The caller threatens to block a bank account.\"]', '2026-10-28 16:11:27'),
(9, '+1 202-555-0147', 'The caller is confirming our project meeting tomorrow at 10 AM.', 0, 'Safe', '[\"No listed warning pattern was detected. This does not prove the caller is safe.\"]', '2026-10-28 16:12:26'),
(10, '+1 202-555-0147', 'The caller says I won a prize and must pay a fee immediately.', 0, 'Safe', '[\"No listed warning pattern was detected. This does not prove the caller is safe.\"]', '2026-10-28 16:12:42'),
(11, '+1 202-555-0147', 'The caller threatens arrest unless I transfer money and keep the call secret.', 25, 'Low Risk', '[\"The caller requests an urgent money transfer.\"]', '2026-10-28 16:12:59'),
(12, '+1 202-555-0147', 'they ask otp', 35, 'Low Risk', '[\"The caller mentions an OTP.\"]', '2026-10-29 16:27:51');

-- --------------------------------------------------------

--
-- Table structure for table `phone_directory`
--

CREATE TABLE `phone_directory` (
  `id` int(11) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `business_name` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT 'Other',
  `city` varchar(100) DEFAULT NULL,
  `source` varchar(255) DEFAULT 'Manually verified',
  `verified` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `phone_directory`
--

INSERT INTO `phone_directory` (`id`, `phone_number`, `business_name`, `category`, `city`, `source`, `verified`, `created_at`) VALUES
(1, '9876543210', 'PhishGuard Demo Store', 'Business', NULL, 'Demo entry for testing', 0, '2026-10-28 16:45:50'),
(2, '9618164954', 'Dogs center', 'Unknown', NULL, 'Manually entered', 0, '2026-10-29 02:14:54');

-- --------------------------------------------------------

--
-- Table structure for table `phone_lookup_history`
--

CREATE TABLE `phone_lookup_history` (
  `id` int(11) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `directory_match` tinyint(1) DEFAULT 0,
  `scam_report_status` varchar(50) DEFAULT 'Not checked',
  `risk_score` int(11) DEFAULT 0,
  `result_source` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `phone_lookup_history`
--

INSERT INTO `phone_lookup_history` (`id`, `phone_number`, `directory_match`, `scam_report_status`, `risk_score`, `result_source`, `created_at`) VALUES
(1, '9014710153', 0, 'Not checked', 0, 'No local directory match', '2026-10-27 17:17:22'),
(2, '+919014710153', 0, 'Not checked', 0, 'No local directory match', '2026-10-27 17:17:53'),
(3, '+91 9014710153', 0, 'Not checked', 0, 'No local directory match', '2026-10-27 17:17:56'),
(4, '9876543210', 0, 'Not checked', 0, 'No local directory match', '2026-10-28 16:33:10'),
(5, '9876543210', 0, 'Not checked', 0, 'No local directory match', '2026-10-28 16:45:00'),
(6, '9876543210', 1, 'Not checked', 0, 'Demo entry for testing', '2026-10-28 16:47:03'),
(7, '9876543210', 1, 'Not checked', 0, 'Demo entry for testing', '2026-10-28 16:47:16'),
(8, '9876543210', 1, 'Not checked', 0, 'Demo entry for testing', '2026-10-28 16:52:36'),
(9, '9876543210', 1, 'Not checked', 0, 'Demo entry for testing', '2026-10-28 16:52:57'),
(10, '9876543210', 1, 'Not checked', 0, 'Demo entry for testing', '2026-10-28 16:57:08'),
(11, '9876543210', 1, 'Not checked', 0, 'Demo entry for testing', '2026-10-28 16:57:09'),
(12, '9876543210', 1, 'Not checked', 0, 'Demo entry for testing', '2026-10-28 16:57:36'),
(13, '9876543210', 1, 'Not checked', 0, 'Demo entry for testing', '2026-10-28 16:58:48'),
(14, '9876543210', 1, 'Not checked', 0, 'Demo entry for testing', '2026-10-28 17:31:59'),
(15, '9876543210', 1, 'Not checked', 0, 'Demo entry for testing', '2026-10-28 17:40:50'),
(16, '9876543210', 1, 'Not checked', 0, 'Demo entry for testing', '2026-10-28 17:42:18'),
(17, '9876543210', 1, 'Not checked', 0, 'Demo entry for testing', '2026-10-28 17:45:03'),
(18, '119876543210', 0, 'Not checked', 0, 'No local directory match', '2026-10-28 17:45:33'),
(19, '9876543210', 1, 'Not checked', 0, 'Demo entry for testing', '2026-10-28 17:52:19'),
(20, '9876543210', 1, 'Not checked', 0, 'Demo entry for testing', '2026-10-28 18:00:19'),
(21, '9876543210', 1, 'Not checked', 0, 'Demo entry for testing', '2026-10-29 01:46:34'),
(22, '9876543210', 1, 'Not checked', NULL, 'Demo entry for testing', '2026-10-29 01:59:19'),
(23, '9876543210', 1, 'Not checked', NULL, 'Demo entry for testing', '2026-10-29 02:03:19'),
(24, '9618164954', 0, 'Not checked', NULL, 'No local directory match', '2026-10-29 02:03:53'),
(25, '9876543210', 1, 'Not checked', NULL, 'Demo entry for testing', '2026-10-29 02:06:15'),
(26, '9876543210', 1, 'Not checked', NULL, 'Demo entry for testing', '2026-10-29 02:08:59'),
(27, '9876543210', 1, 'Not checked', NULL, 'Demo entry for testing', '2026-10-29 02:09:21'),
(28, '9876543210', 1, 'Not checked', NULL, 'Demo entry for testing', '2026-10-29 15:27:33');

-- --------------------------------------------------------

--
-- Table structure for table `quiz_history`
--

CREATE TABLE `quiz_history` (
  `id` int(11) NOT NULL,
  `total_questions` int(11) NOT NULL,
  `correct_answers` int(11) NOT NULL,
  `score_percent` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `quiz_history`
--

INSERT INTO `quiz_history` (`id`, `total_questions`, `correct_answers`, `score_percent`, `created_at`) VALUES
(1, 3, 3, 100, '2026-10-28 17:23:08'),
(2, 3, 2, 67, '2026-10-28 17:31:37'),
(3, 3, 3, 100, '2026-10-29 16:28:59');

-- --------------------------------------------------------

--
-- Table structure for table `quiz_questions`
--

CREATE TABLE `quiz_questions` (
  `id` int(11) NOT NULL,
  `question` text NOT NULL,
  `option_a` varchar(255) NOT NULL,
  `option_b` varchar(255) NOT NULL,
  `option_c` varchar(255) NOT NULL,
  `option_d` varchar(255) NOT NULL,
  `correct_answer` char(1) NOT NULL,
  `explanation` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `scan_history`
--

CREATE TABLE `scan_history` (
  `id` int(11) NOT NULL,
  `url` text NOT NULL,
  `risk_score` int(11) NOT NULL,
  `status` varchar(50) NOT NULL,
  `findings` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `scan_history`
--

INSERT INTO `scan_history` (`id`, `url`, `risk_score`, `status`, `findings`, `created_at`) VALUES
(1, 'https://example.com/', 0, 'Safe', '[\"HTTPS is enabled, but this alone does not guarantee safety\"]', '2026-10-27 16:14:04'),
(2, 'https://mail.com', 0, 'Safe', '[\"No listed warning pattern was detected. This does not guarantee the site is safe.\"]', '2026-10-28 09:27:29'),
(3, 'https://example.com', 0, 'Safe', '[\"No listed warning pattern was detected. This does not guarantee the site is safe.\"]', '2026-10-28 09:27:42'),
(4, 'https://www.google.com', 0, 'Safe', '[\"No listed warning pattern was detected. This does not guarantee the site is safe.\"]', '2026-10-28 15:51:31'),
(5, 'http://paypal-login-security.example.com/verify', 35, 'Low Risk', '[\"The URL does not use HTTPS.\",\"Suspicious keywords: login, verify.\"]', '2026-10-28 15:51:44'),
(6, 'http://example.com', 15, 'Safe', '[\"The URL does not use HTTPS.\"]', '2026-10-29 05:29:06'),
(7, 'https://mail.com', 0, 'Safe', '[\"No listed warning pattern was detected. This does not guarantee the site is safe.\"]', '2026-10-29 15:28:22'),
(8, 'http://paypal-login-security.example.com/verify', 35, 'Low Risk', '[\"The URL does not use HTTPS.\",\"Suspicious keywords: login, verify.\"]', '2026-10-29 15:28:45'),
(9, 'https://chatgpt.com', 20, 'Low Risk', '[\"The URL uses a known URL-shortening domain.\"]', '2026-10-29 16:27:27');

-- --------------------------------------------------------

--
-- Table structure for table `sms_checks`
--

CREATE TABLE `sms_checks` (
  `id` int(11) NOT NULL,
  `message_text` text NOT NULL,
  `risk_score` int(11) NOT NULL DEFAULT 0,
  `status` varchar(30) NOT NULL,
  `findings` text DEFAULT NULL,
  `recommendation` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sms_checks`
--

INSERT INTO `sms_checks` (`id`, `message_text`, `risk_score`, `status`, `findings`, `recommendation`, `created_at`) VALUES
(1, 'Your bank account will be blocked today. Share your OTP immediately to keep your account active.', 35, 'Low Risk', '[\"The message mentions an OTP.\"]', '', '2026-10-28 16:18:34'),
(2, 'Congratulations! You won â‚¹5,00,000. Pay a processing fee now and send your bank details to claim your prize.', 30, 'Low Risk', '[\"The message mentions sensitive information.\"]', '', '2026-10-28 16:19:35'),
(3, 'Hi, our meeting is scheduled for tomorrow at 10 AM. Please bring your project report.', 0, 'Safe', '[\"No listed warning pattern was detected. Stay careful with unknown messages.\"]', '', '2026-10-28 16:19:49'),
(4, 'Hi, our meeting is scheduled for tomorrow at 10 AM. Please bring your project report.', 0, 'Safe', '[\"No listed warning pattern was detected. This does not guarantee the message is safe.\"]', 'No listed warning patterns were detected. Stay cautious with unknown senders and never share sensitive information.', '2026-10-28 16:27:44'),
(5, 'Congratulations! You won â‚¹5,00,000. Pay a processing fee now and send your bank details to claim this prize.', 85, 'High Risk', '[\"The message requests or mentions sensitive financial information.\",\"The message uses a possible prize or lottery lure.\",\"The message requests payment or a fee.\"]', 'High risk: Do not share OTPs, passwords, UPI PINs, or banking details. Do not pay fees or follow suspicious links. Verify claims using official channels.', '2026-10-28 16:27:55'),
(6, 'Your bank account will be blocked today. Share your OTP immediately to keep your account active.', 100, 'High Risk', '[\"The message mentions an OTP. Never share an OTP with another person.\",\"The message threatens account blocking or suspension.\",\"The message uses urgency or pressure to prompt quick action.\",\"The message asks you to share or provide an OTP.\"]', 'High risk: Do not share OTPs, passwords, UPI PINs, or banking details. Do not pay fees or follow suspicious links. Verify claims using official channels.', '2026-10-28 16:28:09'),
(7, 'Your bank account will be blocked today. Share your OTP immediately to keep your account active.', 100, 'High Risk', '[\"The message mentions an OTP. Never share an OTP with another person.\",\"The message threatens account blocking or suspension.\",\"The message uses urgency or pressure to prompt quick action.\",\"The message asks you to share or provide an OTP.\"]', NULL, '2026-10-29 16:28:35');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `call_checks`
--
ALTER TABLE `call_checks`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `phone_directory`
--
ALTER TABLE `phone_directory`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_phone_number` (`phone_number`);

--
-- Indexes for table `phone_lookup_history`
--
ALTER TABLE `phone_lookup_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_lookup_phone` (`phone_number`);

--
-- Indexes for table `quiz_history`
--
ALTER TABLE `quiz_history`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `scan_history`
--
ALTER TABLE `scan_history`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sms_checks`
--
ALTER TABLE `sms_checks`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `call_checks`
--
ALTER TABLE `call_checks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `phone_directory`
--
ALTER TABLE `phone_directory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `phone_lookup_history`
--
ALTER TABLE `phone_lookup_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `quiz_history`
--
ALTER TABLE `quiz_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `scan_history`
--
ALTER TABLE `scan_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `sms_checks`
--
ALTER TABLE `sms_checks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
