# Agent Model Provider - Implementation Tasks

## 1. Database Migration

- [x] 1.1 Create Alembic migration for `agent_model_provider` table
- [x] 1.2 Create Alembic migration for `agent_model_config` table
- [x] 1.3 Add columns to `agent_prototype` table: `provider_id`, `model_id`, `model_config`
- [x] 1.4 Add foreign key constraints between tables
- [x] 1.5 Run migration and verify tables created

## 2. Backend Models

- [x] 2.1 Create `ModelProvider` SQLAlchemy model in `app/models/model_provider.py`
- [x] 2.2 Create `ModelConfig` SQLAlchemy model in `app/models/model_config.py`
- [x] 2.3 Update `AgentPrototype` model with new fields
- [x] 2.4 Define enum for API types (openai-completions, anthropic-messages, etc.)

## 3. Backend Schemas

- [x] 3.1 Create Pydantic schemas for ModelProvider CRUD
- [x] 3.2 Create Pydantic schemas for ModelConfig CRUD
- [x] 3.3 Update AgentPrototype schemas with provider_id, model_id, model_config
- [x] 3.4 Add validation for api_type field
- [x] 3.5 Add validation for env variable format

## 4. Backend Repositories

- [x] 4.1 Create `ModelProviderRepository` with CRUD operations
- [x] 4.2 Create `ModelConfigRepository` with CRUD operations
- [x] 4.3 Add query methods for filtering by enabled status
- [x] 4.4 Add method to get models by provider_id

## 5. Backend Services

- [x] 5.1 Create `ModelProviderService` with business logic
- [x] 5.2 Create `ModelConfigService` with business logic
- [x] 5.3 Implement validation: provider must exist and be enabled
- [x] 5.4 Implement validation: model must exist and be enabled
- [x] 5.5 Implement validation: model must belong to provider
- [x] 5.6 Update `AgentPrototypeService` to handle new fields

## 6. Backend API Endpoints

- [x] 6.1 Create API router for ModelProvider: `app/api/v1/model_provider.py`
- [x] 6.2 Implement GET `/api/v1/model-providers` (list)
- [x] 6.3 Implement POST `/api/v1/model-providers` (create)
- [x] 6.4 Implement GET `/api/v1/model-providers/{id}` (get)
- [x] 6.5 Implement PUT `/api/v1/model-providers/{id}` (update)
- [x] 6.6 Implement DELETE `/api/v1/model-providers/{id}` (delete)
- [x] 6.7 Implement PATCH `/api/v1/model-providers/{id}/enable`
- [x] 6.8 Implement PATCH `/api/v1/model-providers/{id}/disable`
- [x] 6.9 Create API router for ModelConfig
- [x] 6.10 Implement model CRUD under provider
- [x] 6.11 Register routers in `app/main.py`
- [x] 6.12 Update AgentPrototype API to include new fields

## 7. Initial Data

- [x] 7.1 Create seed data script for default OpenAI provider
- [x] 7.2 Create seed data for default Anthropic provider
- [x] 7.3 Add common models (gpt-4o, claude-3-5-sonnet, etc.)
- [x] 7.4 Run seed script and verify data

## 8. Testing

- [ ] 8.1 Write unit tests for ModelProviderService
- [ ] 8.2 Write unit tests for ModelConfigService
- [ ] 8.3 Write unit tests for validation logic
- [ ] 8.4 Write integration tests for ModelProvider API
- [ ] 8.5 Write integration tests for ModelConfig API
- [ ] 8.6 Update AgentPrototype tests for new fields
- [x] 8.7 Manual API verification (curl test passed)

## 9. Documentation

- [ ] 9.1 Update API documentation with new endpoints
- [ ] 9.2 Add examples for provider and model creation
- [ ] 9.3 Document environment variable configuration
- [ ] 9.4 Update README if applicable
