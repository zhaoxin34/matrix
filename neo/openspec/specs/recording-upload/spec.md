# recording-upload Specification

## Purpose
后端 recording 上传 / 下载 API 规格。提供两个消费方:
1. 手动上传 (Neo Frontend): 用户在 Web UI 上传 rrweb JSON 文件
2. 代理上传 (agent-steer 扩展): Chrome 扩展 CS 通过 fetch + Bearer token 调后端 API

> **变更记录**: 2026-06 agent-steer-upload-backend-integration change 接入 agent-steer 扩展,使用 PUT bytes proxy + POST segments 路径。详细场景见 `rrweb-recording/spec.md` 中 "User-triggered Upload to Backend"。

## Requirements

### Requirement: Create recording
The system SHALL provide an API to create a new recording. The API SHALL return a unique UID for the recording.

#### Scenario: Create recording for agent recording
- **WHEN** user requests POST /api/v1/workspaces/{workspace_code}/recordings with enterUrl
- **THEN** system creates recording with status="recording" and returns uid

#### Scenario: Create recording for manual upload
- **WHEN** user requests POST /api/v1/workspaces/{workspace_code}/recordings with source="upload"
- **THEN** system creates recording with source="upload" and status="recording"

### Requirement: Upload segment
The system SHALL provide an API to create a segment associated with a recording. Each segment SHALL be assigned a sequence number automatically.

#### Scenario: Create segment for recording
- **WHEN** user requests POST /api/v1/workspaces/{workspace_code}/recordings/{uid}/segments with startTime, endTime, pageUrls, storageKey, size
- **THEN** system creates segment with next sequence number and returns segment uid

#### Scenario: Segment sequence auto-increment
- **WHEN** user creates multiple segments for same recording
- **THEN** each segment receives sequential sequence numbers starting from 1

### Requirement: Get presigned upload URL
The system SHALL provide an API to generate a presigned URL for uploading segment files to S3.

#### Scenario: Request upload URL
- **WHEN** user requests POST /api/v1/workspaces/{workspace_code}/recordings/{uid}/segments/presigned with filename and contentType
- **THEN** system returns presigned upload URL and storage key valid for 1 hour

### Requirement: Get presigned download URL
The system SHALL provide an API to generate a presigned URL for downloading segment files from S3.

#### Scenario: Request download URL
- **WHEN** user requests GET /api/v1/workspaces/{workspace_code}/recordings/{uid}/segments/{segmentUid}/download-url
- **THEN** system returns presigned download URL valid for 1 hour

### Requirement: List segments
The system SHALL provide an API to list all segments of a recording.

#### Scenario: Get segments for recording
- **WHEN** user requests GET /api/v1/workspaces/{workspace_code}/recordings/{uid}/segments
- **THEN** system returns all segments sorted by sequence number

### Requirement: S3 storage path
The system SHALL store segment files in S3 with path pattern: recordings/{workspace_id}/{recording_id}/{segment_uid}.rrweb.json

#### Scenario: Generate storage path
- **WHEN** segment is created
- **THEN** storageKey is set to recordings/{workspace_id}/{recording_id}/{segment_uid}.rrweb.json

### Requirement: Two upload modes
The system SHALL support two upload modes: agent recording (real-time upload from Chrome extension) and manual upload (user uploads files through web interface).

#### Scenario: Agent recording mode
- **WHEN** recording is created with source="agent"
- **THEN** segments are uploaded every 10 minutes during recording session

#### Scenario: Manual upload mode
- **WHEN** recording is created with source="upload"
- **THEN** user can upload segment files manually through web interface

### Requirement: Backend CORS allows all origins
The system SHALL allow CORS requests from any origin to recording API endpoints, since the agent-steer extension runs in arbitrary browser tabs and the API is authenticated via Bearer token (not cookies).

#### Scenario: Preflight request from any origin
- **WHEN** any browser tab (any origin) makes an OPTIONS preflight to a recording API endpoint
- **THEN** system SHALL respond with `Access-Control-Allow-Origin: *`
- **AND** `Access-Control-Allow-Methods` SHALL include GET, POST, PUT, DELETE
- **AND** `Access-Control-Allow-Headers` SHALL include Authorization, Content-Type
- **AND** `Access-Control-Allow-Credentials` SHALL be `false` (required when origin is `*`)

#### Scenario: Actual request from agent-steer extension
- **WHEN** agent-steer Content Script in a tab on origin X calls `fetch('http://localhost:8000/api/v1/...')`
- **THEN** the request SHALL be allowed by CORS (origin X is in `*`)
- **AND** the request SHALL succeed if Bearer token is valid
- **AND** the request SHALL fail with 401 if Bearer token is missing or invalid
