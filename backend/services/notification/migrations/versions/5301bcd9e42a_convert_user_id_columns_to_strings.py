"""convert user id columns to strings

Revision ID: 5301bcd9e42a
Revises: 1fb76f69ae3e
Create Date: 2026-06-02 20:44:24.173654

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "5301bcd9e42a"
down_revision: Union[str, Sequence[str], None] = "1fb76f69ae3e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "notifications",
        "target_user_id",
        existing_type=sa.Integer(),
        type_=sa.String(),
        existing_nullable=True,
        postgresql_using="target_user_id::varchar",
    )
    op.alter_column(
        "notifications",
        "sender_id",
        existing_type=sa.Integer(),
        type_=sa.String(),
        existing_nullable=True,
        postgresql_using="sender_id::varchar",
    )


def downgrade() -> None:
    op.alter_column(
        "notifications",
        "target_user_id",
        existing_type=sa.String(),
        type_=sa.Integer(),
        existing_nullable=True,
        postgresql_using="target_user_id::integer",
    )
    op.alter_column(
        "notifications",
        "sender_id",
        existing_type=sa.String(),
        type_=sa.Integer(),
        existing_nullable=True,
        postgresql_using="sender_id::integer",
    )
