from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    Numeric,
    DateTime,
    ForeignKey,
)
from sqlalchemy.sql import func
from backend.database import Base


# ============================================================
# USER
# ============================================================

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    email = Column(
        String,
        unique=True,
        index=True,
        nullable=False
    )

    password = Column(
        String,
        nullable=False
    )

    mobile = Column(
        String,
        unique=True,
        nullable=False
    )

    # User role
    role = Column(
        String(20),
        default="customer"
    )

    # Account status
    is_active = Column(
        Boolean,
        default=True
    )

    # Account timestamps
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


# ============================================================
# TRANSACTION
# ============================================================

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    txHash = Column(
        String
    )

    # Amount is stored as ETH.
    #
    # Numeric(36, 18) allows:
    #   0.001
    #   0.0005
    #   1.25
    #   10.000000000000000000
    #
    # 18 decimal places matches Ethereum's wei precision.
    amount = Column(
        Numeric(36, 18),
        nullable=False
    )

    sender = Column(
        String
    )

    recipient = Column(
        String
    )

    status = Column(
        String
    )

    timestamp = Column(
        String
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id")
    )


# ============================================================
# KYC
# ============================================================

class KYC(Base):
    __tablename__ = "kyc"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id")
    )

    gov_id = Column(
        String
    )

    status = Column(
        String
    )

    gov_id_type = Column(
        String(30)
    )

    document_url = Column(
        Text
    )

    selfie_url = Column(
        Text
    )

    face_match_score = Column(
        Numeric(5, 2)
    )

    # ========================================================
    # LIVENESS
    # ========================================================

    liveness = Column(
        Boolean
    )

    liveness_score = Column(
        Numeric(5, 2)
    )

    liveness_status = Column(
        String(30)
    )

    # ========================================================
    # OVERALL AI IDENTITY
    # ========================================================

    overall_score = Column(
        Numeric(5, 2)
    )

    # ========================================================
    # REVIEW
    # ========================================================

    reviewer_note = Column(
        Text
    )

    reviewed_by = Column(
        Integer,
        ForeignKey("users.id")
    )

    reviewed_at = Column(
        DateTime(timezone=True)
    )

    # ========================================================
    # TIMESTAMPS
    # ========================================================

    submitted_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # ========================================================
    # PERSONAL DETAILS
    # ========================================================

    full_name = Column(
        String(255)
    )

    # ========================================================
    # AI IDENTITY REASONS
    # ========================================================

    reasons = Column(
        Text
    )

    # ========================================================
    # INTERNAL VERIFICATION REASONS
    # ========================================================

    verification_reasons = Column(
        Text
    )


# ============================================================
# WALLET
# ============================================================

class Wallet(Base):
    __tablename__ = "wallets"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id")
    )

    # This is the application/display balance.
    #
    # The real blockchain balance is retrieved from
    # the blockchain service in main.py.
    balance = Column(
        Integer,
        default=5000
    )

    wallet_address = Column(
        String,
        unique=True
    )

    did = Column(
        String,
        unique=True
    )

    blockchain = Column(
        String,
        default="Polygon"
    )


# ============================================================
# GOOGLE LOGIN EMAIL OTP
# ============================================================
#
# IMPORTANT:
# This model is intentionally KEPT even though Google OTP
# is temporarily disabled in main.py.
#
# The database table can remain in place for future use.
#
# Current temporary Google login flow:
#
# Google
#    ↓
# Firebase
#    ↓
# /auth/google
#    ↓
# VECTRO JWT
#    ↓
# Dashboard
#
# The GoogleOTPChallenge table is currently NOT used by
# the temporary direct Google login flow.
#
# Do NOT delete this model or its database table.
#
# ============================================================

class GoogleOTPChallenge(Base):
    __tablename__ = "google_otp_challenges"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # Random identifier for an OTP challenge.
    # This is NOT the OTP itself.
    challenge_id = Column(
        String(128),
        unique=True,
        nullable=False,
        index=True
    )

    # VECTRO user associated with the Google login attempt.
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    # Email address to which the OTP would be sent.
    email = Column(
        String,
        nullable=False,
        index=True
    )

    # Secure hash of the OTP.
    #
    # The actual OTP is never stored in the database.
    otp_hash = Column(
        String(128),
        nullable=False
    )

    # OTP expiration time.
    expires_at = Column(
        DateTime(timezone=True),
        nullable=False
    )

    # Number of incorrect OTP attempts.
    attempts = Column(
        Integer,
        nullable=False,
        default=0
    )

    # Prevents reuse of an OTP challenge.
    used = Column(
        Boolean,
        nullable=False,
        default=False
    )

    # Controls OTP resend frequency.
    last_sent_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Challenge creation time.
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )