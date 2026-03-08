let kycStatus = "Not Submitted";
let currentOtp = null; // store OTP

// Submit KYC data
export const submitKYC = async (data, onProgress) => {
  console.log("KYC Data Submitted:", data);

  return new Promise((resolve) => {
    let progress = 0;

    const interval = setInterval(() => {
      progress += 20;

      if (onProgress) {
        onProgress(progress);
      }

      if (progress === 100) {
        clearInterval(interval);

        setTimeout(() => {
          kycStatus = "Pending";

          // Generate dynamic OTP
          currentOtp = Math.floor(1000 + Math.random() * 9000).toString();
          console.log("Generated OTP (check console!):", currentOtp);

          resolve({ message: "OTP Sent", otp: currentOtp });
        }, 1000);
      }
    }, 300);
  });
};

// Verify OTP
export const verifyOTP = async (otp) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (otp === currentOtp) {
        kycStatus = "Approved";
        resolve({ message: "OTP Verified Successfully" });
      } else {
        reject(new Error("Invalid OTP"));
      }
    }, 1000);
  });
};

// Get current KYC status
export const getKYCStatus = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ status: kycStatus });
    }, 500);
  });
};