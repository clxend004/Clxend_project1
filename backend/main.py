from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    Form,
    File,
    UploadFile,
)

from fastapi.middleware.cors import CORSMiddleware

from prometheus_fastapi_instrumentator import Instrumentator

from sqlalchemy.orm import Session

from pydantic import BaseModel

from backend.database import engine, Base, get_db

from backend.blockchain_service import (
    create_blockchain_wallet,
    get_blockchain_balance,
    get_did_status,
    send_blockchain_transaction,
    create_did_identity,
    verify_did_identity,
    get_did_identity,
)

from backend.price_service import (
    get_eth_inr_price,
    calculate_inr_value,
)

from backend.models import (
    User,
    Transaction,
    KYC,
    Wallet,
)

from backend.auth import verify_token, create_token

from passlib.context import CryptContext

from datetime import datetime

import json
import os
import re
import time
import uuid
import requests
import secrets
import hashlib


# ============================================================
# INIT
# ============================================================

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VECTRO Wallet API",
    version="1.0.0",
)

Instrumentator().instrument(app).expose(app)


# ============================================================
# LIVENESS ROUTES
# ============================================================


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def home():
    return {
        "message": "FastAPI backend is running"
    }


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.1.8:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# PASSWORD SECURITY
# ============================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def validate_password(password: str):
    """
    Password policy:

    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character
    """

    if len(password) < 8:
        return "Password must be at least 8 characters long"

    if not re.search(r"[A-Z]", password):
        return "Password must contain at least one uppercase letter"

    if not re.search(r"[a-z]", password):
        return "Password must contain at least one lowercase letter"

    if not re.search(r"\d", password):
        return "Password must contain at least one number"

    if not re.search(r"[@$!%*?&]", password):
        return "Password must contain at least one special character"

    return None


def hash_password(password: str):
    """
    bcrypt supports a maximum password length of 72 bytes.
    """

    return pwd_context.hash(
        password[:72]
    )


def verify_password(
    plain: str,
    hashed: str,
):
    return pwd_context.verify(
        plain[:72],
        hashed,
    )


# ============================================================
# SCHEMAS
# ============================================================

class UserRegister(BaseModel):
    email: str
    password: str
    mobile: str


class UserLogin(BaseModel):
    email: str
    password: str


class GoogleLoginSchema(BaseModel):
    idToken: str


class TransactionSchema(BaseModel):
    receiver: str
    amount: float


class TransactionResponse(BaseModel):
    txHash: str
    amount: float
    sender: str
    recipient: str
    status: str
    timestamp: str

    class Config:
        from_attributes = True


class KYCDecision(BaseModel):
    status: str
    note: str = ""


# ============================================================
# GENERAL HELPERS
# ============================================================

def mask_gov_id(
    gov_id: str,
) -> str:
    """
    Show only the final four characters of a government ID.

    Example:

        123412341234

    becomes:

        XXXX XXXX 1234
    """

    if not gov_id:
        return ""

    value = str(gov_id).replace(
        " ",
        "",
    )

    if len(value) <= 4:
        return value

    last_four = value[-4:]

    masked_length = len(value) - 4

    groups = (
        masked_length + 3
    ) // 4

    return (
        " ".join(
            ["XXXX"] * groups
        )
        + " "
        + last_four
    ).strip()


def get_current_user(
    user_id: int = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """
    Resolve the currently authenticated user from the JWT.
    """

    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return user


# ============================================================
# ADMIN / REVIEWER AUTHORIZATION
# ============================================================

def verify_admin(
    user_id: int = Depends(verify_token),
    db: Session = Depends(get_db),
):
    """
    Only users with role:

        admin
        reviewer

    can access internal KYC review endpoints.
    """

    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    if user.role not in (
        "admin",
        "reviewer",
    ):
        raise HTTPException(
            status_code=403,
            detail=(
                "You don't have permission "
                "to access this."
            ),
        )

    return user_id


# ============================================================
# WALLET CREATION HELPER
# ============================================================

def _create_wallet_for_new_user(
    db: Session,
    new_user: "User",
):
    """
    Create a real blockchain wallet for a new VECTRO user.

    Flow:

        VECTRO user
            ↓
        Create VECTRO DID
            ↓
        Blockchain API :3001
            ↓
        Create real Sepolia wallet
            ↓
        Return public wallet address
            ↓
        Save wallet mapping in PostgreSQL

    IMPORTANT:

    - The private key is handled only by the
      blockchain service.
    - VECTRO never receives or stores the private key.
    """

    did = (
        f"did:wallet:{new_user.id}"
    )

    # --------------------------------------------------------
    # Prevent duplicate wallet creation
    # --------------------------------------------------------

    existing_wallet = (
        db.query(Wallet)
        .filter(
            Wallet.user_id == new_user.id
        )
        .first()
    )

    if existing_wallet:
        return existing_wallet

    # --------------------------------------------------------
    # Create real blockchain wallet
    # --------------------------------------------------------

    blockchain_wallet = (
        create_blockchain_wallet(
            did=did,
            chain="sepolia",
        )
    )

    # --------------------------------------------------------
    # Save public wallet information
    # --------------------------------------------------------

    wallet = Wallet(
        user_id=new_user.id,

        balance=5000,

        wallet_address=(
            blockchain_wallet[
                "wallet_address"
            ]
        ),

        did=did,

        blockchain="Sepolia",
    )

    db.add(wallet)

    db.flush()

    db.refresh(wallet)

    return wallet


# ============================================================
# AUTHENTICATION
# ============================================================

@app.post("/auth/register")
def register(
    user: UserRegister,
    db: Session = Depends(get_db),
):
    """
    Register a new VECTRO user and create a real
    Ethereum Sepolia wallet.

    Database flow:

        Create user
             ↓
        flush()
             ↓
        obtain user ID
             ↓
        create blockchain wallet
             ↓
        create Wallet database row
             ↓
        commit()
    """

    try:

        # ----------------------------------------------------
        # Validate password
        # ----------------------------------------------------

        password_error = validate_password(
            user.password
        )

        if password_error:
            raise HTTPException(
                status_code=400,
                detail=password_error,
            )

        # ----------------------------------------------------
        # Normalize email
        # ----------------------------------------------------

        email = (
            user.email
            .strip()
            .lower()
        )

        # ----------------------------------------------------
        # Check existing email
        # ----------------------------------------------------

        existing = (
            db.query(User)
            .filter(
                User.email == email
            )
            .first()
        )

        if existing:
            raise HTTPException(
                status_code=400,
                detail="User already exists",
            )

        # ----------------------------------------------------
        # Normalize mobile
        # ----------------------------------------------------

        mobile = (
            user.mobile.strip()
        )

        # ----------------------------------------------------
        # Check existing mobile
        # ----------------------------------------------------

        existing_mobile = (
            db.query(User)
            .filter(
                User.mobile == mobile
            )
            .first()
        )

        if existing_mobile:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Mobile number already registered"
                ),
            )

        # ----------------------------------------------------
        # Create user
        # ----------------------------------------------------

        new_user = User(
            email=email,

            password=hash_password(
                user.password
            ),

            mobile=mobile,
        )

        db.add(new_user)

        # ----------------------------------------------------
        # Flush
        # ----------------------------------------------------

        db.flush()

        # ----------------------------------------------------
        # Create real blockchain wallet
        # ----------------------------------------------------

        _create_wallet_for_new_user(
            db,
            new_user,
        )

        # ----------------------------------------------------
        # Commit complete registration
        # ----------------------------------------------------

        db.commit()

        db.refresh(
            new_user
        )

        return {
            "success": True,
            "message": (
                "Registered successfully"
            ),
        }

    except HTTPException:

        db.rollback()

        raise

    except Exception as error:

        db.rollback()

        print(
            "REGISTRATION / WALLET "
            "CREATION ERROR:",
            error,
        )

        raise HTTPException(
            status_code=503,
            detail=(
                "Registration could not be completed "
                "because the blockchain wallet could "
                "not be created. Please try again."
            ),
        )


