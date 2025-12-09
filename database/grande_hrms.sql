-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 09, 2025 at 04:40 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `grande_hrms`
--

-- --------------------------------------------------------

--
-- Table structure for table `archives`
--

CREATE TABLE `archives` (
  `archive_id` int(11) NOT NULL,
  `archive_type` enum('employees','attendance','payroll') NOT NULL,
  `original_id` varchar(50) NOT NULL,
  `name_description` varchar(255) DEFAULT NULL,
  `archived_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`archived_data`)),
  `archived_by` int(11) DEFAULT NULL,
  `archived_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendance_records`
--

CREATE TABLE `attendance_records` (
  `attendance_id` int(11) NOT NULL,
  `employee_id` varchar(20) NOT NULL,
  `attendance_date` date NOT NULL,
  `time_in` time DEFAULT NULL,
  `time_out` time DEFAULT NULL,
  `status` enum('Present','Late','Absent','On Leave') NOT NULL,
  `hours_worked` decimal(4,2) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `attendance_records`
--

INSERT INTO `attendance_records` (`attendance_id`, `employee_id`, `attendance_date`, `time_in`, `time_out`, `status`, `hours_worked`, `remarks`, `created_at`, `updated_at`) VALUES
(1, 'EMP001', '2025-12-09', '08:00:00', '17:00:00', 'Present', 9.00, '', '2025-12-09 15:12:48', '2025-12-09 15:12:48'),
(2, 'EMP002', '2025-12-09', '08:15:00', '17:10:00', 'Late', 8.92, 'Traffic', '2025-12-09 15:12:48', '2025-12-09 15:12:48'),
(3, 'EMP003', '2025-12-09', '08:05:00', '17:00:00', 'Present', 8.92, '', '2025-12-09 15:12:48', '2025-12-09 15:12:48'),
(4, 'EMP004', '2025-12-09', NULL, NULL, 'Absent', 0.00, 'Sick', '2025-12-09 15:12:48', '2025-12-09 15:12:48'),
(5, 'EMP005', '2025-12-09', '08:00:00', '17:00:00', 'Present', 9.00, '', '2025-12-09 15:12:48', '2025-12-09 15:12:48');

-- --------------------------------------------------------

--
-- Table structure for table `audit_trail`
--

CREATE TABLE `audit_trail` (
  `audit_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action_type` enum('employee','payroll','attendance','biometric','issue','system') NOT NULL,
  `action` varchar(100) NOT NULL,
  `details` text NOT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `biometric_records`
--

CREATE TABLE `biometric_records` (
  `biometric_id` int(11) NOT NULL,
  `employee_id` varchar(20) NOT NULL,
  `registration_date` date NOT NULL,
  `expiry_date` date NOT NULL,
  `fingerprint_data` blob DEFAULT NULL,
  `status` enum('Active','Expired','Expiring Soon') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `biometric_summary`
-- (See below for the actual view)
--
CREATE TABLE `biometric_summary` (
`total_registered` bigint(21)
,`expiring_soon` decimal(22,0)
,`expired` decimal(22,0)
);

-- --------------------------------------------------------

--
-- Table structure for table `custom_shifts`
--

CREATE TABLE `custom_shifts` (
  `shift_id` int(11) NOT NULL,
  `shift_name` varchar(50) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `color` varchar(7) DEFAULT '#222222',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `employee_id` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `position` varchar(50) NOT NULL,
  `department` enum('Sales','Kitchen','Service','Management') NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `date_hired` date NOT NULL,
  `birthdate` date NOT NULL,
  `address` text NOT NULL,
  `emergency_contact` varchar(100) NOT NULL,
  `emergency_phone` varchar(20) NOT NULL,
  `monthly_salary` decimal(10,2) NOT NULL,
  `status` enum('Active','Inactive','On Leave','Blocklisted') DEFAULT 'Active',
  `sss_number` varchar(20) DEFAULT NULL,
  `tin_number` varchar(20) DEFAULT NULL,
  `philhealth_number` varchar(20) DEFAULT NULL,
  `blocklist_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`employee_id`, `name`, `position`, `department`, `email`, `phone`, `date_hired`, `birthdate`, `address`, `emergency_contact`, `emergency_phone`, `monthly_salary`, `status`, `sss_number`, `tin_number`, `philhealth_number`, `blocklist_reason`, `created_at`, `updated_at`) VALUES
