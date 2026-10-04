from pathlib import Path
from uuid import uuid4
import shutil

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from pydantic import BaseModel

import cv2
import kyc
from liveness import liveness_manager

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
DOCUMENT_DIR = UPLOAD_DIR / "documents"
SELFIE_DIR = UPLOAD_DIR / "selfies"
RESULT_DIR = BASE_DIR / "results"

for directory in (DOCUMENT_DIR, SELFIE_DIR, RESULT_DIR):
    directory.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="VECTRO KYC API",
    version="1.1.0",
    description="VECTRO KYC API adapter with browser liveness integration."
)

Instrumentator().instrument(app).expose(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def save_upload(upload: UploadFile, destination: Path) -> Path:
    with destination.open("wb") as buffer:
        shutil.copyfileobj(upload.file, buffer)
    return destination


def safe_remove(path: Path | None):
    if path and path.exists():
        try:
            path.unlink()
        except OSError:
            pass


def clamp_score(value, default=0.0):
    try:
        value = float(value)
    except (TypeError, ValueError):
        return float(default)

    return round(max(0.0, min(100.0, value)), 2)


def build_kyc_result(
    document_path: Path,
    selfie_path: Path,
    liveness_passed: bool,
    liveness_score: float,
    liveness_status: str,
):
    """
    Runs OCR, document-face extraction and face matching from kyc.py.

    Browser liveness is supplied by React/LivenessChallenge. The Python
    endpoint does not open its own webcam.
    """

    document_image = cv2.imread(str(document_path))
    if document_image is None:
        raise ValueError("Unable to read the identity document image")

    selfie_image = cv2.imread(str(selfie_path))
    if selfie_image is None:
        raise ValueError("Unable to read the selfie image")

    # ---------------------------------------------------------
    # OCR
    # ---------------------------------------------------------
    try:
        ocr = kyc.run_ocr(document_image)
    except Exception as exc:
        return {
            "success": True,
            "status": "MANUAL_REVIEW",
            "faceMatchScore": 0,
            "liveness": bool(liveness_passed),
            "livenessScore": clamp_score(liveness_score),
            "overallScore": clamp_score(liveness_score * 0.30),
            "ocrData": None,
            "reasons": [f"OCR processing could not be completed: {exc}"],
            "message": "Automated OCR verification could not be completed. Manual review is required.",
        }

    # ---------------------------------------------------------
    # Document image quality
    # ---------------------------------------------------------
    try:
        quality_issues = kyc.check_image_quality(document_image)
    except Exception as exc:
        quality_issues = [f"Image quality check failed: {exc}"]

    # ---------------------------------------------------------
    # Extract face from identity document
    # ---------------------------------------------------------
    try:
        faces = kyc.DeepFace.extract_faces(
            str(document_path),
            enforce_detection=False,
        )
    except Exception as exc:
        return {
            "success": True,
            "status": "MANUAL_REVIEW",
            "faceMatchScore": 0,
            "liveness": bool(liveness_passed),
            "livenessScore": clamp_score(liveness_score),
            "overallScore": clamp_score(liveness_score * 0.30),
            "ocrData": ocr,
            "reasons": [f"Document face extraction failed: {exc}"],
            "message": "The document face could not be processed automatically. Manual review is required.",
        }

    if not faces:
        return {
            "success": True,
            "status": "REJECTED",
            "faceMatchScore": 0,
            "liveness": bool(liveness_passed),
            "livenessScore": clamp_score(liveness_score),
            "overallScore": 0,
            "ocrData": ocr,
            "reasons": ["No face detected in identity document"],
            "message": "No face was detected in the identity document.",
        }

    id_face_path = RESULT_DIR / f"{uuid4().hex}_id_face.jpg"

    try:
        id_face = (faces[0]["face"] * 255).astype("uint8")

        if not cv2.imwrite(str(id_face_path), id_face):
            raise ValueError("Unable to create temporary document-face image")

        # -----------------------------------------------------
        # DeepFace
        # -----------------------------------------------------
        deepface_error = None
        try:
            deep_similarity = clamp_score(
                kyc.deepface_match(
                    str(selfie_path),
                    str(id_face_path),
                )
            )
        except Exception as exc:
            deep_similarity = 0.0
            deepface_error = str(exc)

        # -----------------------------------------------------
        # AWS Rekognition (optional)
        # -----------------------------------------------------
        try:
            aws_result = kyc.aws_face_match(
                str(selfie_path),
                str(id_face_path),
            )
        except Exception as exc:
            aws_result = {
                "similarity": 0,
                "aws_status": "NOT_CONNECTED",
                "error": str(exc),
            }

        aws_similarity = clamp_score(
            aws_result.get("similarity", 0)
        )
        aws_connected = (
            aws_result.get("aws_status") == "CONNECTED"
        )

        # -----------------------------------------------------
        # Browser liveness
        # -----------------------------------------------------
        live_score = clamp_score(liveness_score)
        liveness_ok = bool(liveness_passed)

        # Face score uses DeepFace and AWS when AWS is available.
        if aws_connected:
            face_score = max(
                deep_similarity,
                aws_similarity,
            )
        else:
            face_score = deep_similarity

        face_match = face_score >= 65

        # -----------------------------------------------------
        # Reasons
        # -----------------------------------------------------
        reasons = []

        if not ocr.get("name"):
            reasons.append("Name not detected")

        if not ocr.get("id_number"):
            reasons.append("ID number not detected")

        ocr_score = clamp_score(
            ocr.get("ocr_confidence", 0)
        )

        if ocr_score < 60:
            reasons.append("Low OCR confidence")

        if deepface_error:
            reasons.append(
                "DeepFace could not complete automatic face matching"
            )

        if not face_match:
            reasons.append("Face mismatch")

        if aws_connected and aws_similarity < 70:
            reasons.append("AWS face match below threshold")

        reasons.extend(quality_issues)

        if not liveness_ok:
            reasons.append("Liveness verification failed")

        # AWS being unavailable is not an automatic rejection because
        # DeepFace remains the primary face-match engine.
        if not aws_connected:
            aws_note = "AWS Rekognition unavailable; DeepFace used."
        else:
            aws_note = "AWS Rekognition connected."

        # -----------------------------------------------------
        # Overall score
        # 40% face + 30% OCR + 30% liveness
        # -----------------------------------------------------
        overall_score = round(
            (face_score * 0.40)
            + (ocr_score * 0.30)
            + (live_score * 0.30),
            2,
        )

        # -----------------------------------------------------
        # Final decision
        # -----------------------------------------------------
        if not liveness_ok:
            status = "REJECTED"
        elif not face_match:
            status = "REJECTED"
        elif (
            ocr_score >= 60
            and not quality_issues
            and not deepface_error
        ):
            status = "APPROVED"
        else:
            status = "MANUAL_REVIEW"

        if status == "APPROVED":
            message = "Identity verification completed successfully."
        elif status == "MANUAL_REVIEW":
            message = "Verification requires manual review."
        else:
            message = "Identity verification was not successful."

        return {
            "success": True,
            "status": status,
            "faceMatchScore": face_score,
            "liveness": liveness_ok,
            "livenessScore": live_score,
            "overallScore": overall_score,
            "ocrData": ocr,
            "face_match": {
                "deepface_similarity": deep_similarity,
                "aws_similarity": aws_similarity,
                "aws_status": aws_result.get(
                    "aws_status",
                    "NOT_CONNECTED",
                ),
                "match": face_match,
            },
            "livenessResult": {
                "passed": liveness_ok,
                "score": live_score,
                "status": (
                    "PASSED"
                    if liveness_ok
                    else "FAILED"
                ),
                "clientStatus": liveness_status or "",
            },
            "reasons": reasons,
            "engineNotes": [aws_note],
            "message": message,
        }

    finally:
        safe_remove(id_face_path)


class LivenessFrameRequest(BaseModel):
    session_id: str
    image: str


class LivenessCancelRequest(BaseModel):
    session_id: str


@app.post("/liveness/start")
def start_liveness():
    session = liveness_manager.start()
    return {
        "success": True,
        **session.result(),
        "message": "Liveness session started.",
    }


@app.post("/liveness/frame")
def process_liveness_frame(request: LivenessFrameRequest):
    session = liveness_manager.get(request.session_id)

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Liveness session not found or expired.",
        )

    try:
        result = session.process_frame(request.image)

        if result.get("passed") is True:
            liveness_manager.close(request.session_id)

        return {
            "success": True,
            **result,
        }

    except Exception as exc:
        liveness_manager.close(request.session_id)

        raise HTTPException(
            status_code=400,
            detail=f"Liveness frame processing failed: {exc}",
        ) from exc