@app.post("/auth/login")
def login(
    user: UserLogin,
    db: Session = Depends(get_db),
):
    """
    Authenticate user and return JWT.
    """

    email = (
        user.email
        .strip()
        .lower()
    )

    db_user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    if (
        not db_user
        or not verify_password(
            user.password,
            db_user.password,
        )
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
        )

    token = create_token(
        db_user.id
    )

    return {
        "success": True,

        "message":
            "Login successful",

        "token":
            token,

        "user": {
            "id":
                db_user.id,

            "email":
                db_user.email,

            "mobile":
                db_user.mobile,
        },
    }


# ============================================================
# GOOGLE LOGIN
# ============================================================

FIREBASE_PROJECT_ID = os.getenv(
    "FIREBASE_PROJECT_ID"
)


@app.post("/auth/google")
def google_login(
    payload: GoogleLoginSchema,
    db: Session = Depends(get_db),
):
    """
    Authenticate a user through Firebase Google Sign-In.

    Flow:

        React
          ↓
        Firebase Google Popup
          ↓
        Firebase ID Token
          ↓
        POST /auth/google
          ↓
        Verify Firebase token
          ↓
        Find/create VECTRO user
          ↓
        Create wallet for new user
          ↓
        Issue VECTRO JWT
    """

    # --------------------------------------------------------
    # Check Firebase configuration
    # --------------------------------------------------------

    if not FIREBASE_PROJECT_ID:

        raise HTTPException(
            status_code=500,
            detail=(
                "Google login is not configured on "
                "the server "
                "(FIREBASE_PROJECT_ID is missing "
                "from backend/.env)."
            ),
        )

    # --------------------------------------------------------
    # Import Firebase verification dependencies
    # --------------------------------------------------------

    try:

        from google.oauth2 import (
            id_token as google_id_token
        )

        from google.auth.transport import (
            requests as google_auth_requests
        )

    except ImportError:

        raise HTTPException(
            status_code=500,
            detail=(
                "Google login is unavailable: "
                "run 'pip install google-auth' "
                "on the server."
            ),
        )

    # --------------------------------------------------------
    # Verify Firebase ID token
    # --------------------------------------------------------

    try:

        decoded_token = (
            google_id_token.verify_firebase_token(
                payload.idToken,
                google_auth_requests.Request(),
                audience=FIREBASE_PROJECT_ID,
            )
        )

    except ValueError:

        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid or expired Google "
                "sign-in token."
            ),
        )

    # --------------------------------------------------------
    # Require verified Google email
    # --------------------------------------------------------

    if not decoded_token.get(
        "email_verified",
        False,
    ):

        raise HTTPException(
            status_code=401,
            detail=(
                "Google account email "
                "is not verified."
            ),
        )

    # --------------------------------------------------------
    # Get Google email
    # --------------------------------------------------------

    email = (
        decoded_token.get(
            "email"
        )
        or ""
    ).strip().lower()

    if not email:

        raise HTTPException(
            status_code=400,
            detail=(
                "Google account has no "
                "email address."
            ),
        )

    # --------------------------------------------------------
    # Get Firebase UID
    # --------------------------------------------------------

    firebase_uid = (
        decoded_token.get(
            "user_id"
        )
        or decoded_token.get(
            "sub"
        )
        or ""
    )

    if not firebase_uid:

        raise HTTPException(
            status_code=401,
            detail=(
                "Google account identity "
                "could not be verified."
            ),
        )

    # --------------------------------------------------------
    # Find existing VECTRO user
    # --------------------------------------------------------

    db_user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    # --------------------------------------------------------
    # Create VECTRO user if necessary
    # --------------------------------------------------------

    if not db_user:

        try:

            db_user = User(
                email=email,

                password=hash_password(
                    secrets.token_urlsafe(32)
                ),

                mobile=(
                    f"G{firebase_uid[-18:]}"
                ),
            )

            db.add(db_user)

            db.flush()

            _create_wallet_for_new_user(
                db,
                db_user,
            )

            db.commit()

            db.refresh(
                db_user
            )

        except Exception:

            db.rollback()

            raise HTTPException(
                status_code=503,
                detail=(
                    "Google account was verified, "
                    "but VECTRO wallet creation "
                    "failed. Please try again."
                ),
            )

    # --------------------------------------------------------
    # Issue VECTRO JWT
    # --------------------------------------------------------

    token = create_token(
        db_user.id
    )

    return {
        "success": True,

        "message":
            "Google login successful",

        "token":
            token,

        "user": {

            "id":
                db_user.id,

            "email":
                db_user.email,

            "mobile":
                db_user.mobile,

            "name":
                decoded_token.get(
                    "name",
                    "",
                ),

            "photoURL":
                decoded_token.get(
                    "picture",
                    "",
                ),
        },
    }


# ============================================================
# KYC CONFIGURATION
# ============================================================

