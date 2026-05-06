# Agent Prototype Management Tasks

## 1. Database Setup

- [x] 1.1 Create Alembic migration for `agent_prototypes` table (BIGINT id, prompts JSON, status, etc.)
- [x] 1.2 Create Alembic migration for `agent_prototype_versions` table (BIGINT id, prompts_snapshot, config_snapshot)
- [x] 1.3 Run migration and verify tables created
- [x] 1.4 Add agent_prototype models to `backend/src/app/models/__init__.py`

## 2. SQLAlchemy Models

- [x] 2.1 Create `AgentPrototype` model in `models/agent_prototype.py`
- [x] 2.2 Create `AgentPrototypeVersion` model in `models/agent_prototype.py`

## 3. Pydantic Schemas

- [x] 3.1 Create `AgentPromptType` enum with descriptions in `schemas/agent_prototype.py`
- [x] 3.2 Create `PromptsField` for prompts JSON validation
- [x] 3.3 Create request schemas: `CreateAgentPrototype`, `UpdateAgentPrototype`
- [x] 3.4 Create response schemas: `AgentPrototypeResponse`, `AgentPrototypeListResponse`
- [x] 3.5 Create version schemas: `PublishRequest`, `RollbackRequest`, `VersionResponse`

## 4. Repository Layer

- [x] 4.1 Create `AgentPrototypeRepository` in `repositories/agent_prototype_repo.py`
- [x] 4.2 Create `AgentPrototypeVersionRepository` in same file

## 5. Service Layer

- [x] 5.1 Create `AgentPrototypeService` in `services/agent_prototype_service.py`
- [x] 5.2 Implement publish logic (create snapshot, increment version, set status to enabled)
- [x] 5.3 Implement rollback logic (restore from snapshot, create new version record)

## 6. API Routes

- [x] 6.1 Create `agent_prototypes.py` in `api/v1/`

## 7. Route Registration

- [x] 7.1 Add agent_prototypes router to `main.py`
- [x] 7.2 Verify no import errors
- [x] 7.3 Test backend starts successfully

## 8. Testing

- [x] 8.1 Write unit tests for service layer
- [x] 8.2 Verify all tests pass
