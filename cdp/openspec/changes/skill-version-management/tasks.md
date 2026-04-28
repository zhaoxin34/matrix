## 1. Database Migration

- [x] 1.1 Create Alembic migration to add `version` column to `skill` table
- [x] 1.2 Create `skill_version` table with FK to `skill`
- [x] 1.3 Add unique constraint on (skill_id, version)

## 2. Backend API - Model & Repository

- [x] 2.1 Add `version` field to `Skill` model
- [x] 2.2 Create `SkillVersion` model
- [x] 2.3 Create `SkillVersionRepository` with CRUD operations
- [x] 2.4 Add `get_versions(skill_id)` method to repository
- [x] 2.5 Add `create_version()` method to repository
- [x] 2.6 Add version uniqueness check in repository

## 3. Backend API - Service Layer

- [x] 3.1 Update `SkillService.create_skill()` to set initial version=null
- [x] 3.2 Remove auto-activate logic in `update_skill()`
- [x] 3.3 Add `publish_skill(code, version, comment)` method
- [x] 3.4 Add `get_skill_versions(code)` method
- [x] 3.5 Add `rollback_skill(code, version)` method

## 4. Backend API - Endpoints

- [x] 4.1 Add `POST /skills/{code}/publish` endpoint
- [x] 4.2 Add `GET /skills/{code}/versions` endpoint
- [x] 4.3 Add `POST /skills/{code}/rollback` endpoint

## 5. Backend API - Schema

- [x] 5.1 Create `SkillVersionResponse` schema
- [x] 5.2 Create `PublishRequest` schema (version, comment)
- [x] 5.3 Create `RollbackRequest` schema (version)

## 6. Frontend API Client

- [x] 6.1 Add `publish(code, version, comment)` to skillApi
- [x] 6.2 Add `getVersions(code)` to skillApi
- [x] 6.3 Add `rollback(code, version)` to skillApi

## 7. Frontend UI - List Page

- [x] 7.1 Add "发布" button (visible when status=draft or can re-publish)
- [x] 7.2 Add "历史" button
- [x] 7.3 Remove auto-activate after content save

## 8. Frontend UI - Publish Dialog

- [x] 8.1 Create PublishDialog component
- [x] 8.2 Version number input (required)
- [x] 8.3 Comment textarea (required)
- [x] 8.4 Validation: version required, comment required
- [x] 8.5 API call to publish endpoint

## 9. Frontend UI - History Dialog

- [x] 9.1 Create HistoryDialog component
- [x] 9.2 Version list display (version, comment, date)
- [x] 9.3 View version content on click
- [x] 9.4 Rollback button per version

## 10. Frontend UI - Rollback Dialog

- [x] 10.1 Create RollbackConfirmDialog component
- [x] 10.2 Show selected version info
- [x] 10.3 Confirmation before rollback
- [x] 10.4 API call to rollback endpoint

## 11. Data Migration

- [x] 11.1 Migrate existing active skills: create initial version "1.0.0"