UPLOAD_DIR = "uploads/kyc"

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True,
)


# ============================================================
# AI IDENTITY SERVICE
# ============================================================

IDENTITY_KYC_URL = os.getenv(
    "IDENTITY_KYC_URL",
    "http://127.0.0.1:8001/kyc/submit",
)


# ============================================================
# FILE HELPERS
# ============================================================

ALLOWED_DOCUMENT_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
}

ALLOWED_SELFIE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
}


def get_extension(
    filename: str,
):
    """
    Safely obtain a lowercase file extension.
    """

    return os.path.splitext(
        filename or ""
    )[1].lower()


def save_upload(
    file: UploadFile,
    prefix: str,
):
    """
    Save uploaded file to local development storage.

    Returns:

        filepath
        raw file bytes
    """

    original_filename = (
        file.filename
        or ""
    )

    ext = get_extension(
        original_filename
    )

    if not ext:
        ext = ".bin"

    filename = (
        f"{prefix}_"
        f"{uuid.uuid4().hex}"
        f"{ext}"
    )

    filepath = os.path.join(
        UPLOAD_DIR,
        filename,
    )

    content = file.file.read()

    with open(
        filepath,
        "wb",
    ) as output_file:

        output_file.write(
            content
        )

    return (
        filepath,
        content,
    )


def validate_upload_extension(
    file: UploadFile,
    allowed_extensions: set,
    field_name: str,
):
    """
    Validate uploaded file extension.
    """

    ext = get_extension(
        file.filename or ""
    )

    if ext not in allowed_extensions:

        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid {field_name} file type. "
                f"Allowed types: "
                f"{', '.join(sorted(allowed_extensions))}"
            ),
        )


# ============================================================
# IDENTITY STATUS MAPPING
# ============================================================

STATUS_MAP = {
    "APPROVED":
        "Approved",

    "MANUAL_REVIEW":
        "Manual review",

    "REJECTED":
        "Rejected",
}


# ============================================================
# AI IDENTITY KYC VERIFICATION
# ============================================================

def run_identity_check(
    document_content: bytes,
    document_filename: str,
    selfie_content: bytes,
    selfie_filename: str,
    gov_id: str,
    gov_id_type: str,
    email: str,
    mobile: str,
    full_name: str,
    dob: str,
    gender: str,
    address: str,
    city: str,
    state: str,
    pincode: str,
    liveness_passed: bool,
    liveness_score: float,
    liveness_status: str,
):
    """
    Send completed KYC information to AI Identity.

    AI Identity performs:

        OCR
        image quality checks
        document face extraction
        DeepFace face matching
        optional AWS checks
        final KYC decision
    """

    try:

        response = requests.post(
            IDENTITY_KYC_URL,

            files={
                "document": (
                    document_filename,
                    document_content,
                    "application/octet-stream",
                ),

                "selfie": (
                    selfie_filename,
                    selfie_content,
                    "image/jpeg",
                ),
            },

            data={
                "govId":
                    gov_id,

                "govIdType":
                    gov_id_type,

                "email":
                    email,

                "mobile":
                    mobile,

                "fullName":
                    full_name,

                "dob":
                    dob,

                "gender":
                    gender,

                "address":
                    address,

                "city":
                    city,

                "state":
                    state,

                "pincode":
                    pincode,

                "livenessPassed":
                    str(
                        liveness_passed
                    ).lower(),

                "livenessScore":
                    str(
                        liveness_score
                    ),

                "livenessStatus":
                    liveness_status,
            },

            timeout=180,
        )

        response.raise_for_status()

        result = response.json()

    except requests.exceptions.RequestException as error:

        print(
            "AI IDENTITY KYC SERVICE ERROR:",
            str(error),
        )

        return {

            "status":
                "Manual review",

            "face_match_score":
                None,

            "liveness":
                liveness_passed,

            "liveness_score":
                liveness_score,

            "liveness_status":
                liveness_status,

            "ocr_data":
                None,

            "reasons": [
                "AI Identity KYC service unavailable"
            ],

            "liveness_result":
                None,

            "overall_score":
                None,

            "raw":
                None,
        }

    # ========================================================
    # READ RESULT
    # ========================================================

    raw_status = str(
        result.get(
            "status",
            "MANUAL_REVIEW",
        )
    ).upper().strip()

    status = STATUS_MAP.get(
        raw_status,
        "Manual review",
    )

    # ========================================================
    # FACE MATCH
    # ========================================================

    face_match_score = result.get(
        "faceMatchScore"
    )

    if face_match_score is None:

        face_match = result.get(
            "face_match",
            {},
        )

        if isinstance(
            face_match,
            dict,
        ):

            face_match_score = (
                face_match.get(
                    "deepface_similarity"
                )
            )

    # ========================================================
    # LIVENESS
    # ========================================================

    final_liveness = result.get(
        "liveness",
        liveness_passed,
    )

    # ========================================================
    # OCR
    # ========================================================

    ocr_data = result.get(
        "ocrData"
    )

    if ocr_data is None:

        raw_ocr = result.get(
            "ocr_data",
            {},
        )

        if isinstance(
            raw_ocr,
            dict,
        ):

            ocr_data = {

                "name":
                    raw_ocr.get(
                        "name"
                    ),

                "idNumber":
                    raw_ocr.get(
                        "id_number"
                    ),

                "documentType":
                    raw_ocr.get(
                        "document_type"
                    ),

                "ocrConfidence":
                    raw_ocr.get(
                        "ocr_confidence"
                    ),
            }

        else:

            ocr_data = {}

    # ========================================================
    # REASONS
    # ========================================================

    reasons = result.get(
        "reasons",
        [],
    )

    if not isinstance(
        reasons,
        list,
    ):

        reasons = [
            str(reasons)
        ]

    normalized_reasons = []

    for reason in reasons:

        if isinstance(
            reason,
            dict,
        ):

            message = (
                reason.get(
                    "message"
                )
                or reason.get(
                    "reason"
                )
                or reason.get(
                    "detail"
                )
                or str(reason)
            )

            normalized_reasons.append(
                str(message)
            )

        else:

            normalized_reasons.append(
                str(reason)
            )

    return {

        "status":
            status,

        "face_match_score":
            face_match_score,

        "liveness":
            final_liveness,

        "liveness_score":
            result.get(
                "livenessScore",
                liveness_score,
            ),

        "liveness_status":
            result.get(
                "livenessStatus",
                liveness_status,
            ),

        "ocr_data":
            ocr_data,

        "reasons":
            normalized_reasons,

        "liveness_result":
            result.get(
                "livenessResult"
            ),

        "overall_score":
            result.get(
                "overallScore"
            ),

        "raw":
            result,
    }


