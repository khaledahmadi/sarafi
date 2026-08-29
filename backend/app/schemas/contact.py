from pydantic import BaseModel, Field


class ContactValidateRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=6, max_length=24, pattern=r"^[\d+\-\s()]+$")
    message: str = Field(min_length=10, max_length=1000)
