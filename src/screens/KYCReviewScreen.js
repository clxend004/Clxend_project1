import { useState, useEffect, useCallback } from "react";
import BackgroundWrapper from "../components/BackgroundWrapper";
import StatusBadge from "../components/StatusBadge";
import {
  getReviewQueue,
  updateSubmissionStatus,
} from "../services/kycReviewService";

const FILTERS = ["All", "Pending", "Manual review", "Approved", "Rejected"];

export default function KYCReviewScreen() {
  const [queue, setQueue] = useState([]);
  const [filter, setFilter] = useState("All");
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [toast, setToast] = useState("");

  const refresh = useCallback(async () => {
    const data = await getReviewQueue();
    setQueue(data);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const filteredQueue =
    filter === "All"
      ? queue
      : queue.filter(
          (item) => item.status?.toLowerCase() === filter.toLowerCase()
        );

  const handleDecision = async (id, newStatus) => {
    await updateSubmissionStatus(id, newStatus, noteDraft);
    setActiveNoteId(null);
    setNoteDraft("");
    setToast(`Marked as ${newStatus}`);
    refresh();
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <BackgroundWrapper>
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.header}>
            <div>
              <div style={styles.eyebrow}>Internal use only</div>
              <h1 style={styles.title}>KYC Review Queue</h1>
              <p style={styles.subtitle}>
                Review submitted applications and update their status.
                Only masked identifiers are shown here — see{" "}
                <span style={styles.inlineCode}>
                  docs/INTERNAL_KYC_REVIEW.md
                </span>{" "}
                for how full document review should work once a real
                backend is connected.
              </p>
            </div>

            <button type="button" onClick={refresh} style={styles.refreshBtn}>
              ↻ Refresh
            </button>
          </div>

          <div style={styles.tabs}>
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                style={{
                  ...styles.tab,
                  ...(filter === f ? styles.tabActive : {}),
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {toast && <div style={styles.toast}>✓ {toast}</div>}

          {filteredQueue.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyTitle}>No submissions here</p>
              <p style={styles.emptyText}>
                {queue.length === 0
                  ? "Submissions will appear here once a user completes KYC."
                  : `No submissions currently match "${filter}".`}
              </p>
            </div>
          ) : (
            <div style={styles.list}>
              {filteredQueue.map((item) => (
                <div key={item.id} style={styles.card}>
                  <div style={styles.cardTop}>
                    <div>
                      <div style={styles.name}>{item.name}</div>
                      <div style={styles.meta}>
                        {item.email} {item.mobile && `· ${item.mobile}`}
                      </div>
                    </div>

                    <StatusBadge status={item.status} />
                  </div>

                  <div style={styles.detailsRow}>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>ID Number</span>
                      <span style={styles.detailValue}>
                        {item.maskedIdNumber || "—"}
                      </span>
                    </div>

                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Submitted</span>
                      <span style={styles.detailValue}>
                        {formatDate(item.submittedAt)}
                      </span>
                    </div>

                    {item.reviewedAt && (
                      <div style={styles.detailItem}>
                        <span style={styles.detailLabel}>Reviewed</span>
                        <span style={styles.detailValue}>
                          {formatDate(item.reviewedAt)}
                        </span>
                      </div>
                    )}
                  </div>

                  {item.reasons && item.reasons.length > 0 && (
                    <div style={{
                        marginTop: 12,
                        padding: "10px 12px",
                        borderRadius: 9,
                        background: "rgba(245,158,11,0.08)",
                        border: "1px solid rgba(245,158,11,0.2)",
                    }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", margin: "0 0 4px" }}>
                        Flagged for:
                    </p>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#fbbf24" }}>
                    {item.reasons.map((reason, i) => (
                            <li key={i}>{reason}</li>
                    ))}
                    </ul>
                    </div>
                  )}

                  {item.reviewerNote && (
                    <div style={styles.noteDisplay}>
                      <strong>Note:</strong> {item.reviewerNote}
                    </div>
                  )}

                  {activeNoteId === item.id ? (
                    <div style={styles.noteBox}>
                      <textarea
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        placeholder="Add an optional note about this decision…"
                        style={styles.noteInput}
                        rows={2}
                      />

                      <div style={styles.actionsRow}>
                        <button
                          type="button"
                          onClick={() => handleDecision(item.id, "Approved")}
                          style={{ ...styles.actionBtn, ...styles.approveBtn }}
                        >
                          Confirm Approve
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDecision(item.id, "Rejected")}
                          style={{ ...styles.actionBtn, ...styles.rejectBtn }}
                        >
                          Confirm Reject
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveNoteId(null);
                            setNoteDraft("");
                          }}
                          style={styles.cancelBtn}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={styles.actionsRow}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveNoteId(item.id);
                          setNoteDraft("");
                        }}
                        style={{
                          ...styles.actionBtn,
                          ...styles.approveBtn,
                          ...(item.status === "Approved"
                            ? styles.disabledBtn
                            : {}),
                        }}
                        disabled={item.status === "Approved"}
                      >
                        Approve
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveNoteId(item.id);
                          setNoteDraft("");
                        }}
                        style={{
                          ...styles.actionBtn,
                          ...styles.rejectBtn,
                          ...(item.status === "Rejected"
                            ? styles.disabledBtn
                            : {}),
                        }}
                        disabled={item.status === "Rejected"}
                      >
                        Reject
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDecision(item.id, "Manual review")
                        }
                        style={{
                          ...styles.actionBtn,
                          ...styles.pendingBtn,
                          ...(item.status === "Manual review"
                            ? styles.disabledBtn
                            : {}),
                        }}
                        disabled={item.status === "Manual review"}
                      >
                        Manual review
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </BackgroundWrapper>
  );
}

const colors = {
  text: "#f8fafc",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  border: "rgba(148,163,184,0.12)",
  cardBg: "rgba(15, 20, 33, 0.72)",
};

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    padding: "40px 20px",
    background:
      "radial-gradient(circle at top, #172554 0%, #0b1120 45%, #050816 100%)",
    color: colors.text,
    fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
  },

  container: { width: "100%", maxWidth: 780 },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 20,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.2,
    color: "#f59e0b",
    marginBottom: 6,
  },

  title: { fontSize: 24, fontWeight: 800, margin: 0 },

  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    maxWidth: 520,
    lineHeight: 1.6,
  },

  inlineCode: {
    fontFamily: "monospace",
    background: "rgba(255,255,255,0.06)",
    padding: "1px 5px",
    borderRadius: 4,
  },

  refreshBtn: {
    height: 38,
    padding: "0 14px",
    borderRadius: 9,
    border: `1px solid ${colors.border}`,
    background: "rgba(255,255,255,0.04)",
    color: colors.text,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  tabs: {
    display: "flex",
    gap: 6,
    marginBottom: 18,
    flexWrap: "wrap",
  },

  tab: {
    padding: "7px 13px",
    borderRadius: 999,
    border: `1px solid ${colors.border}`,
    background: "rgba(255,255,255,0.03)",
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },

  tabActive: {
    background: "linear-gradient(135deg, #8b5cf6, #2563eb)",
    color: "#ffffff",
    border: "1px solid transparent",
  },

  toast: {
    marginBottom: 16,
    padding: "9px 14px",
    borderRadius: 10,
    background: "rgba(52,211,153,0.10)",
    border: "1px solid rgba(52,211,153,0.25)",
    color: "#34d399",
    fontSize: 13,
    fontWeight: 700,
  },

  emptyState: {
    padding: "50px 20px",
    textAlign: "center",
    borderRadius: 16,
    border: `1px dashed ${colors.border}`,
  },

  emptyTitle: { fontSize: 15, fontWeight: 700, margin: 0 },

  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
  },

  list: { display: "flex", flexDirection: "column", gap: 12 },

  card: {
    padding: 18,
    borderRadius: 16,
    background: colors.cardBg,
    border: `1px solid ${colors.border}`,
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
  },

  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  name: { fontSize: 15, fontWeight: 700 },

  meta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },

  detailsRow: {
    display: "flex",
    gap: 24,
    marginTop: 14,
    flexWrap: "wrap",
  },

  detailItem: { display: "flex", flexDirection: "column", gap: 3 },

  detailLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.6,
    color: colors.textMuted,
    textTransform: "uppercase",
  },

  detailValue: { fontSize: 13, fontWeight: 600, color: colors.text },

  noteDisplay: {
    marginTop: 12,
    padding: "8px 12px",
    borderRadius: 9,
    background: "rgba(255,255,255,0.03)",
    fontSize: 12,
    color: colors.textSecondary,
  },

  noteBox: { marginTop: 14 },

  noteInput: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 9,
    border: `1px solid ${colors.border}`,
    background: "#0b1120",
    color: colors.text,
    fontSize: 13,
    padding: "8px 10px",
    resize: "vertical",
    fontFamily: "inherit",
    marginBottom: 10,
  },

  actionsRow: {
    display: "flex",
    gap: 8,
    marginTop: 14,
    flexWrap: "wrap",
  },

  actionBtn: {
    height: 40,
    padding: "0 14px",
    borderRadius: 8,
    border: "none",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },

  approveBtn: {
    background: "rgba(52,211,153,0.12)",
    color: "#34d399",
    border: "1px solid rgba(52,211,153,0.3)",
  },

  rejectBtn: {
    background: "rgba(248,113,113,0.12)",
    color: "#f87171",
    border: "1px solid rgba(248,113,113,0.3)",
  },

  pendingBtn: {
    background: "rgba(245,158,11,0.12)",
    color: "#f59e0b",
    border: "1px solid rgba(245,158,11,0.3)",
  },

  disabledBtn: {
    opacity: 0.35,
    cursor: "not-allowed",
  },

  cancelBtn: {
    height: 40,
    padding: "0 14px",
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    background: "transparent",
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  },
};