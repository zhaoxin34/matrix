"""Unit tests for embedded site service."""

from sqlalchemy.orm import Session

from app.models.embedded_site import EmbeddedSiteStatus
from app.repositories.embedded_site_repository import EmbeddedSiteRepository
from app.schemas.embedded_site import EmbeddedSiteCreate, EmbeddedSiteUpdate


class TestEmbeddedSiteRepository:
    """Tests for EmbeddedSiteRepository."""

    def test_create_embedded_site(self, db_session: Session, test_workspace):
        """Test creating a new embedded site."""
        repo = EmbeddedSiteRepository(db_session)
        data = EmbeddedSiteCreate(
            site_name="测试网站",
            site_url="https://example.com",
            description="这是一个测试网站",
        )

        site = repo.create(
            workspace_id=test_workspace.id,
            user_id=test_workspace.owner_id,
            data=data,
        )

        assert site.id is not None
        assert site.site_name == "测试网站"
        assert site.site_url == "https://example.com"
        assert site.description == "这是一个测试网站"
        assert site.workspace_id == test_workspace.id
        assert site.status == EmbeddedSiteStatus.DISABLED
        assert site.created_by == test_workspace.owner_id

    def test_get_by_id(self, db_session: Session, test_workspace):
        """Test getting embedded site by ID."""
        repo = EmbeddedSiteRepository(db_session)
        data = EmbeddedSiteCreate(
            site_name="测试网站",
            site_url="https://example.com",
        )
        created = repo.create(
            workspace_id=test_workspace.id,
            user_id=test_workspace.owner_id,
            data=data,
        )

        site = repo.get_by_id(created.id)
        assert site is not None
        assert site.id == created.id
        assert site.site_name == "测试网站"

    def test_get_by_id_not_found(self, db_session: Session):
        """Test getting non-existent embedded site."""
        repo = EmbeddedSiteRepository(db_session)
        site = repo.get_by_id(99999)
        assert site is None

    def test_list_by_workspace(self, db_session: Session, test_workspace):
        """Test listing embedded sites for a workspace."""
        repo = EmbeddedSiteRepository(db_session)

        # Create multiple sites
        for i in range(5):
            data = EmbeddedSiteCreate(
                site_name=f"网站{i}",
                site_url=f"https://site{i}.com",
            )
            repo.create(
                workspace_id=test_workspace.id,
                user_id=test_workspace.owner_id,
                data=data,
            )

        sites, total = repo.list_by_workspace(test_workspace.id)
        assert len(sites) == 5
        assert total == 5

    def test_list_by_workspace_pagination(self, db_session: Session, test_workspace):
        """Test pagination in listing embedded sites."""
        repo = EmbeddedSiteRepository(db_session)

        # Create 10 sites
        for i in range(10):
            data = EmbeddedSiteCreate(
                site_name=f"网站{i}",
                site_url=f"https://site{i}.com",
            )
            repo.create(
                workspace_id=test_workspace.id,
                user_id=test_workspace.owner_id,
                data=data,
            )

        # Get first page with 3 items
        sites, total = repo.list_by_workspace(test_workspace.id, page=1, page_size=3)
        assert len(sites) == 3
        assert total == 10

        # Get second page
        sites, total = repo.list_by_workspace(test_workspace.id, page=2, page_size=3)
        assert len(sites) == 3
        assert total == 10

    def test_list_by_workspace_filter_status(self, db_session: Session, test_workspace):
        """Test filtering embedded sites by status."""
        repo = EmbeddedSiteRepository(db_session)

        # Create sites with different statuses
        for i, status in enumerate([EmbeddedSiteStatus.ENABLED, EmbeddedSiteStatus.DISABLED] * 3):
            data = EmbeddedSiteCreate(
                site_name=f"网站{i}",
                site_url=f"https://site{i}.com",
            )
            site = repo.create(
                workspace_id=test_workspace.id,
                user_id=test_workspace.owner_id,
                data=data,
            )
            if status == EmbeddedSiteStatus.ENABLED:
                repo.enable(site)

        # Filter only enabled
        sites, total = repo.list_by_workspace(test_workspace.id, status="enabled")
        assert all(s.status == EmbeddedSiteStatus.ENABLED for s in sites)
        assert total == 3

    def test_list_by_workspace_search(self, db_session: Session, test_workspace):
        """Test searching embedded sites by name or URL."""
        repo = EmbeddedSiteRepository(db_session)

        data_list = [
            EmbeddedSiteCreate(site_name="CRM系统", site_url="https://crm.com"),
            EmbeddedSiteCreate(site_name="ERP系统", site_url="https://erp.com"),
            EmbeddedSiteCreate(site_name="官方网站", site_url="https://main.com"),
        ]
        for data in data_list:
            repo.create(
                workspace_id=test_workspace.id,
                user_id=test_workspace.owner_id,
                data=data,
            )

        # Search for "CRM"
        sites, total = repo.list_by_workspace(test_workspace.id, search="CRM")
        assert len(sites) == 1
        assert sites[0].site_name == "CRM系统"

    def test_update_embedded_site(self, db_session: Session, test_workspace):
        """Test updating an embedded site."""
        repo = EmbeddedSiteRepository(db_session)
        data = EmbeddedSiteCreate(
            site_name="原名称",
            site_url="https://old.com",
        )
        site = repo.create(
            workspace_id=test_workspace.id,
            user_id=test_workspace.owner_id,
            data=data,
        )

        update_data = EmbeddedSiteUpdate(
            site_name="新名称",
            site_url="https://new.com",
        )
        updated = repo.update(site, update_data)

        assert updated.site_name == "新名称"
        assert updated.site_url == "https://new.com"

    def test_soft_delete(self, db_session: Session, test_workspace):
        """Test soft deleting an embedded site."""
        repo = EmbeddedSiteRepository(db_session)
        data = EmbeddedSiteCreate(
            site_name="测试网站",
            site_url="https://example.com",
        )
        site = repo.create(
            workspace_id=test_workspace.id,
            user_id=test_workspace.owner_id,
            data=data,
        )

        repo.soft_delete(site)

        # Site should not be found without include_deleted
        assert repo.get_by_id(site.id) is None

        # Site should be found with include_deleted
        assert repo.get_by_id(site.id, include_deleted=True) is not None

    def test_enable_site(self, db_session: Session, test_workspace):
        """Test enabling an embedded site."""
        repo = EmbeddedSiteRepository(db_session)
        data = EmbeddedSiteCreate(
            site_name="测试网站",
            site_url="https://example.com",
        )
        site = repo.create(
            workspace_id=test_workspace.id,
            user_id=test_workspace.owner_id,
            data=data,
        )

        assert site.status == EmbeddedSiteStatus.DISABLED

        enabled = repo.enable(site)
        assert enabled.status == EmbeddedSiteStatus.ENABLED

    def test_disable_site(self, db_session: Session, test_workspace):
        """Test disabling an embedded site."""
        repo = EmbeddedSiteRepository(db_session)
        data = EmbeddedSiteCreate(
            site_name="测试网站",
            site_url="https://example.com",
        )
        site = repo.create(
            workspace_id=test_workspace.id,
            user_id=test_workspace.owner_id,
            data=data,
        )
        repo.enable(site)

        disabled = repo.disable(site)
        assert disabled.status == EmbeddedSiteStatus.DISABLED

    def test_idempotent_enable(self, db_session: Session, test_workspace):
        """Test that enabling an already enabled site is idempotent."""
        repo = EmbeddedSiteRepository(db_session)
        data = EmbeddedSiteCreate(
            site_name="测试网站",
            site_url="https://example.com",
        )
        site = repo.create(
            workspace_id=test_workspace.id,
            user_id=test_workspace.owner_id,
            data=data,
        )
        repo.enable(site)

        # Enable again should not raise error
        enabled = repo.enable(site)
        assert enabled.status == EmbeddedSiteStatus.ENABLED

    def test_idempotent_disable(self, db_session: Session, test_workspace):
        """Test that disabling an already disabled site is idempotent."""
        repo = EmbeddedSiteRepository(db_session)
        data = EmbeddedSiteCreate(
            site_name="测试网站",
            site_url="https://example.com",
        )
        site = repo.create(
            workspace_id=test_workspace.id,
            user_id=test_workspace.owner_id,
            data=data,
        )

        # Disable again should not raise error
        disabled = repo.disable(site)
        assert disabled.status == EmbeddedSiteStatus.DISABLED

    def test_duplicate_name_check(self, db_session: Session, test_workspace):
        """Test checking for duplicate site name in workspace."""
        repo = EmbeddedSiteRepository(db_session)
        data = EmbeddedSiteCreate(
            site_name="重复名称",
            site_url="https://example.com",
        )
        repo.create(
            workspace_id=test_workspace.id,
            user_id=test_workspace.owner_id,
            data=data,
        )

        # Check for existing name
        existing = repo.get_by_workspace_and_name(test_workspace.id, "重复名称")
        assert existing is not None

        # Check for non-existing name
        non_existing = repo.get_by_workspace_and_name(test_workspace.id, "不存在的名称")
        assert non_existing is None

    def test_duplicate_name_exclude_id(self, db_session: Session, test_workspace):
        """Test duplicate name check excludes current site ID during update."""
        repo = EmbeddedSiteRepository(db_session)
        data = EmbeddedSiteCreate(
            site_name="我的网站",
            site_url="https://example.com",
        )
        site = repo.create(
            workspace_id=test_workspace.id,
            user_id=test_workspace.owner_id,
            data=data,
        )

        # Should return None when excluding the same site
        result = repo.get_by_workspace_and_name(test_workspace.id, "我的网站", exclude_id=site.id)
        assert result is None