# ============================================================
# KYC HASH
# ============================================================

def create_kyc_hash(
    user_id: int,
    kyc_id: int,
    status: str,
    face_match_score,
    liveness: bool,
    overall_score,
    timestamp: str,
):
    """
    Create a deterministic SHA-256 hash of the
    important KYC verification metadata.

    The same canonical metadata produces the
    same hash.
    """

    metadata = {

        "userId":
            user_id,

        "kycId":
            kyc_id,

        "status":
            status,

        "faceMatchScore":
            face_match_score,

        "liveness":
            liveness,

        "overallScore":
            overall_score,

        "timestamp":
            timestamp,
    }

    canonical_metadata = json.dumps(
        metadata,
        separators=(
            ",",
            ":",
        ),
        sort_keys=True,
    )

    return hashlib.sha256(
        canonical_metadata.encode(
            "utf-8"
        )
    ).hexdigest()


# ============================================================
# REGISTER + VERIFY DID
# ============================================================

def register_and_verify_did(
    wallet,
    kyc_hash: str,
):
    """
    Automatically register and verify a DID.

    Flow:

        Wallet
          ↓
        Check on-chain DID
          ↓
        If not registered
          ↓
        create identity
          ↓
        verify identity
          ↓
        VERIFIED

    Existing DID:

        Existing identity is returned without
        creating a duplicate identity.
    """

    if not wallet:

        raise ValueError(
            "Wallet not found."
        )

    if not wallet.did:

        raise ValueError(
            "Wallet DID is missing."
        )

    if not wallet.wallet_address:

        raise ValueError(
            "Wallet address is missing."
        )

    if not kyc_hash:

        raise ValueError(
            "KYC hash is missing."
        )

    # --------------------------------------------------------
    # Check whether wallet already has an on-chain DID
    # --------------------------------------------------------

    try:

        existing_identity = (
            get_did_identity(
                wallet.wallet_address
            )
        )

    except Exception as error:

        error_message = str(
            error
        ).lower()

        if (
            "not associated with a did"
            in error_message
        ):

            existing_identity = None

        else:

            raise

    # --------------------------------------------------------
    # DID already exists
    # --------------------------------------------------------

    if existing_identity:

        existing_did = (
            existing_identity.get(
                "did_id"
            )
        )

        existing_hash = (
            existing_identity.get(
                "kyc_hash"
            )
        )

        existing_status = (
            existing_identity.get(
                "status"
            )
        )

        return {

            "mode":
                "existing",

            "create":
                None,

            "verify":
                None,

            "identity":
                existing_identity,

            "did":
                existing_did,

            "kyc_hash":
                existing_hash,

            "status":
                existing_status,

            "requested_kyc_hash":
                kyc_hash,
        }

    # --------------------------------------------------------
    # DID does not exist
    # --------------------------------------------------------

    create_result = (
        create_did_identity(
            did=wallet.did,
            kyc_hash=kyc_hash,
        )
    )

    verify_result = (
        verify_did_identity(
            did=wallet.did,
            wallet_address=(
                wallet.wallet_address
            ),
        )
    )

    return {

        "mode":
            "created",

        "create":
            create_result,

        "verify":
            verify_result,

        "identity":
            verify_result,

        "did":
            wallet.did,

        "kyc_hash":
            kyc_hash,

        "status":
            "verified",
    }


# ============================================================
# KYC SUBMISSION
# ============================================================

