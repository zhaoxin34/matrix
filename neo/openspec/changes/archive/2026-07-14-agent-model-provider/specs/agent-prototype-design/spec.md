# Agent Prototype Model Configuration - Specification

> Delta specification for change: agent-model-provider

## ADDED Requirements

### Requirement: AgentPrototype provider and model reference

The system SHALL support referencing a ModelProvider and ModelConfig when creating or updating an AgentPrototype.

#### Scenario: Create prototype with provider and model

- **WHEN** admin creates prototype with provider_id and model_id
- **THEN** system stores the reference and validates that both provider and model exist and are enabled

#### Scenario: Prototype with model validation

- **WHEN** admin creates prototype with non-existent provider_id
- **THEN** system returns 400 Bad Request with error "Provider not found"

#### Scenario: Prototype with disabled model

- **WHEN** admin creates prototype with disabled model
- **THEN** system returns 400 Bad Request with error "Model is disabled"

### Requirement: AgentPrototype model configuration

The system SHALL support additional model configuration through model_config JSON field.

#### Scenario: Create prototype with model_config

- **WHEN** admin creates prototype with model_config containing temperature and thinking
- **THEN** system stores the configuration and includes it in prototype response

#### Scenario: Model config fields

The system SHALL support the following model_config fields:

- `temperature`: Model temperature (0.0 - 2.0)
- `max_tokens`: Maximum output tokens
- `thinking`: Thinking level (off, low, medium, high)
- `timeout`: Request timeout in seconds

#### Scenario: Default model_config

- **WHEN** admin creates prototype without model_config
- **THEN** system uses default values from the referenced model

### Requirement: Backward compatibility with legacy model field

The system SHALL maintain backward compatibility with the legacy model string field.

#### Scenario: Create prototype with legacy model field only

- **WHEN** admin creates prototype with only model="gpt-4"
- **THEN** system accepts the request and stores the model field

#### Scenario: Response includes both legacy and new fields

- **WHEN** user retrieves a prototype
- **THEN** response includes model field and (if set) provider_id, model_id, model_config

### Requirement: AgentPrototype validation with ModelProvider

The system SHALL validate model availability when creating/updating prototypes.

#### Scenario: Validate provider exists

- **WHEN** admin creates prototype with provider_id
- **THEN** system verifies the provider exists in agent_model_provider table

#### Scenario: Validate model exists under provider

- **WHEN** admin creates prototype with provider_id and model_id
- **THEN** system verifies the model exists in agent_model_config table under that provider

#### Scenario: Validate model is enabled

- **WHEN** admin creates prototype with provider_id and model_id
- **THEN** system verifies the model.enabled = true

### Requirement: AgentPrototype response includes model details

The system SHALL include model details in prototype responses.

#### Scenario: Get prototype includes model info

- **WHEN** user requests GET /api/v1/agent_prototype/{id}
- **THEN** response includes provider_id, model_id, model_config, and resolved model display_name

#### Scenario: List prototypes includes model info

- **WHEN** user requests GET /api/v1/agent_prototype
- **THEN** each item includes provider_id, model_id, and model display_name

### Requirement: Agent creation inherits prototype model configuration

The system SHALL ensure that when creating an Agent from a Prototype, the model configuration is properly inherited.

#### Scenario: Agent inherits model reference

- **WHEN** user creates agent from prototype with provider_id and model_id
- **THEN** agent stores the same provider_id and model_id reference

#### Scenario: Agent inherits model_config with override

- **WHEN** user creates agent from prototype with model_config override
- **THEN** agent uses the overridden config values
