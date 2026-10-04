"""
VECTRO KYC - Browser Liveness Engine

Used by the existing FastAPI KYC project.

Flow:
    React LivenessChallenge.js
            ↓
    POST /liveness/start
            ↓
    LivenessSession
            ↓
    POST /liveness/frame
            ↓
    MediaPipe Face Mesh
            ↓
    EAR + Nose Movement
            ↓
    Liveness PASSED / FAILED
"""

import base64
import random
import time
import uuid
from typing import Dict

import cv2
import mediapipe as mp
import numpy as np


# =========================================================
# CONFIGURATION
# =========================================================

EAR_THRESHOLD = 0.23
CONSEC_FRAMES = 2

LOOK_LEFT_THRESHOLD = -15
LOOK_RIGHT_THRESHOLD = 15
HOLD_STILL_THRESHOLD = 10

TOTAL_CHALLENGES_REQUIRED = 5

ACTIONS = [
    "BLINK_ONCE",
    "BLINK_TWICE",
    "LOOK_LEFT",
    "LOOK_RIGHT",
    "HOLD_STILL",
]

# MediaPipe landmark indexes
LEFT_EYE = [
    33,
    160,
    158,
    133,
    153,
    144,
]

RIGHT_EYE = [
    362,
    385,
    387,
    263,
    373,
    380,
]

NOSE = 1


# =========================================================
# UTILITY FUNCTIONS
# =========================================================

def distance(point_a, point_b):
    """
    Calculate Euclidean distance between two points.
    """

    return np.linalg.norm(
        np.array(point_a) -
        np.array(point_b)
    )


def eye_aspect_ratio(eye):
    """
    Calculate Eye Aspect Ratio (EAR).

    Used for blink detection.
    """

    p1, p2, p3, p4, p5, p6 = eye

    denominator = (
        2 *
        distance(p1, p4)
    )

    if denominator == 0:
        return 1.0

    ear = (
        distance(p2, p6) +
        distance(p3, p5)
    ) / denominator

    return ear


# =========================================================
# IMAGE DECODING
# =========================================================

def decode_frame(data_url: str):
    """
    Convert browser Base64/Data URL image
    into an OpenCV BGR image.
    """

    if not data_url:
        raise ValueError(
            "Camera frame is empty"
        )

    # Browser usually sends:
    #
    # data:image/jpeg;base64,XXXXXX
    #
    # Remove everything before the comma.
    if "," in data_url:
        data_url = data_url.split(
            ",",
            1
        )[1]

    try:
        image_bytes = base64.b64decode(
            data_url
        )
    except Exception as exc:
        raise ValueError(
            "Invalid Base64 camera frame"
        ) from exc

    image_array = np.frombuffer(
        image_bytes,
        dtype=np.uint8
    )

    frame = cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR
    )

    if frame is None:
        raise ValueError(
            "Unable to decode camera frame"
        )

    # Mirror the image to behave like
    # a normal front-facing camera preview.
    frame = cv2.flip(
        frame,
        1
    )

    return frame


# =========================================================
# LIVENESS SESSION
# =========================================================

