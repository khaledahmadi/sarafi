import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.transfer import TransferCreate, TransferOut
from app.services import transfers as transfers_service

router = APIRouter(prefix="/transfers", tags=["transfers"])


@router.get("/me", response_model=list[TransferOut])
def my_transfers(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> list[TransferOut]:
    rows = transfers_service.list_my_transfers(db, current_user)
    return [TransferOut.model_validate(r) for r in rows]


@router.post("")
def create_transfer(
    payload: TransferCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> dict:
    return transfers_service.create_transfer(db, current_user, payload)


@router.post("/{transfer_id}/cancel")
def cancel_transfer(
    transfer_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> dict:
    return transfers_service.cancel_transfer(db, current_user, transfer_id)
