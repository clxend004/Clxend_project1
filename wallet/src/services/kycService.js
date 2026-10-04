import {
  postRequest,
  getRequest,
} from "./api";

import {
  dataUrlToBlob,
} from "../utils/fileUtils";


let currentOtp = null;


// ============================================================
// OTP
// ============================================================

export const generateOTP = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {

      currentOtp =
        Math.floor(
          100000 +
          Math.random() * 900000
        ).toString();

      console.log(
        "Generated OTP:",
        currentOtp
      );

      resolve({
        success: true,
        message: "OTP Sent Successfully",
        otp: currentOtp,
      });

    }, 500);
  });
};


export const verifyOTP = async (
  data
) => {

  return new Promise(
    (resolve, reject) => {

      setTimeout(() => {

        const otp =
          typeof data === "string"
            ? data
            : data?.otp;

        if (!otp) {

          reject(
            new Error(
              "OTP is required"
            )
          );

          return;
        }

        if (otp === currentOtp) {

          resolve({
            success: true,
            message:
              "OTP Verified Successfully",
          });

          return;
        }

        reject(
          new Error(
            "Invalid OTP"
          )
        );

      }, 500);

    }
  );
};


// ============================================================
// KYC SUBMISSION
// ============================================================

export const saveKYC = async ({
  govId,
  govIdType,

  personalDetails,

  email,
  mobile,

  documentFile,
  selfie,

  // ==========================================================
  // NEW BROWSER LIVENESS VALUES
  // ==========================================================

  livenessPassed = false,

  livenessScore = 0,

  livenessStatus = "",

}) => {

  try {

    console.log(
      "========== KYC SUBMISSION START =========="
    );


    // ========================================================
    // BASIC VALIDATION
    // ========================================================

    if (!govId) {

      throw new Error(
        "Government ID is required."
      );

    }


    if (!govIdType) {

      throw new Error(
        "Government ID type is required."
      );

    }


    if (!documentFile) {

      throw new Error(
        "KYC document is required."
      );

    }


    if (!selfie) {

      throw new Error(
        "Selfie is required."
      );

    }


    // ========================================================
    // LIVENESS VALIDATION
    // ========================================================

    if (!livenessPassed) {

      throw new Error(
        "Please complete liveness verification before submitting KYC."
      );

    }


    // ========================================================
    // FORM DATA
    // ========================================================

    const formData =
      new FormData();


    // ========================================================
    // IDENTITY INFORMATION
    // ========================================================

    formData.append(
      "govId",
      govId
    );


    formData.append(
      "govIdType",
      govIdType
    );


    formData.append(
      "email",
      email || ""
    );


    formData.append(
      "mobile",
      mobile || ""
    );


    // ========================================================
    // PERSONAL INFORMATION
    // ========================================================

    Object.entries(
      personalDetails || {}
    ).forEach(
      ([key, value]) => {

        formData.append(
          key,
          value ?? ""
        );

      }
    );


    // ========================================================
    // LIVENESS INFORMATION
    // ========================================================

    formData.append(
      "livenessPassed",
      String(
        livenessPassed
      )
    );


    formData.append(
      "livenessScore",
      String(
        livenessScore ?? 0
      )
    );


    formData.append(
      "livenessStatus",
      livenessStatus || ""
    );


    // ========================================================
    // DOCUMENT
    // ========================================================

    formData.append(
      "document",
      documentFile,
      documentFile.name ||
        "document"
    );


    // ========================================================
    // SELFIE
    // ========================================================

    let selfieBlob;


    if (
      selfie instanceof Blob
    ) {

      selfieBlob = selfie;

    } else {

      selfieBlob =
        dataUrlToBlob(
          selfie
        );

    }


    if (
      !selfieBlob ||
      selfieBlob.size === 0
    ) {

      throw new Error(
        "Invalid selfie file."
      );

    }


    formData.append(
      "selfie",
      selfieBlob,
      "selfie.jpg"
    );


    // ========================================================
    // DEBUG INFORMATION
    // ========================================================

    console.log(
      "KYC document:",
      documentFile?.name
    );


    console.log(
      "Selfie:",
      selfieBlob.type,
      selfieBlob.size
    );


    console.log(
      "Liveness passed:",
      livenessPassed
    );


    console.log(
      "Liveness score:",
      livenessScore
    );


    console.log(
      "Liveness status:",
      livenessStatus
    );


    // ========================================================
    // SEND TO VECTRO BACKEND
    // ========================================================

    const response =
      await postRequest(
        "/kyc/submit",
        formData
      );


    // ========================================================
    // NORMALIZE RESPONSE
    // ========================================================

    const result = {

      success:
        response?.success !== false,

      status:
        response?.status ||
        "Pending",

      faceMatchScore:
        response?.faceMatchScore ??
        null,

      liveness:
        response?.liveness ??
        null,

      livenessScore:
        response?.livenessScore ??
        null,

      livenessStatus:
        response?.livenessStatus ??
        "",

      overallScore:
        response?.overallScore ??
        null,

      ocrData:
        response?.ocrData ??
        null,

      livenessResult:
        response?.livenessResult ??
        null,

      reasons:
        Array.isArray(
          response?.reasons
        )
          ? response.reasons
          : [],

      message:
        response?.message ||
        "KYC submitted successfully",

      raw:
        response,
    };


    console.log(
      "========== KYC SUBMISSION SUCCESS =========="
    );


    console.log(
      "KYC response:",
      result
    );


    return result;


  } catch (error) {

    console.error(
      "========== KYC SUBMIT ERROR =========="
    );


    console.error(
      error
    );


    const status =
      error?.status ||
      error?.response?.status;


    if (status === 400) {

      throw new Error(
        error?.message ||
        error?.response?.data?.detail ||
        "The submitted KYC information is invalid."
      );

    }


    if (
      status === 401 ||
      status === 403
    ) {

      throw new Error(
        "Your session has expired or you are not authorized. Please log in again."
      );

    }


    if (status === 413) {

      throw new Error(
        "The file is too large. Please upload smaller files and try again."
      );

    }


    if (
      status >= 500 &&
      status < 600
    ) {

      throw new Error(
        "The identity verification service is temporarily unavailable. Please try again shortly."
      );

    }


    throw new Error(
      error?.message ||
      error?.response?.data?.detail ||
      "KYC submission failed."
    );

  }

};


// ============================================================
// KYC STATUS
// ============================================================

export const getKYCStatus = async (
  userId
) => {

  try {

    const response =
      await getRequest(
        "/kyc/status",
        userId
          ? { userId }
          : {}
      );


    return {

      success: true,

      status:
        response?.status ||
        "Pending",

    };


  } catch (error) {

    console.error(
      "Fetch KYC Status Error:",
      error
    );


    throw new Error(
      error?.message ||
      "Failed to fetch KYC status"
    );

  }

};