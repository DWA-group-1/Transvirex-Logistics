"""split full_name into first/last name

Revision ID: 6adc4914240b
Revises: b0d328fa938e
Create Date: 2026-06-02 08:35:45.230036

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "6adc4914240b"
down_revision: Union[str, Sequence[str], None] = "b0d328fa938e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add new columns as nullable first
    op.add_column("drivers", sa.Column("first_name", sa.String(), nullable=True))
    op.add_column("drivers", sa.Column("last_name", sa.String(), nullable=True))

    # 2. Backfill from full_name (split on first space)
    op.execute("""
        UPDATE drivers
        SET first_name = split_part(full_name, ' ', 1),
            last_name = CASE
                WHEN position(' ' in full_name) > 0
                THEN substring(full_name from position(' ' in full_name) + 1)
                ELSE ''
            END
    """)

    # 3. Now make them NOT NULL
    op.alter_column("drivers", "first_name", nullable=False)
    op.alter_column("drivers", "last_name", nullable=False)

    # 4. Index on last_name
    op.create_index(op.f("ix_drivers_last_name"), "drivers", ["last_name"])

    # 5. Drop the old column
    op.drop_column("drivers", "full_name")


def downgrade() -> None:
    op.add_column("drivers", sa.Column("full_name", sa.String(), nullable=True))
    op.execute("UPDATE drivers SET full_name = first_name || ' ' || last_name")
    op.alter_column("drivers", "full_name", nullable=False)
    op.drop_index(op.f("ix_drivers_last_name"), table_name="drivers")
    op.drop_column("drivers", "last_name")
    op.drop_column("drivers", "first_name")