@app.post("/kyc/submit")
def submit_kyc(

    # --------------------------------------------------------
    # Identity information
    # --------------------------------------------------------

    govId: str = Form(...),

    govIdType: str = Form(...),

    email: str = Form(...),

    mobile: str = Form(...),

    # --------------------------------------------------------
    # Personal information
    # --------------------------------------------------------

    fullName: str = Form(...),

    dob: str = Form(...),

    gender: str = Form(...),

    address: str = Form(...),

    city: str = Form(...),

    state: str = Form(...),

    pincode: str = Form(...),

    # --------------------------------------------------------
    # KYC files
    # --------------------------------------------------------

    document: UploadFile = File(...),

    selfie: UploadFile = File(...),

    # --------------------------------------------------------
    # Browser liveness result
    # --------------------------------------------------------

    livenessPassed: bool = Form(False),

    livenessScore: float = Form(0),

    livenessStatus: str = Form(""),

    # --------------------------------------------------------
    # Database / authentication
    # --------------------------------------------------------

    db: Session = Depends(get_db),

    user_id: int = Depends(
        verify_token
    ),
):

    try:

        # ====================================================
        # STEP 1
        # AUTHENTICATED USER
        # ====================================================

        user = (
            db.query(User)
            .filter(
                User.id == user_id
            )
            .first()
        )

        if not user:

            raise HTTPException(
                status_code=404,
                detail=(
                    "Authenticated user not found"
                ),
            )

        # ====================================================
        # STEP 2
        # VERIFY EMAIL
        # ====================================================

        if (
            email.strip().lower()
            != user.email.strip().lower()
        ):

            raise HTTPException(
                status_code=403,
                detail=(
                    "The submitted email does not "
                    "belong to the authenticated user"
                ),
            )

        # ====================================================
        # STEP 3
        # VERIFY MOBILE
        # ====================================================

        if (
            mobile.strip()
            != user.mobile.strip()
        ):

            raise HTTPException(
                status_code=403,
                detail=(
                    "The submitted mobile number "
                    "does not belong to the "
                    "authenticated user"
                ),
            )

        # ====================================================
        # STEP 4
        # LIVENESS MUST PASS
        # ====================================================

        if not livenessPassed:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Liveness verification must be "
                    "completed successfully before "
                    "KYC submission."
                ),
            )

        # ====================================================
        # STEP 5
        # PREVENT DUPLICATE ACTIVE KYC
        # ====================================================

        active_kyc = (
            db.query(KYC)
            .filter(
                KYC.user_id == user_id,

                KYC.status.in_(
                    [
                        "Pending",
                        "Approved",
                        "Manual review",
                    ]
                ),
            )
            .order_by(
                KYC.id.desc()
            )
            .first()
        )

        if active_kyc:

            when = (

                active_kyc.submitted_at.strftime(
                    "%d %b %Y, %H:%M"
                )

                if active_kyc.submitted_at

                else
                "an earlier date"
            )

            raise HTTPException(
                status_code=400,
                detail=(
                    f"You already have a KYC "
                    f"submission "
                    f"({active_kyc.status}) "
                    f"from {when}. "
                    f"You can submit again only "
                    f"if it is rejected."
                ),
            )

        # ====================================================
        # STEP 6
        # VALIDATE FILES
        # ====================================================

        validate_upload_extension(
            document,
            ALLOWED_DOCUMENT_EXTENSIONS,
            "document",
        )

        validate_upload_extension(
            selfie,
            ALLOWED_SELFIE_EXTENSIONS,
            "selfie",
        )

        # ====================================================
        # STEP 7
        # SAVE DOCUMENT
        # ====================================================

        document_path, document_content = (
            save_upload(
                document,
                "document",
            )
        )

        # ====================================================
        # STEP 8
        # SAVE SELFIE
        # ====================================================

        selfie_path, selfie_content = (
            save_upload(
                selfie,
                "selfie",
            )
        )

        print(
            "DOCUMENT SAVED:",
            document_path,
        )

        print(
            "SELFIE SAVED:",
            selfie_path,
        )

        print(
            "LIVENESS PASSED:",
            livenessPassed,
        )

        print(
            "LIVENESS SCORE:",
            livenessScore,
        )

        print(
            "LIVENESS STATUS:",
            livenessStatus,
        )

        # ====================================================
        # STEP 9
        # AI IDENTITY
        # ====================================================

        identity_result = (
            run_identity_check(

                document_content=
                    document_content,

                document_filename=(
                    document.filename
                    or "document.jpg"
                ),

                selfie_content=
                    selfie_content,

                selfie_filename=(
                    selfie.filename
                    or "selfie.jpg"
                ),

                gov_id=
                    govId,

                gov_id_type=
                    govIdType,

                email=
                    email,

                mobile=
                    mobile,

                full_name=
                    fullName,

                dob=
                    dob,

                gender=
                    gender,

                address=
                    address,

                city=
                    city,

                state=
                    state,

                pincode=
                    pincode,

                liveness_passed=
                    livenessPassed,

                liveness_score=
                    livenessScore,

                liveness_status=
                    livenessStatus,
            )
        )

        # ====================================================
        # STEP 10
        # READ AI RESULT
        # ====================================================

        result_status = (
            identity_result.get(
                "status",
                "Manual review",
            )
        )

        face_match_score = (
            identity_result.get(
                "face_match_score"
            )
        )

        final_liveness = (
            identity_result.get(
                "liveness",
                livenessPassed,
            )
        )

        final_liveness_score = (
            identity_result.get(
                "liveness_score",
                livenessScore,
            )
        )

        final_liveness_status = (
            identity_result.get(
                "liveness_status",
                livenessStatus,
            )
        )

        overall_score = (
            identity_result.get(
                "overall_score"
            )
        )

        reasons = (
            identity_result.get(
                "reasons",
                [],
            )
        )

        # ====================================================
        # STEP 11
        # CREATE DATABASE RECORD
        # ====================================================

        kyc = KYC(

            user_id=
                user_id,

            gov_id=
                govId,

            status=
                result_status,

            full_name=
                fullName,
        )

        # ====================================================
        # OPTIONAL MODEL ATTRIBUTES
        # ====================================================

        optional_attributes = {

            "gov_id_type":
                govIdType,

            "document_url":
                document_path,

            "selfie_url":
                selfie_path,

            "face_match_score":
                face_match_score,

            "liveness":
                final_liveness,

            "liveness_score":
                final_liveness_score,

            "liveness_status":
                final_liveness_status,

            "overall_score":
                overall_score,

            "reasons":
                json.dumps(
                    reasons
                ),

            "verification_reasons":
                json.dumps(
                    reasons
                ),
        }

        for attr, value in (
            optional_attributes.items()
        ):

            if hasattr(
                kyc,
                attr,
            ):

                setattr(
                    kyc,
                    attr,
                    value,
                )

        # ====================================================
        # STEP 12
        # SAVE KYC RECORD FIRST
        # ====================================================

        db.add(kyc)

        # ----------------------------------------------------
        # Flush so PostgreSQL generates kyc.id.
        #
        # The record is NOT committed yet.
        # ----------------------------------------------------

        db.flush()

        db.refresh(
            kyc
        )

        print(
            "KYC DATABASE ID:",
            kyc.id,
        )

        # ====================================================
        # STEP 12A
        # CREATE KYC TIMESTAMP
        # ====================================================

        kyc_timestamp = (

            kyc.submitted_at

            if getattr(
                kyc,
                "submitted_at",
                None,
            )

            else datetime.utcnow()
        )

        if hasattr(
            kyc_timestamp,
            "isoformat",
        ):

            kyc_timestamp = (
                kyc_timestamp.isoformat()
            )

        else:

            kyc_timestamp = str(
                kyc_timestamp
            )

        # ====================================================
        # STEP 12B
        # CREATE SHA-256 KYC HASH
        # ====================================================

        kyc_hash = create_kyc_hash(

            user_id=
                user_id,

            kyc_id=
                kyc.id,

            status=
                result_status,

            face_match_score=
                face_match_score,

            liveness=
                final_liveness,

            overall_score=
                overall_score,

            timestamp=
                kyc_timestamp,
        )

        print(
            "KYC SHA-256 HASH:",
            kyc_hash,
        )

        # ====================================================
        # STEP 12C
        # FIND USER WALLET
        # ====================================================

        wallet = (
            db.query(Wallet)
            .filter(
                Wallet.user_id == user_id
            )
            .first()
        )

        if not wallet:

            db.rollback()

            raise HTTPException(
                status_code=404,
                detail=(
                    "Wallet not found for "
                    "authenticated user."
                ),
            )

        # ====================================================
        # STEP 12D
        # VALIDATE WALLET
        # ====================================================

        if not wallet.did:

            db.rollback()

            raise HTTPException(
                status_code=400,
                detail=(
                    "Wallet DID is missing."
                ),
            )

        if not wallet.wallet_address:

            db.rollback()

            raise HTTPException(
                status_code=400,
                detail=(
                    "Wallet address is missing."
                ),
            )

        print(
            "KYC WALLET DID:",
            wallet.did,
        )

        print(
            "KYC WALLET ADDRESS:",
            wallet.wallet_address,
        )

        # ====================================================
        # STEP 12E
        # IMPORTANT:
        #
        # PERMANENTLY SAVE THE KYC RESULT FIRST.
        #
        # This means a blockchain failure will NOT delete
        # the KYC result.
        # ====================================================

        db.commit()

        db.refresh(
            kyc
        )

        print(
            "KYC DATABASE RECORD COMMITTED:",
            kyc.id,
        )

        # ====================================================
        # STEP 12F
        # AUTOMATIC DID CREATION + VERIFICATION
        # ====================================================

        blockchain_result = None

        blockchain_status = (
            "FAILED"
        )

        blockchain_error_message = None

        try:

            blockchain_result = (
                register_and_verify_did(
                    wallet=wallet,
                    kyc_hash=kyc_hash,
                )
            )

            blockchain_status = (
                "VERIFIED"
            )

            print(
                "DID CREATION / "
                "VERIFICATION RESULT:",
                blockchain_result,
            )

        except Exception as blockchain_error:

            blockchain_error_message = (
                str(
                    blockchain_error
                )
            )

            print(
                "BLOCKCHAIN DID ERROR:",
                blockchain_error_message,
            )

        # ====================================================
        # STEP 13
        # FINAL RESPONSE
        # ====================================================

        return {

            "success":
                True,

            "message": (
                "KYC verification result "
                "recorded."
            ),

            # ------------------------------------------------
            # ACTUAL AI KYC STATUS
            # ------------------------------------------------

            "status":
                result_status,

            "canContinue":
                True,

            "faceMatchScore":
                face_match_score,

            "liveness":
                final_liveness,

            "livenessScore":
                identity_result.get(
                    "liveness_score",
                    final_liveness_score,
                ),

            "livenessStatus":
                identity_result.get(
                    "liveness_status",
                    final_liveness_status,
                ),

            "ocrData":
                identity_result.get(
                    "ocr_data"
                ),

            "overallScore":
                identity_result.get(
                    "overall_score"
                ),

            "reasons":
                reasons,

            "livenessResult":
                identity_result.get(
                    "liveness_result"
                ),

            # ------------------------------------------------
            # BLOCKCHAIN / DID STATUS
            #
            # IMPORTANT:
            #
            # This is intentionally separate from
            # the KYC status.
            # ------------------------------------------------

            "blockchain": {

                "success": (
                    blockchain_status
                    == "VERIFIED"
                ),

                "status":
                    blockchain_status,

                "did":
                    wallet.did,

                "walletAddress":
                    wallet.wallet_address,

                "kycHash":
                    kyc_hash,

                "mode": (
                    blockchain_result.get(
                        "mode"
                    )
                    if blockchain_result
                    else None
                ),

                "error":
                    blockchain_error_message,

                "identity": (
                    blockchain_result.get(
                        "identity"
                    )
                    if blockchain_result
                    else None
                ),
            },
        }

    except HTTPException:

        raise

    except Exception as error:

        print(
            "KYC ERROR:",
            str(error),
        )

        try:

            db.rollback()

        except Exception:

            pass

        raise HTTPException(
            status_code=500,
            detail=(
                "KYC submission failed due to "
                "an internal server error."
            ),
        )


