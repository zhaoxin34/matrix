"""
创建测试用户脚本
运行方式: uv run python scripts/create_test_user.py
"""

import sys

sys.path.insert(0, "src")

from app.database import SessionLocal
from app.models.organization_unit import OrganizationUnit, OrgUnitStatus, OrgUnitType
from app.models.user import User
from app.models.workspace import Workspace
from app.services.auth_service import hash_password


def create_test_user():
    """创建测试用户 13800138002"""
    db = SessionLocal()

    try:
        # 检查用户是否已存在
        existing = db.query(User).filter(User.phone == "13800138002").first()
        if existing:
            print(f"User already exists: id={existing.id}, phone={existing.phone}")
            user = existing
        else:
            # 创建用户
            hashed = hash_password("abcd1234")
            user = User(
                phone="13800138002",
                hashed_password=hashed,
                username="测试用户",
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"User created: id={user.id}, phone={user.phone}")

        # 检查组织是否已存在
        existing_org = db.query(OrganizationUnit).filter(OrganizationUnit.code == "test-org").first()
        if existing_org:
            print(f"Organization already exists: id={existing_org.id}")
            org = existing_org
        else:
            # 创建组织
            org = OrganizationUnit(
                name="测试组织",
                code="test-org",
                type=OrgUnitType.COMPANY,
                status=OrgUnitStatus.ACTIVE,
            )
            db.add(org)
            db.commit()
            db.refresh(org)
            print(f"Organization created: id={org.id}")

        # 检查工作区是否已存在
        existing_ws = db.query(Workspace).filter(Workspace.code == "default").first()
        if existing_ws:
            print(f"Workspace already exists: id={existing_ws.id}, code={existing_ws.code}")
        else:
            # 创建工作区
            workspace = Workspace(
                name="默认工作区",
                code="default",
                description="测试用工作区",
                org_id=org.id,
                owner_id=user.id,
            )
            db.add(workspace)
            db.commit()
            db.refresh(workspace)
            print(f"Workspace created: id={workspace.id}, code={workspace.code}")

        print("\n=== Test User Summary ===")
        print(f"User ID: {user.id}")
        print(f"Phone: {user.phone}")
        print(f"Username: {user.username}")
        print("Workspace Code: default")
        print("\nFor Chrome Extension, use:")
        print("  Token: 1234567890")

        return user

    finally:
        db.close()


if __name__ == "__main__":
    create_test_user()
