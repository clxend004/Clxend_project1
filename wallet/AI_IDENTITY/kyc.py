import cv2
import pytesseract
import numpy as np
import mediapipe as mp
import random
import re
import json
import time
import boto3

from deepface import DeepFace
from tkinter import Tk
from tkinter.filedialog import askopenfilename
from botocore.exceptions import NoCredentialsError, NoRegionError, ClientError

# -------------------------------
# TESSERACT PATH
# -------------------------------
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# -------------------------------
# FILE PICKER
# -------------------------------
def pick_image():
    root = Tk()
    root.withdraw()
    root.attributes('-topmost', True)
    path = askopenfilename(filetypes=[("Images","*.jpg *.png *.jpeg")])
    root.destroy()
    return path

# -------------------------------
# OCR
# -------------------------------
def run_ocr(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    data = pytesseract.image_to_data(gray, output_type=pytesseract.Output.DICT)

    text = ""
    confs = []

    for i in range(len(data["text"])):
        word = data["text"][i].strip()
        conf = int(data["conf"][i]) if data["conf"][i] != '-1' else 0

        if word:
            text += word + " "
            confs.append(conf)

    avg_conf = sum(confs)/len(confs) if confs else 0
    text = text.upper()

    aadhaar = re.search(r'\d{4}\s\d{4}\s\d{4}', text)
    pan = re.search(r'[A-Z]{5}[0-9]{4}[A-Z]', text)
    dob = re.search(r'\d{2}[/-]\d{2}[/-]\d{4}', text)

    name = None
    words = text.split()
    for i in range(len(words)-1):
        if words[i].isalpha() and words[i+1].isalpha():
            name = words[i] + " " + words[i+1]
            break

    return {
        "document_type": "AADHAAR" if aadhaar else "PAN",
        "name": name,
        "dob": dob.group() if dob else None,
        "id_number": aadhaar.group() if aadhaar else pan.group() if pan else None,
        "ocr_confidence": round(avg_conf,2)
    }

# -------------------------------
# IMAGE QUALITY CHECK
# -------------------------------
def check_image_quality(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
    brightness = np.mean(gray)

    issues = []

    if blur_score < 50:
        issues.append("Image too blurry")

    if brightness < 50:
        issues.append("Image too dark")

    if brightness > 200:
        issues.append("Image too bright")

    return issues

# -------------------------------
# AWS SAFE CLIENT
# -------------------------------
def get_aws_client():
    try:
        client = boto3.client("rekognition", region_name="ap-south-1")
        return client, "CONNECTED"
    except:
        return None, "NOT_CONNECTED"

# -------------------------------
# AWS MATCH
# -------------------------------
def aws_face_match(selfie, id_img):
    client, status = get_aws_client()

    if client is None:
        return {"similarity": 0, "aws_status": "NOT_CONNECTED"}

    try:
        with open(selfie, 'rb') as f:
            src = f.read()
        with open(id_img, 'rb') as f:
            tgt = f.read()

        res = client.compare_faces(
            SourceImage={'Bytes': src},
            TargetImage={'Bytes': tgt},
            SimilarityThreshold=60
        )

        sim = res['FaceMatches'][0]['Similarity'] if res['FaceMatches'] else 0
        return {"similarity": round(sim,2), "aws_status": "CONNECTED"}

    except:
        return {"similarity": 0, "aws_status": "NOT_CONNECTED"}

# -------------------------------
# DEEPFACE MATCH
# -------------------------------
def deepface_match(selfie, id_img):
    res = DeepFace.verify(selfie, id_img, enforce_detection=False)
    sim = (1 - float(res["distance"])) * 100
    return round(sim,2)

# -------------------------------
# GENERATE REASONS
# -------------------------------
def generate_reasons(ocr, deep_sim, aws_res, liveness, image):
    reasons = []

    if not ocr["name"]:
        reasons.append("Name not detected")

    if not ocr["id_number"]:
        reasons.append("ID number not detected")

    if ocr["ocr_confidence"] < 60:
        reasons.append("Low OCR confidence")

    if deep_sim < 65:
        reasons.append("Face mismatch (DeepFace)")

    if aws_res["aws_status"] == "CONNECTED":
        if aws_res["similarity"] < 70:
            reasons.append("Face mismatch (AWS)")
    else:
        reasons.append("AWS not connected")

    if liveness != "REAL":
        reasons.append("Liveness failed")

    reasons.extend(check_image_quality(image))

    return reasons

# -------------------------------
# LIVENESS + SELFIE (ONE CAMERA)
# -------------------------------
def run_liveness_and_capture():

    mp_face_mesh = mp.solutions.face_mesh
    face_mesh = mp_face_mesh.FaceMesh(refine_landmarks=True)

    LEFT_EYE = [33,160,158,133,153,144]
    RIGHT_EYE = [362,385,387,263,373,380]
    NOSE = 1

    def dist(a,b):
        return np.linalg.norm(np.array(a)-np.array(b))

    def EAR(eye):
        p1,p2,p3,p4,p5,p6 = eye
        return (dist(p2,p6)+dist(p3,p5))/(2*dist(p1,p4))

    ACTIONS = ["BLINK_ONCE","BLINK_TWICE","LOOK_LEFT","LOOK_RIGHT","HOLD_STILL"]
    actions = random.sample(ACTIONS,5)

    cap = cv2.VideoCapture(0)

    action_idx = 0
    blink_count = 0
    frame_counter = 0
    prev_x = None

    mode = "LIVENESS"
    selfie_path = None

    print("\n👉 Perform actions → then capture selfie\n")

    while True:
        ret, frame = cap.read()
        frame = cv2.flip(frame,1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        res = face_mesh.process(rgb)

        if res.multi_face_landmarks:

            mesh = res.multi_face_landmarks[0].landmark
            h,w = frame.shape[:2]

            left = [(int(mesh[i].x*w), int(mesh[i].y*h)) for i in LEFT_EYE]
            right = [(int(mesh[i].x*w), int(mesh[i].y*h)) for i in RIGHT_EYE]

            ear = (EAR(left)+EAR(right))/2

            if ear < 0.23:
                frame_counter += 1
            else:
                if frame_counter >= 2:
                    blink_count += 1
                frame_counter = 0

            nose = mesh[NOSE]
            nx = int(nose.x*w)

            move = 0
            if prev_x:
                move = nx - prev_x
            prev_x = nx

            if mode == "LIVENESS" and action_idx < len(actions):
                current = actions[action_idx]
                success = False

                if current == "BLINK_ONCE" and blink_count >= 1:
                    success = True
                elif current == "BLINK_TWICE" and blink_count >= 2:
                    success = True
                elif current == "LOOK_LEFT" and move < -15:
                    success = True
                elif current == "LOOK_RIGHT" and move > 15:
                    success = True
                elif current == "HOLD_STILL" and abs(move) < 10:
                    success = True

                cv2.putText(frame,f"Do: {current}",(20,50),
                            cv2.FONT_HERSHEY_SIMPLEX,1,(0,255,255),2)

                if success:
                    print(f"[PASS] {current}")
                    action_idx += 1
                    blink_count = 0
                    time.sleep(1)

                if action_idx >= len(actions):
                    mode = "READY"

            elif mode == "READY":
                cv2.putText(frame,"LIVENESS PASSED",(20,50),
                            cv2.FONT_HERSHEY_SIMPLEX,1,(0,255,0),2)
                cv2.putText(frame,"Press SPACE to capture",(20,100),
                            cv2.FONT_HERSHEY_SIMPLEX,1,(255,255,0),2)

        cv2.imshow("KYC Camera", frame)

        key = cv2.waitKey(1)

        if key == 32 and mode == "READY":
            cv2.imwrite("selfie.jpg", frame)
            selfie_path = "selfie.jpg"
            print("📸 Selfie Captured")
            cap.release()
            cv2.destroyAllWindows()
            return "REAL", selfie_path

        elif key == ord('q'):
            cap.release()
            cv2.destroyAllWindows()
            return "SPOOF", None

# -------------------------------
# MAIN
# -------------------------------
def main():

    path = pick_image()
    if not path:
        return

    img = cv2.imread(path)
    ocr = run_ocr(img)

    faces = DeepFace.extract_faces(path, enforce_detection=False)
    if not faces:
        print("❌ No face in ID")
        return

    id_face = (faces[0]["face"]*255).astype("uint8")
    cv2.imwrite("id_face.jpg", id_face)

    live, selfie = run_liveness_and_capture()

    if live != "REAL":
        print("❌ Liveness Failed")
        return

    deep_sim = deepface_match(selfie, "id_face.jpg")
    aws_res = aws_face_match(selfie, "id_face.jpg")

    match = deep_sim > 65 or aws_res["similarity"] > 70

    reasons = generate_reasons(ocr, deep_sim, aws_res, live, img)

    if live != "REAL":
        status = "REJECTED"
    elif match and len(reasons) == 0:
        status = "APPROVED"
    elif match:
        status = "MANUAL_REVIEW"
    else:
        status = "REJECTED"

    result = {
        "ocr_data": ocr,
        "face_match": {
            "deepface_similarity": deep_sim,
            "aws_similarity": aws_res["similarity"],
            "aws_status": aws_res["aws_status"],
            "match": match
        },
        "liveness": live,
        "kyc_status": status,
        "reasons": reasons
    }

    print("\n🎯 FINAL RESULT\n")
    print(json.dumps(result, indent=4))

if __name__ == "__main__":
    main()