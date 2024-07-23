-- MySQL dump 10.13  Distrib 8.0.30, for macos12.4 (x86_64)
--
-- Host: localhost    Database: test
-- ------------------------------------------------------
-- Server version	8.0.30

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
  `version_num` varchar(32) NOT NULL,
  PRIMARY KEY (`version_num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alembic_version`
--

LOCK TABLES `alembic_version` WRITE;
/*!40000 ALTER TABLE `alembic_version` DISABLE KEYS */;
INSERT INTO `alembic_version` VALUES ('5e139331e376');
/*!40000 ALTER TABLE `alembic_version` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asset_keys`
--

DROP TABLE IF EXISTS `asset_keys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asset_keys` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asset_key` varchar(512) DEFAULT NULL,
  `last_materialization` text,
  `last_run_id` varchar(255) DEFAULT NULL,
  `asset_details` text,
  `wipe_timestamp` timestamp(6) NULL DEFAULT NULL,
  `last_materialization_timestamp` timestamp(6) NULL DEFAULT NULL,
  `tags` text,
  `create_timestamp` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `asset_key` (`asset_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asset_keys`
--

LOCK TABLES `asset_keys` WRITE;
/*!40000 ALTER TABLE `asset_keys` DISABLE KEYS */;
/*!40000 ALTER TABLE `asset_keys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bulk_actions`
--

DROP TABLE IF EXISTS `bulk_actions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bulk_actions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `key` varchar(32) NOT NULL,
  `status` varchar(255) NOT NULL,
  `timestamp` timestamp(6) NOT NULL,
  `body` text,
  `action_type` varchar(32) DEFAULT NULL,
  `selector_id` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`),
  KEY `idx_bulk_actions` (`key`),
  KEY `idx_bulk_actions_selector_id` (`selector_id`(64)),
  KEY `idx_bulk_actions_status` (`status`(32)),
  KEY `idx_bulk_actions_action_type` (`action_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bulk_actions`
--

LOCK TABLES `bulk_actions` WRITE;
/*!40000 ALTER TABLE `bulk_actions` DISABLE KEYS */;
/*!40000 ALTER TABLE `bulk_actions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `daemon_heartbeats`
--

DROP TABLE IF EXISTS `daemon_heartbeats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daemon_heartbeats` (
  `daemon_type` varchar(255) NOT NULL,
  `daemon_id` varchar(255) DEFAULT NULL,
  `timestamp` timestamp(6) NOT NULL,
  `body` text,
  UNIQUE KEY `daemon_type` (`daemon_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daemon_heartbeats`
--

LOCK TABLES `daemon_heartbeats` WRITE;
/*!40000 ALTER TABLE `daemon_heartbeats` DISABLE KEYS */;
/*!40000 ALTER TABLE `daemon_heartbeats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_logs`
--

DROP TABLE IF EXISTS `event_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `event_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `run_id` varchar(255) DEFAULT NULL,
  `event` text NOT NULL,
  `dagster_event_type` text,
  `timestamp` timestamp(6) NULL DEFAULT NULL,
  `step_key` text,
  `asset_key` text,
  `partition` text,
  PRIMARY KEY (`id`),
  KEY `idx_run_id` (`run_id`),
  KEY `idx_step_key` (`step_key`(32)),
  KEY `idx_asset_partition` (`asset_key`(64),`partition`(64)),
  KEY `idx_event_type` (`dagster_event_type`(64),`id`),
  KEY `idx_asset_key` (`asset_key`(32))
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_logs`
--

LOCK TABLES `event_logs` WRITE;
/*!40000 ALTER TABLE `event_logs` DISABLE KEYS */;
INSERT INTO `event_logs` VALUES (1,'9de2a48b-74a9-4fb4-ad14-70d6db695fab','{\"__class__\": \"EventLogEntry\", \"dagster_event\": {\"__class__\": \"DagsterEvent\", \"event_specific_data\": null, \"event_type_value\": \"PIPELINE_STARTING\", \"logging_tags\": {}, \"message\": null, \"pid\": null, \"pipeline_name\": \"succeeds_job\", \"solid_handle\": null, \"step_handle\": null, \"step_key\": null, \"step_kind_value\": null}, \"error_info\": null, \"level\": 20, \"message\": \"\", \"pipeline_name\": \"succeeds_job\", \"run_id\": \"9de2a48b-74a9-4fb4-ad14-70d6db695fab\", \"step_key\": null, \"timestamp\": 1665620459.2220001, \"user_message\": \"\"}','PIPELINE_STARTING','2022-10-13 07:20:59.222000',NULL,NULL,NULL),(2,'9de2a48b-74a9-4fb4-ad14-70d6db695fab','{\"__class__\": \"EventLogEntry\", \"dagster_event\": {\"__class__\": \"DagsterEvent\", \"event_specific_data\": {\"__class__\": \"EngineEventData\", \"error\": null, \"marker_end\": null, \"marker_start\": null, \"metadata_entries\": [{\"__class__\": \"EventMetadataEntry\", \"description\": null, \"entry_data\": {\"__class__\": \"TextMetadataEntryData\", \"text\": \"66435\"}, \"label\": \"pid\"}]}, \"event_type_value\": \"ENGINE_EVENT\", \"logging_tags\": {}, \"message\": \"Started process for run (pid: 66435).\", \"pid\": null, \"pipeline_name\": \"succeeds_job\", \"solid_handle\": null, \"step_handle\": null, \"step_key\": null, \"step_kind_value\": null}, \"error_info\": null, \"level\": 20, \"message\": \"\", \"pipeline_name\": \"succeeds_job\", \"run_id\": \"9de2a48b-74a9-4fb4-ad14-70d6db695fab\", \"step_key\": null, \"timestamp\": 1665620460.9561012, \"user_message\": \"\"}','ENGINE_EVENT','2022-10-13 07:21:00.956101',NULL,NULL,NULL),(3,'9de2a48b-74a9-4fb4-ad14-70d6db695fab','{\"__class__\": \"EventLogEntry\", \"dagster_event\": {\"__class__\": \"DagsterEvent\", \"event_specific_data\": null, \"event_type_value\": \"PIPELINE_START\", \"logging_tags\": {}, \"message\": \"Started execution of run for \\\"succeeds_job\\\".\", \"pid\": 66435, \"pipeline_name\": \"succeeds_job\", \"solid_handle\": null, \"step_handle\": null, \"step_key\": null, \"step_kind_value\": null}, \"error_info\": null, \"level\": 10, \"message\": \"\", \"pipeline_name\": \"succeeds_job\", \"run_id\": \"9de2a48b-74a9-4fb4-ad14-70d6db695fab\", \"step_key\": null, \"timestamp\": 1665620463.470655, \"user_message\": \"Started execution of run for \\\"succeeds_job\\\".\"}','PIPELINE_START','2022-10-13 07:21:03.470655',NULL,NULL,NULL),(4,'9de2a48b-74a9-4fb4-ad14-70d6db695fab','{\"__class__\": \"EventLogEntry\", \"dagster_event\": {\"__class__\": \"DagsterEvent\", \"event_specific_data\": {\"__class__\": \"EngineEventData\", \"error\": null, \"marker_end\": null, \"marker_start\": null, \"metadata_entries\": [{\"__class__\": \"EventMetadataEntry\", \"description\": null, \"entry_data\": {\"__class__\": \"TextMetadataEntryData\", \"text\": \"66435\"}, \"label\": \"pid\"}, {\"__class__\": \"EventMetadataEntry\", \"description\": null, \"entry_data\": {\"__class__\": \"TextMetadataEntryData\", \"text\": \"[\'succeeds\']\"}, \"label\": \"step_keys\"}]}, \"event_type_value\": \"ENGINE_EVENT\", \"logging_tags\": {}, \"message\": \"Executing steps using multiprocess executor: parent process (pid: 66435)\", \"pid\": 66435, \"pipeline_name\": \"succeeds_job\", \"solid_handle\": null, \"step_handle\": null, \"step_key\": null, \"step_kind_value\": null}, \"error_info\": null, \"level\": 10, \"message\": \"\", \"pipeline_name\": \"succeeds_job\", \"run_id\": \"9de2a48b-74a9-4fb4-ad14-70d6db695fab\", \"step_key\": null, \"timestamp\": 1665620463.521247, \"user_message\": \"Executing steps using multiprocess executor: parent process (pid: 66435)\"}','ENGINE_EVENT','2022-10-13 07:21:03.521247',NULL,NULL,NULL),(5,'9de2a48b-74a9-4fb4-ad14-70d6db695fab','{\"__class__\": \"EventLogEntry\", \"dagster_event\": {\"__class__\": \"DagsterEvent\", \"event_specific_data\": {\"__class__\": \"EngineEventData\", \"error\": null, \"marker_end\": null, \"marker_start\": \"step_process_start\", \"metadata_entries\": []}, \"event_type_value\": \"STEP_WORKER_STARTING\", \"logging_tags\": {\"pipeline_name\": \"succeeds_job\", \"pipeline_tags\": \"{\'.dagster/grpc_info\': \'{\\\"host\\\": \\\"localhost\\\", \\\"socket\\\": \\\"/var/folders/lr/mcmhlx2177953tcj5m7v8l3h0000gn/T/tmpqfw3zqh5\\\"}\', \'dagster/solid_selection\': \'*\'}\", \"resource_fn_name\": \"None\", \"resource_name\": \"None\", \"run_id\": \"9de2a48b-74a9-4fb4-ad14-70d6db695fab\", \"solid_name\": \"succeeds\", \"step_key\": \"succeeds\"}, \"message\": \"Launching subprocess for \\\"succeeds\\\".\", \"pid\": 66435, \"pipeline_name\": \"succeeds_job\", \"solid_handle\": {\"__class__\": \"SolidHandle\", \"name\": \"succeeds\", \"parent\": null}, \"step_handle\": {\"__class__\": \"StepHandle\", \"key\": \"succeeds\", \"solid_handle\": {\"__class__\": \"SolidHandle\", \"name\": \"succeeds\", \"parent\": null}}, \"step_key\": \"succeeds\", \"step_kind_value\": \"COMPUTE\"}, \"error_info\": null, \"level\": 10, \"message\": \"\", \"pipeline_name\": \"succeeds_job\", \"run_id\": \"9de2a48b-74a9-4fb4-ad14-70d6db695fab\", \"step_key\": \"succeeds\", \"timestamp\": 1665620463.527574, \"user_message\": \"Launching subprocess for \\\"succeeds\\\".\"}','STEP_WORKER_STARTING','2022-10-13 07:21:03.527574','succeeds',NULL,NULL),(6,'9de2a48b-74a9-4fb4-ad14-70d6db695fab','{\"__class__\": \"EventLogEntry\", \"dagster_event\": {\"__class__\": \"DagsterEvent\", \"event_specific_data\": {\"__class__\": \"EngineEventData\", \"error\": null, \"marker_end\": \"step_process_start\", \"marker_start\": null, \"metadata_entries\": [{\"__class__\": \"EventMetadataEntry\", \"description\": null, \"entry_data\": {\"__class__\": \"TextMetadataEntryData\", \"text\": \"66438\"}, \"label\": \"pid\"}]}, \"event_type_value\": \"STEP_WORKER_STARTED\", \"logging_tags\": {}, \"message\": \"Executing step \\\"succeeds\\\" in subprocess.\", \"pid\": 66438, \"pipeline_name\": \"succeeds_job\", \"solid_handle\": null, \"step_handle\": null, \"step_key\": \"succeeds\", \"step_kind_value\": null}, \"error_info\": null, \"level\": 10, \"message\": \"\", \"pipeline_name\": \"succeeds_job\", \"run_id\": \"9de2a48b-74a9-4fb4-ad14-70d6db695fab\", \"step_key\": \"succeeds\", \"timestamp\": 1665620467.191471, \"user_message\": \"Executing step \\\"succeeds\\\" in subprocess.\"}','STEP_WORKER_STARTED','2022-10-13 07:21:07.191471','succeeds',NULL,NULL),(7,'9de2a48b-74a9-4fb4-ad14-70d6db695fab','{\"__class__\": \"EventLogEntry\", \"dagster_event\": {\"__class__\": \"DagsterEvent\", \"event_specific_data\": {\"__class__\": \"EngineEventData\", \"error\": null, \"marker_end\": null, \"marker_start\": \"resources\", \"metadata_entries\": []}, \"event_type_value\": \"RESOURCE_INIT_STARTED\", \"logging_tags\": {}, \"message\": \"Starting initialization of resources [io_manager].\", \"pid\": 66438, \"pipeline_name\": \"succeeds_job\", \"solid_handle\": null, \"step_handle\": {\"__class__\": \"StepHandle\", \"key\": \"succeeds\", \"solid_handle\": {\"__class__\": \"SolidHandle\", \"name\": \"succeeds\", \"parent\": null}}, \"step_key\": \"succeeds\", \"step_kind_value\": null}, \"error_info\": null, \"level\": 10, \"message\": \"\", \"pipeline_name\": \"succeeds_job\", \"run_id\": \"9de2a48b-74a9-4fb4-ad14-70d6db695fab\", \"step_key\": \"succeeds\", \"timestamp\": 1665620467.2102, \"user_message\": \"Starting initialization of resources [io_manager].\"}','RESOURCE_INIT_STARTED','2022-10-13 07:21:07.210200','succeeds',NULL,NULL),(8,'9de2a48b-74a9-4fb4-ad14-70d6db695fab','{\"__class__\": \"EventLogEntry\", \"dagster_event\": {\"__class__\": \"DagsterEvent\", \"event_specific_data\": {\"__class__\": \"EngineEventData\", \"error\": null, \"marker_end\": \"resources\", \"marker_start\": null, \"metadata_entries\": [{\"__class__\": \"EventMetadataEntry\", \"description\": null, \"entry_data\": {\"__class__\": \"PythonArtifactMetadataEntryData\", \"module\": \"dagster._core.storage.fs_io_manager\", \"name\": \"PickledObjectFilesystemIOManager\"}, \"label\": \"io_manager\"}, {\"__class__\": \"EventMetadataEntry\", \"description\": null, \"entry_data\": {\"__class__\": \"TextMetadataEntryData\", \"text\": \"0.08ms\"}, \"label\": \"io_manager:init_time\"}]}, \"event_type_value\": \"RESOURCE_INIT_SUCCESS\", \"logging_tags\": {}, \"message\": \"Finished initialization of resources [io_manager].\", \"pid\": 66438, \"pipeline_name\": \"succeeds_job\", \"solid_handle\": null, \"step_handle\": {\"__class__\": \"StepHandle\", \"key\": \"succeeds\", \"solid_handle\": {\"__class__\": \"SolidHandle\", \"name\": \"succeeds\", \"parent\": null}}, \"step_key\": \"succeeds\", \"step_kind_value\": null}, \"error_info\": null, \"level\": 10, \"message\": \"\", \"pipeline_name\": \"succeeds_job\", \"run_id\": \"9de2a48b-74a9-4fb4-ad14-70d6db695fab\", \"step_key\": \"succeeds\", \"timestamp\": 1665620467.217094, \"user_message\": \"Finished initialization of resources [io_manager].\"}','RESOURCE_INIT_SUCCESS','2022-10-13 07:21:07.217094','succeeds',NULL,NULL),(9,'9de2a48b-74a9-4fb4-ad14-70d6db695fab','{\"__class__\": \"EventLogEntry\", \"dagster_event\": {\"__class__\": \"DagsterEvent\", \"event_specific_data\": {\"__class__\": \"ComputeLogsCaptureData\", \"log_key\": \"succeeds\", \"step_keys\": [\"succeeds\"]}, \"event_type_value\": \"LOGS_CAPTURED\", \"logging_tags\": {\"pipeline_name\": \"succeeds_job\", \"pipeline_tags\": \"{\'.dagster/grpc_info\': \'{\\\"host\\\": \\\"localhost\\\", \\\"socket\\\": \\\"/var/folders/lr/mcmhlx2177953tcj5m7v8l3h0000gn/T/tmpqfw3zqh5\\\"}\', \'dagster/solid_selection\': \'*\'}\", \"resource_fn_name\": \"None\", \"resource_name\": \"None\", \"run_id\": \"9de2a48b-74a9-4fb4-ad14-70d6db695fab\", \"solid_name\": \"succeeds\", \"step_key\": \"succeeds\"}, \"message\": \"Started capturing logs for step: succeeds.\", \"pid\": 66438, \"pipeline_name\": \"succeeds_job\", \"solid_handle\": {\"__class__\": \"SolidHandle\", \"name\": \"succeeds\", \"parent\": null}, \"step_handle\": {\"__class__\": \"StepHandle\", \"key\": \"succeeds\", \"solid_handle\": {\"__class__\": \"SolidHandle\", \"name\": \"succeeds\", \"parent\": null}}, \"step_key\": \"succeeds\", \"step_kind_value\": \"COMPUTE\"}, \"error_info\": null, \"level\": 10, \"message\": \"\", \"pipeline_name\": \"succeeds_job\", \"run_id\": \"9de2a48b-74a9-4fb4-ad14-70d6db695fab\", \"step_key\": \"succeeds\", \"timestamp\": 1665620467.27223, \"user_message\": \"Started capturing logs for step: succeeds.\"}','LOGS_CAPTURED','2022-10-13 07:21:07.272230','succeeds',NULL,NULL),(10,'9de2a48b-74a9-4fb4-ad14-70d6db695fab','{\"__class__\": \"EventLogEntry\", \"dagster_event\": {\"__class__\": \"DagsterEvent\", \"event_specific_data\": null, \"event_type_value\": \"STEP_START\", \"logging_tags\": {\"pipeline_name\": \"succeeds_job\", \"pipeline_tags\": \"{\'.dagster/grpc_info\': \'{\\\"host\\\": \\\"localhost\\\", \\\"socket\\\": \\\"/var/folders/lr/mcmhlx2177953tcj5m7v8l3h0000gn/T/tmpqfw3zqh5\\\"}\', \'dagster/solid_selection\': \'*\'}\", \"resource_fn_name\": \"None\", \"resource_name\": \"None\", \"run_id\": \"9de2a48b-74a9-4fb4-ad14-70d6db695fab\", \"solid_name\": \"succeeds\", \"step_key\": \"succeeds\"}, \"message\": \"Started execution of step \\\"succeeds\\\".\", \"pid\": 66438, \"pipeline_name\": \"succeeds_job\", \"solid_handle\": {\"__class__\": \"SolidHandle\", \"name\": \"succeeds\", \"parent\": null}, \"step_handle\": {\"__class__\": \"StepHandle\", \"key\": \"succeeds\", \"solid_handle\": {\"__class__\": \"SolidHandle\", \"name\": \"succeeds\", \"parent\": null}}, \"step_key\": \"succeeds\", \"step_kind_value\": \"COMPUTE\"}, \"error_info\": null, \"level\": 10, \"message\": \"\", \"pipeline_name\": \"succeeds_job\", \"run_id\": \"9de2a48b-74a9-4fb4-ad14-70d6db695fab\", \"step_key\": \"succeeds\", \"timestamp\": 1665620467.283252, \"user_message\": \"Started execution of step \\\"succeeds\\\".\"}','STEP_START','2022-10-13 07:21:07.283252','succeeds',NULL,NULL),(11,'9de2a48b-74a9-4fb4-ad14-70d6db695fab','{\"__class__\": \"EventLogEntry\", \"dagster_event\": {\"__class__\": \"DagsterEvent\", \"event_specific_data\": {\"__class__\": \"StepOutputData\", \"metadata_entries\": [], \"step_output_handle\": {\"__class__\": \"StepOutputHandle\", \"mapping_key\": null, \"output_name\": \"result\", \"step_key\": \"succeeds\"}, \"type_check_data\": {\"__class__\": \"TypeCheckData\", \"description\": null, \"label\": \"result\", \"metadata_entries\": [], \"success\": true}, \"version\": null}, \"event_type_value\": \"STEP_OUTPUT\", \"logging_tags\": {\"pipeline_name\": \"succeeds_job\", \"pipeline_tags\": \"{\'.dagster/grpc_info\': \'{\\\"host\\\": \\\"localhost\\\", \\\"socket\\\": \\\"/var/folders/lr/mcmhlx2177953tcj5m7v8l3h0000gn/T/tmpqfw3zqh5\\\"}\', \'dagster/solid_selection\': \'*\'}\", \"resource_fn_name\": \"None\", \"resource_name\": \"None\", \"run_id\": \"9de2a48b-74a9-4fb4-ad14-70d6db695fab\", \"solid_name\": \"succeeds\", \"step_key\": \"succeeds\"}, \"message\": \"Yielded output \\\"result\\\" of type \\\"Any\\\". (Type check passed).\", \"pid\": 66438, \"pipeline_name\": \"succeeds_job\", \"solid_handle\": {\"__class__\": \"SolidHandle\", \"name\": \"succeeds\", \"parent\": null}, \"step_handle\": {\"__class__\": \"StepHandle\", \"key\": \"succeeds\", \"solid_handle\": {\"__class__\": \"SolidHandle\", \"name\": \"succeeds\", \"parent\": null}}, \"step_key\": \"succeeds\", \"step_kind_value\": \"COMPUTE\"}, \"error_info\": null, \"level\": 10, \"message\": \"\", \"pipeline_name\": \"succeeds_job\", \"run_id\": \"9de2a48b-74a9-4fb4-ad14-70d6db695fab\", \"step_key\": \"succeeds\", \"timestamp\": 1665620467.307748, \"user_message\": \"Yielded output \\\"result\\\" of type \\\"Any\\\". (Type check passed).\"}','STEP_OUTPUT','2022-10-13 07:21:07.307748','succeeds',NULL,NULL),(12,'9de2a48b-74a9-4fb4-ad14-70d6db695fab','{\"__class__\": \"EventLogEntry\", \"dagster_event\": {\"__class__\": \"DagsterEvent\", \"event_specific_data\": {\"__class__\": \"HandledOutputData\", \"manager_key\": \"io_manager\", \"metadata_entries\": [{\"__class__\": \"EventMetadataEntry\", \"description\": null, \"entry_data\": {\"__class__\": \"PathMetadataEntryData\", \"path\": \"/Users/claire/dagster_home/storage/9de2a48b-74a9-4fb4-ad14-70d6db695fab/succeeds/result\"}, \"label\": \"path\"}], \"output_name\": \"result\"}, \"event_type_value\": \"HANDLED_OUTPUT\", \"logging_tags\": {\"pipeline_name\": \"succeeds_job\", \"pipeline_tags\": \"{\'.dagster/grpc_info\': \'{\\\"host\\\": \\\"localhost\\\", \\\"socket\\\": \\\"/var/folders/lr/mcmhlx2177953tcj5m7v8l3h0000gn/T/tmpqfw3zqh5\\\"}\', \'dagster/solid_selection\': \'*\'}\", \"resource_fn_name\": \"None\", \"resource_name\": \"None\", \"run_id\": \"9de2a48b-74a9-4fb4-ad14-70d6db695fab\", \"solid_name\": \"succeeds\", \"step_key\": \"succeeds\"}, \"message\": \"Handled output \\\"result\\\" using IO manager \\\"io_manager\\\"\", \"pid\": 66438, \"pipeline_name\": \"succeeds_job\", \"solid_handle\": {\"__class__\": \"SolidHandle\", \"name\": \"succeeds\", \"parent\": null}, \"step_handle\": {\"__class__\": \"StepHandle\", \"key\": \"succeeds\", \"solid_handle\": {\"__class__\": \"SolidHandle\", \"name\": \"succeeds\", \"parent\": null}}, \"step_key\": \"succeeds\", \"step_kind_value\": \"COMPUTE\"}, \"error_info\": null, \"level\": 10, \"message\": \"\", \"pipeline_name\": \"succeeds_job\", \"run_id\": \"9de2a48b-74a9-4fb4-ad14-70d6db695fab\", \"step_key\": \"succeeds\", \"timestamp\": 1665620467.317577, \"user_message\": \"Handled output \\\"result\\\" using IO manager \\\"io_manager\\\"\"}','HANDLED_OUTPUT','2022-10-13 07:21:07.317577','succeeds',NULL,NULL),(13,'9de2a48b-74a9-4fb4-ad14-70d6db695fab','{\"__class__\": \"EventLogEntry\", \"dagster_event\": {\"__class__\": \"DagsterEvent\", \"event_specific_data\": {\"__class__\": \"StepSuccessData\", \"duration_ms\": 17.79951000000013}, \"event_type_value\": \"STEP_SUCCESS\", \"logging_tags\": {\"pipeline_name\": \"succeeds_job\", \"pipeline_tags\": \"{\'.dagster/grpc_info\': \'{\\\"host\\\": \\\"localhost\\\", \\\"socket\\\": \\\"/var/folders/lr/mcmhlx2177953tcj5m7v8l3h0000gn/T/tmpqfw3zqh5\\\"}\', \'dagster/solid_selection\': \'*\'}\", \"resource_fn_name\": \"None\", \"resource_name\": \"None\", \"run_id\": \"9de2a48b-74a9-4fb4-ad14-70d6db695fab\", \"solid_name\": \"succeeds\", \"step_key\": \"succeeds\"}, \"message\": \"Finished execution of step \\\"succeeds\\\" in 17ms.\", \"pid\": 66438, \"pipeline_name\": \"succeeds_job\", \"solid_handle\": {\"__class__\": \"SolidHandle\", \"name\": \"succeeds\", \"parent\": null}, \"step_handle\": {\"__class__\": \"StepHandle\", \"key\": \"succeeds\", \"solid_handle\": {\"__class__\": \"SolidHandle\", \"name\": \"succeeds\", \"parent\": null}}, \"step_key\": \"succeeds\", \"step_kind_value\": \"COMPUTE\"}, \"error_info\": null, \"level\": 10, \"message\": \"\", \"pipeline_name\": \"succeeds_job\", \"run_id\": \"9de2a48b-74a9-4fb4-ad14-70d6db695fab\", \"step_key\": \"succeeds\", \"timestamp\": 1665620467.324287, \"user_message\": \"Finished execution of step \\\"succeeds\\\" in 17ms.\"}','STEP_SUCCESS','2022-10-13 07:21:07.324287','succeeds',NULL,NULL),(14,'9de2a48b-74a9-4fb4-ad14-70d6db695fab','{\"__class__\": \"EventLogEntry\", \"dagster_event\": {\"__class__\": \"DagsterEvent\", \"event_specific_data\": {\"__class__\": \"EngineEventData\", \"error\": null, \"marker_end\": null, \"marker_start\": null, \"metadata_entries\": [{\"__class__\": \"EventMetadataEntry\", \"description\": null, \"entry_data\": {\"__class__\": \"TextMetadataEntryData\", \"text\": \"66435\"}, \"label\": \"pid\"}]}, \"event_type_value\": \"ENGINE_EVENT\", \"logging_tags\": {}, \"message\": \"Multiprocess executor: parent process exiting after 4.2s (pid: 66435)\", \"pid\": 66435, \"pipeline_name\": \"succeeds_job\", \"solid_handle\": null, \"step_handle\": null, \"step_key\": null, \"step_kind_value\": null}, \"error_info\": null, \"level\": 10, \"message\": \"\", \"pipeline_name\": \"succeeds_job\", \"run_id\": \"9de2a48b-74a9-4fb4-ad14-70d6db695fab\", \"step_key\": null, \"timestamp\": 1665620467.726439, \"user_message\": \"Multiprocess executor: parent process exiting after 4.2s (pid: 66435)\"}','ENGINE_EVENT','2022-10-13 07:21:07.726439',NULL,NULL,NULL),(15,'9de2a48b-74a9-4fb4-ad14-70d6db695fab','{\"__class__\": \"EventLogEntry\", \"dagster_event\": {\"__class__\": \"DagsterEvent\", \"event_specific_data\": null, \"event_type_value\": \"PIPELINE_SUCCESS\", \"logging_tags\": {}, \"message\": \"Finished execution of run for \\\"succeeds_job\\\".\", \"pid\": 66435, \"pipeline_name\": \"succeeds_job\", \"solid_handle\": null, \"step_handle\": null, \"step_key\": null, \"step_kind_value\": null}, \"error_info\": null, \"level\": 10, \"message\": \"\", \"pipeline_name\": \"succeeds_job\", \"run_id\": \"9de2a48b-74a9-4fb4-ad14-70d6db695fab\", \"step_key\": null, \"timestamp\": 1665620467.7534678, \"user_message\": \"Finished execution of run for \\\"succeeds_job\\\".\"}','PIPELINE_SUCCESS','2022-10-13 07:21:07.753468',NULL,NULL,NULL),(16,'9de2a48b-74a9-4fb4-ad14-70d6db695fab','{\"__class__\": \"EventLogEntry\", \"dagster_event\": {\"__class__\": \"DagsterEvent\", \"event_specific_data\": {\"__class__\": \"EngineEventData\", \"error\": null, \"marker_end\": null, \"marker_start\": null, \"metadata_entries\": []}, \"event_type_value\": \"ENGINE_EVENT\", \"logging_tags\": {}, \"message\": \"Process for run exited (pid: 66435).\", \"pid\": null, \"pipeline_name\": \"succeeds_job\", \"solid_handle\": null, \"step_handle\": null, \"step_key\": null, \"step_kind_value\": null}, \"error_info\": null, \"level\": 20, \"message\": \"\", \"pipeline_name\": \"succeeds_job\", \"run_id\": \"9de2a48b-74a9-4fb4-ad14-70d6db695fab\", \"step_key\": null, \"timestamp\": 1665620467.7794182, \"user_message\": \"\"}','ENGINE_EVENT','2022-10-13 07:21:07.779418',NULL,NULL,NULL);
/*!40000 ALTER TABLE `event_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `instance_info`
--

DROP TABLE IF EXISTS `instance_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `instance_info` (
  `run_storage_id` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `instance_info`
--

LOCK TABLES `instance_info` WRITE;
/*!40000 ALTER TABLE `instance_info` DISABLE KEYS */;
INSERT INTO `instance_info` VALUES ('80859556-21b8-4876-83e6-830b4a61bc1d');
/*!40000 ALTER TABLE `instance_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `instigators`
--

DROP TABLE IF EXISTS `instigators`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `instigators` (
  `id` int NOT NULL AUTO_INCREMENT,
  `selector_id` varchar(255) DEFAULT NULL,
  `repository_selector_id` varchar(255) DEFAULT NULL,
  `status` varchar(63) DEFAULT NULL,
  `instigator_type` varchar(63) DEFAULT NULL,
  `instigator_body` text,
  `create_timestamp` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `update_timestamp` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `selector_id` (`selector_id`),
  KEY `ix_instigators_instigator_type` (`instigator_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `instigators`
--

LOCK TABLES `instigators` WRITE;
/*!40000 ALTER TABLE `instigators` DISABLE KEYS */;
/*!40000 ALTER TABLE `instigators` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_ticks`
--

DROP TABLE IF EXISTS `job_ticks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_ticks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `job_origin_id` varchar(255) DEFAULT NULL,
  `selector_id` varchar(255) DEFAULT NULL,
  `status` varchar(63) DEFAULT NULL,
  `type` varchar(63) DEFAULT NULL,
  `timestamp` timestamp(6) NULL DEFAULT NULL,
  `tick_body` text,
  `create_timestamp` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `update_timestamp` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `ix_job_ticks_job_origin_id` (`job_origin_id`),
  KEY `idx_job_tick_status` (`job_origin_id`(32),`status`(32)),
  KEY `idx_job_tick_timestamp` (`job_origin_id`,`timestamp`),
  KEY `idx_tick_selector_timestamp` (`selector_id`,`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_ticks`
--

LOCK TABLES `job_ticks` WRITE;
/*!40000 ALTER TABLE `job_ticks` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_ticks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `job_origin_id` varchar(255) DEFAULT NULL,
  `selector_id` varchar(255) DEFAULT NULL,
  `repository_origin_id` varchar(255) DEFAULT NULL,
  `status` varchar(63) DEFAULT NULL,
  `job_type` varchar(63) DEFAULT NULL,
  `job_body` text,
  `create_timestamp` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `update_timestamp` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `job_origin_id` (`job_origin_id`),
  KEY `ix_jobs_job_type` (`job_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kvs`
--

DROP TABLE IF EXISTS `kvs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kvs` (
  `key` text NOT NULL,
  `value` text,
  UNIQUE KEY `idx_kvs_keys_unique` (`key`(64))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kvs`
--

LOCK TABLES `kvs` WRITE;
/*!40000 ALTER TABLE `kvs` DISABLE KEYS */;
/*!40000 ALTER TABLE `kvs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `run_tags`
--

DROP TABLE IF EXISTS `run_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `run_tags` (
  `id` int NOT NULL AUTO_INCREMENT,
  `run_id` varchar(255) DEFAULT NULL,
  `key` text,
  `value` text,
  PRIMARY KEY (`id`),
  KEY `run_id` (`run_id`),
  KEY `idx_run_tags` (`key`(64),`value`(64)),
  CONSTRAINT `run_tags_ibfk_1` FOREIGN KEY (`run_id`) REFERENCES `runs` (`run_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `run_tags`
--

LOCK TABLES `run_tags` WRITE;
/*!40000 ALTER TABLE `run_tags` DISABLE KEYS */;
INSERT INTO `run_tags` VALUES (1,'9de2a48b-74a9-4fb4-ad14-70d6db695fab','.dagster/repository','more_toys_repository@dagster_test.toys.repo'),(2,'9de2a48b-74a9-4fb4-ad14-70d6db695fab','dagster/solid_selection','*'),(3,'9de2a48b-74a9-4fb4-ad14-70d6db695fab','.dagster/grpc_info','{\"host\": \"localhost\", \"socket\": \"/var/folders/lr/mcmhlx2177953tcj5m7v8l3h0000gn/T/tmpqfw3zqh5\"}');
/*!40000 ALTER TABLE `run_tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `runs`
--

DROP TABLE IF EXISTS `runs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `runs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `run_id` varchar(255) DEFAULT NULL,
  `snapshot_id` varchar(255) DEFAULT NULL,
  `pipeline_name` text,
  `mode` text,
  `status` varchar(63) DEFAULT NULL,
  `run_body` text,
  `partition` text,
  `partition_set` text,
  `create_timestamp` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `update_timestamp` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `start_time` double DEFAULT NULL,
  `end_time` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `run_id` (`run_id`),
  KEY `fk_runs_snapshot_id_snapshots_snapshot_id` (`snapshot_id`),
  KEY `idx_run_partitions` (`partition_set`(64),`partition`(64)),
  KEY `idx_run_range` (`status`(32),`update_timestamp`,`create_timestamp`),
  KEY `idx_run_status` (`status`(32)),
  CONSTRAINT `fk_runs_snapshot_id_snapshots_snapshot_id` FOREIGN KEY (`snapshot_id`) REFERENCES `snapshots` (`snapshot_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `runs`
--

LOCK TABLES `runs` WRITE;
/*!40000 ALTER TABLE `runs` DISABLE KEYS */;
INSERT INTO `runs` VALUES (1,'9de2a48b-74a9-4fb4-ad14-70d6db695fab','1deccee186d4c5a6c7e9d4859e07c550c2c2dd72','succeeds_job',NULL,'SUCCESS','{\"__class__\": \"PipelineRun\", \"asset_selection\": null, \"execution_plan_snapshot_id\": \"0bbe5d437908a00de4548c6f4dbe4a00ed54c9e8\", \"external_pipeline_origin\": {\"__class__\": \"ExternalPipelineOrigin\", \"external_repository_origin\": {\"__class__\": \"ExternalRepositoryOrigin\", \"repository_location_origin\": {\"__class__\": \"ManagedGrpcPythonEnvRepositoryLocationOrigin\", \"loadable_target_origin\": {\"__class__\": \"LoadableTargetOrigin\", \"attribute\": null, \"executable_path\": null, \"module_name\": \"dagster_test.toys.repo\", \"package_name\": null, \"python_file\": null, \"working_directory\": null}, \"location_name\": \"dagster_test.toys.repo\"}, \"repository_name\": \"more_toys_repository\"}, \"pipeline_name\": \"succeeds_job\"}, \"has_repository_load_data\": false, \"mode\": \"default\", \"parent_run_id\": null, \"pipeline_code_origin\": {\"__class__\": \"PipelinePythonOrigin\", \"pipeline_name\": \"succeeds_job\", \"repository_origin\": {\"__class__\": \"RepositoryPythonOrigin\", \"code_pointer\": {\"__class__\": \"ModuleCodePointer\", \"fn_name\": \"more_toys_repository\", \"module\": \"dagster_test.toys.repo\", \"working_directory\": \"/Users/claire/dagster\"}, \"container_context\": {}, \"container_image\": null, \"entry_point\": [\"dagster\"], \"executable_path\": \"/Users/claire/.virtualenvs/dagster-dev-3.9/bin/python\"}}, \"pipeline_name\": \"succeeds_job\", \"pipeline_snapshot_id\": \"1deccee186d4c5a6c7e9d4859e07c550c2c2dd72\", \"root_run_id\": null, \"run_config\": {}, \"run_id\": \"9de2a48b-74a9-4fb4-ad14-70d6db695fab\", \"solid_selection\": null, \"solids_to_execute\": null, \"status\": {\"__enum__\": \"PipelineRunStatus.SUCCESS\"}, \"step_keys_to_execute\": null, \"tags\": {\".dagster/grpc_info\": \"{\\\"host\\\": \\\"localhost\\\", \\\"socket\\\": \\\"/var/folders/lr/mcmhlx2177953tcj5m7v8l3h0000gn/T/tmpqfw3zqh5\\\"}\", \"dagster/solid_selection\": \"*\"}}',NULL,NULL,'2022-10-12 17:20:59.217066','2022-10-13 00:21:07.771650',1665620463.515243,1665620467.77165);
/*!40000 ALTER TABLE `runs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `secondary_indexes`
--

DROP TABLE IF EXISTS `secondary_indexes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `secondary_indexes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(512) DEFAULT NULL,
  `create_timestamp` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  `migration_completed` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `secondary_indexes`
--

LOCK TABLES `secondary_indexes` WRITE;
/*!40000 ALTER TABLE `secondary_indexes` DISABLE KEYS */;
INSERT INTO `secondary_indexes` VALUES (1,'run_partitions','2022-10-12 17:20:46.276165','2022-10-12 17:20:46.272602'),(2,'run_repo_label_tags','2022-10-12 17:20:46.312146','2022-10-12 17:20:46.307311'),(3,'bulk_action_types','2022-10-12 17:20:46.327267','2022-10-12 17:20:46.323582'),(4,'run_start_end_overwritten','2022-10-12 17:20:46.374806','2022-10-12 17:20:46.371241'),(5,'asset_key_table','2022-10-12 17:20:46.568788','2022-10-12 17:20:46.564050'),(6,'asset_key_index_columns','2022-10-12 17:20:46.601679','2022-10-12 17:20:46.579971'),(7,'schedule_jobs_selector_id','2022-10-12 17:20:46.829684','2022-10-12 17:20:46.822652'),(8,'schedule_ticks_selector_id','2022-10-12 17:20:46.907758','2022-10-12 17:20:46.904241');
/*!40000 ALTER TABLE `secondary_indexes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `snapshots`
--

DROP TABLE IF EXISTS `snapshots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `snapshots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `snapshot_id` varchar(255) NOT NULL,
  `snapshot_body` blob NOT NULL,
  `snapshot_type` varchar(63) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `snapshot_id` (`snapshot_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `snapshots`
--

LOCK TABLES `snapshots` WRITE;
/*!40000 ALTER TABLE `snapshots` DISABLE KEYS */;
INSERT INTO `snapshots` VALUES (1,'1deccee186d4c5a6c7e9d4859e07c550c2c2dd72',_binary 'x�\�]io\�\��+\�\�C`-�y\�~�m9+đ�A�2\�>�5\\sH.\�C�=\�<\�\�Q\�h8�-��H\��\�Uuu\����0d1)�0��lL~�2��.�Ӵ��dLX��\�:,\�f$,�/?_\�\�\�]\�\�V\�8�2\�\�\�\�O0�8N\�C]γ��ˣ��\�D&H�8�/!�f\�\r�+(�/E1_y��n 	2U��N�lj_<E	oQy�\r�����\��3��iFb��m���R�\n3���\�WW�J~�\�d~t1%9��	\��ﺖ\�\"�.7)\'4\�-�yp�n�\�\�]T�F*���\�	\�\�]\�\�j!���\�V\��>ٲ!V$U\�Qr�p	4\�\�\�Eyc!\�TP#\�*M\�ح�Mm\��.5�y\���\�\����\�庨S\��^����s\r\�\�\�8%�n� 4\�-QX>�\�\�w\�Ǘ\�\�p�U\��\�iDN\�\�\����Dv\�HQ\�\�\��\�4?�\�r\�\�xı�+,\0F�k	��>B\�\�\�\�-\����\�og�\�gۙ�N۷oڇ�ҩUf\�Gn�\�\��L�\�>\�\�Ìy\�>s�+�|\\f?	\�\�\�\�\�峰C۷\�I}^v�`c�}đE�&�x�6��g;\�\�o�OB<��|t\�r��}#�f\�_\�LG9H�c�dM��,\�sl�Z�\��LH5\r,\�iض�?���^\�\��kd\�eCTP\��6��$\�\�\�o&\�\�\�\\���5�@~\�-\����,U�*.\�,Oo\"\n�2�`\�K]zH�\��\"M¢\�UI_o�aVQ^&H\\�\�:_�G���\�a\�1�v�9�1�\\\�CMn[�K\�z&\n�I�\�\�J�O�o�\�k\�ѡ�ɥ�0\'\�N^_�\��c\�Η���$\�6�2DR+\na�\�(ק�\�2�j��4P\\��_uҮ�no{839��*� ql%d�%1\ni\\b0d��\�hr/��$l\�S\�q�\�溦�9ArĀ@b\�1\�_N��m[��ظZs5��/*^Ī<��T��?�\��Mk\�j\��/�d�*o�\�L68ڈ�@�\�x���� \"�-n\�\0c\��\�p`b\�\�+��R1\�%B҂��K\�e�\0.(�����>�\�i\��)f��\��r\n\�*	�\�\�F�Jv��4����0*��\�G�\�\n\�o ����e\�\r�ҵ�\�S\�\�\�F�\��\�972=S \�`���s\�q\�\�@��\�`T\'<\�ب\�\�C�\�#O�vS�N���\�֤\�2�<\�8�\�\����\�ǲĕz0W\�\nl\�0f{r\�j\�1�\�+�ا~ĞՅ\�혚\�j�\�\�\'\��P\�G�\n>�\�j���u�V[7\�aއn>rH�Y7�us\�l�\�\�ʹ\�\�}(\�#����\�Y9\�Q\�v@[;\��|�\�t-Al�\�Ǯ%A�K�0���\�]\�yZ\�\�g\�|4\�\�&�.�Iva	\�\�\�3	O�\�\�X\�Y\�\�Mϥ\�y&�3ٟj\�z�\"�\�U[5��\��YK\��\�:�gS\�\Z*8b4\0\�\r|\�\�\�®�\�OJ/u\�W�ӳ�\�W����\��8������QNs(�i\�5�\�2S\�\r\�C�ȈWN��\��.�V�ݲ\�\�\��i\�����{��t9}��\�\�ex\�\�\�\'ീ�vm\�Qױc�pL�QN	Pl	\��@)&\���^-i�\�i;��\�\\%�\�݂+}\�J�,mK\�TC�L�4}\�4g�ͼ6%4�+˃2��\�\�\�Ⱦ1̤�\��Y\�\�\"\�\�\��5\�WU�/�\�Q\�\\�kf��3�\�iEIir��\� 	7�m7\�\�@� Y�\��}i\�\�\�1߱�\�\�e\�r\\9�\�ܳm��O�&��\�I\���)\'�\\v\�\n�仏\�	\�LN�r�\�otVRV��\�\r\';n\�\Z0E[\��\�c��Lʔ\�\�A}7󫻴��H:H\�i�-\�}BkO�\�\�}\�C\�b\����_ߟ�>�<y\�Ac�\�?A��lbZz�\�\�\�[\�r\�3\��{\n\�T�\�N=�\�`���47��<2^\�;�t\Z\�m�kP[�\��jj�./�-	\�y�؎-�\�ȵ��阦�.�A�\�(�\�\�)\�\�_\'i�~N�CI5�=ؐ\��\�^\�o\�\�\�\��\�rz��m�~n�\�\�|mv�r\�sTN\���y�h��\�\rԴ�\�G\�ᧀh&_���4fw\��\�b\�ҏؕc�\�M\� p�\�	\�!��`a2ӱ�^Q1���dd�\�hF��P*��4|RI���\�Rg��R�^L`\�\�S@�)�\�3�0Sp\�\r$$g\�ܱ1Y\�xtP�gJ\�\�]::i��\�\�G�,��\�\�\�\�hQP?P\�s$\�1@\�\�v\�\rQ��V@��\�E�!=��\��}����|\�\�Ee<7�X$\�ͦ\�W��ejd9\�)\�\�@���\�6d�+\�s��V�Amh\�ϩ��\�R�\�.�\�\�{\"�(Z��^j[m$\�Q\�T\�U�i��\�)5>�\�P\�K�%\�t&mV���\�(Tl�y!�Z�\��\�\�\Z��\�\�\�\�.}T�$�\��iö�߬\��\��\�=���\����$i�\�m\�A�}�c$AkA�\�ȃB��\�L`��x�������3��9��q(d\�	\�\�ѓX\��fjP�YU��\�\�{z�B�X���\�\�\��jHP\�뜺���Ѕ���\�>���H�3\�6�\�QT3*�\�Tt\'��{�\�7gd�&\�\�2\�\�c�r�](��RyԴ9��CY\�I\��b?��\�\�j(˪��UR�\�\�:�5\�\�p�罞c\�[Ŭ=*�ml�8�\�v\0,R�Y\�*B\�Qކ\\*�Jp`L\�2+~~����8\�\�\�4M�\�����2�hN\��˻l����/�?%|)�$\�/\�\�/fRf)\�	�\�\�\�&� �ڧ|\����:�qԍ~o\�w�t\�߁��o�I]�8�ކ9�w�l�\�/\0\\�\�r-v�\�\��T0��c\�M��\�[�	\�4�\�\�\�1\�pn3R\�;\�߽w�P�\�qW�ݨ�<*��\�\�\�}+�N\��(Y\�\�}�+��]�[�\�\�r\��\�\"�ɡ$����\�py\��\�\��6\\w�+\�ݍ�P\�x\�\�]�W8ݏ\�^ny���C\�\\��+��\�\n7���jՇ���[\�\�\�\�!\�\�\�+�텄�\�t�\�C�\���Ʊ�?M6\�~��\�Ξ�uW\�7ÿ�JKg痿t#c�\�\��\�&\�i\�2C.Ǯ�,=�\r�\�\�f<����r,r.�\�+�\�فL�\�+�|��$6�\�R��8��F\�MʈTSR����.\�u2���*ú1]\��,�\\v\'b\�dٚ\�\�T)ga�\�|\�\�\'u�\�\�\���s�M{\��H\�`��\�	\�z\r�NKRu\�!�%���\�͎��ż���Ԅ�\�f&�r\r9\�\�g>\��عqwc�\��oqwi�_�붱l�\��6\�2}\�Օ�\�\�9�QK\"OӲ��$�m\�Y\�]#�0AQ�\�hm�\�,���\�Y�Q)\�\�¨�\���\�\���\�\�\nl��;\���fm#n\�u�Us�:Q_�/\���V��q\�R{�!h�*\\�\���\�P�|��\"�d','PIPELINE'),(2,'0bbe5d437908a00de4548c6f4dbe4a00ed54c9e8',_binary 'x��S�j1���\�Rb\�Io�\n�\�\�\�d\� �q\"��Ti�vc\�\�;�+��&\�\�7\�\�\�<\�\0\�T\�\0ͧ�\�\�7\�B6��S~\�U\���g�JdwJS��)\�Lh��RA.\��\n	�jQd\�\�\�\�CLA#\��D\�zKV9x\�ᗇL���\�\�V���\�\�\�\\\�\�+VC�b��>�g<���&1_�4\�\r%CBJ(\"l#M��\�t\n\�2�la�\�3��4\�\�l��獵\r�d�\�mDg=B�+\�if�F�]]��P�z�\�\�\�jq�\�K�X�빞��\�T��3vx\��\�e�M��H�\�lk\�`g�\�5\�\� \�w_g\����s�\�zSW�����(\�r\�㗻o�\�o\Z�ERF�\�[�$�\������\�\�ʨ{�\"u���\�;)B�0s��ᨁSH\�\�\��W\�.	p���\�56À2�S.\�\�|��,6�f��U�\��k��}\�c\�Kp\���\�ƽ�\�T��œO�0��z\��\�_�5a��!*\�\�\�\�o�f�T�����M?��','EXECUTION_PLAN');
/*!40000 ALTER TABLE `snapshots` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2022-10-12 17:23:43
