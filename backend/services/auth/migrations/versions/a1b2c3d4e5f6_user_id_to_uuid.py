"""user id to uuid

Revision ID: a1b2c3d4e5f6
Revises: f84f90ef5ceb
Create Date: 2026-05-27 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "f84f90ef5ceb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add new UUID column (nullable for now)
    op.add_column("users", sa.Column("uuid_id", UUID(as_uuid=True), nullable=True))

    # 2. Populate it with generated UUIDs for existing rows
    op.execute("UPDATE users SET uuid_id = gen_random_uuid()")

    # 3. Make it non-nullable
    op.alter_column("users", "uuid_id", nullable=False)

    # 4. Drop old primary key constraint
    op.drop_constraint("users_pkey", "users", type_="primary")

    # 5. Drop the old integer id column
    op.drop_column("users", "id")

    # 6. Rename uuid_id → id
    op.alter_column("users", "uuid_id", new_column_name="id")

    # 7. Set new primary key
    op.create_primary_key("users_pkey", "users", ["id"])


def downgrade() -> None:
    # 1. Add back integer id column
    op.add_column("users", sa.Column("int_id", sa.Integer(), nullable=True))

    # 2. Assign sequential integers
    op.execute("UPDATE users SET int_id = nextval('users_id_seq'::regclass)")

    # 3. Make non-nullable
    op.alter_column("users", "int_id", nullable=False)

    # 4. Drop UUID primary key
    op.drop_constraint("users_pkey", "users", type_="primary")

    # 5. Drop UUID id column
    op.drop_column("users", "id")

    # 6. Rename back
    op.alter_column("users", "int_id", new_column_name="id")

    # 7. Restore primary key
    op.create_primary_key("users_pkey", "users", ["id"])
