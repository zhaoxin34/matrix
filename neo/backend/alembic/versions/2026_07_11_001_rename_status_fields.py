"""Rename status fields: entity_name -> entity_type + entity_id, captured_at -> stat_at, remove embedded_site_id.

Revision ID: 2026_07_11_001
Revises: 2026_07_10_001
Create Date: 2026-07-11

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "2026_07_11_001"
down_revision = "2026_07_10_001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Rename status fields."""
    # Check if index exists and drop using raw SQL with procedure
    op.execute("""
        DROP PROCEDURE IF EXISTS drop_index_if_exists;
    """)
    op.execute("""
        CREATE PROCEDURE drop_index_if_exists(IN idx_name VARCHAR(255), IN tbl_name VARCHAR(255))
        BEGIN
            IF EXISTS (
                SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = tbl_name 
                AND INDEX_NAME = idx_name
            ) THEN
                SET @sql = CONCAT('DROP INDEX ', idx_name, ' ON ', tbl_name);
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            END IF;
        END
    """)

    # Drop old unique constraint (if exists)
    op.execute("""
        DROP PROCEDURE IF EXISTS drop_constraint_if_exists;
    """)
    op.execute("""
        CREATE PROCEDURE drop_constraint_if_exists(IN cst_name VARCHAR(255), IN tbl_name VARCHAR(255))
        BEGIN
            IF EXISTS (
                SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = tbl_name 
                AND CONSTRAINT_NAME = cst_name
            ) THEN
                SET @sql = CONCAT('ALTER TABLE ', tbl_name, ' DROP INDEX ', cst_name);
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            END IF;
        END
    """)

    op.execute("CALL drop_constraint_if_exists('uk_st_entity_captured', 'statuses')")

    # Drop old foreign key (try both possible names)
    op.execute("""
        DROP PROCEDURE IF EXISTS drop_fk_if_exists;
    """)
    op.execute("""
        CREATE PROCEDURE drop_fk_if_exists(IN fk_name VARCHAR(255), IN tbl_name VARCHAR(255))
        BEGIN
            IF EXISTS (
                SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = tbl_name 
                AND CONSTRAINT_NAME = fk_name
                AND CONSTRAINT_TYPE = 'FOREIGN KEY'
            ) THEN
                SET @sql = CONCAT('ALTER TABLE ', tbl_name, ' DROP FOREIGN KEY ', fk_name);
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            END IF;
        END
    """)

    op.execute("CALL drop_fk_if_exists('fk_statuses_embedded_site', 'statuses')")
    op.execute("CALL drop_fk_if_exists('statuses_embedded_site_id_fkey', 'statuses')")

    # Drop old indexes (if exists)
    op.execute("CALL drop_index_if_exists('idx_st_entity_name', 'statuses')")
    op.execute("CALL drop_index_if_exists('idx_st_captured_at', 'statuses')")
    op.execute("CALL drop_index_if_exists('idx_st_embedded_site', 'statuses')")

    # Add new columns
    op.add_column("statuses", sa.Column("entity_type", sa.String(128), nullable=True))
    op.add_column("statuses", sa.Column("entity_id", sa.String(255), nullable=True))
    op.add_column("statuses", sa.Column("stat_at", sa.DateTime(), nullable=True))

    # Copy data from entity_name to entity_type and entity_id
    op.execute("""
        UPDATE statuses 
        SET entity_type = SUBSTRING_INDEX(entity_name, '_', 1),
            entity_id = SUBSTRING(entity_name, LOCATE('_', entity_name) + 1)
        WHERE entity_name IS NOT NULL
    """)

    # Copy data from captured_at to stat_at
    op.execute("""
        UPDATE statuses 
        SET stat_at = captured_at
        WHERE captured_at IS NOT NULL
    """)

    # Make new columns not null with explicit type
    op.alter_column("statuses", "entity_type", nullable=False, type_=sa.String(128))
    op.alter_column("statuses", "entity_id", nullable=False, type_=sa.String(255))
    op.alter_column("statuses", "stat_at", nullable=False, type_=sa.DateTime())

    # Drop old columns
    op.drop_column("statuses", "entity_name")
    op.drop_column("statuses", "captured_at")
    op.drop_column("statuses", "embedded_site_id")

    # Create new indexes
    op.create_index("idx_st_entity_type", "statuses", ["entity_type"])
    op.create_index("idx_st_entity_id", "statuses", ["entity_id"])
    op.create_index("idx_st_stat_at", "statuses", ["stat_at"])

    # Create new unique constraint
    op.create_unique_constraint("uk_st_entity_stat_at", "statuses", ["entity_type", "entity_id", "stat_at"])

    # Clean up procedures
    op.execute("DROP PROCEDURE IF EXISTS drop_index_if_exists")
    op.execute("DROP PROCEDURE IF EXISTS drop_constraint_if_exists")
    op.execute("DROP PROCEDURE IF EXISTS drop_fk_if_exists")


def downgrade() -> None:
    """Revert status field renaming."""
    # Drop new unique constraint
    op.drop_constraint("uk_st_entity_stat_at", "statuses", type_="unique")

    # Drop new indexes
    op.drop_index("idx_st_entity_type", table_name="statuses")
    op.drop_index("idx_st_entity_id", table_name="statuses")
    op.drop_index("idx_st_stat_at", table_name="statuses")

    # Add old columns back
    op.add_column("statuses", sa.Column("entity_name", sa.String(255), nullable=True))
    op.add_column("statuses", sa.Column("captured_at", sa.DateTime(), nullable=True))
    op.add_column("statuses", sa.Column("embedded_site_id", sa.Integer(), nullable=True))

    # Copy data back
    op.execute("""
        UPDATE statuses 
        SET entity_name = CONCAT(entity_type, '_', entity_id)
        WHERE entity_type IS NOT NULL AND entity_id IS NOT NULL
    """)

    op.execute("""
        UPDATE statuses 
        SET captured_at = stat_at
        WHERE stat_at IS NOT NULL
    """)

    # Make old columns not null with explicit type
    op.alter_column("statuses", "entity_name", nullable=False, type_=sa.String(255))
    op.alter_column("statuses", "captured_at", nullable=False, type_=sa.DateTime())

    # Drop new columns
    op.drop_column("statuses", "entity_type")
    op.drop_column("statuses", "entity_id")
    op.drop_column("statuses", "stat_at")

    # Recreate foreign key for embedded_site_id
    op.create_foreign_key(
        "fk_statuses_embedded_site", "statuses", "embedded_sites", ["embedded_site_id"], ["id"], ondelete="SET NULL"
    )

    # Recreate old indexes
    op.create_index("idx_st_entity_name", "statuses", ["entity_name"])
    op.create_index("idx_st_captured_at", "statuses", ["captured_at"])
    op.create_index("idx_st_embedded_site", "statuses", ["embedded_site_id"])

    # Recreate old unique constraint
    op.create_unique_constraint("uk_st_entity_captured", "statuses", ["entity_name", "captured_at"])
