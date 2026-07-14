# Model Provider Management - Specification

## ADDED Requirements

### Requirement: ModelProvider CRUD operations

The system SHALL provide CRUD operations for ModelProvider entities, including create, read, update, delete, enable, and disable operations.

#### Scenario: Create a new provider

- **WHEN** admin sends POST request to `/api/v1/model-providers` with valid provider data
- **THEN** system creates a new provider with status enabled and returns the created provider

#### Scenario: List providers with pagination

- **WHEN** user sends GET request to `/api/v1/model-providers` with pagination parameters
- **THEN** system returns paginated list of providers with total count

#### Scenario: Filter providers by enabled status

- **WHEN** user sends GET request to `/api/v1/model-providers?enabled=true`
- **THEN** system returns only enabled providers

#### Scenario: Update provider

- **WHEN** admin sends PUT request to `/api/v1/model-providers/{id}` with updated data
- **THEN** system updates the provider and returns the updated entity

#### Scenario: Delete provider

- **WHEN** admin sends DELETE request to `/api/v1/model-providers/{id}`
- **THEN** system soft-deletes the provider (sets enabled=false)

#### Scenario: Enable provider

- **WHEN** admin sends PATCH request to `/api/v1/model-providers/{id}/enable`
- **THEN** system sets provider status to enabled

#### Scenario: Disable provider

- **WHEN** admin sends PATCH request to `/api/v1/model-providers/{id}/disable`
- **THEN** system sets provider status to disabled

### Requirement: Provider unique code constraint

The system SHALL enforce unique constraint on provider code field.

#### Scenario: Create provider with duplicate code

- **WHEN** admin tries to create a provider with existing code
- **THEN** system returns 409 Conflict error

### Requirement: API Key environment variable reference

The system SHALL support environment variable reference for API Key configuration.

#### Scenario: Provider with env variable reference

- **WHEN** admin creates provider with `api_key_env: "OPENAI_API_KEY"`
- **THEN** system stores the env variable name without resolving its value

#### Scenario: Validate env variable format

- **WHEN** admin creates provider with invalid env variable name
- **THEN** system returns 400 Bad Request with validation error

### Requirement: ModelConfig CRUD operations

The system SHALL provide CRUD operations for ModelConfig entities under a provider.

#### Scenario: Add model to provider

- **WHEN** admin sends POST request to `/api/v1/model-providers/{id}/models` with model data
- **THEN** system creates a new model config under the provider

#### Scenario: List models under provider

- **WHEN** user sends GET request to `/api/v1/model-providers/{id}/models`
- **THEN** system returns list of all models under the provider

#### Scenario: Update model configuration

- **WHEN** admin sends PUT request to `/api/v1/model-providers/{id}/models/{model_id}`
- **THEN** system updates the model configuration

#### Scenario: Delete model configuration

- **WHEN** admin sends DELETE request to `/api/v1/model-providers/{id}/models/{model_id}`
- **THEN** system removes the model configuration

### Requirement: Provider and model relationship

The system SHALL enforce referential integrity between Provider and ModelConfig.

#### Scenario: Delete provider cascades to models

- **WHEN** admin deletes a provider
- **THEN** system also deletes all associated model configurations

#### Scenario: Prevent duplicate model_id under same provider

- **WHEN** admin tries to add model with existing model_id under same provider
- **THEN** system returns 409 Conflict error

### Requirement: Model configuration fields

The system SHALL store the following model configuration fields:

- `model_id`: The model identifier (e.g., "gpt-4", "claude-3-5-sonnet")
- `display_name`: Human-readable name
- `context_window`: Maximum context size in tokens
- `max_tokens`: Maximum output tokens
- `supports_thinking`: Whether the model supports thinking/reasoning
- `thinking_level_map`: Mapping of thinking levels (JSON)
- `input_types`: Supported input types (text, image)

#### Scenario: Create model with all fields

- **WHEN** admin creates model with all configuration fields
- **THEN** system stores all fields correctly

#### Scenario: Create model with minimal fields

- **WHEN** admin creates model with only required fields (model_id)
- **THEN** system uses default values for optional fields

### Requirement: Provider API types

The system SHALL support the following API types:

- `openai-completions`: OpenAI Chat Completions API
- `anthropic-messages`: Anthropic Messages API
- `google-generative-ai`: Google Generative AI API
- `openai-responses`: OpenAI Responses API

#### Scenario: Create provider with openai-completions type

- **WHEN** admin creates provider with api_type="openai-completions"
- **THEN** system accepts the request and stores the api_type

#### Scenario: Create provider with unsupported api type

- **WHEN** admin creates provider with api_type="unsupported-type"
- **THEN** system returns 400 Bad Request with validation error

### Requirement: List available providers for agent creation

The system SHALL provide an endpoint to list providers suitable for agent creation.

#### Scenario: Get available providers for agents

- **WHEN** user sends GET request to `/api/v1/model-providers?for_agent=true`
- **THEN** system returns only enabled providers with at least one enabled model
