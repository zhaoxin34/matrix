-- MySQL dump 10.13  Distrib 9.5.0, for macos15.4 (arm64)
--
-- Host: 127.0.0.1    Database: cdp
-- ------------------------------------------------------
-- Server version	8.0.40

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `alembic_version`
--

DROP TABLE IF EXISTS `alembic_version`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alembic_version` (
  `version_num` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`version_num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alembic_version`
--

LOCK TABLES `alembic_version` WRITE;
/*!40000 ALTER TABLE `alembic_version` DISABLE KEYS */;
INSERT INTO `alembic_version` VALUES ('003');
/*!40000 ALTER TABLE `alembic_version` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee`
--

DROP TABLE IF EXISTS `employee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `employee_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `primary_unit_id` bigint DEFAULT NULL,
  `status` enum('onboarding','on_job','transferring','offboarding') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'onboarding',
  `entry_date` date DEFAULT NULL,
  `dimission_date` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_no` (`employee_no`),
  UNIQUE KEY `ix_employee_no` (`employee_no`),
  KEY `ix_employee_primary_unit` (`primary_unit_id`),
  CONSTRAINT `employee_ibfk_1` FOREIGN KEY (`primary_unit_id`) REFERENCES `organization_unit` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee`
--

LOCK TABLES `employee` WRITE;
/*!40000 ALTER TABLE `employee` DISABLE KEYS */;
INSERT INTO `employee` VALUES (1,'001','京城三爷Zhao','13800138002','zhaoxin3456@gmail.com','高级测试工程师',1,'on_job','2026-04-23',NULL,'2026-04-23 09:12:07','2026-04-23 10:57:24'),(2,'002','京城三爷Zhao','13522585560','zhaoxin3456@gmail.com','tech',6,'onboarding',NULL,NULL,'2026-04-23 09:18:17','2026-04-23 09:18:17'),(3,'EMP41795','测试员工','13900001001',NULL,'测试工程师',NULL,'onboarding',NULL,NULL,'2026-04-23 10:56:36','2026-04-23 10:56:36'),(4,'EMP41806','绑定账号员工','13900001002',NULL,'测试工程师',NULL,'onboarding',NULL,NULL,'2026-04-23 10:56:47','2026-04-23 10:56:47'),(5,'EMP001','重复工号测试','13900001003',NULL,NULL,NULL,'onboarding',NULL,NULL,'2026-04-23 10:56:58','2026-04-23 10:56:58'),(6,'EMP41830','绑定已占用账号测试','13900001004',NULL,'测试工程师',NULL,'onboarding',NULL,NULL,'2026-04-23 10:57:11','2026-04-23 10:57:11');
/*!40000 ALTER TABLE `employee` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_secondary_unit`
--

DROP TABLE IF EXISTS `employee_secondary_unit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_secondary_unit` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `employee_id` bigint NOT NULL,
  `unit_id` bigint NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_employee_secondary_unit` (`employee_id`,`unit_id`),
  KEY `unit_id` (`unit_id`),
  CONSTRAINT `employee_secondary_unit_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_secondary_unit_ibfk_2` FOREIGN KEY (`unit_id`) REFERENCES `organization_unit` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_secondary_unit`
--

LOCK TABLES `employee_secondary_unit` WRITE;
/*!40000 ALTER TABLE `employee_secondary_unit` DISABLE KEYS */;
/*!40000 ALTER TABLE `employee_secondary_unit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_transfer`
--

DROP TABLE IF EXISTS `employee_transfer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_transfer` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `employee_id` bigint NOT NULL,
  `from_unit_id` bigint DEFAULT NULL,
  `to_unit_id` bigint NOT NULL,
  `transfer_type` enum('promotion','demotion','transfer') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `effective_date` date NOT NULL,
  `reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `from_unit_id` (`from_unit_id`),
  KEY `to_unit_id` (`to_unit_id`),
  KEY `ix_employee_transfer_employee` (`employee_id`),
  CONSTRAINT `employee_transfer_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`) ON DELETE CASCADE,
  CONSTRAINT `employee_transfer_ibfk_2` FOREIGN KEY (`from_unit_id`) REFERENCES `organization_unit` (`id`),
  CONSTRAINT `employee_transfer_ibfk_3` FOREIGN KEY (`to_unit_id`) REFERENCES `organization_unit` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_transfer`
--

LOCK TABLES `employee_transfer` WRITE;
/*!40000 ALTER TABLE `employee_transfer` DISABLE KEYS */;
/*!40000 ALTER TABLE `employee_transfer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `org_unit_closure`
--

DROP TABLE IF EXISTS `org_unit_closure`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `org_unit_closure` (
  `ancestor_id` bigint NOT NULL,
  `descendant_id` bigint NOT NULL,
  `depth` int NOT NULL,
  PRIMARY KEY (`ancestor_id`,`descendant_id`),
  KEY `ix_org_unit_closure_descendant` (`descendant_id`),
  CONSTRAINT `org_unit_closure_ibfk_1` FOREIGN KEY (`ancestor_id`) REFERENCES `organization_unit` (`id`) ON DELETE CASCADE,
  CONSTRAINT `org_unit_closure_ibfk_2` FOREIGN KEY (`descendant_id`) REFERENCES `organization_unit` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `org_unit_closure`
--

LOCK TABLES `org_unit_closure` WRITE;
/*!40000 ALTER TABLE `org_unit_closure` DISABLE KEYS */;
INSERT INTO `org_unit_closure` VALUES (1,1,0),(1,4,1),(1,5,2),(1,6,3),(4,4,0),(4,5,1),(4,6,2),(5,5,0),(5,6,1),(6,6,0),(8,8,0),(9,9,0),(10,10,0);
/*!40000 ALTER TABLE `org_unit_closure` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organization_unit`
--

DROP TABLE IF EXISTS `organization_unit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organization_unit` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('company','branch','department','sub_department') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` bigint DEFAULT NULL,
  `level` int NOT NULL DEFAULT '0',
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `sort_order` int NOT NULL DEFAULT '0',
  `leader_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `ix_org_unit_code` (`code`),
  KEY `leader_id` (`leader_id`),
  KEY `ix_org_unit_parent_id` (`parent_id`),
  CONSTRAINT `organization_unit_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `organization_unit` (`id`),
  CONSTRAINT `organization_unit_ibfk_2` FOREIGN KEY (`leader_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organization_unit`
--

LOCK TABLES `organization_unit` WRITE;
/*!40000 ALTER TABLE `organization_unit` DISABLE KEYS */;
INSERT INTO `organization_unit` VALUES (1,'修改后的组织名称','matrix','company',NULL,1,'inactive',0,NULL,'2026-04-23 01:59:21','2026-04-23 10:11:52'),(4,'北京分公司','bj-001','branch',1,2,'active',0,NULL,'2026-04-23 08:45:12','2026-04-23 09:34:58'),(5,'技术部','tech-001','department',4,3,'active',0,NULL,'2026-04-23 08:45:41','2026-04-23 08:45:41'),(6,'技术一组','tech-group-001','sub_department',5,4,'active',0,NULL,'2026-04-23 08:46:03','2026-04-23 08:46:03'),(8,'测试部门','TEST_DEPT_1776939058','department',NULL,1,'active',0,NULL,'2026-04-23 10:10:59','2026-04-23 10:10:59'),(9,'测试重复编码部门','DEPT_001','department',NULL,1,'active',0,NULL,'2026-04-23 10:11:06','2026-04-23 10:11:06'),(10,'测试部门','TEST_DEPT_1776941655','department',NULL,1,'active',0,NULL,'2026-04-23 10:54:17','2026-04-23 10:54:17');
/*!40000 ALTER TABLE `organization_unit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_employee_mapping`
--

DROP TABLE IF EXISTS `user_employee_mapping`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_employee_mapping` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `employee_id` bigint NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `employee_id` (`employee_id`),
  CONSTRAINT `user_employee_mapping_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_employee_mapping_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employee` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_employee_mapping`
--

LOCK TABLES `user_employee_mapping` WRITE;
/*!40000 ALTER TABLE `user_employee_mapping` DISABLE KEYS */;
INSERT INTO `user_employee_mapping` VALUES (1,12,1,'2026-04-23 09:30:21');
/*!40000 ALTER TABLE `user_employee_mapping` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hashed_password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT (now()),
  `updated_at` datetime NOT NULL DEFAULT (now()),
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_admin` tinyint(1) NOT NULL DEFAULT '0',
  `password_reset_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_reset_expires_at` datetime DEFAULT NULL,
  `password_history` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `failed_login_attempts` int NOT NULL DEFAULT '0',
  `locked_until` datetime DEFAULT NULL,
  `sms_code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sms_code_expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `ix_users_username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `ix_users_email` (`email`),
  UNIQUE KEY `ix_users_phone` (`phone`),
  KEY `ix_users_id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (12,'13800138002','13800138002@example.com','$2b$12$s1yQnTsfesH10QDoWF1i/.Kob4AxhsqyJvNCmzT6tyewZJBpwBjba',1,'2026-04-23 02:33:53','2026-04-23 02:33:53','13800138002',1,NULL,NULL,NULL,0,NULL,NULL,NULL),(13,'test_updated','updated@test.com','$2b$12$UShKxMpaua2BGmJSLcWfdOjR6.zQ72c9J.ABNDI975fO1Z6b/FkPy',1,'2026-04-23 10:09:45','2026-04-23 10:44:00','13800138982',0,NULL,NULL,NULL,0,NULL,NULL,NULL),(15,'testuser_1776941580','testuser_1776941580@example.com','$2b$12$V1nfzN9h8xGKkrf285cz9uxVL/5ZzoDRkTIHgbZPwVFSlHSqIQ7ky',1,'2026-04-23 10:53:02','2026-04-23 10:53:02','13800131580',0,NULL,NULL,NULL,0,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-23 19:01:05