class LivenessSession:

    def __init__(self):

        # Unique session ID
        self.session_id = (
            uuid.uuid4().hex
        )

        self.created_at = time.time()

        # Randomly select all five challenges.
        #
        # Example:
        #
        # [
        #   "LOOK_LEFT",
        #   "BLINK_ONCE",
        #   "HOLD_STILL",
        #   "LOOK_RIGHT",
        #   "BLINK_TWICE"
        # ]
        #
        self.actions = random.sample(
            ACTIONS,
            TOTAL_CHALLENGES_REQUIRED
        )

        self.action_idx = 0

        # Blink tracking
        self.blink_count = 0
        self.frame_counter = 0

        # Nose tracking
        self.prev_x = None

        # MediaPipe Face Mesh
        self.face_mesh = (
            mp.solutions.face_mesh.FaceMesh(
                refine_landmarks=True,
                max_num_faces=1,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5,
            )
        )

        self.closed = False


    # =====================================================
    # CURRENT CHALLENGE
    # =====================================================

    @property
    def current_action(self):

        if (
            self.action_idx >=
            len(self.actions)
        ):
            return None

        return self.actions[
            self.action_idx
        ]


    # =====================================================
    # COMPLETED CHALLENGES
    # =====================================================

    @property
    def completed(self):

        return self.action_idx


    # =====================================================
    # PASSED
    # =====================================================

    @property
    def passed(self):

        return (
            self.action_idx >=
            len(self.actions)
        )


    # =====================================================
    # ACCURACY
    # =====================================================

    @property
    def accuracy(self):

        return round(
            (
                self.completed /
                TOTAL_CHALLENGES_REQUIRED
            ) * 100,
            2
        )


    # =====================================================
    # CLOSE MEDIAPIPE
    # =====================================================

    def close(self):

        if self.closed:
            return

        try:

            self.face_mesh.close()

        except Exception:

            pass

        self.closed = True


    # =====================================================
    # RESULT
    # =====================================================

    def result(self):

        return {
            "session_id":
                self.session_id,

            "status":
                (
                    "PASSED"
                    if self.passed
                    else "LIVENESS"
                ),

            "passed":
                self.passed,

            "is_real_user":
                self.passed,

            "current_challenge":
                self.current_action,

            "completed_challenges":
                self.completed,

            "total_challenges":
                TOTAL_CHALLENGES_REQUIRED,

            "accuracy":
                (
                    100.0
                    if self.passed
                    else self.accuracy
                ),
        }


    # =====================================================
    # PROCESS CAMERA FRAME
    # =====================================================

    def process_frame(
        self,
        data_url: str
    ):

        if self.closed:

            raise ValueError(
                "Liveness session is closed"
            )


        # Already passed
        if self.passed:

            result = self.result()

            result[
                "face_detected"
            ] = True

            return result


        # -------------------------------------------------
        # Decode browser frame
        # -------------------------------------------------

        frame = decode_frame(
            data_url
        )


        # -------------------------------------------------
        # Convert BGR → RGB
        # -------------------------------------------------

        rgb = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2RGB
        )


        # -------------------------------------------------
        # MediaPipe Face Mesh
        # -------------------------------------------------

        result = (
            self.face_mesh.process(
                rgb
            )
        )


        # -------------------------------------------------
        # Face not detected
        # -------------------------------------------------

        if not result.multi_face_landmarks:

            return {
                **self.result(),

                "face_detected":
                    False,

                "message":
                    (
                        "No face detected. "
                        "Please keep your face "
                        "inside the camera."
                    ),
            }


        # -------------------------------------------------
        # Get first detected face
        # -------------------------------------------------

        mesh = (
            result.multi_face_landmarks[0]
            .landmark
        )


        height, width = (
            frame.shape[:2]
        )


        # =================================================
        # LEFT EYE
        # =================================================

        left_eye = [

            (
                int(
                    mesh[index].x *
                    width
                ),

                int(
                    mesh[index].y *
                    height
                ),
            )

            for index
            in LEFT_EYE
        ]


        # =================================================
        # RIGHT EYE
        # =================================================

        right_eye = [

            (
                int(
                    mesh[index].x *
                    width
                ),

                int(
                    mesh[index].y *
                    height
                ),
            )

            for index
            in RIGHT_EYE
        ]


        # =================================================
        # EAR
        # =================================================

        left_ear = (
            eye_aspect_ratio(
                left_eye
            )
        )

        right_ear = (
            eye_aspect_ratio(
                right_eye
            )
        )

        current_ear = (
            left_ear +
            right_ear
        ) / 2


        # =================================================
        # BLINK DETECTION
        # =================================================

        if (
            current_ear <
            EAR_THRESHOLD
        ):

            self.frame_counter += 1

        else:

            if (
                self.frame_counter >=
                CONSEC_FRAMES
            ):

                self.blink_count += 1

            self.frame_counter = 0


        # =================================================
        # NOSE MOVEMENT
        # =================================================

        nose = mesh[NOSE]

        nose_x = int(
            nose.x *
            width
        )


        if self.prev_x is None:

            movement = 0

        else:

            movement = (
                nose_x -
                self.prev_x
            )


        self.prev_x = nose_x


        # =================================================
        # CURRENT CHALLENGE
        # =================================================

        current = (
            self.current_action
        )

        challenge_success = False


        # =================================================
        # BLINK ONCE
        # =================================================

        if (
            current ==
            "BLINK_ONCE"
            and
            self.blink_count >= 1
        ):

            challenge_success = True


        # =================================================
        # BLINK TWICE
        # =================================================

        elif (
            current ==
            "BLINK_TWICE"
            and
            self.blink_count >= 2
        ):

            challenge_success = True


        # =================================================
        # LOOK LEFT
        # =================================================

        elif (
            current ==
            "LOOK_LEFT"
            and
            movement <
            LOOK_LEFT_THRESHOLD
        ):

            challenge_success = True


        # =================================================
        # LOOK RIGHT
        # =================================================

        elif (
            current ==
            "LOOK_RIGHT"
            and
            movement >
            LOOK_RIGHT_THRESHOLD
        ):

            challenge_success = True


        # =================================================
        # HOLD STILL
        # =================================================

        elif (
            current ==
            "HOLD_STILL"
            and
            abs(movement) <
            HOLD_STILL_THRESHOLD
        ):

            challenge_success = True


        # =================================================
        # CHALLENGE PASSED
        # =================================================

        if challenge_success:

            self.action_idx += 1

            # Reset blink state
            self.blink_count = 0

            self.frame_counter = 0

            self.prev_x = nose_x


        # =================================================
        # RESPONSE
        # =================================================

        response = {

            **self.result(),

            "face_detected":
                True,

            "ear":
                round(
                    float(current_ear),
                    4
                ),

            "move":
                int(movement),
        }


        # =================================================
        # FINAL STATUS
        # =================================================

        if self.passed:

            response[
                "message"
            ] = (
                "Liveness verification passed."
            )

        else:

            response[
                "message"
            ] = (
                "Perform the displayed challenge."
            )


        return response


# =========================================================
# LIVENESS MANAGER
# =========================================================

class LivenessManager:

    def __init__(self):

        self.sessions: Dict[
            str,
            LivenessSession
        ] = {}


    # =====================================================
    # CREATE SESSION
    # =====================================================

    def start(self):

        session = (
            LivenessSession()
        )

        self.sessions[
            session.session_id
        ] = session

        return session


    # =====================================================
    # GET SESSION
    # =====================================================

    def get(
        self,
        session_id: str
    ):

        return self.sessions.get(
            session_id
        )


    # =====================================================
    # CLOSE SESSION
    # =====================================================

    def close(
        self,
        session_id: str
    ):

        session = (
            self.sessions.pop(
                session_id,
                None
            )
        )

        if session:

            session.close()


    # =====================================================
    # CLEAN OLD SESSIONS
    # =====================================================

    def cleanup(
        self,
        max_age_seconds=900
    ):

        now = time.time()

        removed = 0

        for (
            session_id,
            session
        ) in list(
            self.sessions.items()
        ):

            if (
                now -
                session.created_at
                >
                max_age_seconds
            ):

                session.close()

                self.sessions.pop(
                    session_id,
                    None
                )

                removed += 1


        return removed


# =========================================================
# GLOBAL LIVENESS MANAGER
# =========================================================

liveness_manager = (
    LivenessManager()
)