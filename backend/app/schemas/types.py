"""Shared Pydantic field types.

Permissive email pattern instead of EmailStr — email-validator rejects
reserved TLDs like `.local` used for local seed accounts (same as sarafi-platform).
"""

from typing import Annotated

from pydantic import StringConstraints

EmailAddress = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        to_lower=True,
        max_length=255,
        pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$",
    ),
]
