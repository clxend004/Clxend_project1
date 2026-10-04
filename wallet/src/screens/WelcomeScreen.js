import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BackgroundWrapper from "../components/BackgroundWrapper";
import clxendLogo from "../assets/clxend-logo.png";

export default function WelcomeScreen() {
  const navigate = useNavigate();

  const [activeFeature, setActiveFeature] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  /* =========================================================
     FEATURE DATA
  ========================================================= */

  const features = [
    {
      icon: "🔐",
      title: "SECURE",
      description: "Protected wallet access",
      detail: "Advanced authentication keeps your wallet protected.",
    },
    {
      icon: "⚡",
      title: "FAST",
      description: "Quick transactions",
      detail: "Enjoy smooth and fast wallet operations.",
    },
    {
      icon: "✓",
      title: "VERIFIED",
      description: "Secure KYC",
      detail: "Complete your identity verification securely.",
    },
  ];

  /* =========================================================
     AUTO SLIDE
  ========================================================= */

  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      setActiveFeature((prev) =>
        prev === features.length - 1 ? 0 : prev + 1
      );
    }, 2500);

    return () => clearInterval(interval);
  }, [isHovered, features.length]);

  /* =========================================================
     NEXT
  ========================================================= */

  const nextFeature = () => {
    setActiveFeature((prev) =>
      prev === features.length - 1 ? 0 : prev + 1
    );
  };

  /* =========================================================
     PREVIOUS
  ========================================================= */

  const previousFeature = () => {
    setActiveFeature((prev) =>
      prev === 0 ? features.length - 1 : prev - 1
    );
  };

  return (
    <BackgroundWrapper>
      <div style={styles.page}>

        {/* =====================================================
            MAIN CARD
        ===================================================== */}

        <div style={styles.card}>

          {/* ===================================================
              BRAND
          =================================================== */}

          <div style={styles.brandSection}>

            <div style={styles.logo}>
              <img
                src={clxendLogo}
                alt="CLXEND"
                style={styles.logoImage}
              />
            </div>

            <h1 style={styles.brand}>
              CLXEND
            </h1>

            <p style={styles.tagline}>
              SECURE DIGITAL WALLET
            </p>

          </div>

          {/* ===================================================
              SECURITY BADGE
          =================================================== */}

          <div style={styles.securityBadge}>

            <span style={styles.securityDot}></span>

            <span>
              Secure & Trusted
            </span>

          </div>

          {/* ===================================================
              MAIN CONTENT
          =================================================== */}

          <div style={styles.content}>

            <h2 style={styles.title}>
              Your Money.{" "}
              <span style={styles.titleHighlight}>
                Your Control.
              </span>
            </h2>

            <p style={styles.subtitle}>
              Welcome to your smart digital wallet
            </p>

            <p style={styles.description}>
              Manage your wallet, track transactions,
              and complete secure KYC verification
              from one simple platform.
            </p>

          </div>

          {/* ===================================================
              3D FEATURE CAROUSEL
          =================================================== */}

          <div
            style={styles.carouselSection}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >

            {/* SIDE PREVIOUS CARD */}

            <div
              style={{
                ...styles.sideCard,
                ...styles.leftSideCard,
              }}
            >
              <div style={styles.sideIcon}>
                {features[
                  activeFeature === 0
                    ? features.length - 1
                    : activeFeature - 1
                ].icon}
              </div>
            </div>

            {/* MAIN 3D CARD */}

            <div style={styles.carouselCenter}>

              <button
                type="button"
                onClick={previousFeature}
                style={{
                  ...styles.carouselArrow,
                  ...styles.leftArrow,
                }}
                aria-label="Previous feature"
              >
                ‹
              </button>

              <div
                style={{
                  ...styles.featureCard,
                  transform: isHovered
                    ? "perspective(900px) rotateX(2deg) rotateY(-2deg) translateY(-5px) scale(1.015)"
                    : "perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)",
                }}
              >

                {/* GLOW */}

                <div style={styles.featureGlow}></div>

                {/* ICON */}

                <div style={styles.featureIconOuter}>

                  <div style={styles.featureIconInner}>
                    {features[activeFeature].icon}
                  </div>

                </div>

                {/* TITLE */}

                <div style={styles.featureTitle}>
                  {features[activeFeature].title}
                </div>

                {/* DESCRIPTION */}

                <div style={styles.featureDescription}>
                  {features[activeFeature].description}
                </div>

                {/* DETAIL */}

                <p style={styles.featureDetail}>
                  {features[activeFeature].detail}
                </p>

                {/* MINI LINE */}

                <div style={styles.featureLine}>
                  <span></span>
                </div>

              </div>

              <button
                type="button"
                onClick={nextFeature}
                style={{
                  ...styles.carouselArrow,
                  ...styles.rightArrow,
                }}
                aria-label="Next feature"
              >
                ›
              </button>

            </div>

            {/* SIDE NEXT CARD */}

            <div
              style={{
                ...styles.sideCard,
                ...styles.rightSideCard,
              }}
            >
              <div style={styles.sideIcon}>
                {features[
                  activeFeature === features.length - 1
                    ? 0
                    : activeFeature + 1
                ].icon}
              </div>
            </div>

          </div>

          {/* ===================================================
              CAROUSEL DOTS
          =================================================== */}

          <div style={styles.dots}>

            {features.map((feature, index) => (
              <button
                key={feature.title}
                type="button"
                aria-label={`Show ${feature.title}`}
                onClick={() => setActiveFeature(index)}
                style={{
                  ...styles.dot,
                  ...(activeFeature === index
                    ? styles.activeDot
                    : {}),
                }}
              />
            ))}

          </div>

          {/* ===================================================
              ACTION BUTTONS
          =================================================== */}

          <div style={styles.actions}>

            {/* CREATE ACCOUNT */}

            <button
              type="button"
              style={styles.primaryButton}
              onClick={() => navigate("/register")}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-2px)";

                e.currentTarget.style.boxShadow =
                  "0 14px 32px rgba(59,130,246,0.38)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform =
                  "translateY(0)";

                e.currentTarget.style.boxShadow =
                  "0 10px 25px rgba(59,130,246,0.25)";
              }}
            >

              <span>
                Create Account
              </span>

              <span style={styles.buttonArrow}>
                →
              </span>

            </button>

            {/* LOGIN */}

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => navigate("/login")}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "rgba(139,92,246,0.10)";

                e.currentTarget.style.borderColor =
                  "rgba(139,92,246,0.50)";

                e.currentTarget.style.transform =
                  "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  "rgba(11,18,32,0.70)";

                e.currentTarget.style.borderColor =
                  "rgba(96,165,250,0.25)";

                e.currentTarget.style.transform =
                  "translateY(0)";
              }}
            >

              <span style={styles.loginIcon}>
                ⇥
              </span>

              <span>
                Login to CLXEND
              </span>

            </button>

          </div>

          {/* ===================================================
              FOOTER
          =================================================== */}

          <div style={styles.footer}>

            <span>
              Secure
            </span>

            <span style={styles.footerDot}>
              •
            </span>

            <span>
              Simple
            </span>

            <span style={styles.footerDot}>
              •
            </span>

            <span>
              Smart
            </span>

          </div>

        </div>

      </div>
    </BackgroundWrapper>
  );
}


