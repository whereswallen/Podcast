from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.services.llm.script_generator import ScriptGenerator

router = APIRouter(prefix="/api/ai", tags=["ai"])


class InlineRewriteRequest(BaseModel):
    text: str
    instruction: str  # "rewrite", "expand", "condense", "change_tone:casual", etc.
    context: str | None = None  # surrounding text for context


class InlineRewriteResponse(BaseModel):
    text: str


@router.post("/rewrite-inline", response_model=InlineRewriteResponse)
async def rewrite_inline(
    payload: InlineRewriteRequest,
    current_user: User = Depends(get_current_user),
) -> InlineRewriteResponse:
    generator = ScriptGenerator()
    result = await generator.rewrite_inline(
        text=payload.text,
        instruction=payload.instruction,
        context=payload.context,
    )
    return InlineRewriteResponse(text=result)
