# Pydantic schemas for requests/responses
from datetime import datetime
from uuid import UUID
import uuid
from pydantic import BaseModel, Field
from fastapi_users import schemas

class UserRead(schemas.BaseUser[uuid.UUID]):
    pass

class UserCreate(schemas.BaseUserCreate):
    pass

class UserUpdate(schemas.BaseUserUpdate):
    pass

class Message(BaseModel):
    role: str = Field(..., description="Role of the message author (e.g., 'user', 'assistant', 'system')")
    content: str = Field(..., description="Text content of the message")


class ChatRequest(BaseModel):
    messages: list[Message]
    document_id: UUID | None = Field(None, description="Optional UUID of specific document to query against")


class DocumentResponse(BaseModel):
    id: UUID
    user_id: UUID
    filename: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True



