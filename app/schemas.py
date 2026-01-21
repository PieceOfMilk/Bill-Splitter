from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict
from datetime import datetime

# -------- USERS --------

class UserCreate(BaseModel):
    name: str = Field(min_length=1)

class UserResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


# -------- BILLS --------

class BillCreate(BaseModel):
    description: str = None
    total_amount: float = Field(gt=0)
    tax: float = Field(ge=0, default=0)
    tip: float = Field(ge=0, default=0)
    tip_split_evenly: bool = True
    created_by: int

class BillUpdate(BaseModel):
    description: Optional[str] = None
    total_amount: Optional[float] = Field(gt=0, default=None)
    tax: Optional[float] = Field(ge=0, default=None)
    tip: Optional[float] = Field(ge=0, default=None)
    tip_split_evenly: Optional[bool] = None

class BillResponse(BaseModel):
    id: int
    description: Optional[str]
    total_amount: float
    tax: float
    tip: float
    tip_split_evenly: bool
    created_at: datetime
    creator: UserResponse

    class Config:
        from_attributes = True


# -------- BILL SHARES --------

class BillShareCreate(BaseModel):
    shares: Dict[int, float]

    @field_validator("shares")
    @classmethod
    def validate_shares(cls, shares: Dict[int, float]):
        # if not shares:
        #     raise ValueError("At least one user must be included")

        for user_id, amount in shares.items():
            if amount < 0:
                raise ValueError(f"User {user_id} has a negative share")

        return shares

class BillShareResponse(BaseModel):
    owner: UserResponse
    base_amount: float
    tax_amount: float
    tip_amount: float
    total_owed: float

    class Config:
        from_attributes = True