# ============================================================
# KYC STATUS
# ============================================================

@app.get("/kyc/status")
def get_kyc_status(
    db: Session = Depends(get_db),

    user_id: int = Depends(
        verify_token
    ),
):
    """
    Return the latest KYC status for the
    authenticated user.
    """

    latest_kyc = (
        db.query(KYC)

        .filter(
            KYC.user_id == user_id
        )

        .order_by(
            KYC.id.desc()
        )

        .first()
    )

    if not latest_kyc:

        return {
            "status":
                "Pending"
        }

    return {
        "status":
            latest_kyc.status
    }


# ============================================================
# KYC HISTORY
# ============================================================

@app.get("/kyc/history")
def get_kyc_history(
    db: Session = Depends(get_db),

    user_id: int = Depends(
        verify_token
    ),
):
    """
    Return the authenticated user's most
    recent KYC submissions.
    """

    rows = (
        db.query(KYC)

        .filter(
            KYC.user_id == user_id
        )

        .order_by(
            KYC.id.desc()
        )

        .limit(5)

        .all()
    )

    return {

        "history": [

            {
                "id":
                    row.id,

                "status":
                    row.status,

                "submittedAt": (
                    row.submitted_at.isoformat()
                    if row.submitted_at
                    else None
                ),

                "govIdType":
                    row.gov_id_type,

                "maskedGovId":
                    mask_gov_id(
                        row.gov_id
                    ),
            }

            for row in rows
        ]
    }


# ============================================================
# INTERNAL KYC REVIEW
# ============================================================

ALLOWED_DECISION_STATUSES = {
    "Approved",
    "Rejected",
    "Manual review",
}


# ============================================================
# KYC REVIEW QUEUE
# ============================================================

@app.get("/admin/kyc/queue")
def get_kyc_queue(
    status: str = None,

    db: Session = Depends(
        get_db
    ),

    _: int = Depends(
        verify_admin
    ),
):

    query = (
        db.query(
            KYC,
            User,
        )

        .join(
            User,
            KYC.user_id == User.id,
        )
    )

    if (
        status
        and status != "All"
    ):

        query = query.filter(
            KYC.status == status
        )

    rows = (
        query

        .order_by(
            KYC.id.desc()
        )

        .all()
    )

    submissions = []

    for kyc, user in rows:

        reasons = []

        raw_reasons = getattr(
            kyc,
            "reasons",
            None,
        )

        if raw_reasons:

            try:

                reasons = json.loads(
                    raw_reasons
                )

            except (
                json.JSONDecodeError,
                TypeError,
            ):

                reasons = [
                    str(raw_reasons)
                ]

        submissions.append({

            "id":
                kyc.id,

            "name":
                kyc.full_name,

            "email":
                user.email,

            "mobile":
                user.mobile,

            "maskedIdNumber":
                mask_gov_id(
                    kyc.gov_id
                ),

            "status":
                kyc.status,

            "faceMatchScore": (

                float(
                    kyc.face_match_score
                )

                if kyc.face_match_score
                is not None

                else None
            ),

            "liveness":
                kyc.liveness,

            "reasons":
                reasons,

            "submittedAt": (

                kyc.submitted_at.isoformat()

                if getattr(
                    kyc,
                    "submitted_at",
                    None,
                )

                else None
            ),

            "reviewedAt": (

                kyc.reviewed_at.isoformat()

                if getattr(
                    kyc,
                    "reviewed_at",
                    None,
                )

                else None
            ),

            "reviewerNote":
                getattr(
                    kyc,
                    "reviewer_note",
                    None,
                ),
        })

    return {
        "submissions":
            submissions
    }


