"""Skill Schemas"""

import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.models.skill import SkillLevel

CODE_PATTERN = re.compile(r"^[a-zA-Z0-9-]{4,64}$")


class SkillCreate(BaseModel):
    code: str = Field(..., min_length=4, max_length=64, description="技能代码")
    name: str = Field(..., min_length=1, max_length=200, description="技能名称")
    level: SkillLevel = Field(..., description="技能级别")
    tags: Optional[list[str]] = Field(None, description="技能标签")
    author: Optional[str] = Field(None, max_length=50, description="作者")
    content: str = Field(..., min_length=1, description="技能内容")

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        if not CODE_PATTERN.match(v):
            raise ValueError("code must match pattern ^[a-zA-Z0-9-]{4,64}$")
        return v


class SkillUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    level: Optional[SkillLevel] = None
    tags: Optional[list[str]] = None
    author: Optional[str] = Field(None, max_length=50)
    content: Optional[str] = Field(None, min_length=1)


class SkillResponse(BaseModel):
    id: int
    code: str
    name: str
    level: SkillLevel
    tags: Optional[list[str]] = None
    author: Optional[str] = None
    content: str
    is_active: bool
    deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SkillListResponse(BaseModel):
    items: list[SkillResponse]
    total: int
    page: int
    page_size: int
