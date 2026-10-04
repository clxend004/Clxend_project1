import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

/*
|--------------------------------------------------------------------------
| API configuration
|--------------------------------------------------------------------------
*/

const API_BASE_URL = (
  process.env.REACT_APP_LIVENESS_API ||
  "http://127.0.0.1:8001"
).replace(/\/$/, "");

/*
|--------------------------------------------------------------------------
| Frame configuration
|--------------------------------------------------------------------------
*/

const FRAME_INTERVAL_MS = 500;

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function LivenessChallenge({
  onComplete,
  onCancel,
}) {
  // =========================================================
  // CAMERA REFERENCES
  // =========================================================

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // =========================================================
  // LIVENESS REFERENCES
  // =========================================================

  const sessionIdRef = useRef(null);
  const frameTimerRef = useRef(null);
  const processingFrameRef = useRef(false);
  const mountedRef = useRef(true);
  const completedRef = useRef(false);

  // =========================================================
  // STATE
  // =========================================================

  const [loading, setLoading] = useState(true);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [session, setSession] = useState(null);

  const [currentChallenge, setCurrentChallenge] =
    useState("");

  const [completedChallenges, setCompletedChallenges] =
    useState(0);

  const [totalChallenges, setTotalChallenges] =
    useState(5);

  const [accuracy, setAccuracy] = useState(0);

  const [status, setStatus] = useState(
    "Starting liveness verification..."
  );

  const [error, setError] = useState("");

  // =========================================================
  // STOP CAMERA
  // =========================================================

  const stopCamera = useCallback(() => {
    if (frameTimerRef.current) {
      clearInterval(frameTimerRef.current);
      frameTimerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (err) {
          console.warn(
            "Camera track stop warning:",
            err
          );
        }
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (mountedRef.current) {
      setCameraStarted(false);
    }
  }, []);

  // =========================================================
  // CANCEL SERVER SESSION
  // =========================================================

  const cancelServerSession = useCallback(async () => {
    const sessionId = sessionIdRef.current;

    if (!sessionId) {
      return;
    }

    try {
      await fetch(
        `${API_BASE_URL}/liveness/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            session_id: sessionId,
          }),
        }
      );
    } catch (err) {
      console.warn(
        "Unable to cancel liveness session:",
        err
      );
    }

    sessionIdRef.current = null;
  }, []);

  // =========================================================
  // COMPLETE LIVENESS
  // =========================================================

  const completeLiveness = useCallback(
    (result) => {
      if (completedRef.current) {
        return;
      }

      completedRef.current = true;

      stopCamera();

      sessionIdRef.current = null;

      if (mountedRef.current) {
        setStatus(
          "Liveness verification passed."
        );

        setError("");
      }

      if (typeof onComplete === "function") {
        onComplete(result);
      }
    },
    [onComplete, stopCamera]
  );

  // =========================================================
  // CAPTURE CURRENT CAMERA FRAME
  // =========================================================

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return null;
    }

    if (
      video.readyState <
      HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      return null;
    }

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) {
      return null;
    }

    context.drawImage(
      video,
      0,
      0,
      width,
      height
    );

    return canvas.toDataURL(
      "image/jpeg",
      0.75
    );
  }, []);

  // =========================================================
  // SEND FRAME TO AI IDENTITY
  // =========================================================

  const sendFrame = useCallback(async () => {
    if (
      processingFrameRef.current ||
      completedRef.current
    ) {
      return;
    }

    const sessionId = sessionIdRef.current;

    if (!sessionId) {
      return;
    }

    const image = captureFrame();

    if (!image) {
      return;
    }

    processingFrameRef.current = true;

    try {
      const response = await fetch(
        `${API_BASE_URL}/liveness/frame`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            session_id: sessionId,
            image,
          }),
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error(
          `Invalid response from liveness server (${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            `Liveness frame request failed (${response.status}).`
        );
      }

      if (!mountedRef.current) {
        return;
      }

      setCurrentChallenge(
        data?.current_challenge ||
          data?.challenge ||
          ""
      );

      setCompletedChallenges(
        Number(
          data?.completed_challenges || 0
        )
      );

      setTotalChallenges(
        Number(
          data?.total_challenges || 5
        )
      );

      setAccuracy(
        Number(data?.accuracy || 0)
      );

      /*
      |--------------------------------------------------------------------------
      | Liveness passed
      |--------------------------------------------------------------------------
      */

      if (data?.passed === true) {
        completeLiveness(data);
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Normal liveness progress
      |--------------------------------------------------------------------------
      */

      if (data?.current_challenge) {
        setStatus(
          `Please ${formatChallenge(
            data.current_challenge
          )}.`
        );
      } else {
        setStatus(
          "Follow the instruction shown on screen."
        );
      }
    } catch (err) {
      console.error(
        "Liveness frame error:",
        err
      );

      if (mountedRef.current) {
        setError(
          err?.message ||
            "Unable to process the camera frame."
        );
      }
    } finally {
      processingFrameRef.current = false;
    }
  }, [
    captureFrame,
    completeLiveness,
  ]);

  // =========================================================
  // START CAMERA
  // =========================================================

  const startCamera = useCallback(async () => {
    try {
      setError("");

      setStatus(
        "Requesting camera permission..."
      );

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          "Camera access is not supported by this browser."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: {
              ideal: 640,
            },
            height: {
              ideal: 480,
            },
          },
          audio: false,
        });

      streamRef.current = stream;

      if (!videoRef.current) {
        throw new Error(
          "Camera video element is not available."
        );
      }

      videoRef.current.srcObject = stream;

      await videoRef.current.play();

      if (!mountedRef.current) {
        return;
      }

      setCameraStarted(true);

      setStatus(
        "Camera started. Follow the instruction."
      );
    } catch (err) {
      console.error(
        "Camera start error:",
        err
      );

      if (mountedRef.current) {
        setError(
          err?.message ||
            "Unable to access the camera. Please allow camera permission."
        );

        setLoading(false);
      }
    }
  }, []);

  // =========================================================
  // START AI IDENTITY LIVENESS SESSION
  // =========================================================

  const startLiveness = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      setStatus(
        "Starting AI Identity liveness session..."
      );

      const response = await fetch(
        `${API_BASE_URL}/liveness/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error(
          `Invalid response from liveness server (${response.status}).`
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            `Unable to start liveness (${response.status}).`
        );
      }

      if (!data?.session_id) {
        throw new Error(
          "Liveness server did not return a session ID."
        );
      }

      sessionIdRef.current =
        data.session_id;

      setSession(data);

      setCurrentChallenge(
        data?.current_challenge || ""
      );

      setCompletedChallenges(
        Number(
          data?.completed_challenges || 0
        )
      );

      setTotalChallenges(
        Number(
          data?.total_challenges || 5
        )
      );

      setAccuracy(
        Number(data?.accuracy || 0)
      );

      await startCamera();

      if (!mountedRef.current) {
        return;
      }

      setLoading(false);

      if (data?.current_challenge) {
        setStatus(
          `Please ${formatChallenge(
            data.current_challenge
          )}.`
        );
      } else {
        setStatus(
          "Follow the instruction shown on screen."
        );
      }
    } catch (err) {
      console.error(
        "Liveness start error:",
        err
      );

      await cancelServerSession();

      stopCamera();

      if (mountedRef.current) {
        setLoading(false);

        setError(
          err?.message ||
            "Unable to start liveness verification."
        );

        setStatus(
          "Unable to start liveness verification."
        );
      }
    }
  }, [
    cancelServerSession,
    startCamera,
    stopCamera,
  ]);

  // =========================================================
  // START SENDING FRAMES
  // =========================================================

  useEffect(() => {
    if (
      !cameraStarted ||
      !sessionIdRef.current ||
      completedRef.current
    ) {
      return undefined;
    }

    sendFrame();

    frameTimerRef.current =
      setInterval(() => {
        sendFrame();
      }, FRAME_INTERVAL_MS);

    return () => {
      if (frameTimerRef.current) {
        clearInterval(
          frameTimerRef.current
        );

        frameTimerRef.current = null;
      }
    };
  }, [
    cameraStarted,
    sendFrame,
  ]);

  // =========================================================
  // INITIALIZE
  // =========================================================

  useEffect(() => {
    mountedRef.current = true;

    startLiveness();

    return () => {
      mountedRef.current = false;

      if (frameTimerRef.current) {
        clearInterval(
          frameTimerRef.current
        );

        frameTimerRef.current = null;
      }

      stopCamera();

      const sessionId =
        sessionIdRef.current;

      if (sessionId) {
        fetch(
          `${API_BASE_URL}/liveness/cancel`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              session_id: sessionId,
            }),
          }
        ).catch((err) => {
          console.warn(
            "Liveness cleanup warning:",
            err
          );
        });

        sessionIdRef.current = null;
      }
    };
  }, [
    startLiveness,
    stopCamera,
  ]);

  // =========================================================
  // CANCEL
  // =========================================================

  const handleCancel = async () => {
    completedRef.current = true;

    stopCamera();

    await cancelServerSession();

    if (typeof onCancel === "function") {
      onCancel();
    }
  };

  // =========================================================
  // RETRY
  // =========================================================

  const handleRetry = async () => {
    completedRef.current = false;

    processingFrameRef.current = false;

    sessionIdRef.current = null;

    stopCamera();

    setSession(null);
    setCurrentChallenge("");
    setCompletedChallenges(0);
    setTotalChallenges(5);
    setAccuracy(0);
    setError("");

    await startLiveness();
  };

  // =========================================================
  // CAMERA STATUS
  // =========================================================

  const cameraStatus = error
    ? "Camera error"
    : cameraStarted
      ? "Camera live"
      : "Starting camera";

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>

        {/* HEADER */}

        <div style={styles.header}>
          <div style={styles.brand}>
            VECTRO
          </div>

          <h2 style={styles.title}>
            Liveness Verification
          </h2>

          <p style={styles.subtitle}>
            Follow the instructions to verify
            that you are a real person.
          </p>
        </div>

        {/* CAMERA */}

        <div style={styles.cameraContainer}>

          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={styles.video}
          />

          <div style={styles.cameraTopBar}>
            <div
              style={{
                ...styles.cameraStatus,
                ...(error
                  ? styles.cameraStatusError
                  : cameraStarted
                    ? styles.cameraStatusLive
                    : styles.cameraStatusStarting),
              }}
            >
              <span style={styles.statusDot} />
              {cameraStatus}
            </div>
          </div>

          <div style={styles.faceGuide} />

          <div style={styles.cameraHint}>
            Position your face inside the oval
          </div>

          <canvas
            ref={canvasRef}
            style={styles.hiddenCanvas}
          />
        </div>

        {/* LOADING */}

        {loading && (
          <div style={styles.infoBox}>
            <div style={styles.spinner}>
              <span>●</span>
            </div>

            <p style={styles.infoText}>
              {status}
            </p>
          </div>
        )}

        {/* CURRENT CHALLENGE */}

        {!loading &&
          !error &&
          !completedRef.current && (
            <div style={styles.challengeBox}>

              <p style={styles.challengeTitle}>
                CURRENT INSTRUCTION
              </p>

              <p style={styles.challengeText}>
                {currentChallenge
                  ? formatChallenge(
                      currentChallenge
                    )
                  : status}
              </p>

              <div style={styles.progressRow}>
                <span>
                  Challenges
                </span>

                <strong>
                  {completedChallenges} /{" "}
                  {totalChallenges}
                </strong>
              </div>

              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${
                      totalChallenges > 0
                        ? Math.min(
                            100,
                            (completedChallenges /
                              totalChallenges) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>

              <p style={styles.accuracyText}>
                Accuracy:{" "}
                <strong>
                  {Math.round(accuracy)}%
                </strong>
              </p>
            </div>
          )}

        {/* STATUS */}

        {!error && !loading && (
          <p style={styles.statusText}>
            {status}
          </p>
        )}

        {/* ERROR */}

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorTitle}>
              Camera / Liveness Error
            </p>

            <p style={styles.errorText}>
              {error}
            </p>

            <button
              type="button"
              onClick={handleRetry}
              style={styles.retryButton}
            >
              Try Again
            </button>
          </div>
        )}

        {/* CANCEL */}

        <button
          type="button"
          onClick={handleCancel}
          style={styles.cancelButton}
        >
          Cancel Liveness Check
        </button>

        {/* SESSION */}

        {session?.session_id && (
          <p style={styles.sessionText}>
            ● Secure liveness session active
          </p>
        )}
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Challenge text helper
|--------------------------------------------------------------------------
*/

function formatChallenge(challenge) {
  if (!challenge) {
    return "Follow the instruction shown on screen.";
  }

  const normalized =
    String(challenge)
      .trim()
      .toUpperCase();

  const labels = {
    BLINK_ONCE: "blink once",
    BLINK_TWICE: "blink twice",
    LOOK_LEFT: "look to your left",
    LOOK_RIGHT: "look to your right",
    HOLD_STILL: "hold still",
  };

  return (
    labels[normalized] ||
    String(challenge)
      .replaceAll("_", " ")
      .toLowerCase()
  );
}

/*
|--------------------------------------------------------------------------
| VECTRO DARK UI
|--------------------------------------------------------------------------
*/

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    backgroundColor:
      "rgba(3, 7, 18, 0.88)",
    backdropFilter: "blur(8px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    boxSizing: "border-box",
  },

  container: {
    width: "100%",
    maxWidth: "620px",
    maxHeight: "95vh",
    overflowY: "auto",
    background:
      "linear-gradient(145deg, #111827, #0b1220)",
    border:
      "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "24px",
    boxSizing: "border-box",
    boxShadow:
      "0 25px 80px rgba(0,0,0,0.55)",
    color: "#ffffff",
  },

  header: {
    textAlign: "center",
    marginBottom: "18px",
  },

  brand: {
    fontSize: "13px",
    fontWeight: 800,
    letterSpacing: "3px",
    color: "#60a5fa",
    marginBottom: "8px",
  },

  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: 700,
    color: "#ffffff",
  },

  subtitle: {
    marginTop: "8px",
    color: "#9ca3af",
    fontSize: "14px",
    lineHeight: 1.5,
  },

  cameraContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: "4 / 3",
    overflow: "hidden",
    borderRadius: "16px",
    backgroundColor: "#020617",
    border:
      "1px solid rgba(255,255,255,0.10)",
  },

  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: "scaleX(-1)",
  },

  cameraTopBar: {
    position: "absolute",
    top: "12px",
    left: "12px",
    right: "12px",
    display: "flex",
    justifyContent: "flex-start",
    pointerEvents: "none",
  },

  cameraStatus: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    padding: "6px 10px",
    borderRadius: "999px",
    backgroundColor:
      "rgba(3, 7, 18, 0.78)",
    backdropFilter: "blur(6px)",
    fontSize: "12px",
    fontWeight: 600,
    color: "#ffffff",
    border:
      "1px solid rgba(255,255,255,0.12)",
  },

  cameraStatusLive: {
    color: "#bbf7d0",
  },

  cameraStatusStarting: {
    color: "#fde68a",
  },

  cameraStatusError: {
    color: "#fecaca",
  },

  statusDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    backgroundColor: "#22c55e",
    boxShadow:
      "0 0 8px rgba(34,197,94,0.8)",
  },

  faceGuide: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: "55%",
    height: "75%",
    transform:
      "translate(-50%, -50%)",
    border:
      "3px solid rgba(255,255,255,0.75)",
    borderRadius: "50%",
    pointerEvents: "none",
    boxShadow:
      "0 0 0 9999px rgba(0,0,0,0.18)",
  },

  cameraHint: {
    position: "absolute",
    bottom: "12px",
    left: "50%",
    transform:
      "translateX(-50%)",
    padding: "6px 12px",
    borderRadius: "999px",
    backgroundColor:
      "rgba(3,7,18,0.72)",
    color: "#e5e7eb",
    fontSize: "11px",
    whiteSpace: "nowrap",
  },

  hiddenCanvas: {
    display: "none",
  },

  infoBox: {
    marginTop: "16px",
    padding: "16px",
    textAlign: "center",
    backgroundColor: "#172033",
    border:
      "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
  },

  spinner: {
    fontSize: "18px",
    color: "#60a5fa",
    animation:
      "pulse 1.2s infinite",
  },

  infoText: {
    margin: "8px 0 0",
    color: "#d1d5db",
    fontSize: "14px",
  },

  challengeBox: {
    marginTop: "16px",
    padding: "18px",
    textAlign: "center",
    background:
      "linear-gradient(145deg, #172033, #111827)",
    border:
      "1px solid rgba(255,255,255,0.08)",
    borderRadius: "14px",
  },

  challengeTitle: {
    margin: 0,
    fontSize: "11px",
    letterSpacing: "1.5px",
    fontWeight: 700,
    color: "#60a5fa",
  },

  challengeText: {
    margin: "10px 0 16px",
    fontSize: "23px",
    fontWeight: 700,
    color: "#ffffff",
    textTransform: "capitalize",
  },

  progressRow: {
    display: "flex",
    justifyContent: "space-between",
    color: "#9ca3af",
    fontSize: "13px",
  },

  progressTrack: {
    height: "6px",
    marginTop: "8px",
    borderRadius: "999px",
    overflow: "hidden",
    backgroundColor: "#273449",
  },

  progressFill: {
    height: "100%",
    borderRadius: "999px",
    background:
      "linear-gradient(90deg, #2563eb, #60a5fa)",
    transition:
      "width 0.3s ease",
  },

  accuracyText: {
    margin: "12px 0 0",
    fontSize: "13px",
    color: "#9ca3af",
  },

  statusText: {
    textAlign: "center",
    margin: "14px 0",
    color: "#d1d5db",
    fontSize: "14px",
  },

  errorBox: {
    marginTop: "16px",
    padding: "16px",
    backgroundColor: "#2a1518",
    border:
      "1px solid rgba(248,113,113,0.25)",
    borderRadius: "12px",
    textAlign: "center",
  },

  errorTitle: {
    margin: "0 0 6px",
    color: "#fca5a5",
    fontWeight: 700,
    fontSize: "14px",
  },

  errorText: {
    margin: "0 0 12px",
    color: "#fecaca",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  retryButton: {
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    cursor: "pointer",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: 600,
  },

  cancelButton: {
    width: "100%",
    marginTop: "16px",
    padding: "12px",
    borderRadius: "10px",
    border:
      "1px solid rgba(255,255,255,0.12)",
    backgroundColor: "#172033",
    color: "#d1d5db",
    cursor: "pointer",
    fontWeight: 600,
  },

  sessionText: {
    margin: "10px 0 0",
    textAlign: "center",
    fontSize: "11px",
    color: "#6ee7b7",
  },
};