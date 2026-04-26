from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from ..database import get_db
from ..models import User, MembershipPackage, AIPackage, Promotion
from ..schemas.package import (
    MembershipPackageCreate, MembershipPackageUpdate, MembershipPackageResponse,
    AIPackageCreate, AIPackageUpdate, AIPackageResponse,
    PromotionCreate, PromotionUpdate, PromotionResponse,
    VerifyCodeRequest
)
from ..middleware.auth import get_current_user

router = APIRouter()

def require_admin_or_manager(current_user: User = Depends(get_current_user)):
    role_code = current_user.role.RoleCode.upper()
    if role_code not in ["ADMIN", "MANAGER"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không có quyền thực hiện thao tác này.")
    return current_user

# ==========================================
# MEMBERSHIP PACKAGES
# ==========================================
@router.get("/membership", response_model=List[MembershipPackageResponse])
def get_membership_packages(db: Session = Depends(get_db)):
    """Lấy danh sách các gói tập hiển thị."""
    packages = db.query(MembershipPackage).filter(MembershipPackage.HienThi == True).all()
    return packages

@router.get("/membership/all", response_model=List[MembershipPackageResponse])
def get_all_membership_packages(db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_manager)):
    """Lấy toàn bộ gói tập (cả ẩn) cho admin."""
    return db.query(MembershipPackage).all()

@router.post("/membership", response_model=MembershipPackageResponse)
def create_membership_package(pkg: MembershipPackageCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_manager)):
    db_pkg = MembershipPackage(**pkg.model_dump())
    db.add(db_pkg)
    db.commit()
    db.refresh(db_pkg)
    return db_pkg

@router.put("/membership/{pkg_id}", response_model=MembershipPackageResponse)
def update_membership_package(pkg_id: int, pkg: MembershipPackageUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_manager)):
    db_pkg = db.query(MembershipPackage).filter(MembershipPackage.MaGoi == pkg_id).first()
    if not db_pkg:
        raise HTTPException(status_code=404, detail="Không tìm thấy gói tập")
    for key, value in pkg.model_dump(exclude_unset=True).items():
        setattr(db_pkg, key, value)
    db.commit()
    db.refresh(db_pkg)
    return db_pkg

@router.delete("/membership/{pkg_id}")
def delete_membership_package(pkg_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_manager)):
    db_pkg = db.query(MembershipPackage).filter(MembershipPackage.MaGoi == pkg_id).first()
    if not db_pkg:
        raise HTTPException(status_code=404, detail="Không tìm thấy gói tập")
    db.delete(db_pkg)
    db.commit()
    return {"message": "Đã xóa gói tập thành công."}

# ==========================================
# AI PACKAGES
# ==========================================
@router.get("/ai", response_model=List[AIPackageResponse])
def get_ai_packages(db: Session = Depends(get_db)):
    packages = db.query(AIPackage).filter(AIPackage.HienThi == True).all()
    return packages

@router.get("/ai/all", response_model=List[AIPackageResponse])
def get_all_ai_packages(db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_manager)):
    return db.query(AIPackage).all()

@router.post("/ai", response_model=AIPackageResponse)
def create_ai_package(pkg: AIPackageCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_manager)):
    db_pkg = AIPackage(**pkg.model_dump())
    db.add(db_pkg)
    db.commit()
    db.refresh(db_pkg)
    return db_pkg

@router.put("/ai/{pkg_id}", response_model=AIPackageResponse)
def update_ai_package(pkg_id: int, pkg: AIPackageUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_manager)):
    db_pkg = db.query(AIPackage).filter(AIPackage.MaGoiAi == pkg_id).first()
    if not db_pkg:
        raise HTTPException(status_code=404, detail="Không tìm thấy gói AI")
    for key, value in pkg.model_dump(exclude_unset=True).items():
        setattr(db_pkg, key, value)
    db.commit()
    db.refresh(db_pkg)
    return db_pkg

@router.delete("/ai/{pkg_id}")
def delete_ai_package(pkg_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_manager)):
    db_pkg = db.query(AIPackage).filter(AIPackage.MaGoiAi == pkg_id).first()
    if not db_pkg:
        raise HTTPException(status_code=404, detail="Không tìm thấy gói AI")
    db.delete(db_pkg)
    db.commit()
    return {"message": "Đã xóa gói AI thành công."}

# ==========================================
# PROMOTIONS & REFERRALS
# ==========================================
@router.get("/promotions", response_model=List[PromotionResponse])
def get_promotions(db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_manager)):
    return db.query(Promotion).all()

@router.post("/promotions", response_model=PromotionResponse)
def create_promotion(promo: PromotionCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_manager)):
    db_promo = Promotion(**promo.model_dump())
    db.add(db_promo)
    db.commit()
    db.refresh(db_promo)
    return db_promo

@router.put("/promotions/{promo_id}", response_model=PromotionResponse)
def update_promotion(promo_id: int, promo: PromotionUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_manager)):
    db_promo = db.query(Promotion).filter(Promotion.PromotionID == promo_id).first()
    if not db_promo:
        raise HTTPException(status_code=404, detail="Không tìm thấy mã khuyến mãi")
    for key, value in promo.model_dump(exclude_unset=True).items():
        setattr(db_promo, key, value)
    db.commit()
    db.refresh(db_promo)
    return db_promo

@router.delete("/promotions/{promo_id}")
def delete_promotion(promo_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin_or_manager)):
    db_promo = db.query(Promotion).filter(Promotion.PromotionID == promo_id).first()
    if not db_promo:
        raise HTTPException(status_code=404, detail="Không tìm thấy mã khuyến mãi")
    db.delete(db_promo)
    db.commit()
    return {"message": "Đã xóa mã khuyến mãi."}

@router.post("/verify-code")
def verify_code(req: VerifyCodeRequest, db: Session = Depends(get_db)):
    """Kiểm tra mã giảm giá hoặc mã Referral."""
    code = req.code.strip()
    
    # Kiểm tra mã Promotion
    promo = db.query(Promotion).filter(Promotion.PromoCode == code, Promotion.IsActive == True).first()
    if promo:
        if promo.ExpiryDate and promo.ExpiryDate < datetime.utcnow():
            raise HTTPException(status_code=400, detail="Mã khuyến mãi đã hết hạn.")
        
        discount_value = float(promo.DiscountValue)
        final_discount = 0.0
        if promo.DiscountType == "PERCENT":
            if req.package_price:
                final_discount = (req.package_price * discount_value) / 100.0
            else:
                return {"valid": True, "type": "PERCENT", "value": discount_value, "message": f"Giảm {discount_value}%"}
        else:
            final_discount = discount_value

        return {"valid": True, "type": "PROMOTION", "discount": final_discount, "message": f"Giảm {final_discount:,.0f} VNĐ"}
    
    # Kiểm tra mã Referral
    referrer = db.query(User).filter(User.ReferralCode == code, User.IsActive == 1).first()
    if referrer:
        discount = 0.0
        if req.package_price:
            discount = (req.package_price * 10) / 100.0 # Giảm 10% cho referral
        return {"valid": True, "type": "REFERRAL", "referrer_id": referrer.UserID, "discount": discount, "message": "Giảm 10% từ mã giới thiệu"}
    
    raise HTTPException(status_code=404, detail="Mã không hợp lệ hoặc không tồn tại.")
