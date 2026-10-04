import { useNavigate } from "react-router-dom";
import { logoutUser } from "../../services/authService";
import clxendLogo from "../../assets/clxend-logo.png";

export default function Navbar() {
  const navigate = useNavigate();

  const userEmail =
    localStorage.getItem("userEmail") || "User";

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  return (
    <header
    className="vectro-navbar"
    style={styles.navbar}
    >

      {/* BRAND */}
      <div
        style={styles.brand}
        onClick={() => navigate("/dashboard")}
      >
        <div style={styles.logo}>
          <img
            src={clxendLogo}
            alt="CLXEND"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
            }}
          />
        </div>

        <div>
          <div style={styles.brandName}>
            CLXEND
          </div>

          <div style={styles.brandSubtitle}>
            Secure Digital Wallet
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div style={styles.rightSection}>

        {/* Notification */}
        <button
          type="button"
          style={styles.iconButton}
          onClick={() => {}}
          aria-label="Notifications"
        >
          🔔
        </button>

        {/* User */}
        <div style={styles.userSection}>
          <div style={styles.avatar}>
            {userEmail
              .charAt(0)
              .toUpperCase()}
          </div>

          <div
            className="vectro-navbar-user-info"
            style={styles.userInfo}
            >
            <span style={styles.userName}>
              User
            </span>

            <span style={styles.userEmail}>
              {userEmail}
            </span>
          </div>
        </div>

        {/* Logout */}
        <button
        className="vectro-navbar-logout"
        type="button"
        onClick={handleLogout}
        style={styles.logoutButton}
        >
          Logout
        </button>

      </div>

    </header>
  );
}

const styles = {
  navbar: {
    height: 72,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",

    background:
      "rgba(11, 17, 32, 0.92)",

    borderBottom:
      "1px solid rgba(148,163,184,0.12)",

    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",

    position: "sticky",
    top: 0,
    zIndex: 100,
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    cursor: "pointer",
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

  brandName: {
    fontSize: 17,
    fontWeight: 800,
    letterSpacing: 1.3,
    color: "#ffffff",
  },

  brandSubtitle: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 2,
  },

  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },

  iconButton: {
    width: 38,
    height: 38,

    borderRadius: 10,
    border:
      "1px solid rgba(148,163,184,0.14)",

    background: "#111827",
    color: "#ffffff",

    cursor: "pointer",
    fontSize: 16,
  },

  userSection: {
    display: "flex",
    alignItems: "center",
    gap: 9,
  },

  avatar: {
    width: 36,
    height: 36,

    borderRadius: "50%",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    background:
      "linear-gradient(135deg, #8b5cf6, #2563eb)",

    color: "#ffffff",
    fontWeight: 800,
    fontSize: 14,
  },

  userInfo: {
    display: "flex",
    flexDirection: "column",
  },

  userName: {
    fontSize: 12,
    fontWeight: 700,
    color: "#ffffff",
  },

  userEmail: {
    fontSize: 10,
    color: "#64748b",
    maxWidth: 150,

    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  logoutButton: {
    height: 38,
    padding: "0 14px",

    borderRadius: 9,

    border:
      "1px solid rgba(248,113,113,0.25)",

    background:
      "rgba(248,113,113,0.08)",

    color: "#f87171",

    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
  },
};