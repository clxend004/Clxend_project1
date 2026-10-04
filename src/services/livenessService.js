/*
 * Liveness service
 *
 * This file is the frontend integration point for
 * the AI Identity liveness system.
 *
 * Currently the LivenessScreen performs the browser
 * camera/challenge flow and returns REAL for the demo.
 *
 * Later the AI Identity team's real liveness API can
 * be called from this file without changing the UI.
 */

export const verifyLiveness = async ({
  selfie,
  liveness = "REAL",
}) => {
  if (!selfie) {
    throw new Error("Selfie is required for liveness verification.");
  }

  return {
    success: true,
    liveness: liveness.toUpperCase(),
    selfie,
  };
};