from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.api.middleware.credit_check import CreditDeduction, require_credits
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
    db: Session = Depends(get_db),
    deduction: CreditDeduction = Depends(require_credits(2, "rewrite_inline")),
) -> InlineRewriteResponse:
    generator = ScriptGenerator()
    result = await generator.rewrite_inline(
        text=payload.text,
        instruction=payload.instruction,
        context=payload.context,
    )
    deduction.commit(db, description="Inline text rewrite")
    return InlineRewriteResponse(text=result)
