from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Table,
)
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Role(Base):
    __tablename__ = "Roles"

    RoleID = Column(Integer, primary_key=True, autoincrement=True)
    RoleCode = Column(String(50), unique=True)
    Department = Column(String(100))

    permissions = relationship("Permission", secondary="RolePermissions", back_populates="roles")
    users = relationship("User", back_populates="role")


class Permission(Base):
    __tablename__ = "Permissions"

    PermissionID = Column(Integer, primary_key=True, autoincrement=True)
    Code = Column(String(100), unique=True)
    Description = Column(String(255))

    roles = relationship("Role", secondary="RolePermissions", back_populates="permissions")


class RolePermission(Base):
    __tablename__ = "RolePermissions"

    RoleID = Column(Integer, ForeignKey("Roles.RoleID"), primary_key=True)
    PermissionID = Column(Integer, ForeignKey("Permissions.PermissionID"), primary_key=True)


class User(Base):
    __tablename__ = "Users"

    UserID = Column(Integer, primary_key=True, autoincrement=True)
    FullName = Column(String(255))
    Email = Column(String(255), unique=True)
    PasswordHash = Column(String(255))
    RoleID = Column(Integer, ForeignKey("Roles.RoleID"))
    IsActive = Column(Integer, default=1)  # BIT
    IsDeleted = Column(Integer, default=0)  # BIT
    ReferralCode = Column(String(20), unique=True, nullable=True)
    ReferredBy = Column(Integer, ForeignKey("Users.UserID"), nullable=True)
    CreatedAt = Column(DateTime, default=datetime.utcnow)

    role = relationship("Role", back_populates="users")
    member_profile = relationship("MemberProfile", uselist=False, back_populates="user")
    pt_profile = relationship("PTProfile", uselist=False, back_populates="user")
    refresh_tokens = relationship("RefreshToken", back_populates="user")
    sessions = relationship("UserSession", back_populates="user")


class RefreshToken(Base):
    __tablename__ = "RefreshTokens"

    TokenID = Column(Integer, primary_key=True, autoincrement=True)
    UserID = Column(Integer, ForeignKey("Users.UserID"))
    Token = Column(String(500))
    ExpiryDate = Column(DateTime)
    IsRevoked = Column(Integer, default=0)

    user = relationship("User", back_populates="refresh_tokens")


class UserSession(Base):
    __tablename__ = "UserSessions"

    SessionID = Column(Integer, primary_key=True, autoincrement=True)
    UserID = Column(Integer, ForeignKey("Users.UserID"))
    Device = Column(String(255))
    IPAddress = Column(String(50))
    CreatedAt = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="sessions")
