from math import isclose
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models import Bill, BillShare, User
from app.schemas import BillCreate, BillResponse, BillShareCreate, BillShareResponse, BillUpdate
from app.database import get_db

router = APIRouter(prefix="/bills", tags=["bills"])
db_dependency = Annotated[Session, Depends(get_db)]


@router.post("/", response_model=BillResponse, summary="Create a new bill")
def create_bill(bill: BillCreate, db: db_dependency):
    try:
        new_bill = Bill(**bill.model_dump())

        created_by = db.query(User).filter(User.id == new_bill.created_by).first()
        if not created_by:
            raise HTTPException(404, "Creating user not found")

        db.add(new_bill)
        db.commit()
        db.refresh(new_bill)
        return new_bill

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(500, "Failed to create bill")


@router.get("/", response_model=list[BillResponse], summary="Get all bills")
def get_bills(db: db_dependency):
    return db.query(Bill).all()


@router.get("/{bill_id}", response_model=BillResponse, summary="Get bill by ID")
def get_bill(bill_id: int, db: db_dependency):
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(404, "Bill not found")
    return bill

@router.put("/{bill_id}", response_model=BillResponse, summary="Update bill by ID")
def update_bill(bill_id: int, updates: BillUpdate, db: db_dependency):
    try:
        bill = db.query(Bill).filter(Bill.id == bill_id).first()
        if not bill:
            raise HTTPException(404, "Bill not found")

        for field, value in updates.model_dump(exclude_unset=True).items():
            setattr(bill, field, value)

        db.commit()
        db.refresh(bill)
        return bill

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(500, "Failed to update bill")


@router.delete("/{bill_id}", summary="Delete bill by ID")
def delete_bill(bill_id: int, db: db_dependency):
    try:
        bill = db.query(Bill).filter(Bill.id == bill_id).first()
        if not bill:
            raise HTTPException(404, "Bill not found")

        db.query(BillShare)\
            .filter(BillShare.bill_id == bill_id)\
            .delete(synchronize_session=False)

        db.delete(bill)
        db.commit()
        return {"detail": "Bill deleted successfully"}

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(500, "Failed to delete bill")


@router.post("/{bill_id}/share", summary="Share bill among users")
def share_bill(bill_id: int, payload: Optional[BillShareCreate], db: db_dependency):
    try:
        bill = db.query(Bill).filter(Bill.id == bill_id).first()
        if not bill:
            raise HTTPException(404, "Bill not found")

        # expected_total = bill.total_with_tax_tip()
        actual_total = round(sum(payload.shares.values()), 2)

        if not isclose(actual_total, bill.total_amount, abs_tol=0.01):
            raise HTTPException(
                400,
                f"Shares total ${actual_total}, but bill total is ${bill.total_amount}"
            )

        db.query(BillShare)\
            .filter(BillShare.bill_id == bill_id)\
            .delete(synchronize_session=False)

        for user_id, owes_amount in payload.shares.items():
            if not db.query(User).filter(User.id == user_id).first():
                raise HTTPException(404, f"User not found")
            db.add(BillShare(
                bill_id=bill_id,
                user_id=user_id,
                owes_amount=owes_amount
            ))

        db.commit()
        return {"detail": "Bill shared successfully"}

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(500, "Failed to share bill")


@router.get("/{bill_id}/shares", response_model=list[BillShareResponse], summary="Get bill shares")
def get_bill_shares(bill_id: int, db: db_dependency):
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(404, "Bill not found")

    shares = db.query(BillShare).filter(BillShare.bill_id == bill_id).all()
    if not shares:
        return []
        # raise HTTPException(404, "No shares found for this bill")

    subtotal = sum(s.owes_amount for s in shares)

    results = []
    for share in shares:
        ratio = share.owes_amount / subtotal if subtotal else 0
        
        tax_amount = round(bill.tax * ratio, 2)
        if bill.tip_split_evenly:
            tip_amount = round(bill.tip / len(shares), 2)
        else:
            tip_amount = round(bill.tip * ratio, 2)

        results.append({
            "owner": share.owner,
            "base_amount": share.owes_amount,
            "tax_amount": tax_amount,
            "tip_amount": tip_amount,
            "total_owed": round(
                share.owes_amount + tax_amount + tip_amount, 2
            )
        })

    return results