@app.post("/liveness/cancel")
def cancel_liveness(request: LivenessCancelRequest):
    liveness_manager.close(request.session_id)

    return {
        "success": True,
        "status": "CANCELLED",
        "passed": False,
    }


@app.post("/liveness/cleanup")
def cleanup_liveness():
    removed = liveness_manager.cleanup()

    return {
        "success": True,
        "removed": removed,
    }


@app.get("/")
def root():
    return {
        "service": "VECTRO KYC API",
        "status": "running",
        "engine": "kyc.py",
        "version": "1.1.0",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "VECTRO KYC API",
        "engine": "kyc.py",
    }


@app.post("/kyc/submit")
async def submit_kyc(
    document: UploadFile = File(...),
    selfie: UploadFile = File(...),
    govId: str = Form(""),
    govIdType: str = Form(""),
    email: str = Form(""),
    mobile: str = Form(""),
    fullName: str = Form(""),
    dob: str = Form(""),
    gender: str = Form(""),
    address: str = Form(""),
    city: str = Form(""),
    state: str = Form(""),
    pincode: str = Form(""),

    # Browser liveness result
    livenessPassed: bool = Form(False),
    livenessScore: float = Form(0),
    livenessStatus: str = Form(""),
):
    document_path = DOCUMENT_DIR / (
        f"{uuid4().hex}"
        f"{Path(document.filename or '.jpg').suffix or '.jpg'}"
    )

    selfie_path = SELFIE_DIR / (
        f"{uuid4().hex}"
        f"{Path(selfie.filename or '.jpg').suffix or '.jpg'}"
    )

    try:
        save_upload(document, document_path)
        save_upload(selfie, selfie_path)

        result = build_kyc_result(
            document_path=document_path,
            selfie_path=selfie_path,
            liveness_passed=livenessPassed,
            liveness_score=livenessScore,
            liveness_status=livenessStatus,
        )

        result["request"] = {
            "govIdType": govIdType,
            "emailProvided": bool(email),
            "mobileProvided": bool(mobile),
            "livenessPassed": bool(livenessPassed),
        }

        return result

    except HTTPException:
        raise

    except Exception as exc:
        # Return a structured verification result instead of hiding the
        # actual processing problem behind a generic HTTP 500.
        return {
            "success": True,
            "status": "MANUAL_REVIEW",
            "faceMatchScore": 0,
            "liveness": bool(livenessPassed),
            "livenessScore": clamp_score(livenessScore),
            "overallScore": clamp_score(
                float(livenessScore) * 0.30
            ),
            "ocrData": None,
            "reasons": [
                "Automated KYC processing could not be completed.",
                str(exc),
            ],
            "message": "Manual review is required because automated verification could not be completed.",
        }

    finally:
        safe_remove(document_path)
        safe_remove(selfie_path)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )
