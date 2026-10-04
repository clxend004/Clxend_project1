import React, { useEffect, useRef, useState } from "react";
import AppLayout from "../components/AppLayout";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  generateOTP,
  verifyOTP,
  saveKYC,
} from "../services/kycService";
import BackgroundWrapper from "../components/BackgroundWrapper";
import LivenessChallenge from "../components/LivenessChallenge";
import { maskGovId } from "../utils/sensitiveData";
import { convertImageFileToJpeg } from "../utils/fileUtils";

export default function KYCScreen() {
  const navigate = useNavigate();
  const location = useLocation();

  // =========================================================
  // STEP CONTROL
  // =========================================================

  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    {
      number: 1,
      title: "Personal",
      subtitle: "Information",
      icon: "👤",
    },
    {
      number: 2,
      title: "ID",
      subtitle: "Verification",
      icon: "🪪",
    },
    {
      number: 3,
      title: "Selfie",
      subtitle: "Verification",
      icon: "🤳",
    },
    {
      number: 4,
      title: "Review",
      subtitle: "& Submit",
      icon: "✓",
    },
  ];

  // =========================================================
  // PERSONAL DETAILS
  // =========================================================

  const [personalDetails, setPersonalDetails] = useState({
    fullName: "",
    dob: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [personalErrors, setPersonalErrors] = useState({});

  const [accountEmail, setAccountEmail] = useState("");
  const [accountMobile, setAccountMobile] = useState("");
  const [mobileDraft, setMobileDraft] = useState("");
  const [mobileConfirmError, setMobileConfirmError] = useState("");

  // =========================================================
  // GOVERNMENT ID
  // =========================================================

  const [govIdType, setGovIdType] = useState("");
  const [govIdNumber, setGovIdNumber] = useState("");
  const [govIdError, setGovIdError] = useState("");

  // =========================================================
  // OTP
  // =========================================================

  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // =========================================================
  // DOCUMENT / SELFIE
  // =========================================================

  const [documentFile, setDocumentFile] = useState(null);
  const [selfie, setSelfie] = useState(null);

  // =========================================================
  // STATUS
  // =========================================================

  const [status, setStatus] = useState("");
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // =========================================================
  // BROWSER LIVENESS
  // =========================================================

  const [showLivenessChallenge, setShowLivenessChallenge] =
    useState(false);

  const [livenessPassed, setLivenessPassed] =
    useState(false);

  const [livenessResult, setLivenessResult] =
    useState(null);

  const [livenessScore, setLivenessScore] =
    useState(0);

  const [livenessStatus, setLivenessStatus] =
    useState("");

  // =========================================================
  // CAMERA
  // =========================================================

  const [cameraOn, setCameraOn] = useState(false);

  // =========================================================
  // MESSAGES
  // =========================================================

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // =========================================================
  // REFS
  // =========================================================

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const selfieInputRef = useRef(null);
  const govIdRef = useRef(null);
  const otpRef = useRef(null);

  // =========================================================
  // LOAD NAVIGATION STATE
  // =========================================================

  useEffect(() => {
    const returnedData = location.state;

    if (!returnedData) {
      return;
    }

    if (returnedData.selfie) {
      setSelfie(returnedData.selfie);
    }

    if (returnedData.otpVerified) {
      setOtpVerified(true);
      setOtpSent(true);
    }

    if (returnedData.documentFile) {
      setDocumentFile(returnedData.documentFile);
    }

    if (returnedData.govId) {
      setGovIdNumber(returnedData.govId);
    }

    if (returnedData.govIdType) {
      setGovIdType(returnedData.govIdType);
    }

    if (returnedData.personalDetails) {
      setPersonalDetails(returnedData.personalDetails);
    }

    if (returnedData.email) {
      setAccountEmail(returnedData.email);
    }

    if (returnedData.mobile) {
      setAccountMobile(returnedData.mobile);
    }

    /*
     * Remove navigation state from browser history
     * after reading it.
     */
    window.history.replaceState({}, document.title);
  }, [location.state]);

  // =========================================================
  // LOAD CURRENT REGISTERED ACCOUNT DETAILS
  // =========================================================

  useEffect(() => {
    const loadAccountDetails = () => {
      let email = "";
      let mobile = "";

      // -------------------------------------------------------
      // 1. Direct email keys
      // -------------------------------------------------------

      const emailKeys = [
        "userEmail",
        "email",
        "registeredEmail",
        "accountEmail",
      ];

      for (const key of emailKeys) {
        const value = localStorage.getItem(key);

        if (value && value.trim()) {
          email = value.trim();
          break;
        }
      }

      // -------------------------------------------------------
      // 2. Direct mobile keys
      // -------------------------------------------------------

      const mobileKeys = [
        "userMobile",
        "mobile",
        "phone",
        "phoneNumber",
        "mobileNumber",
        "registeredMobile",
        "accountMobile",
      ];

      for (const key of mobileKeys) {
        const value = localStorage.getItem(key);

        if (value && value.trim()) {
          mobile = value.trim();
          break;
        }
      }

      // -------------------------------------------------------
      // 3. Check stored user object
      // -------------------------------------------------------

      const possibleUserKeys = [
        "user",
        "currentUser",
        "loggedInUser",
        "registeredUser",
        "userData",
      ];

      for (const key of possibleUserKeys) {
        const storedUser = localStorage.getItem(key);

        if (!storedUser) {
          continue;
        }

        try {
          const parsedUser = JSON.parse(storedUser);

          if (!email) {
            email =
              parsedUser?.email ||
              parsedUser?.userEmail ||
              "";
          }

          if (!mobile) {
            mobile =
              parsedUser?.mobile ||
              parsedUser?.phone ||
              parsedUser?.phoneNumber ||
              parsedUser?.mobileNumber ||
              "";
          }

          if (email || mobile) {
            break;
          }
        } catch (error) {
          // Ignore invalid JSON in localStorage.
        }
      }

      setAccountEmail(email);
      setAccountMobile(mobile);
    };

    loadAccountDetails();
  }, []);

  // =========================================================
  // MOBILE FALLBACK
  // =========================================================

  const handleConfirmMobile = () => {
    const digits = mobileDraft.replace(/\D/g, "");

    if (!digits || digits.length < 7) {
      setMobileConfirmError(
        "Enter a valid mobile number"
      );
      return;
    }

    setAccountMobile(digits);
    setMobileConfirmError("");

    localStorage.setItem("userMobile", digits);
    localStorage.setItem("registeredMobile", digits);
  };

  // =========================================================
  // PERSONAL DETAILS CHANGE
  // =========================================================

  const handlePersonalChange = (name, value) => {
    let newValue = value;

    if (name === "pincode") {
      newValue = value
        .replace(/\D/g, "")
        .slice(0, 6);
    }

    if (name === "fullName") {
      newValue = value.replace(/[0-9]/g, "");
    }

    setPersonalDetails((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    setPersonalErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setErrorMessage("");
  };

  // =========================================================
  // PERSONAL VALIDATION
  // =========================================================

  const validatePersonalDetails = () => {
    const errors = {};

    if (!personalDetails.fullName.trim()) {
      errors.fullName = "Full name is required";
    } else if (
      personalDetails.fullName.trim().length < 3
    ) {
      errors.fullName = "Enter a valid full name";
    }

    if (!personalDetails.dob) {
      errors.dob = "Date of birth is required";
    }

    if (!personalDetails.gender) {
      errors.gender = "Select gender";
    }

    if (!personalDetails.address.trim()) {
      errors.address = "Address is required";
    }

    if (!personalDetails.city.trim()) {
      errors.city = "City is required";
    }

    if (!personalDetails.state.trim()) {
      errors.state = "State is required";
    }

    if (!personalDetails.pincode) {
      errors.pincode = "Pincode is required";
    } else if (
      personalDetails.pincode.length !== 6
    ) {
      errors.pincode =
        "Pincode must be 6 digits";
    }

    setPersonalErrors(errors);

    return Object.keys(errors).length === 0;
  };

  // =========================================================
  // STEP 1 → STEP 2
  // =========================================================

  const handlePersonalNext = () => {
    if (!validatePersonalDetails()) {
      setErrorMessage(
        "Please complete all personal details."
      );
      return;
    }

    setErrorMessage("");
    setMessage("");
    setCurrentStep(2);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================================
  // GOVERNMENT ID CHANGE
  // =========================================================

  const handleGovIdChange = (value) => {
    let error = "";

    value = value.trim();

    if (govIdType === "aadhaar") {
      value = value.replace(/\D/g, "");

      if (value.length > 12) {
        return;
      }

      if (
        value &&
        value.length !== 12
      ) {
        error =
          "Aadhaar must be 12 digits";
      }
    }

    if (govIdType === "pan") {
      value = value.toUpperCase();

      if (value.length > 10) {
        return;
      }

      if (
        value &&
        !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(
          value
        )
      ) {
        error =
          "PAN format: ABCDE1234F";
      }
    }

    if (govIdType === "voter") {
      value = value.toUpperCase();

      if (value.length > 10) {
        return;
      }

      if (
        value &&
        !/^[A-Z0-9]{10}$/.test(value)
      ) {
        error =
          "Voter ID must be 10 alphanumeric characters";
      }
    }

    setGovIdNumber(value);
    setGovIdError(error);
    setErrorMessage("");
  };

  // =========================================================
  // GENERATE OTP
  // =========================================================

  const handleGenerateOTP = async () => {
    if (!govIdType) {
      setErrorMessage(
        "Select Government ID Type"
      );
      return;
    }

    if (!govIdNumber) {
      govIdRef.current?.focus();

      setErrorMessage(
        "Enter Government ID Number"
      );

      return;
    }

    if (govIdError) {
      setErrorMessage(
        "Fix ID errors first"
      );

      return;
    }

    try {
      const response = await generateOTP();

      console.log(
        "Generated OTP:",
        response.otp
      );

      setOtpSent(true);
      setEnteredOtp("");
      setErrorMessage("");

      setMessage(
        "OTP sent successfully. Check console for the demo OTP."
      );
    } catch (error) {
      console.error(
        "OTP Error:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Unable to generate OTP"
      );
    }
  };

  // =========================================================
  // VERIFY OTP
  // =========================================================

  const handleVerifyOtp = async () => {
    if (!enteredOtp) {
      otpRef.current?.focus();

      setErrorMessage(
        "Enter OTP"
      );

      return;
    }

    if (enteredOtp.length !== 6) {
      setErrorMessage(
        "OTP must be 6 digits"
      );

      return;
    }

    try {
      await verifyOTP(enteredOtp);

      setOtpVerified(true);

      setMessage(
        "OTP Verified Successfully ✓"
      );

      setErrorMessage("");

      setCurrentStep(3);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      setErrorMessage(
        error?.message ||
          "Invalid OTP"
      );

      setMessage("");
    }
  };

  // =========================================================
  // DOCUMENT PICK
  // =========================================================

  const pickDocument = async (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    /*
     * Common image formats are accepted here and converted
     * to JPEG automatically before submission.
     */
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      window.alert(
        "Please upload a JPG, PNG, or WEBP photo of your document. PDF and HEIC are not supported yet. Please use a regular photo instead."
      );

      e.target.value = "";
      return;
    }

    if (
      file.size >
      8 * 1024 * 1024
    ) {
      window.alert(
        "File must be less than 8MB"
      );

      e.target.value = "";
      return;
    }

    try {
      const jpegFile =
        file.type === "image/jpeg"
          ? file
          : await convertImageFileToJpeg(file);

      if (
        jpegFile.size >
        2 * 1024 * 1024
      ) {
        window.alert(
          "This image is too large even after conversion. Please use a smaller photo (under 2MB)."
        );

        e.target.value = "";
        return;
      }

      setDocumentFile(jpegFile);

      setLivenessPassed(false);
      setLivenessResult(null);
      setLivenessScore(0);
      setLivenessStatus("");

      setErrorMessage("");
      setMessage("");

    } catch (error) {
      console.error(
        "Document conversion failed:",
        error
      );

      window.alert(
        "This image couldn't be processed. Please try a different photo."
      );

      e.target.value = "";
    }
  };

  // =========================================================
  // START CAMERA
  // =========================================================

  const startCamera = async () => {
    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        window.alert(
          "Camera is not supported by this browser."
        );

        return;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: true,
            audio: false,
          }
        );

      setCameraOn(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject =
            stream;

          videoRef.current.play();
        }
      }, 200);
    } catch (error) {
      console.error(
        "Camera Error:",
        error
      );

      setCameraOn(false);

      window.alert(
        "Unable to access camera. Please allow camera permission."
      );
    }
  };

  // =========================================================
  // STOP CAMERA
  // =========================================================

  const stopCamera = () => {
    if (
      videoRef.current &&
      videoRef.current.srcObject
    ) {
      const tracks =
        videoRef.current.srcObject.getTracks();

      tracks.forEach((track) =>
        track.stop()
      );

      videoRef.current.srcObject =
        null;
    }
  };

  // =========================================================
  // CAPTURE SELFIE
  // =========================================================

  const captureSelfie = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return;
    }

    if (!video.srcObject) {
      return;
    }

    const context =
      canvas.getContext("2d");

    const videoWidth =
      video.videoWidth;

    const videoHeight =
      video.videoHeight;

    if (
      !videoWidth ||
      !videoHeight
    ) {
      window.alert(
        "Camera is not ready. Please try again."
      );

      return;
    }

    const size = 300;

    canvas.width = size;
    canvas.height = size;

    const minSide = Math.min(
      videoWidth,
      videoHeight
    );

    const sx =
      (videoWidth - minSide) / 2;

    const sy =
      (videoHeight - minSide) / 2;

    context.drawImage(
      video,
      sx,
      sy,
      minSide,
      minSide,
      0,
      0,
      size,
      size
    );

    const imageData =
      canvas.toDataURL(
        "image/jpeg",
        0.92
      );

    setSelfie(imageData);

    stopCamera();
    setCameraOn(false);

    setErrorMessage("");
  };

  // =========================================================
  // SELFIE OPTION
  // =========================================================

  const handleSelfieOption = () => {
    const choice = window.confirm(
      "Press OK to open Camera\nPress Cancel to Upload Image"
    );

    if (choice) {
      startCamera();
    } else {
      selfieInputRef.current?.click();
    }
  };

  // =========================================================
  // SELFIE UPLOAD
  // =========================================================

  const handleSelfieUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      window.alert(
        "Please upload a JPG, PNG, or WEBP photo. PDF and HEIC are not supported yet. Please use a regular photo instead."
      );

      e.target.value = "";
      return;
    }

    if (
      file.size >
      8 * 1024 * 1024
    ) {
      window.alert(
        "File must be less than 8MB"
      );

      e.target.value = "";
      return;
    }

    try {
      const jpegFile =
        file.type === "image/jpeg"
          ? file
          : await convertImageFileToJpeg(file);

      if (
        jpegFile.size >
        2 * 1024 * 1024
      ) {
        window.alert(
          "This image is too large even after conversion. Please use a smaller photo (under 2MB)."
        );

        e.target.value = "";
        return;
      }

      const reader = new FileReader();

      reader.onloadend = () => {
        setSelfie(reader.result);
        setErrorMessage("");
      };

      reader.readAsDataURL(jpegFile);
    } catch (error) {
      console.error(
        "Selfie conversion failed:",
        error
      );

      window.alert(
        "This image couldn't be processed. Please try a different photo."
      );

      e.target.value = "";
    }
  };

  // =========================================================
  // BROWSER LIVENESS
  // =========================================================

  const handleLivenessCheck = () => {
    setErrorMessage("");
    setMessage("");
    if (!documentFile) {
      setErrorMessage(
        "Please upload your identity document (ID) first."
      );
      return;
    }

    if (!selfie) {
      setErrorMessage(
        "Please capture or upload your selfie first."
      );
      return;
    }

    setLivenessPassed(false);
    setLivenessResult(null);
    setLivenessScore(0);
    setLivenessStatus("");

    setShowLivenessChallenge(true);
  };


  // =========================================================
  // LIVENESS COMPLETED
  // =========================================================

  const handleLivenessComplete = (result) => {
    console.log("Liveness result:", result);

    const status = String(result?.status || "").toUpperCase();

    const passed =
      result?.passed === true ||
      result?.is_real_user === true ||
      status === "PASSED" ||
      status === "PASS" ||
      status === "SUCCESS";

    const score = Number(
      result?.accuracy ??
      result?.score ??
      0
    );

    const normalizedResult = {
      ...result,
      passed,
      status: passed ? "PASSED" : "FAILED",
      accuracy: score,
    };

    setLivenessResult(normalizedResult);
    setLivenessPassed(passed);
    setLivenessScore(score);
    setLivenessStatus(passed ? "PASSED" : "FAILED");
    setShowLivenessChallenge(false);

    if (passed) {
      setErrorMessage("");

      setMessage(
        `Liveness verification passed. Accuracy: ${Math.round(score)}%`
      );
    } else {
      setMessage("");

      setErrorMessage(
        "Liveness verification failed. Please try again."
      );
    }
  };


  // =========================================================
  // CANCEL LIVENESS
  // =========================================================

  const handleLivenessCancel = () => {
    console.log(
      "Liveness verification cancelled."
    );

    setShowLivenessChallenge(false);

    setLivenessPassed(false);

    setLivenessResult(null);

    setLivenessScore(0);

    setLivenessStatus("");

    setErrorMessage(
      "Liveness verification is required before submitting KYC."
    );
  };


  // =========================================================
  // SELFIE → LIVENESS
  // =========================================================

  const handleSelfieNext = () => {
    setErrorMessage("");
    setMessage("");
    if (!documentFile) {
      setErrorMessage(
        "Please upload your identity document (ID) first."
      );
      return;
    }

    if (!selfie) {
      setErrorMessage(
        "Please capture or upload your selfie first."
      );
      return;
    }

    /*
    * Liveness must be completed before
    * entering the final KYC review step.
    */
    if (!livenessPassed) {
      handleLivenessCheck();
      return;
    }

    setCurrentStep(4);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================================
  // CAMERA CLEANUP
  // =========================================================

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // =========================================================
  // FINAL KYC SUBMIT
  // =========================================================

  const handleFinalSubmit = async () => {
    if (!validatePersonalDetails()) {
      setCurrentStep(1);

      setErrorMessage(
        "Please complete all personal details."
      );

      return;
    }

    if (
      !govIdType ||
      !govIdNumber
    ) {
      setCurrentStep(2);

      setErrorMessage(
        "Please complete your ID verification."
      );

      return;
    }

    if (govIdError) {
      setCurrentStep(2);

      setErrorMessage(
        "Please fix your Government ID details."
      );

      return;
    }

    if (!otpVerified) {
      setCurrentStep(2);

      setErrorMessage(
        "Please verify OTP first."
      );

      return;
    }

    if (
      !documentFile ||
      !selfie
    ) {
      setCurrentStep(3);

      setErrorMessage(
        "Please complete document upload and selfie verification first."
      );

      return;
    }

    if (!livenessPassed) {
      setCurrentStep(3);

      setErrorMessage(
        "Please complete and pass liveness verification before submitting KYC."
      );

      return;
    }

    setLoading(true);
    setStatus("Pending");
    setProgress(0);
    setErrorMessage("");
    setMessage("");

    try {
      let progressValue = 0;

      const interval =
        setInterval(() => {
          progressValue += 20;

          setProgress(progressValue);

          if (
            progressValue >= 100
          ) {
            clearInterval(interval);

            setTimeout(
              async () => {
                try {
                  const response =
                    await saveKYC({
                      govId:
                        govIdNumber.trim(),

                      govIdType,

                      personalDetails,

                      email:
                        accountEmail,

                      mobile:
                        accountMobile,

                      documentFile,

                      selfie,

                      livenessPassed,

                      livenessScore,

                      livenessStatus,
                    });

                  /*
                  * Prefer the real values returned by
                  * the AI Identity KYC service.
                  */
                  if (
                    response?.faceMatchScore ==
                      null ||
                    response?.liveness ==
                      null
                  ) {
                    console.warn(
                      "KYC: backend response is missing faceMatchScore/liveness."
                    );
                  }

                  const livenessResult =
                    response?.liveness ===
                    true;

                  /*
                  * The AI Identity service determines the
                  * final KYC verification status.
                  */
                  const backendStatus =
                    response?.status || "Manual review";

                  const canContinue =
                    response?.canContinue === true;

                  const faceMatchScore =
                    response?.faceMatchScore ?? null;

                  const responseReasons =
                    Array.isArray(response?.reasons)
                      ? response.reasons
                      : [];

                  const resultData = {
                    // Final KYC decision
                    status: backendStatus,

                    // Face verification
                    faceMatchScore,

                    // Simple liveness result
                    liveness: livenessPassed,

                    // Liveness score from backend, if available
                    livenessScore:
                      response?.livenessScore ??
                      livenessScore,

                    // PASSED / FAILED
                    livenessStatus:
                      response?.livenessStatus ??
                      livenessStatus,

                    // Overall AI Identity score
                    overallScore:
                      response?.overallScore ??
                      null,

                    // Detailed browser liveness result
                    livenessResult:
                      response?.livenessResult ??
                      livenessResult,

                    // OCR result
                    ocrData:
                      response?.ocrData ??
                      null,

                    // AI Identity reasons
                    reasons: responseReasons,

                    // Name
                    name:
                      response?.ocrData?.name ||
                      personalDetails?.fullName ||
                      "",

                    // Masked government ID
                    maskedIdNumber:
                      maskGovId(govIdNumber),

                    // Submission timestamp
                    submittedAt:
                      new Date().toISOString(),
                  };

                  setReasons(responseReasons);

                    localStorage.setItem(
                      "kycResult",
                      JSON.stringify(resultData)
                    );

                    localStorage.setItem(
                      "kycStatus",
                      backendStatus
                    );

                    setLoading(false);

                  if (canContinue) {
                     navigate("/verification-result", {
                       state: {
                         ...resultData,
                         canContinue: true,
                        },
                       });
                  } else {
                    navigate("/verification-result", {
                      state: resultData,
                  });
               }

                  localStorage.setItem(
                    "kycResult",
                    JSON.stringify({
                      status: resultData.status,
                      faceMatchScore: resultData.faceMatchScore,

                      liveness: resultData.liveness,
                      livenessScore: resultData.livenessScore,
                      livenessStatus: resultData.livenessStatus,
                      overallScore: resultData.overallScore,

                      livenessResult: resultData.livenessResult,

                      maskedIdNumber: resultData.maskedIdNumber,
                      name: resultData.name,
                      submittedAt: resultData.submittedAt,

                      ocrData: resultData.ocrData,
                      reasons: resultData.reasons,
                    })
                  );

                  /*
                   * Store only a minimal summary in localStorage.
                   *
                   * Raw ID numbers, selfie images, address,
                   * date of birth and other sensitive information
                   * should not be persisted there.
                   */
                  const minimalKycSummary = {
                    status:
                      backendStatus,

                    faceMatchScore,

                    liveness:
                      livenessResult,

                    livenessScore:
                      response?.livenessScore ??
                      livenessScore,

                    livenessStatus:
                      response?.livenessStatus ??
                      livenessStatus,

                    overallScore:
                      response?.overallScore ??
                      null,

                    maskedIdNumber:
                      maskGovId(
                        govIdNumber
                      ),

                    name:
                      personalDetails.fullName,

                    submittedAt:
                      new Date().toISOString(),
                  };

                  localStorage.setItem(
                    "kycStatus",
                    backendStatus
                  );

                  localStorage.setItem(
                    "kycResult",
                    JSON.stringify(
                      minimalKycSummary
                    )
                  );

                  setLoading(false);

                  navigate(
                    "/verification-result",
                    {
                      state:
                        resultData,
                    }
                  );
                } catch (error) {
                  console.error(
                    "KYC Submission Error:",
                    error
                  );

                  setErrorMessage(
                    error?.message ||
                      "KYC submission failed. Please try again."
                  );

                  setLoading(false);
                }
              },
              500
            );
          }
        }, 300);
    } catch (error) {
      console.error(
        "KYC Submission Error:",
        error
      );

      setLoading(false);

      setErrorMessage(
        error?.message ||
          "KYC submission failed"
      );
    }
  };

  // =========================================================
  // STATUS COLOR
  // =========================================================

  const getStatusColor = () => {
    if (status === "Approved") {
      return "#34d399";
    }

    if (status === "Rejected") {
      return "#f87171";
    }

    if (status === "Pending") {
      return "#fbbf24";
    }

    return "#94a3b8";
  };

  // =========================================================
  // STATUS ICON
  // =========================================================

  const getStatusIcon = (
    currentStatus
  ) => {
    if (
      currentStatus ===
      "Approved"
    ) {
      return "✓";
    }

    if (
      currentStatus ===
      "Rejected"
    ) {
      return "✕";
    }

    if (
      currentStatus ===
      "Manual review"
    ) {
      return "!";
    }

    return "…";
  };

  // =========================================================
  // STEP NAVIGATION
  // =========================================================

  const goToStep = (step) => {
    if (step === 1) {
      setCurrentStep(1);
      setErrorMessage("");
      return;
    }

    if (step === 2) {
      if (
        validatePersonalDetails()
      ) {
        setCurrentStep(2);
        setErrorMessage("");
      } else {
        setCurrentStep(1);

        setErrorMessage(
          "Complete personal information first."
        );
      }

      return;
    }

    if (step === 3) {
      if (!otpVerified) {
        setCurrentStep(2);

        setErrorMessage(
          "Complete ID verification first."
        );

        return;
      }

      setCurrentStep(3);
      setErrorMessage("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    if (step === 4) {
      if (!otpVerified) {
        setCurrentStep(2);

        setErrorMessage(
          "Complete ID verification first."
        );

        return;
      }

      if (
        !documentFile ||
        !selfie
      ) {
        setCurrentStep(3);

        setErrorMessage(
          "Complete document and selfie verification first."
        );

        return;
      }

      if (!livenessPassed) {
        setCurrentStep(3);

        setErrorMessage(
          "Complete liveness verification first."
        );

        return;
      }

      setCurrentStep(4);
      setErrorMessage("");
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================================
  // BACK BUTTON
  // =========================================================

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(
        currentStep - 1
      );

      setErrorMessage("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  // =========================================================
  // STEP INDICATOR
  // =========================================================

  const renderStepIndicator = () => {
    return (
      <div style={styles.stepper}>
        {steps.map(
          (step, index) => {
            const completed =
              (step.number === 1 &&
                currentStep > 1) ||
              (step.number === 2 &&
                otpVerified) ||
              (step.number === 3 &&
                documentFile &&
                selfie &&
                livenessPassed) ||
              (step.number === 4 &&
                status ===
                  "Approved");

            const active =
              currentStep ===
              step.number;

            return (
              <React.Fragment
                key={step.number}
              >
                <button
                  type="button"
                  style={{
                    ...styles.stepItem,

                    ...(active
                      ? styles.stepItemActive
                      : {}),
                  }}
                  onClick={() =>
                    goToStep(
                      step.number
                    )
                  }
                >
                  <div
                    style={{
                      ...styles.stepCircle,

                      ...(active
                        ? styles.stepCircleActive
                        : {}),

                      ...(completed
                        ? styles.stepCircleCompleted
                        : {}),
                    }}
                  >
                    {completed
                      ? "✓"
                      : step.icon}
                  </div>

                  <div
                    style={
                      styles.stepText
                    }
                  >
                    <span
                      style={{
                        ...styles.stepTitle,

                        ...(active
                          ? styles.stepTitleActive
                          : {}),
                      }}
                    >
                      {step.title}
                    </span>

                    <span
                      style={
                        styles.stepSubtitle
                      }
                    >
                      {
                        step.subtitle
                      }
                    </span>
                  </div>
                </button>

                {index <
                  steps.length -
                    1 && (
                  <div
                    style={{
                      ...styles.stepLine,

                      ...(currentStep >
                      step.number
                        ? styles.stepLineActive
                        : {}),
                    }}
                  />
                )}
              </React.Fragment>
            );
          }
        )}
      </div>
    );
  };

  // =========================================================
  // PERSONAL STEP
  // =========================================================

  const renderPersonalStep = () => {
    return (
      <div style={styles.section}>
        <div
          style={
            styles.sectionHeader
          }
        >
          <div
            style={
              styles.sectionIcon
            }
          >
            👤
          </div>

          <div>
            <h3
              style={
                styles.sectionTitle
              }
            >
              Personal Information
            </h3>

            <p
              style={
                styles.sectionSubtitle
              }
            >
              Enter your details exactly
              as they appear on your
              government ID.
            </p>
          </div>
        </div>

        {/* REGISTERED ACCOUNT DETAILS */}

        <div
          style={
            styles.accountBox
          }
        >
          <div
            style={
              styles.accountItem
            }
          >
            <span
              style={
                styles.accountLabel
              }
            >
              Registered Email
            </span>

            <strong
              style={
                styles.accountValue
              }
            >
              {accountEmail ||
                "Not available"}
            </strong>
          </div>

          <div
            style={
              styles.accountItem
            }
          >
            <span
              style={
                styles.accountLabel
              }
            >
              Registered Mobile
            </span>

            {accountMobile ? (
              <strong
                style={
                  styles.accountValue
                }
              >
                {accountMobile}
              </strong>
            ) : (
              <div
                style={
                  styles.mobileFallback
                }
              >
                <p
                  style={
                    styles.mobileFallbackNote
                  }
                >
                  We couldn't find a
                  mobile number on your
                  account. Please confirm
                  it below.
                </p>

                <div
                  style={
                    styles.mobileFallbackRow
                  }
                >
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="Enter mobile number"
                    value={
                      mobileDraft
                    }
                    onChange={(e) =>
                      setMobileDraft(
                        e.target.value
                          .replace(
                            /\D/g,
                            ""
                          )
                          .slice(
                            0,
                            15
                          )
                      )
                    }
                    style={
                      styles.mobileFallbackInput
                    }
                  />

                  <button
                    type="button"
                    onClick={
                      handleConfirmMobile
                    }
                    style={
                      styles.mobileFallbackButton
                    }
                  >
                    Confirm
                  </button>
                </div>

                {mobileConfirmError && (
                  <p
                    style={
                      styles.mobileFallbackError
                    }
                  >
                    {
                      mobileConfirmError
                    }
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <label
          style={styles.label}
        >
          Full Name
        </label>

        <input
          type="text"
          placeholder="Enter your full name"
          value={
            personalDetails.fullName
          }
          onChange={(e) =>
            handlePersonalChange(
              "fullName",
              e.target.value
            )
          }
          style={{
            ...styles.input,

            ...(personalErrors.fullName
              ? styles.inputError
              : {}),
          }}
        />

        {personalErrors.fullName && (
          <p
            style={
              styles.errorText
            }
          >
            {
              personalErrors.fullName
            }
          </p>
        )}

        <div
          style={
            styles.twoColumn
          }
        >
          <div>
            <label
              style={
                styles.label
              }
            >
              Date of Birth
            </label>

            <input
              type="date"
              value={
                personalDetails.dob
              }
              onChange={(e) =>
                handlePersonalChange(
                  "dob",
                  e.target.value
                )
              }
              style={{
                ...styles.input,

                ...(personalErrors.dob
                  ? styles.inputError
                  : {}),
              }}
            />

            {personalErrors.dob && (
              <p
                style={
                  styles.errorText
                }
              >
                {
                  personalErrors.dob
                }
              </p>
            )}
          </div>

          <div>
            <label
              style={
                styles.label
              }
            >
              Gender
            </label>

            <select
              value={
                personalDetails.gender
              }
              onChange={(e) =>
                handlePersonalChange(
                  "gender",
                  e.target.value
                )
              }
              style={{
                ...styles.input,

                ...(personalErrors.gender
                  ? styles.inputError
                  : {}),
              }}
            >
              <option value="">
                Select
              </option>

              <option value="Male">
                Male
              </option>

              <option value="Female">
                Female
              </option>

              <option value="Other">
                Other
              </option>
            </select>

            {personalErrors.gender && (
              <p
                style={
                  styles.errorText
                }
              >
                {
                  personalErrors.gender
                }
              </p>
            )}
          </div>
        </div>

        <label
          style={styles.label}
        >
          Address
        </label>

        <textarea
          placeholder="Enter your full address"
          value={
            personalDetails.address
          }
          onChange={(e) =>
            handlePersonalChange(
              "address",
              e.target.value
            )
          }
          rows={3}
          style={{
            ...styles.input,
            ...styles.textarea,

            ...(personalErrors.address
              ? styles.inputError
              : {}),
          }}
        />

        {personalErrors.address && (
          <p
            style={
              styles.errorText
            }
          >
            {
              personalErrors.address
            }
          </p>
        )}

        <div
          style={
            styles.twoColumn
          }
        >
          <div>
            <label
              style={
                styles.label
              }
            >
              City
            </label>

            <input
              type="text"
              placeholder="Enter city"
              value={
                personalDetails.city
              }
              onChange={(e) =>
                handlePersonalChange(
                  "city",
                  e.target.value
                )
              }
              style={{
                ...styles.input,

                ...(personalErrors.city
                  ? styles.inputError
                  : {}),
              }}
            />

            {personalErrors.city && (
              <p
                style={
                  styles.errorText
                }
              >
                {
                  personalErrors.city
                }
              </p>
            )}
          </div>

          <div>
            <label
              style={
                styles.label
              }
            >
              State
            </label>

            <input
              type="text"
              placeholder="Enter state"
              value={
                personalDetails.state
              }
              onChange={(e) =>
                handlePersonalChange(
                  "state",
                  e.target.value
                )
              }
              style={{
                ...styles.input,

                ...(personalErrors.state
                  ? styles.inputError
                  : {}),
              }}
            />

            {personalErrors.state && (
              <p
                style={
                  styles.errorText
                }
              >
                {
                  personalErrors.state
                }
              </p>
            )}
          </div>
        </div>

        <label
          style={styles.label}
        >
          Pincode
        </label>

        <input
          type="text"
          inputMode="numeric"
          placeholder="Enter 6-digit pincode"
          value={
            personalDetails.pincode
          }
          onChange={(e) =>
            handlePersonalChange(
              "pincode",
              e.target.value
            )
          }
          style={{
            ...styles.input,

            ...(personalErrors.pincode
              ? styles.inputError
              : {}),
          }}
        />

        {personalErrors.pincode && (
          <p
            style={
              styles.errorText
            }
          >
            {
              personalErrors.pincode
            }
          </p>
        )}

        <button
          style={
            styles.nextButton
          }
          onClick={
            handlePersonalNext
          }
        >
          Continue to ID Verification →
        </button>
      </div>
    );
  };

  // =========================================================
  // ID STEP
  // =========================================================

  const renderIdStep = () => {
    return (
      <div style={styles.section}>
        <div
          style={
            styles.sectionHeader
          }
        >
          <div
            style={
              styles.sectionIcon
            }
          >
            🪪
          </div>

          <div>
            <h3
              style={
                styles.sectionTitle
              }
            >
              ID Verification
            </h3>

            <p
              style={
                styles.sectionSubtitle
              }
            >
              Verify your government-issued
              identity.
            </p>
          </div>
        </div>

        <label
          style={styles.label}
        >
          Government ID Type
        </label>

        <select
          value={govIdType}
          disabled={otpVerified}
          onChange={(e) => {
            setGovIdType(
              e.target.value
            );

            setGovIdNumber("");

            setGovIdError("");

            setOtpSent(false);

            setEnteredOtp("");

            setOtpVerified(false);

            setErrorMessage("");

            setMessage("");
          }}
          style={styles.input}
        >
          <option value="">
            Select Government ID Type
          </option>

          <option value="aadhaar">
            Aadhaar
          </option>

          <option value="pan">
            PAN
          </option>

          <option value="voter">
            Voter ID
          </option>
        </select>

        <label
          style={styles.label}
        >
          ID Number
        </label>

        <input
          type="text"
          ref={govIdRef}
          disabled={otpVerified}
          placeholder="Enter ID Number"
          value={govIdNumber}
          onChange={(e) =>
            handleGovIdChange(
              e.target.value
            )
          }
          style={{
            ...styles.input,

            ...(govIdError
              ? styles.inputError
              : {}),
          }}
        />

        {govIdError && (
          <p
            style={
              styles.errorText
            }
          >
            {govIdError}
          </p>
        )}

        {govIdNumber &&
          !govIdError && (
            <p
              style={
                styles.validText
              }
            >
              ✓ ID number format is valid
            </p>
          )}

        {!otpSent &&
          !otpVerified && (
            <button
              style={
                styles.nextButton
              }
              onClick={
                handleGenerateOTP
              }
            >
              ✓ Verify OTP
            </button>
          )}

        {otpSent &&
          !otpVerified && (
            <div
              style={
                styles.otpBox
              }
            >
              <div
                style={
                  styles.otpHeader
                }
              >
                <span>✓</span>

                <div>
                  <strong>
                    OTP Verification
                  </strong>

                  <p
                    style={
                      styles.otpBoxText
                    }
                  >
                    Enter the 6-digit OTP
                    generated for
                    verification.
                  </p>
                </div>
              </div>

              <label
                style={
                  styles.label
                }
              >
                Enter OTP
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                ref={otpRef}
                placeholder="Enter 6-digit OTP"
                value={enteredOtp}
                onChange={(e) => {
                  const value =
                    e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6);

                  setEnteredOtp(
                    value
                  );

                  setErrorMessage("");
                }}
                style={
                  styles.input
                }
              />

              <button
                style={
                  styles.nextButton
                }
                onClick={
                  handleVerifyOtp
                }
              >
                ✓ Verify OTP
              </button>
            </div>
          )}

        {otpVerified && (
          <div
            style={
              styles.verifiedBox
            }
          >
            <div
              style={
                styles.verifiedIcon
              }
            >
              ✓
            </div>

            <div>
              <strong>
                Identity Verified
              </strong>

              <p>
                Your OTP has been
                successfully verified.
              </p>
            </div>
          </div>
        )}

        <div
          style={
            styles.navigationRow
          }
        >
          <button
            style={
              styles.backButton
            }
            onClick={handleBack}
          >
            ← Back
          </button>

          {otpVerified && (
            <button
              style={
                styles.nextSmallButton
              }
              onClick={() => {
                setCurrentStep(3);

                window.scrollTo({
                  top: 0,
                  behavior:
                    "smooth",
                });
              }}
            >
              Continue →
            </button>
          )}
        </div>
      </div>
    );
  };

  // =========================================================
  // SELFIE STEP
  // =========================================================

  const renderSelfieStep = () => {
    return (
      <div style={styles.section}>
        <div
          style={
            styles.sectionHeader
          }
        >
          <div
            style={
              styles.sectionIcon
            }
          >
            🤳
          </div>

          <div>
            <h3
              style={
                styles.sectionTitle
              }
            >
              Selfie Verification
            </h3>

            <p
              style={
                styles.sectionSubtitle
              }
            >
              Upload your identity document
              and complete face
              verification.
            </p>
          </div>
        </div>

        {/* DOCUMENT */}

        <div
          style={
            styles.uploadCard
          }
        >
          <div
            style={
              styles.uploadIcon
            }
          >
            🪪
          </div>

          <div
            style={
              styles.uploadContent
            }
          >
            <strong>
              Identity Document
            </strong>

            <p>
              JPG, PNG or WEBP • Maximum
              8MB
            </p>
          </div>

          <label
            style={
              styles.uploadButton
            }
          >
            {documentFile
              ? "Change"
              : "Upload"}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={
                pickDocument
              }
              style={{
                display: "none",
              }}
            />
          </label>
        </div>

        {documentFile && (
          <div
            style={
              styles.fileBox
            }
          >
            <span>✓</span>

            <div>
              <strong>
                {documentFile.name}
              </strong>

              <p>
                Document uploaded
                successfully
              </p>
            </div>
          </div>
        )}

        {/* SELFIE */}

        <div
          style={{
            ...styles.uploadCard,
            marginTop: "12px",
          }}
        >
          <div
            style={
              styles.uploadIcon
            }
          >
            🤳
          </div>

          <div
            style={
              styles.uploadContent
            }
          >
            <strong>
              Selfie Verification
            </strong>

            <p>
              Capture a clear photo of
              your face
            </p>
          </div>
        </div>

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          ref={
            selfieInputRef
          }
          onChange={
            handleSelfieUpload
          }
          style={{
            display: "none",
          }}
        />

        {!cameraOn &&
          !selfie && (
            <button
              style={
                styles.nextButton
              }
              onClick={
                handleSelfieOption
              }
            >
              🤳 Capture / Upload Selfie
            </button>
          )}

        {cameraOn && (
          <div
            style={
              styles.cameraBox
            }
          >
            <div
              style={
                styles.cameraHeader
              }
            >
              <span>
                Camera Verification
              </span>

              <span
                style={
                  styles.liveBadge
                }
              >
                ● LIVE
              </span>
            </div>

            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={
                styles.camera
              }
            />

            <button
              style={
                styles.nextButton
              }
              onClick={
                captureSelfie
              }
            >
              📸 Capture Now
            </button>

            <button
              style={
                styles.secondaryButton
              }
              onClick={() => {
                stopCamera();

                setCameraOn(false);
              }}
            >
              Cancel Camera
            </button>
          </div>
        )}

        <canvas
          ref={canvasRef}
          style={{
            display: "none",
          }}
        />

        {selfie && (
          <div
            style={
              styles.selfieBox
            }
          >
            <div
              style={
                styles.selfiePreviewLabel
              }
            >
              Selfie Preview
            </div>

            <img
              src={selfie}
              alt="Selfie"
              style={
                styles.selfieImage
              }
            />

            <p
              style={
                styles.validText
              }
            >
              ✓ Selfie captured
              successfully
            </p>

            <button
              style={
                styles.secondaryButton
              }
              onClick={() => {
                setSelfie(null);

                setLivenessPassed(false);
                setLivenessResult(null);
                setLivenessScore(0);
                setLivenessStatus("");

                setErrorMessage("");
                setMessage("");
              }}
            >
              Retake Selfie
            </button>
          </div>
        )}

        {livenessPassed && (
          <div
            style={{
              marginTop: "14px",
              padding: "12px",
              borderRadius: "10px",
              background:
                "rgba(52,211,153,0.08)",
              border:
                "1px solid rgba(52,211,153,0.20)",
              color: "#34d399",
              fontSize: "10px",
              fontWeight: "700",
            }}
          >
            ✓ Liveness verification passed
            {livenessScore > 0
              ? ` • Score: ${livenessScore.toFixed(1)}%`
              : ""}

            {livenessResult?.current_challenge && (
                <div
                  style={{
                    marginTop: "4px",
                    color: "#94a3b8",
                    fontSize: "8px",
                    fontWeight: "500",
                  }}
                >
                  Final challenge:{" "}
                  {livenessResult.current_challenge}
                </div>
              )}
              </div>
            )}

        <div
          style={
            styles.navigationRow
          }
        >
          <button
            style={
              styles.backButton
            }
            onClick={handleBack}
          >
            ← Back
          </button>

          <button
            style={
              styles.nextSmallButton
            }
            onClick={
              handleSelfieNext
            }
          >
            {livenessPassed
              ? "Review KYC →"
              : "Continue to Liveness →"}
          </button>
        </div>
      </div>
    );
  };

  // =========================================================
  // REVIEW ROW
  // =========================================================

  const ReviewRow = ({
    label,
    value,
  }) => (
    <div
      style={
        styles.reviewRow
      }
    >
      <div>
        <span
          style={
            styles.reviewLabel
          }
        >
          {label}
        </span>

        <strong
          style={
            styles.reviewValue
          }
        >
          {value ||
            "Not provided"}
        </strong>
      </div>
    </div>
  );

  // =========================================================
  // REVIEW STEP
  // =========================================================

  const renderReviewStep = () => {
    return (
      <div style={styles.section}>
        <div
          style={
            styles.sectionHeader
          }
        >
          <div
            style={
              styles.sectionIcon
            }
          >
            ✓
          </div>

          <div>
            <h3
              style={
                styles.sectionTitle
              }
            >
              Review & Submit
            </h3>

            <p
              style={
                styles.sectionSubtitle
              }
            >
              Review your information
              before submitting your
              KYC.
            </p>
          </div>
        </div>

        {/* PERSONAL REVIEW */}

        <div
          style={
            styles.reviewCard
          }
        >
          <div
            style={
              styles.reviewHeader
            }
          >
            <div>
              <span
                style={
                  styles.reviewNumber
                }
              >
                01
              </span>

              <strong>
                Personal Information
              </strong>
            </div>

            <button
              style={
                styles.editButton
              }
              onClick={() => {
                setCurrentStep(1);
                setErrorMessage("");
              }}
            >
              Edit
            </button>
          </div>

          <ReviewRow
            label="Registered Email"
            value={accountEmail}
          />

          <ReviewRow
            label="Registered Mobile"
            value={accountMobile}
          />

          <ReviewRow
            label="Full Name"
            value={
              personalDetails.fullName
            }
          />

          <ReviewRow
            label="Date of Birth"
            value={
              personalDetails.dob
            }
          />

          <ReviewRow
            label="Gender"
            value={
              personalDetails.gender
            }
          />

          <ReviewRow
            label="Address"
            value={
              personalDetails.address
            }
          />

          <ReviewRow
            label="City / State"
            value={`${personalDetails.city}, ${personalDetails.state}`}
          />

          <ReviewRow
            label="Pincode"
            value={
              personalDetails.pincode
            }
          />
        </div>

        {/* ID REVIEW */}

        <div
          style={
            styles.reviewCard
          }
        >
          <div
            style={
              styles.reviewHeader
            }
          >
            <div>
              <span
                style={
                  styles.reviewNumber
                }
              >
                02
              </span>

              <strong>
                ID Verification
              </strong>
            </div>

            <button
              style={
                styles.editButton
              }
              onClick={() => {
                setCurrentStep(2);
                setErrorMessage("");
              }}
            >
              Edit
            </button>
          </div>

          <ReviewRow
            label="Government ID"
            value={
              govIdType
                ? govIdType.toUpperCase()
                : ""
            }
          />

          <ReviewRow
            label="ID Number"
            value={maskGovId(govIdNumber)}
          />

          <div
            style={
              styles.reviewVerified
            }
          >
            ✓ OTP Verified
          </div>
        </div>

        {/* SELFIE REVIEW */}

        <div
          style={
            styles.reviewCard
          }
        >
          <div
            style={
              styles.reviewHeader
            }
          >
            <div>
              <span
                style={
                  styles.reviewNumber
                }
              >
                03
              </span>

              <strong>
                Document & Selfie
              </strong>
            </div>

            <button
              style={
                styles.editButton
              }
              onClick={() => {
                setCurrentStep(3);
                setErrorMessage("");
              }}
            >
              Edit
            </button>
          </div>

          <div
            style={
              styles.reviewFiles
            }
          >
            {livenessPassed && (
              <div
                style={{
                  marginTop: "10px",
                  padding: "9px",
                  borderRadius: "8px",
                  background:
                    "rgba(52,211,153,0.07)",
                  border:
                    "1px solid rgba(52,211,153,0.15)",
                  color: "#34d399",
                  fontSize: "9px",
                  fontWeight: "700",
                }}
              >
                ✓ Liveness Verified
                {livenessScore > 0
                  ? ` • Score: ${livenessScore.toFixed(1)}%`
                  : ""}
              </div>
            )}
                <div
                  style={
                    styles.reviewFilesItem
                  }
                >
              <span>🪪</span>

              <strong>
                {documentFile?.name ||
                  "Document"}
              </strong>

              <small>
                ✓ Uploaded
              </small>
            </div>

            <div
              style={
                styles.reviewFilesItem
              }
            >
              {selfie && (
                <img
                  src={selfie}
                  alt="Selfie preview"
                  style={
                    styles.reviewSelfie
                  }
                />
              )}

              <strong>
                Selfie
              </strong>

              <small>
                ✓ Captured
              </small>
            </div>
          </div>
        </div>

        {/* SECURITY */}

        <div
          style={
            styles.securityNote
          }
        >
          <span>🔒</span>

          <div>
            <strong>
              Secure KYC Verification
            </strong>

            <p>
              Your information is encrypted
              and processed securely for
              identity verification.
            </p>
          </div>
        </div>

        {/* SUBMIT */}

        <button
          style={{
            ...styles.submitButton,

            ...(loading
              ? styles.disabledButton
              : {}),
          }}
          onClick={
            handleFinalSubmit
          }
          disabled={loading}
        >
          {loading
            ? `Processing... ${progress}%`
            : "🚀 Submit KYC"}
        </button>

        {/* PROGRESS */}

        {loading && (
          <div
            style={
              styles.progressBox
            }
          >
            <div
              style={
                styles.progressTrack
              }
            >
              <div
                style={{
                  ...styles.progressBar,

                  width: `${progress}%`,
                }}
              />
            </div>

            <p>
              Securely submitting your
              KYC... {progress}%
            </p>
          </div>
        )}

        <button
          style={
            styles.backButtonFull
          }
          onClick={handleBack}
          disabled={loading}
        >
          ← Back to Selfie Verification
        </button>
      </div>
    );
  };

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <BackgroundWrapper>
      <AppLayout>
        <div
          style={styles.wrapper}
        >
          <div
            style={styles.card}
          >
            {/* HEADER */}

            <div
              style={styles.header}
            >
              <div
                style={
                  styles.headerIcon
                }
              >
                🛡️
              </div>

              <h1
                style={styles.title}
              >
                KYC Verification
              </h1>

              <p
                style={
                  styles.subtitle
                }
              >
                Complete your identity
                verification securely
              </p>
            </div>

            {/* STEP MENU */}

            {renderStepIndicator()}

            <div
              style={
                styles.progressText
              }
            >
              Step {currentStep} of 4
            </div>

            {/* SUCCESS MESSAGE */}

            {message && (
              <div
                style={
                  styles.successBox
                }
              >
                <span>✓</span>
                {message}
              </div>
            )}

            {message &&
              reasons.length > 0 && (
                <div
                  style={{
                    marginTop: 14,
                    padding:
                      "12px 14px",
                    borderRadius: 10,
                    background:
                      "rgba(245,158,11,0.08)",
                    border:
                      "1px solid rgba(245,158,11,0.25)",
                  }}
                >
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color:
                        "#f59e0b",
                      margin:
                        "0 0 6px",
                    }}
                  >
                    Why this needs
                    review:
                  </p>

                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 18,
                      fontSize: 12,
                      color:
                        "#fbbf24",
                    }}
                  >
                    {reasons.map(
                      (
                        reason,
                        i
                      ) => (
                        <li key={i}>
                          {reason}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

            {/* ERROR MESSAGE */}

            {errorMessage && (
              <div
                style={
                  styles.errorBox
                }
              >
                <span>!</span>
                {errorMessage}
              </div>
            )}

            {/* STEP CONTENT */}

            {currentStep === 1 &&
              renderPersonalStep()}

            {currentStep === 2 &&
              renderIdStep()}

            {currentStep === 3 &&
              renderSelfieStep()}

            {currentStep === 4 &&
              renderReviewStep()}

            {showLivenessChallenge && (
              <LivenessChallenge
                onComplete={
                  handleLivenessComplete
                }
                onCancel={
                  handleLivenessCancel
                }
              />
            )}

            {/* STATUS */}

            {status && (
              <div
                style={{
                  ...styles.statusBox,

                  borderColor:
                    getStatusColor(),
                }}
              >
                <span>
                  {getStatusIcon(
                    status
                  )}
                </span>

                <div>
                  <span
                    style={
                      styles.statusLabel
                    }
                  >
                    KYC Status
                  </span>

                  <strong
                    style={{
                      color:
                        getStatusColor(),
                    }}
                  >
                    {status}
                  </strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </BackgroundWrapper>
  );
}

// ===========================================================
// STYLES
// ===========================================================

const styles = {
  wrapper: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "18px 10px 50px",
    boxSizing: "border-box",
    fontFamily:
      '"Inter", "Segoe UI", Arial, sans-serif',
  },

  card: {
    width: "100%",
    maxWidth: "760px",
    padding: "28px 30px 30px",
    borderRadius: "22px",
    background:
      "linear-gradient(145deg, rgba(24,35,56,0.98), rgba(17,24,39,0.98))",
    border:
      "1px solid rgba(148,163,184,0.16)",
    boxShadow:
      "0 25px 70px rgba(0,0,0,0.55)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter:
      "blur(14px)",
    boxSizing: "border-box",
    color: "#ffffff",
  },

  header: {
    textAlign: "center",
    marginBottom: "24px",
  },

  headerIcon: {
    width: "48px",
    height: "48px",
    margin: "0 auto 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "14px",
    background:
      "rgba(96,165,250,0.12)",
    border:
      "1px solid rgba(96,165,250,0.22)",
    fontSize: "23px",
  },

  title: {
    margin: "0 0 6px",
    fontSize: "24px",
    lineHeight: "1.25",
    fontWeight: "800",
    letterSpacing: "-0.5px",
    color: "#ffffff",
  },

  subtitle: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "12px",
    fontWeight: "500",
  },

  stepper: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    marginBottom: "8px",
    padding: "12px 4px",
    boxSizing: "border-box",
  },

  stepItem: {
    flex: "0 0 auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: 0,
    color: "#64748b",
  },

  stepItemActive: {
    color: "#ffffff",
  },

  stepCircle: {
    width: "38px",
    height: "38px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background:
      "rgba(148,163,184,0.08)",
    border:
      "1px solid rgba(148,163,184,0.18)",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "800",
    transition:
      "all 0.25s ease",
  },

  stepCircleActive: {
    background:
      "linear-gradient(135deg, #667eea, #764ba2)",
    border:
      "1px solid rgba(167,139,250,0.7)",
    color: "#ffffff",
    boxShadow:
      "0 0 0 5px rgba(102,126,234,0.10)",
  },

  stepCircleCompleted: {
    background:
      "rgba(52,211,153,0.14)",
    border:
      "1px solid rgba(52,211,153,0.35)",
    color: "#34d399",
  },

  stepText: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    minWidth: "60px",
  },

  stepTitle: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#64748b",
  },

  stepTitleActive: {
    color: "#f8fafc",
  },

  stepSubtitle: {
    fontSize: "8px",
    color: "#475569",
    marginTop: "2px",
  },

  stepLine: {
    flex: 1,
    height: "2px",
    margin: "0 6px 26px",
    background:
      "rgba(148,163,184,0.12)",
    transition:
      "background 0.25s ease",
  },

  stepLineActive: {
    background:
      "linear-gradient(90deg, #667eea, #764ba2)",
  },

  progressText: {
    textAlign: "right",
    color: "#64748b",
    fontSize: "9px",
    fontWeight: "600",
    marginBottom: "14px",
  },

  successBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 12px",
    marginBottom: "14px",
    borderRadius: "9px",
    background:
      "rgba(52,211,153,0.08)",
    border:
      "1px solid rgba(52,211,153,0.20)",
    color: "#34d399",
    fontSize: "11px",
    fontWeight: "600",
  },

  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 12px",
    marginBottom: "14px",
    borderRadius: "9px",
    background:
      "rgba(248,113,113,0.08)",
    border:
      "1px solid rgba(248,113,113,0.20)",
    color: "#f87171",
    fontSize: "11px",
    fontWeight: "600",
  },

  section: {
    padding: "20px",
    borderRadius: "15px",
    background:
      "rgba(11,18,32,0.52)",
    border:
      "1px solid rgba(148,163,184,0.10)",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    marginBottom: "20px",
  },

  sectionIcon: {
    width: "38px",
    height: "38px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "11px",
    background:
      "rgba(96,165,250,0.12)",
    border:
      "1px solid rgba(96,165,250,0.20)",
    fontSize: "17px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "15px",
    fontWeight: "800",
    color: "#f8fafc",
  },

  sectionSubtitle: {
    margin: "4px 0 0",
    fontSize: "10px",
    color: "#64748b",
    lineHeight: "1.4",
  },

  accountBox: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "9px",
    marginBottom: "15px",
  },

  accountItem: {
    padding: "10px",
    borderRadius: "9px",
    background:
      "rgba(148,163,184,0.05)",
    border:
      "1px solid rgba(148,163,184,0.08)",
  },

  accountLabel: {
    display: "block",
    marginBottom: "4px",
    color: "#64748b",
    fontSize: "9px",
    fontWeight: "600",
  },

  accountValue: {
    display: "block",
    color: "#cbd5e1",
    fontSize: "10px",
    fontWeight: "600",
    wordBreak: "break-word",
  },

  mobileFallback: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  mobileFallbackNote: {
    margin: 0,
    color: "#f59e0b",
    fontSize: "9px",
    lineHeight: 1.4,
  },

  mobileFallbackRow: {
    display: "flex",
    gap: "6px",
  },

  mobileFallbackInput: {
    flex: 1,
    minWidth: 0,
    height: "28px",
    borderRadius: "6px",
    border:
      "1px solid rgba(148,163,184,0.18)",
    background: "#0b1120",
    color: "#e2e8f0",
    fontSize: "10px",
    padding: "0 8px",
    boxSizing: "border-box",
  },

  mobileFallbackButton: {
    height: "28px",
    padding: "0 10px",
    borderRadius: "6px",
    border: "none",
    background:
      "linear-gradient(135deg, #8b5cf6, #2563eb)",
    color: "#ffffff",
    fontSize: "9px",
    fontWeight: "700",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  mobileFallbackError: {
    margin: 0,
    color: "#f87171",
    fontSize: "9px",
  },

  label: {
    display: "block",
    marginBottom: "6px",
    marginTop: "13px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#e2e8f0",
  },

  input: {
    width: "100%",
    height: "43px",
    padding: "0 11px",
    borderRadius: "9px",
    border:
      "1px solid rgba(148,163,184,0.16)",
    outline: "none",
    background:
      "rgba(11,18,32,0.72)",
    color: "#ffffff",
    fontSize: "12px",
    fontFamily:
      '"Inter", "Segoe UI", Arial, sans-serif',
    boxSizing: "border-box",
  },

  textarea: {
    height: "auto",
    minHeight: "82px",
    padding: "10px 11px",
    resize: "vertical",
  },

  inputError: {
    border:
      "1px solid rgba(248,113,113,0.75)",
  },

  twoColumn: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "10px",
  },

  errorText: {
    color: "#f87171",
    fontSize: "9px",
    margin: "4px 0 0",
    fontWeight: "500",
  },

  validText: {
    color: "#34d399",
    fontSize: "10px",
    margin: "6px 0",
    fontWeight: "600",
  },

  nextButton: {
    width: "100%",
    minHeight: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "16px",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontWeight: "750",
    fontSize: "11px",
    color: "#ffffff",
    background:
      "linear-gradient(135deg, #667eea, #764ba2)",
    boxShadow:
      "0 6px 18px rgba(0,0,0,0.20)",
    boxSizing: "border-box",
  },

  secondaryButton: {
    width: "100%",
    minHeight: "40px",
    padding: "9px 12px",
    marginTop: "8px",
    borderRadius: "9px",
    border:
      "1px solid rgba(148,163,184,0.18)",
    cursor: "pointer",
    fontWeight: "650",
    fontSize: "10px",
    background:
      "rgba(148,163,184,0.06)",
    color: "#cbd5e1",
    boxSizing: "border-box",
  },

  backButton: {
    flex: 1,
    minHeight: "42px",
    borderRadius: "9px",
    border:
      "1px solid rgba(148,163,184,0.18)",
    background:
      "rgba(148,163,184,0.05)",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: "700",
  },

  nextSmallButton: {
    flex: 1,
    minHeight: "42px",
    borderRadius: "9px",
    border: "none",
    background:
      "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#ffffff",
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: "750",
  },

  navigationRow: {
    display: "flex",
    gap: "10px",
    marginTop: "20px",
  },

  otpBox: {
    marginTop: "18px",
    padding: "14px",
    borderRadius: "11px",
    background:
      "rgba(96,165,250,0.05)",
    border:
      "1px solid rgba(96,165,250,0.12)",
  },

  otpHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#60a5fa",
    fontSize: "12px",
  },

  otpBoxText: {
    color: "#64748b",
    fontSize: "9px",
    margin: "4px 0 0",
  },

  verifiedBox: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    marginTop: "15px",
    padding: "13px",
    borderRadius: "10px",
    background:
      "rgba(52,211,153,0.08)",
    border:
      "1px solid rgba(52,211,153,0.18)",
    color: "#34d399",
  },

  verifiedIcon: {
    width: "30px",
    height: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background:
      "rgba(52,211,153,0.15)",
    fontWeight: "800",
  },

  uploadCard: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    padding: "13px",
    borderRadius: "11px",
    background:
      "rgba(148,163,184,0.045)",
    border:
      "1px solid rgba(148,163,184,0.10)",
  },

  uploadIcon: {
    width: "38px",
    height: "38px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "10px",
    background:
      "rgba(96,165,250,0.10)",
    fontSize: "17px",
  },

  uploadContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },

  uploadButton: {
    padding: "8px 12px",
    borderRadius: "8px",
    background:
      "linear-gradient(135deg, #667eea, #764ba2)",
    color: "#ffffff",
    fontSize: "9px",
    fontWeight: "750",
    cursor: "pointer",
  },

  fileBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px",
    marginTop: "8px",
    borderRadius: "9px",
    background:
      "rgba(52,211,153,0.06)",
    border:
      "1px solid rgba(52,211,153,0.14)",
    color: "#cbd5e1",
    fontSize: "10px",
  },

  cameraBox: {
    marginTop: "14px",
    padding: "10px",
    borderRadius: "11px",
    background:
      "rgba(0,0,0,0.25)",
    border:
      "1px solid rgba(148,163,184,0.12)",
  },

  cameraHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "9px",
    color: "#cbd5e1",
    fontSize: "10px",
    fontWeight: "700",
  },

  liveBadge: {
    color: "#f87171",
    fontSize: "8px",
  },

  camera: {
    width: "100%",
    display: "block",
    borderRadius: "9px",
    background: "#000000",
  },

  selfieBox: {
    marginTop: "12px",
    padding: "14px",
    textAlign: "center",
    borderRadius: "11px",
    background:
      "rgba(52,211,153,0.05)",
    border:
      "1px solid rgba(52,211,153,0.12)",
  },

  selfiePreviewLabel: {
    color: "#94a3b8",
    fontSize: "9px",
    fontWeight: "650",
    marginBottom: "10px",
  },

  selfieImage: {
    width: "135px",
    height: "135px",
    objectFit: "cover",
    borderRadius: "50%",
    border:
      "3px solid rgba(52,211,153,0.45)",
    display: "block",
    margin: "0 auto",
  },

  reviewCard: {
    marginBottom: "12px",
    padding: "13px",
    borderRadius: "11px",
    background:
      "rgba(148,163,184,0.045)",
    border:
      "1px solid rgba(148,163,184,0.10)",
  },

  reviewHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "8px",
    color: "#f8fafc",
    fontSize: "11px",
  },

  reviewNumber: {
    marginRight: "7px",
    color: "#60a5fa",
    fontSize: "9px",
    fontWeight: "800",
  },

  reviewRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "9px 0",
    borderTop:
      "1px solid rgba(148,163,184,0.07)",
  },

  reviewLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "8px",
    marginBottom: "3px",
  },

  reviewValue: {
    display: "block",
    color: "#cbd5e1",
    fontSize: "10px",
    fontWeight: "650",
  },

  editButton: {
    border: "none",
    background: "transparent",
    color: "#60a5fa",
    cursor: "pointer",
    fontSize: "9px",
    fontWeight: "700",
  },

  reviewVerified: {
    marginTop: "8px",
    padding: "7px 9px",
    borderRadius: "7px",
    background:
      "rgba(52,211,153,0.07)",
    color: "#34d399",
    fontSize: "9px",
    fontWeight: "700",
  },

  reviewFiles: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "10px",
  },

  reviewFilesItem: {
    minWidth: 0,
    padding: "10px",
    borderRadius: "9px",
    background:
      "rgba(148,163,184,0.04)",
    border:
      "1px solid rgba(148,163,184,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    color: "#cbd5e1",
    fontSize: "10px",
  },

  reviewSelfie: {
    width: "48px",
    height: "48px",
    objectFit: "cover",
    borderRadius: "50%",
    display: "block",
    marginBottom: "5px",
    border:
      "2px solid rgba(52,211,153,0.35)",
  },

  securityNote: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "11px",
    marginTop: "14px",
    borderRadius: "9px",
    background:
      "rgba(96,165,250,0.06)",
    border:
      "1px solid rgba(96,165,250,0.12)",
    color: "#94a3b8",
    fontSize: "9px",
    lineHeight: "1.5",
  },

  submitButton: {
    width: "100%",
    minHeight: "50px",
    marginTop: "12px",
    borderRadius: "11px",
    border: "none",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: "13px",
    color: "#ffffff",
    background:
      "linear-gradient(135deg, #667eea, #764ba2)",
    boxShadow:
      "0 8px 25px rgba(102,126,234,0.28)",
    boxSizing: "border-box",
  },

  disabledButton: {
    opacity: 0.55,
    cursor: "not-allowed",
  },

  backButtonFull: {
    width: "100%",
    minHeight: "40px",
    marginTop: "9px",
    borderRadius: "9px",
    border:
      "1px solid rgba(148,163,184,0.15)",
    background:
      "rgba(148,163,184,0.04)",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "9px",
    fontWeight: "650",
  },

  progressBox: {
    marginTop: "14px",
    padding: "12px",
    borderRadius: "10px",
    background:
      "rgba(11,18,32,0.55)",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "10px",
  },

  progressTrack: {
    width: "100%",
    height: "6px",
    borderRadius: "10px",
    overflow: "hidden",
    background:
      "rgba(148,163,184,0.12)",
  },

  progressBar: {
    height: "100%",
    borderRadius: "10px",
    background:
      "linear-gradient(90deg, #667eea, #764ba2)",
    transition:
      "width 0.3s ease",
  },

  statusBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "15px",
    padding: "12px",
    borderRadius: "10px",
    background:
      "rgba(11,18,32,0.55)",
    border: "1px solid",
    fontSize: "11px",
  },

  statusLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "9px",
    marginBottom: "3px",
  },
};