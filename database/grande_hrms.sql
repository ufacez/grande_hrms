-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 12, 2025 at 12:40 AM
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
(1, 'EMP-001', '2024-12-01', '06:00:00', '14:00:00', 'Present', 8.00, 'On time', '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(2, 'EMP-001', '2024-12-02', '06:05:00', '14:00:00', 'Late', 7.50, 'Late 5 minutes', '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(3, 'EMP-001', '2024-12-03', '06:00:00', '14:00:00', 'Present', 8.00, NULL, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(4, 'EMP-001', '2024-12-04', '06:00:00', '14:00:00', 'Present', 8.00, NULL, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(5, 'EMP-001', '2024-12-05', '14:00:00', '22:00:00', 'Present', 8.00, NULL, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(6, 'EMP-001', '2024-12-06', '14:00:00', '22:00:00', 'Present', 8.00, NULL, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(7, 'EMP-001', '2024-12-07', '06:00:00', '14:00:00', 'Present', 8.00, NULL, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(8, 'EMP-001', '2024-12-08', NULL, NULL, 'On Leave', 0.00, 'Day off', '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(9, 'EMP-001', '2024-12-09', '06:00:00', '14:00:00', 'Present', 8.00, NULL, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(10, 'EMP-001', '2024-12-10', '06:00:00', '14:00:00', 'Present', 8.00, NULL, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(11, 'EMP-001', '2024-12-11', '14:00:00', '22:00:00', 'Present', 8.00, NULL, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(12, 'EMP-001', '2024-12-12', '14:00:00', '22:00:00', 'Present', 8.00, NULL, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(13, 'EMP-001', '2024-12-13', '06:00:00', '14:00:00', 'Present', 8.00, NULL, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(14, 'EMP-001', '2024-12-14', '06:00:00', '14:00:00', 'Present', 8.00, NULL, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(15, 'EMP-001', '2024-12-15', NULL, NULL, 'On Leave', 0.00, 'Day off', '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(16, 'EMP-002', '2024-12-01', '14:00:00', '22:00:00', 'Present', 8.00, NULL, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(17, 'EMP-002', '2024-12-02', '14:10:00', '22:00:00', 'Late', 7.50, 'Late 10 minutes', '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(18, 'EMP-002', '2024-12-03', '14:00:00', '22:00:00', 'Present', 8.00, NULL, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(19, 'EMP-002', '2024-12-04', '22:00:00', '06:00:00', 'Present', 8.00, '[OVERNIGHT]', '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(20, 'EMP-002', '2024-12-05', '22:00:00', '06:00:00', 'Present', 8.00, '[OVERNIGHT]', '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(21, 'EMP-002', '2024-12-06', '14:00:00', '22:00:00', 'Present', 8.00, NULL, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(22, 'EMP-002', '2024-12-07', '14:00:00', '22:00:00', 'Present', 8.00, NULL, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(23, 'EMP-002', '2024-12-08', NULL, NULL, 'On Leave', 0.00, 'Day off', '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(24, 'EMP-002', '2024-12-09', '14:00:00', '22:00:00', 'Present', 8.00, NULL, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(25, 'EMP-002', '2024-12-10', '22:00:00', '06:00:00', 'Present', 8.00, '[OVERNIGHT]', '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(26, 'EMP-002', '2024-12-11', '22:00:00', '06:00:00', 'Present', 8.00, '[OVERNIGHT]', '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(27, 'EMP-002', '2024-12-12', '14:00:00', '22:00:00', 'Present', 8.00, NULL, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(28, 'EMP-002', '2024-12-13', '14:00:00', '22:00:00', 'Present', 8.00, NULL, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(29, 'EMP-002', '2024-12-14', '14:00:00', '22:00:00', 'Present', 8.00, NULL, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(30, 'EMP-002', '2024-12-15', NULL, NULL, 'On Leave', 0.00, 'Day off', '2025-12-11 12:11:34', '2025-12-11 12:11:34');

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

--
-- Dumping data for table `audit_trail`
--

INSERT INTO `audit_trail` (`audit_id`, `user_id`, `action_type`, `action`, `details`, `icon`, `timestamp`) VALUES
(1, 1, 'employee', 'Employee Added', 'Added employee: Juan Dela Cruz (EMP-001)', 'fa-user-plus', '2025-12-11 12:11:35'),
(2, 1, 'employee', 'Employee Added', 'Added employee: Maria Santos (EMP-002)', 'fa-user-plus', '2025-12-11 12:11:35'),
(3, 1, 'biometric', 'Biometric Registered', 'Registered biometric for employee EMP-001', 'fa-fingerprint', '2025-12-11 12:11:35'),
(4, 1, 'biometric', 'Biometric Registered', 'Registered biometric for employee EMP-002', 'fa-fingerprint', '2025-12-11 12:11:35'),
(5, 1, 'system', 'Schedule Created', 'Created schedules for current week', 'fa-calendar', '2025-12-11 12:11:35'),
(6, 1, 'system', 'Schedule Created', 'Created schedules for next week', 'fa-calendar', '2025-12-11 12:11:35'),
(7, 1, 'attendance', 'Manual Attendance Added', 'Added attendance records for pay period Dec 1-15', 'fa-clock', '2025-12-11 12:11:35'),
(8, 1, 'payroll', 'Payroll Generated', 'Generated biweekly payroll for period 2024-12-01 to 2024-12-15 - 2 employees', 'fa-money-bill-wave', '2025-12-11 12:11:35');

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

--
-- Dumping data for table `biometric_records`
--

INSERT INTO `biometric_records` (`biometric_id`, `employee_id`, `registration_date`, `expiry_date`, `fingerprint_data`, `status`, `created_at`, `updated_at`) VALUES
(1, 'EMP-001', '2024-11-15', '2024-12-15', NULL, 'Active', '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(2, 'EMP-002', '2024-11-20', '2024-12-20', NULL, 'Active', '2025-12-11 12:11:34', '2025-12-11 12:11:34');

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
('EMP-001', 'Juan Dela Cruz', 'Senior Barista', 'Service', 'juan.delacruz@grande.com', '09171234567', '2023-01-15', '1995-03-20', '123 Rizal Street, Angeles City, Pampanga', 'Maria Dela Cruz', '09171234568', 16200.00, 'Active', '12-3456789-0', '123-456-789-000', 'PH-123456789', NULL, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
('EMP-002', 'Maria Santos', 'Junior Service Crew', 'Service', 'maria.santos@grande.com', '09181234567', '2024-06-01', '2000-08-15', '456 Del Pilar Street, Angeles City, Pampanga', 'Jose Santos', '09181234568', 15750.00, 'Active', '12-9876543-0', '987-654-321-000', 'PH-987654321', NULL, '2025-12-11 12:11:34', '2025-12-11 12:11:34');

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

--
-- Dumping data for table `payroll`
--

INSERT INTO `payroll` (`payroll_id`, `employee_id`, `pay_period_start`, `pay_period_end`, `basic_salary`, `overtime_hours`, `overtime_rate`, `overtime_pay`, `gross_pay`, `late_deductions`, `other_deductions`, `total_deductions`, `net_pay`, `status`, `created_at`, `updated_at`) VALUES
(1, 'EMP-001', '2024-12-01', '2024-12-15', 7020.00, 0.00, 0.00, 0.00, 7020.00, 33.75, 470.00, 503.75, 6516.25, 'Configured', '2025-12-11 12:11:35', '2025-12-11 12:11:35'),
(2, 'EMP-002', '2024-12-01', '2024-12-15', 7035.00, 0.00, 0.00, 0.00, 7035.00, 54.69, 468.00, 522.69, 6512.31, 'Configured', '2025-12-11 12:11:35', '2025-12-11 12:11:35');

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

--
-- Dumping data for table `schedules`
--

INSERT INTO `schedules` (`schedule_id`, `employee_id`, `week_start_date`, `day_of_week`, `shift_name`, `shift_time`, `is_next_week`, `created_at`, `updated_at`) VALUES
(1, 'EMP-001', '2024-12-07', 0, 'Morning', '6:00 AM - 2:00 PM', 0, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(2, 'EMP-001', '2024-12-07', 1, 'Off', 'Day Off', 0, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(3, 'EMP-001', '2024-12-07', 2, 'Morning', '6:00 AM - 2:00 PM', 0, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(4, 'EMP-001', '2024-12-07', 3, 'Morning', '6:00 AM - 2:00 PM', 0, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(5, 'EMP-001', '2024-12-07', 4, 'Afternoon', '2:00 PM - 10:00 PM', 0, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(6, 'EMP-001', '2024-12-07', 5, 'Afternoon', '2:00 PM - 10:00 PM', 0, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(7, 'EMP-001', '2024-12-07', 6, 'Morning', '6:00 AM - 2:00 PM', 0, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(8, 'EMP-002', '2024-12-07', 0, 'Afternoon', '2:00 PM - 10:00 PM', 0, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(9, 'EMP-002', '2024-12-07', 1, 'Off', 'Day Off', 0, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(10, 'EMP-002', '2024-12-07', 2, 'Afternoon', '2:00 PM - 10:00 PM', 0, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(11, 'EMP-002', '2024-12-07', 3, 'Night', '10:00 PM - 6:00 AM', 0, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(12, 'EMP-002', '2024-12-07', 4, 'Night', '10:00 PM - 6:00 AM', 0, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(13, 'EMP-002', '2024-12-07', 5, 'Afternoon', '2:00 PM - 10:00 PM', 0, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(14, 'EMP-002', '2024-12-07', 6, 'Afternoon', '2:00 PM - 10:00 PM', 0, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(15, 'EMP-001', '2024-12-14', 0, 'Morning', '6:00 AM - 2:00 PM', 1, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(16, 'EMP-001', '2024-12-14', 1, 'Off', 'Day Off', 1, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(17, 'EMP-001', '2024-12-14', 2, 'Morning', '6:00 AM - 2:00 PM', 1, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(18, 'EMP-001', '2024-12-14', 3, 'Morning', '6:00 AM - 2:00 PM', 1, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(19, 'EMP-001', '2024-12-14', 4, 'Afternoon', '2:00 PM - 10:00 PM', 1, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(20, 'EMP-001', '2024-12-14', 5, 'Afternoon', '2:00 PM - 10:00 PM', 1, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(21, 'EMP-001', '2024-12-14', 6, 'Morning', '6:00 AM - 2:00 PM', 1, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(22, 'EMP-002', '2024-12-14', 0, 'Afternoon', '2:00 PM - 10:00 PM', 1, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(23, 'EMP-002', '2024-12-14', 1, 'Off', 'Day Off', 1, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(24, 'EMP-002', '2024-12-14', 2, 'Afternoon', '2:00 PM - 10:00 PM', 1, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(25, 'EMP-002', '2024-12-14', 3, 'Night', '10:00 PM - 6:00 AM', 1, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(26, 'EMP-002', '2024-12-14', 4, 'Night', '10:00 PM - 6:00 AM', 1, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(27, 'EMP-002', '2024-12-14', 5, 'Afternoon', '2:00 PM - 10:00 PM', 1, '2025-12-11 12:11:34', '2025-12-11 12:11:34'),
(28, 'EMP-002', '2024-12-14', 6, 'Afternoon', '2:00 PM - 10:00 PM', 1, '2025-12-11 12:11:34', '2025-12-11 12:11:34');

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
(1, 'admin', '$2y$10$RAj0A1dW1NI19PvOjuLftOuKnfSfPd9BljgQ7cOJkuGcWztBd9RZu', 'System Administrator', 'admin@grande.com', 'admin', '2025-12-10 23:47:26', '2025-12-11 23:26:09', 1);

-- --------------------------------------------------------

--
-- Table structure for table `zkteco_mapping`
--

CREATE TABLE `zkteco_mapping` (
  `mapping_id` int(11) NOT NULL,
  `zkteco_id` varchar(50) NOT NULL COMMENT 'Badge/AC-No from ZKTeco device',
  `employee_id` varchar(20) NOT NULL COMMENT 'Employee ID in your system',
  `employee_name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
-- Indexes for table `zkteco_mapping`
--
ALTER TABLE `zkteco_mapping`
  ADD PRIMARY KEY (`mapping_id`),
  ADD UNIQUE KEY `unique_zkteco` (`zkteco_id`),
  ADD KEY `idx_employee` (`employee_id`);

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
  MODIFY `attendance_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `audit_trail`
--
ALTER TABLE `audit_trail`
  MODIFY `audit_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `biometric_records`
--
ALTER TABLE `biometric_records`
  MODIFY `biometric_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `custom_shifts`
--
ALTER TABLE `custom_shifts`
  MODIFY `shift_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payroll`
--
ALTER TABLE `payroll`
  MODIFY `payroll_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `schedules`
--
ALTER TABLE `schedules`
  MODIFY `schedule_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `zkteco_mapping`
--
ALTER TABLE `zkteco_mapping`
  MODIFY `mapping_id` int(11) NOT NULL AUTO_INCREMENT;

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

--
-- Constraints for table `zkteco_mapping`
--
ALTER TABLE `zkteco_mapping`
  ADD CONSTRAINT `fk_zkteco_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`employee_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
