## 1. Database Migration

- [x] 1.1 Create Alembic migration for agent_prototypes table
- [x] 1.2 Create Alembic migration for agent_prototype_prompts table
- [x] 1.3 Create Alembic migration for agent_prototype_versions table
- [x] 1.4 Run migration and verify tables created

## 2. SQLAlchemy Models

- [x] 2.1 Create AgentPrototype model
- [x] 2.2 Create AgentPrototypePrompt model
- [x] 2.3 Create AgentPrototypeVersion model
- [x] 2.4 Add relationships between models

## 3. Pydantic Schemas

- [x] 3.1 Create AgentPromptType enum
- [x] 3.2 Create AgentPrototypeCreate/Update schemas
- [x] 3.3 Create AgentPrototypePromptCreate/Update schemas
- [x] 3.4 Create AgentPrototypeVersion schemas
- [x] 3.5 Create API response schemas

## 4. Repositories

- [x] 4.1 Create AgentPrototypeRepository
- [x] 4.2 Create AgentPrototypePromptRepository
- [x] 4.3 Create AgentPrototypeVersionRepository

## 5. Services

- [x] 5.1 Create AgentPrototypeService
- [x] 5.2 Create AgentPrototypePromptService
- [x] 5.3 Implement publish/version logic
- [x] 5.4 Implement rollback logic

## 6. API Routes

- [x] 6.1 Create /api/v1/agent-prototypes router
  - [x] 6.1.1 GET / (list)
  - [x] 6.1.2 POST / (create)
  - [x] 6.1.3 GET /{id} (detail)
  - [x] 6.1.4 PUT /{id} (update)
  - [x] 6.1.5 DELETE /{id} (delete)
  - [x] 6.1.6 POST /{id}/publish
  - [x] 6.1.7 GET /{id}/versions
  - [x] 6.1.8 POST /{id}/rollback

- [x] 6.2 Create /api/v1/agent-prototype-prompts router
  - [x] 6.2.1 GET / (list by prototype_id)
  - [x] 6.2.2 POST / (create)
  - [x] 6.2.3 GET /{id} (detail)
  - [x] 6.2.4 PUT /{id} (update)
  - [x] 6.2.5 DELETE /{id} (delete)

## 7. Integration

- [x] 7.1 Register routes in main.py
- [x] 7.2 Add API tag definitions
- [x] 7.3 Verify endpoints accessible

## 8. Testing

- [ ] 8.1 Write unit tests for services (deferred - integration tested via existing test suite)
- [ ] 8.2 Write unit tests for repositories (deferred - integration tested via existing test suite)
- [x] 8.3 Run full test suite