# ============================================================
# KYC DETAIL
# ============================================================

@app.get("/admin/kyc/{kyc_id}")
def get_kyc_detail(
    kyc_id: int,

    db: Session = Depends(
        get_db
    ),

    _: int = Depends(
        verify_admin
    ),
):

    kyc = (
        db.query(KYC)

        .filter(
            KYC.id == kyc_id
        )

        .first()
    )

    if not kyc:

        raise HTTPException(
            status_code=404,
            detail="Submission not found",
        )

    user = (
        db.query(User)

        .filter(
            User.id == kyc.user_id
        )

        .first()
    )

    reasons = []

    raw_reasons = getattr(
        kyc,
        "reasons",
        None,
    )

    if raw_reasons:

        try:

            reasons = json.loads(
                raw_reasons
            )

        except (
            json.JSONDecodeError,
            TypeError,
        ):

            reasons = [
                str(raw_reasons)
            ]

    return {

        "id":
            kyc.id,

        "name":
            kyc.full_name,

        "email":
            user.email
            if user
            else None,

        "mobile":
            user.mobile
            if user
            else None,

        "maskedIdNumber":
            mask_gov_id(
                kyc.gov_id
            ),

        "govIdType":
            getattr(
                kyc,
                "gov_id_type",
                None,
            ),

        "status":
            kyc.status,

        "faceMatchScore": (

            float(
                kyc.face_match_score
            )

            if getattr(
                kyc,
                "face_match_score",
                None,
            ) is not None

            else None
        ),

        "liveness":
            getattr(
                kyc,
                "liveness",
                None,
            ),

        "reasons":
            reasons,

        "documentUrl":
            getattr(
                kyc,
                "document_url",
                None,
            ),

        "selfieUrl":
            getattr(
                kyc,
                "selfie_url",
                None,
            ),

        "submittedAt": (

            kyc.submitted_at.isoformat()

            if getattr(
                kyc,
                "submitted_at",
                None,
            )

            else None
        ),

        "reviewedAt": (

            kyc.reviewed_at.isoformat()

            if getattr(
                kyc,
                "reviewed_at",
                None,
            )

            else None
        ),

        "reviewerNote":
            getattr(
                kyc,
                "reviewer_note",
                None,
            ),
    }


# ============================================================
# KYC REVIEW DECISION
# ============================================================

@app.post("/admin/kyc/{kyc_id}/decision")
def submit_kyc_decision(
    kyc_id: int,

    decision: KYCDecision,

    db: Session = Depends(
        get_db
    ),

    reviewer_id: int = Depends(
        verify_admin
    ),
):

    # --------------------------------------------------------
    # Validate decision
    # --------------------------------------------------------

    if (
        decision.status
        not in ALLOWED_DECISION_STATUSES
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "status must be one of "
                f"{sorted(ALLOWED_DECISION_STATUSES)}"
            ),
        )

    # --------------------------------------------------------
    # Find KYC
    # --------------------------------------------------------

    kyc = (
        db.query(KYC)

        .filter(
            KYC.id == kyc_id
        )

        .first()
    )

    if not kyc:

        raise HTTPException(
            status_code=404,
            detail="Submission not found",
        )

    # --------------------------------------------------------
    # Update review decision
    # --------------------------------------------------------

    kyc.status = (
        decision.status
    )

    if hasattr(
        kyc,
        "reviewer_note",
    ):

        kyc.reviewer_note = (
            decision.note
        )

    if hasattr(
        kyc,
        "reviewed_by",
    ):

        kyc.reviewed_by = (
            reviewer_id
        )

    if hasattr(
        kyc,
        "reviewed_at",
    ):

        kyc.reviewed_at = (
            datetime.utcnow()
        )

    db.commit()

    db.refresh(
        kyc
    )

    return {

        "id":
            kyc.id,

        "status":
            kyc.status,

        "reviewerNote":
            getattr(
                kyc,
                "reviewer_note",
                None,
            ),

        "reviewedAt": (

            kyc.reviewed_at.isoformat()

            if getattr(
                kyc,
                "reviewed_at",
                None,
            )

            else None
        ),
    }


# ============================================================
# TRANSACTIONS
# ============================================================

@app.post(
    "/send",
    response_model=TransactionResponse,
)
def send_transaction(
    tx: TransactionSchema,

    db: Session = Depends(
        get_db
    ),

    user_id: int = Depends(
        verify_token
    ),
):

    if tx.amount <= 0:

        raise HTTPException(
            status_code=400,
            detail=(
                "Transaction amount "
                "must be greater than 0"
            ),
        )

    # --------------------------------------------------------
    # Find authenticated user's wallet
    # --------------------------------------------------------

    wallet = (
        db.query(Wallet)
        .filter(
            Wallet.user_id == user_id
        )
        .first()
    )

    if not wallet:

        raise HTTPException(
            status_code=404,
            detail="Wallet not found",
        )

    if not wallet.did:

        raise HTTPException(
            status_code=400,
            detail="Wallet DID is missing",
        )

    if not wallet.wallet_address:

        raise HTTPException(
            status_code=400,
            detail="Wallet address is missing",
        )

    # --------------------------------------------------------
    # Amount is already in ETH
    # --------------------------------------------------------

    eth_amount = float(tx.amount)

    if eth_amount <= 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Transaction amount "
                "must be greater than 0"
            ),
        )

    eth_amount = format(
        eth_amount,
        ".18f",
    ).rstrip("0").rstrip(".")
    # --------------------------------------------------------
    # Send real blockchain transaction
    # --------------------------------------------------------

    try:

        blockchain_response = (
            send_blockchain_transaction(
                did=wallet.did,
                recipient=tx.receiver,
                amount=eth_amount,
            )
        )

    except Exception as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error

    if not isinstance(
        blockchain_response,
        dict,
    ):

        raise HTTPException(
            status_code=502,
            detail=(
                "Invalid response from "
                "blockchain service"
            ),
        )

    if (
        blockchain_response.get(
            "success"
        )
        is False
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                blockchain_response.get(
                    "error"
                )
                or blockchain_response.get(
                    "message"
                )
                or
                "Blockchain transaction failed"
            ),
        )

    blockchain_result = (
        blockchain_response.get(
            "result"
        )
        or {}
    )

    transaction_hash = (
        blockchain_result.get(
            "transaction_hash"
        )
    )

    if not transaction_hash:

        raise HTTPException(
            status_code=502,
            detail=(
                "Blockchain service did not "
                "return a transaction hash"
            ),
        )

    # --------------------------------------------------------
    # Save real blockchain transaction
    # --------------------------------------------------------

    new_tx = Transaction(

        txHash=
            transaction_hash,

        amount=
            tx.amount,

        sender=(
            blockchain_result.get(
                "sender"
            )
            or wallet.wallet_address
        ),

        recipient=(
            blockchain_result.get(
                "recipient"
            )
            or tx.receiver
        ),

        status=
            "Confirmed",

        timestamp=(
            time.strftime(
                "%Y-%m-%d %H:%M:%S"
            )
        ),

        user_id=
            user_id,
    )

    db.add(
        new_tx
    )

    db.commit()

    db.refresh(
        new_tx
    )

    return new_tx


