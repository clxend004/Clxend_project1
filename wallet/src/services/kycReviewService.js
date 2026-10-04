import { getRequest, postRequest } from "./api";

// =========================================================
// INTERNAL KYC REVIEW QUEUE (REAL)
//
// Replaces the localStorage mock — now calls the real backend
// endpoints (GET /admin/kyc/queue, POST /admin/kyc/:id/decision),
// which are gated by a real admin/reviewer role check server-side.
// =========================================================

export const getReviewQueue = async (status) => {
  const response = await getRequest("/admin/kyc/queue", {
    status: status && status !== "All" ? status : undefined,
  });

  return response?.submissions || [];
};

export const updateSubmissionStatus = async (id, newStatus, reviewerNote = "") => {
  return postRequest(`/admin/kyc/${id}/decision`, {
    status: newStatus,
    note: reviewerNote,
  });
};