/* =========================================================
   STYLES
========================================================= */

const styles = {

  /* =======================================================
     PAGE
  ======================================================= */

  page: {
    width: "100%",
    minHeight: "100vh",

    display: "flex",

    justifyContent: "center",
    alignItems: "center",

    padding: "25px 15px",

    boxSizing: "border-box",
  },


  /* =======================================================
     MAIN CARD
  ======================================================= */

  card: {
    width: "100%",
    maxWidth: "480px",

    padding: "38px 36px 26px",

    borderRadius: "26px",

    background:
      "linear-gradient(145deg, rgba(24,35,56,0.96), rgba(17,24,39,0.96))",

    border:
      "1px solid rgba(148,163,184,0.16)",

    boxShadow:
      "0 25px 80px rgba(0,0,0,0.58)",

    backdropFilter: "blur(14px)",

    WebkitBackdropFilter: "blur(14px)",

    color: "#ffffff",

    textAlign: "center",

    boxSizing: "border-box",
  },


  /* =======================================================
     BRAND
  ======================================================= */

  brandSection: {
    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    marginBottom: "16px",
  },


  logo: {
  width: 44,
  height: 44,
  borderRadius: 12,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  overflow: "hidden",
  background: "#ffffff",
  boxShadow: "0 8px 25px rgba(59,130,246,0.35)",
},

logoImage: {
  width: "100%",
  height: "100%",
  objectFit: "contain",
  display: "block",
},


  brand: {
    margin: 0,

    fontSize: "26px",

    fontWeight: "800",

    fontFamily:
      '"Inter", "Segoe UI", sans-serif',

    letterSpacing: "3.2px",

    lineHeight: "1",

    color: "#ffffff",
  },


  tagline: {
    margin: "7px 0 0",

    fontSize: "9px",

    color: "#94a3b8",

    letterSpacing: "1.7px",

    fontWeight: "700",

    fontFamily:
      '"Inter", "Segoe UI", sans-serif',
  },


  /* =======================================================
     SECURITY BADGE
  ======================================================= */

  securityBadge: {
    display: "inline-flex",

    alignItems: "center",

    justifyContent: "center",

    gap: "8px",

    padding: "6px 12px",

    borderRadius: "20px",

    background:
      "rgba(52,211,153,0.07)",

    border:
      "1px solid rgba(52,211,153,0.18)",

    color: "#34d399",

    fontSize: "10px",

    fontWeight: "600",

    fontFamily:
      '"Inter", "Segoe UI", sans-serif',

    marginBottom: "23px",
  },


  securityDot: {
    width: "6px",
    height: "6px",

    borderRadius: "50%",

    background: "#34d399",

    boxShadow:
      "0 0 9px rgba(52,211,153,0.85)",
  },


  /* =======================================================
     CONTENT
  ======================================================= */

  content: {
    marginBottom: "20px",
  },


  title: {
    margin: "0 0 8px",

    fontSize: "25px",

    lineHeight: "1.2",

    fontWeight: "800",

    letterSpacing: "-0.7px",

    whiteSpace: "nowrap",

    color: "#ffffff",

    fontFamily:
      '"Inter", "Segoe UI", sans-serif',
  },


  titleHighlight: {
    color: "#60a5fa",

    fontWeight: "800",
  },


  subtitle: {
    margin: "0 0 11px",

    fontSize: "13px",

    lineHeight: "1.5",

    color: "#e2e8f0",

    fontWeight: "600",

    fontFamily:
      '"Inter", "Segoe UI", sans-serif',
  },


  description: {
    margin: "0 auto",

    maxWidth: "360px",

    fontSize: "12px",

    lineHeight: "1.65",

    color: "#94a3b8",

    fontWeight: "400",

    fontFamily:
      '"Inter", "Segoe UI", sans-serif',
  },


  /* =======================================================
     3D CAROUSEL
  ======================================================= */

  carouselSection: {
    position: "relative",

    width: "100%",

    height: "205px",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    marginBottom: "3px",

    overflow: "hidden",
  },


  carouselCenter: {
    position: "relative",

    width: "100%",

    height: "100%",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    perspective: "1000px",

    zIndex: 3,
  },


  featureCard: {
    position: "relative",

    width: "230px",

    height: "172px",

    borderRadius: "22px",

    display: "flex",

    flexDirection: "column",

    alignItems: "center",

    justifyContent: "center",

    overflow: "hidden",

    background:
      "linear-gradient(145deg, #1e293b, #0f172a)",

    border:
      "1px solid rgba(96,165,250,0.28)",

    boxShadow:
      "0 25px 50px rgba(0,0,0,0.45), 0 0 35px rgba(37,99,235,0.12)",

    transition:
      "transform 0.35s ease, box-shadow 0.35s ease",

    transformStyle: "preserve-3d",

    zIndex: 3,
  },


  featureGlow: {
    position: "absolute",

    width: "150px",
    height: "150px",

    top: "-70px",
    right: "-55px",

    borderRadius: "50%",

    background:
      "rgba(37,99,235,0.18)",

    filter: "blur(35px)",

    pointerEvents: "none",
  },


  /* =======================================================
     FEATURE ICON
  ======================================================= */

  featureIconOuter: {
    width: "58px",
    height: "58px",

    display: "flex",

    alignItems: "center",
    justifyContent: "center",

    borderRadius: "18px",

    background:
      "linear-gradient(145deg, rgba(37,99,235,0.22), rgba(139,92,246,0.16))",

    border:
      "1px solid rgba(96,165,250,0.25)",

    boxShadow:
      "0 12px 25px rgba(37,99,235,0.18)",

    transform:
      "translateZ(20px)",

    marginBottom: "10px",
  },


  featureIconInner: {
    fontSize: "26px",

    lineHeight: 1,

    filter:
      "drop-shadow(0 5px 8px rgba(0,0,0,0.35))",
  },


  featureTitle: {
    color: "#ffffff",

    fontSize: "14px",

    fontWeight: "800",

    letterSpacing: "1.5px",

    fontFamily:
      '"Inter", "Segoe UI", sans-serif',

    transform:
      "translateZ(15px)",
  },


  featureDescription: {
    color: "#60a5fa",

    fontSize: "10px",

    fontWeight: "600",

    marginTop: "4px",

    fontFamily:
      '"Inter", "Segoe UI", sans-serif',

    transform:
      "translateZ(12px)",
  },


  featureDetail: {
    margin: "7px 18px 0",

    color: "#64748b",

    fontSize: "9px",

    lineHeight: "1.4",

    fontFamily:
      '"Inter", "Segoe UI", sans-serif',

    transform:
      "translateZ(8px)",
  },


  featureLine: {
    width: "35px",

    height: "2px",

    marginTop: "8px",

    borderRadius: "5px",

    background:
      "linear-gradient(90deg, #8b5cf6, #2563eb)",
  },


  /* =======================================================
     SIDE 3D CARDS
  ======================================================= */

  sideCard: {
    position: "absolute",

    width: "92px",

    height: "135px",

    borderRadius: "18px",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    background:
      "linear-gradient(145deg, #172033, #0d1422)",

    border:
      "1px solid rgba(148,163,184,0.10)",

    boxShadow:
      "0 15px 30px rgba(0,0,0,0.35)",

    opacity: 0.65,

    zIndex: 1,

    transformStyle: "preserve-3d",
  },


  leftSideCard: {
    left: "-35px",

    transform:
      "perspective(700px) rotateY(22deg) scale(0.82)",
  },


  rightSideCard: {
    right: "-35px",

    transform:
      "perspective(700px) rotateY(-22deg) scale(0.82)",
  },


  sideIcon: {
    fontSize: "22px",

    opacity: 0.75,

    filter:
      "drop-shadow(0 4px 6px rgba(0,0,0,0.4))",
  },


  /* =======================================================
     CAROUSEL ARROWS
  ======================================================= */

  carouselArrow: {
    position: "absolute",

    width: "30px",
    height: "30px",

    borderRadius: "50%",

    display: "flex",

    alignItems: "center",
    justifyContent: "center",

    border:
      "1px solid rgba(96,165,250,0.22)",

    background:
      "rgba(11,18,32,0.82)",

    color: "#cbd5e1",

    fontSize: "22px",

    lineHeight: 1,

    cursor: "pointer",

    zIndex: 5,

    transition:
      "background 0.2s ease, border 0.2s ease, transform 0.2s ease",
  },


  leftArrow: {
    left: "12px",
  },


  rightArrow: {
    right: "12px",
  },


  /* =======================================================
     DOTS
  ======================================================= */

  dots: {
    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    gap: "7px",

    marginBottom: "20px",
  },


  dot: {
    width: "6px",
    height: "6px",

    padding: 0,

    border: "none",

    borderRadius: "50%",

    background:
      "#334155",

    cursor: "pointer",

    transition:
      "width 0.2s ease, background 0.2s ease",
  },


  activeDot: {
    width: "20px",

    borderRadius: "10px",

    background:
      "linear-gradient(90deg, #8b5cf6, #2563eb)",
  },


  /* =======================================================
     ACTIONS
  ======================================================= */

  actions: {
    display: "flex",

    flexDirection: "column",

    gap: "10px",
  },


  primaryButton: {
    width: "100%",

    height: "50px",

    padding: "13px 18px",

    border: "none",

    borderRadius: "12px",

    background:
      "linear-gradient(135deg, #8b5cf6, #2563eb)",

    color: "#ffffff",

    fontSize: "14px",

    fontWeight: "700",

    fontFamily:
      '"Inter", "Segoe UI", sans-serif',

    cursor: "pointer",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    gap: "10px",

    boxShadow:
      "0 10px 25px rgba(59,130,246,0.25)",

    transition:
      "transform 0.2s ease, box-shadow 0.2s ease",
  },


  buttonArrow: {
    fontSize: "19px",

    lineHeight: 1,

    fontWeight: "500",
  },


  secondaryButton: {
    width: "100%",

    height: "48px",

    padding: "12px 18px",

    borderRadius: "12px",

    background:
      "rgba(11,18,32,0.70)",

    border:
      "1px solid rgba(96,165,250,0.25)",

    color: "#e2e8f0",

    fontSize: "14px",

    fontWeight: "650",

    fontFamily:
      '"Inter", "Segoe UI", sans-serif',

    cursor: "pointer",

    display: "flex",

    alignItems: "center",

    justifyContent: "center",

    gap: "8px",

    transition:
      "transform 0.2s ease, background 0.2s ease, border-color 0.2s ease",
  },


  loginIcon: {
    width: "22px",
    height: "22px",

    display: "inline-flex",

    alignItems: "center",
    justifyContent: "center",

    borderRadius: "7px",

    background:
      "rgba(96,165,250,0.10)",

    color: "#60a5fa",

    fontSize: "16px",

    fontWeight: "700",
  },


  /* =======================================================
     FOOTER
  ======================================================= */

  footer: {
    marginTop: "21px",

    display: "flex",

    justifyContent: "center",

    alignItems: "center",

    gap: "7px",

    fontSize: "10px",

    color: "#64748b",

    letterSpacing: "0.8px",

    fontWeight: "500",

    fontFamily:
      '"Inter", "Segoe UI", sans-serif',
  },


  footerDot: {
    color: "#334155",

    fontSize: "9px",
  },
};