from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas import UserCreate, UserResponse
from app.models import Bill

from app.database import get_db
from app.models import User

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

db_dependency = Annotated[Session, Depends(get_db)]

@router.post("/", response_model=UserResponse, summary="Create a new user")
def create_user(user: UserCreate, db: db_dependency):
    new_user = User(**user.model_dump())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/{user_id}", summary="Get user by ID")
def get_user(user_id: int, db: db_dependency):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/", summary="Get all users")
def get_users(db: db_dependency):
    users = db.query(User).all()
    return users

@router.delete("/{user_id}", summary="Delete user by ID")
def delete_user(user_id: int, db: db_dependency):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"detail": "User deleted successfully"}

@router.get("/{user_id}/bills")
def get_user_bills(user_id: int, db: db_dependency):
    return db.query(Bill).filter(Bill.created_by == user_id).all()