('EMP001', 'Bern Saez', 'Barista', 'Service', 'bern.saez@grande.com', '09171234567', '2023-01-15', '1995-03-20', '123 Main St, Quezon City', 'Maria Saez', '09181234567', 18000.00, 'Active', '12-3456789-0', '123-456-789-000', 'PH-123456789', NULL, '2025-12-09 15:12:48', '2025-12-09 15:12:48'),
('EMP002', 'Earl Espiritu', 'Barista', 'Kitchen', 'earl.espiritu@grande.com', '09171234568', '2023-02-01', '1996-05-15', '456 Second St, Manila', 'Anna Espiritu', '09181234568', 17000.00, 'Active', '12-3456789-1', '123-456-789-001', 'PH-123456790', NULL, '2025-12-09 15:12:48', '2025-12-09 15:12:48'),
('EMP003', 'Lee Bornoz', 'Barista', 'Sales', 'lee.bornoz@grande.com', '09171234569', '2023-03-10', '1994-08-22', '789 Third St, Makati', 'John Bornoz', '09181234569', 20000.00, 'Active', '12-3456789-2', '123-456-789-002', 'PH-123456791', NULL, '2025-12-09 15:12:48', '2025-12-09 15:12:48'),
('EMP004', 'Dev Jimenez', 'Barista', 'Management', 'dev.jimenez@grande.com', '09171234570', '2022-11-01', '1992-12-10', '321 Fourth St, Pasig', 'Lisa Jimenez', '09181234570', 25000.00, 'Active', '12-3456789-3', '123-456-789-003', 'PH-123456792', NULL, '2025-12-09 15:12:48', '2025-12-09 15:12:48'),
('EMP005', 'Karl Gonzales', 'Barista', 'Service', 'karl.gonzales@grande.com', '09171234571', '2023-04-15', '1997-02-28', '654 Fifth St, Taguig', 'Rosa Gonzales', '09181234571', 18000.00, 'Active', '12-3456789-4', '123-456-789-004', 'PH-123456793', NULL, '2025-12-09 15:12:48', '2025-12-09 15:12:48');

-- --------------------------------------------------------

--
-- Stand-in structure for view `employee_statistics`
-- (See below for the actual view)
--
CREATE TABLE `employee_statistics` (
`total_employees` bigint(21)
,`active_employees` decimal(22,0)
,`on_leave` decimal(22,0)
,`blocklisted` decimal(22,0)
);

-- --------------------------------------------------------

--
-- Table structure for table `payroll`
--