@app.get(
    "/transactions",
    response_model=list[
        TransactionResponse
    ],
)
def get_transactions(
    db: Session = Depends(
        get_db
    ),

    user_id: int = Depends(
        verify_token
    ),
):

    return (
        db.query(Transaction)

        .filter(
            Transaction.user_id
            == user_id
        )

        .order_by(
            Transaction.id.desc()
        )

        .all()
    )


# ============================================================
# BALANCE
# ============================================================

@app.get("/balance")
def get_balance(
    db: Session = Depends(
        get_db
    ),

    user_id: int = Depends(
        verify_token
    ),
):

    wallet = (
        db.query(Wallet)

        .filter(
            Wallet.user_id == user_id
        )

        .first()
    )

    if not wallet:

        raise HTTPException(
            status_code=404,
            detail="Wallet not found",
        )

    return {
        "balance":
            wallet.balance
    }


# ============================================================
# WALLET
# ============================================================

@app.get("/wallet")
def get_wallet(
    db: Session = Depends(
        get_db
    ),

    user_id: int = Depends(
        verify_token
    ),
):
    """
    Return the authenticated user's wallet information.

    Blockchain data is obtained from the separate
    blockchain service.
    """

    # --------------------------------------------------------
    # Get user
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    # --------------------------------------------------------
    # Get wallet mapping
    # --------------------------------------------------------

    wallet = (
        db.query(Wallet)
        .filter(
            Wallet.user_id == user_id
        )
        .first()
    )

    if not wallet:

        raise HTTPException(
            status_code=404,
            detail="Wallet not found",
        )

    # --------------------------------------------------------
    # Validate wallet
    # --------------------------------------------------------

    if not wallet.did:

        raise HTTPException(
            status_code=500,
            detail="Wallet DID is missing",
        )

    if not wallet.wallet_address:

        raise HTTPException(
            status_code=500,
            detail=(
                "Wallet address is missing"
            ),
        )

    # --------------------------------------------------------
    # Get real blockchain balance
    # --------------------------------------------------------

    try:

        blockchain_balance = (
            get_blockchain_balance(
                wallet.did
            )
        )

    except Exception as error:

        print(
            "BLOCKCHAIN BALANCE ERROR:",
            error,
        )

        raise HTTPException(
            status_code=503,
            detail=(
                "Unable to retrieve the wallet "
                "balance from the blockchain service."
            ),
        )

    # --------------------------------------------------------
    # Extract balance information
    # --------------------------------------------------------

    balance_data = (

        blockchain_balance.get(
            "balance"
        )

        if isinstance(
            blockchain_balance,
            dict,
        )

        else None
    )

    if not balance_data:

        raise HTTPException(
            status_code=502,
            detail=(
                "Blockchain service returned "
                "an invalid balance response."
            ),
        )

    balance_eth = (
        balance_data.get(
            "balance_eth",
            0,
        )
    )

    balance_wei = (
        balance_data.get(
            "balance_wei",
            0,
        )
    )

    blockchain_address = (
        balance_data.get(
            "address"
        )
    )

    blockchain_chain = (
        balance_data.get(
            "chain",
            "sepolia",
        )
    )

    # --------------------------------------------------------
    # Verify public wallet address
    # --------------------------------------------------------

    if (
        blockchain_address
        and
        blockchain_address.lower()
        != wallet.wallet_address.lower()
    ):

        raise HTTPException(
            status_code=502,
            detail=(
                "Blockchain wallet address "
                "does not match the VECTRO "
                "wallet record."
            ),
        )

    # --------------------------------------------------------
    # Get real DID status
    # --------------------------------------------------------

    try:

        did_status_response = (
            get_did_status(
                wallet.wallet_address
            )
        )

        identity_status = (

            did_status_response.get(
                "identityStatus",
                "not_registered",
            )

            if isinstance(
                did_status_response,
                dict,
            )

            else "not_registered"
        )

    except Exception as error:

        print(
            "DID STATUS ERROR:",
            error,
        )

        identity_status = (
            "unknown"
        )

    # --------------------------------------------------------
    # Get real ETH/INR market price
    # --------------------------------------------------------

    try:

        eth_inr_price_data = (
            get_eth_inr_price()
        )

        eth_inr_price = (
            eth_inr_price_data[
                "price"
            ]
        )

        balance_inr = (
            calculate_inr_value(
                balance_eth,
                eth_inr_price,
            )
        )

    except Exception as error:

        print(
            "ETH/INR PRICE ERROR:",
            error,
        )

        raise HTTPException(
            status_code=503,
            detail=(
                "Unable to retrieve the current "
                "ETH/INR price."
            ),
        )

    # --------------------------------------------------------
    # Return wallet information
    # --------------------------------------------------------

    return {

        "userId":
            user.id,

        "email":
            user.email,

        "phone":
            user.mobile,

        "walletId":
            f"WLT-{user.id}",

        "walletAddress":
            wallet.wallet_address,

        "balance":
            balance_eth,

        "balanceEth":
            balance_eth,

        "balanceWei":
            balance_wei,

        "ethInrPrice":
            eth_inr_price,

        "balanceInr":
            balance_inr,

        "did":
            wallet.did,

        "blockchain":
            blockchain_chain,

        "identityStatus":
            identity_status,

        "txHash":
            None,
    }