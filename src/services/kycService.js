import { postRequest, getRequest } from "./api";

let currentOtp = null;

// Generate OTP
export const submitKYC = async (data) => {
  return new Promise((resolve) => {
    setTimeout(() => {

      currentOtp = Math.floor(1000 + Math.random() * 9000).toString();
      console.log("Generated OTP:", currentOtp);

      resolve({
        message: "OTP Sent",
        otp: currentOtp
      });

    }, 500);
  });
};

// Verify OTP
export const verifyOTP = async (otp) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {

      if (otp === currentOtp) {
        resolve({ message: "OTP Verified Successfully" });
      } else {
        reject(new Error("Invalid OTP"));
      }

    }, 500);
  });
};

// Save KYC to API
export const saveKYC = async (data) => {
  try {

    const response = await postRequest("/kyc", {
      userId: data.userId || 1,
      govId: data.govId,
      status: "Pending"
    });

    return {
      success: true,
      message: "KYC Submitted",
      data: response
    };

  } catch (error) {
    throw new Error(error.message || "KYC submission failed");
  }
};

// Get KYC Status
export const getKYCStatus = async (userId) => {

  const response = await getRequest("/kyc", { userId });

  if (response.length === 0) {
    return { status: "Not Submitted" };
  }

  return { status: response[0].status };
};