CREATE TABLE `payroll` (
  `payroll_id` int(11) NOT NULL,
  `employee_id` varchar(20) NOT NULL,
  `pay_period_start` date NOT NULL,
  `pay_period_end` date NOT NULL,
  `basic_salary` decimal(10,2) NOT NULL,
  `overtime_hours` decimal(5,2) DEFAULT 0.00,
  `overtime_rate` decimal(10,2) DEFAULT 0.00,
  `overtime_pay` decimal(10,2) DEFAULT 0.00,
  `gross_pay` decimal(10,2) NOT NULL,
  `late_deductions` decimal(10,2) DEFAULT 0.00,
  `other_deductions` decimal(10,2) DEFAULT 0.00,
  `total_deductions` decimal(10,2) DEFAULT 0.00,
  `net_pay` decimal(10,2) NOT NULL,
  `status` enum('Pending','Configured','Approved','Paid') DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `schedules`
--

CREATE TABLE `schedules` (
  `schedule_id` int(11) NOT NULL,
  `employee_id` varchar(20) NOT NULL,
  `week_start_date` date NOT NULL,
  `day_of_week` tinyint(4) NOT NULL,
  `shift_name` varchar(50) NOT NULL,
  `shift_time` varchar(50) NOT NULL,
  `is_next_week` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `todays_attendance`
-- (See below for the actual view)
--
CREATE TABLE `todays_attendance` (
`total_records` bigint(21)
,`present` decimal(22,0)
,`late` decimal(22,0)
,`absent` decimal(22,0)
,`on_leave` decimal(22,0)
);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `role` enum('admin','manager','hr') DEFAULT 'hr',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `password_hash`, `full_name`, `email`, `role`, `created_at`, `last_login`, `is_active`) VALUES
(1, 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Avery Libran', 'admin@grande.com', 'admin', '2025-12-09 15:12:48', '2025-12-09 15:27:24', 1);

-- --------------------------------------------------------

--
-- Structure for view `biometric_summary`
--
DROP TABLE IF EXISTS `biometric_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `biometric_summary`  AS SELECT count(0) AS `total_registered`, sum(case when to_days(`biometric_records`.`expiry_date`) - to_days(curdate()) <= 7 and to_days(`biometric_records`.`expiry_date`) - to_days(curdate()) >= 0 then 1 else 0 end) AS `expiring_soon`, sum(case when `biometric_records`.`expiry_date` < curdate() then 1 else 0 end) AS `expired` FROM `biometric_records` ;

-- --------------------------------------------------------

--
-- Structure for view `employee_statistics`
--
DROP TABLE IF EXISTS `employee_statistics`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `employee_statistics`  AS SELECT count(0) AS `total_employees`, sum(case when `employees`.`status` = 'Active' then 1 else 0 end) AS `active_employees`, sum(case when `employees`.`status` = 'On Leave' then 1 else 0 end) AS `on_leave`, sum(case when `employees`.`status` = 'Blocklisted' then 1 else 0 end) AS `blocklisted` FROM `employees` ;

-- --------------------------------------------------------

--
-- Structure for view `todays_attendance`
--
DROP TABLE IF EXISTS `todays_attendance`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `todays_attendance`  AS SELECT count(0) AS `total_records`, sum(case when `attendance_records`.`status` = 'Present' then 1 else 0 end) AS `present`, sum(case when `attendance_records`.`status` = 'Late' then 1 else 0 end) AS `late`, sum(case when `attendance_records`.`status` = 'Absent' then 1 else 0 end) AS `absent`, sum(case when `attendance_records`.`status` = 'On Leave' then 1 else 0 end) AS `on_leave` FROM `attendance_records` WHERE `attendance_records`.`attendance_date` = curdate() ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `archives`
--
ALTER TABLE `archives`
  ADD PRIMARY KEY (`archive_id`),
  ADD KEY `archived_by` (`archived_by`),
  ADD KEY `idx_type` (`archive_type`),
  ADD KEY `idx_date` (`archived_date`);

--
-- Indexes for table `attendance_records`
--
ALTER TABLE `attendance_records`
  ADD PRIMARY KEY (`attendance_id`),
  ADD UNIQUE KEY `unique_attendance` (`employee_id`,`attendance_date`),
  ADD KEY `idx_date` (`attendance_date`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `audit_trail`
--
ALTER TABLE `audit_trail`
  ADD PRIMARY KEY (`audit_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_timestamp` (`timestamp`),
  ADD KEY `idx_type` (`action_type`);

--
-- Indexes for table `biometric_records`
--
ALTER TABLE `biometric_records`
  ADD PRIMARY KEY (`biometric_id`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `idx_expiry` (`expiry_date`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `custom_shifts`
--
ALTER TABLE `custom_shifts`
  ADD PRIMARY KEY (`shift_id`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`employee_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_department` (`department`);

--
-- Indexes for table `payroll`
--
ALTER TABLE `payroll`
  ADD PRIMARY KEY (`payroll_id`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `idx_period` (`pay_period_start`,`pay_period_end`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `schedules`
--
ALTER TABLE `schedules`
  ADD PRIMARY KEY (`schedule_id`),
  ADD UNIQUE KEY `unique_schedule` (`employee_id`,`week_start_date`,`day_of_week`,`is_next_week`),
  ADD KEY `idx_week` (`week_start_date`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `archives`
--
ALTER TABLE `archives`
  MODIFY `archive_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `attendance_records`
--
ALTER TABLE `attendance_records`
  MODIFY `attendance_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `audit_trail`
--
ALTER TABLE `audit_trail`
  MODIFY `audit_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `biometric_records`
--
ALTER TABLE `biometric_records`
  MODIFY `biometric_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `custom_shifts`
--
ALTER TABLE `custom_shifts`
  MODIFY `shift_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payroll`
--
ALTER TABLE `payroll`
  MODIFY `payroll_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `schedules`
--
ALTER TABLE `schedules`
  MODIFY `schedule_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `archives`
--
ALTER TABLE `archives`
  ADD CONSTRAINT `archives_ibfk_1` FOREIGN KEY (`archived_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `attendance_records`
--
ALTER TABLE `attendance_records`
  ADD CONSTRAINT `attendance_records_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE;

--
-- Constraints for table `audit_trail`
--
ALTER TABLE `audit_trail`
  ADD CONSTRAINT `audit_trail_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `biometric_records`
--
ALTER TABLE `biometric_records`
  ADD CONSTRAINT `biometric_records_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE;

--
-- Constraints for table `payroll`
--
ALTER TABLE `payroll`
  ADD CONSTRAINT `payroll_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE;

--
-- Constraints for table `schedules`
--
ALTER TABLE `schedules`
  ADD CONSTRAINT `schedules_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
