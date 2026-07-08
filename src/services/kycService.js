import { postRequest, getRequest } from "./api";

let currentOtp = null;

/* =====================================================
   🔐 OTP SECTION
===================================================== */

// Generate OTP
export const generateOTP = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      currentOtp = Math.floor(1000 + Math.random() * 9000).toString();

      console.log("Generated OTP:", currentOtp);

      resolve({
        success: true,
        message: "OTP Sent Successfully",
        otp: currentOtp,
      });
    }, 500);
  });
};

// Verify OTP
export const verifyOTP = async (data) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const otp = typeof data === "string" ? data : data?.otp;

      if (!otp) {
        return reject(new Error("OTP is required"));
      }

      if (otp === currentOtp) {
        resolve({
          success: true,
          message: "OTP Verified Successfully",
        });
      } else {
        reject(new Error("Invalid OTP"));
      }
    }, 500);
  });
};

/* =====================================================
   🪪 KYC SUBMISSION (UI + AI MOCK)
===================================================== */

export const submitKYC = async (formData) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!formData) {
        return reject(new Error("Invalid KYC data"));
      }

      const statuses = ["Pending", "Approved", "Rejected", "Manual review"];
      const randomStatus =
        statuses[Math.floor(Math.random() * statuses.length)];

      console.log("KYC Status:", randomStatus);

      resolve({
        success: true,
        status: randomStatus,
        message: "KYC submitted successfully",
      });
    }, 2000);
  });
};

/* =====================================================
   💾 SAVE KYC (Backend API)
===================================================== */

export const saveKYC = async (data) => {
  try {
    const response = await postRequest("/kyc/submit", data);
    return response;
  } catch (error) {
    console.error("KYC ERROR:", error);

    // ✅ IMPORTANT FIX
    throw new Error(
      error.message || "KYC submission failed"
    );
  }
};

/* =====================================================
   📊 GET KYC STATUS
===================================================== */

export const getKYCStatus = async (userId) => {
  try {
    const response = await getRequest("/kyc/status", { userId });

    return {
      success: true,
      status: response.status || "Pending",
    };
  } catch (error) {
    console.error("Fetch KYC Status Error:", error);

    throw new Error("Failed to fetch KYC status");
  }
};

/* =====================================================
   🤖 MOCK KYC RESULT (FOR UI)
===================================================== */

export const getKYCResult = async () => {
  return {
    status: "verified",
    faceMatchScore: 87,
    liveness: true,
    ocrData: {
      name: "Vimalashwari",
      idNumber: "ABC1234567",
    },
    error: null,
  };
};