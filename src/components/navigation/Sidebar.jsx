import { useLocation, useNavigate } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      label: "Dashboard",
      icon: "⌂",
      path: "/dashboard",
    },
    {
      label: "KYC Verification",
      icon: "✓",
      path: "/kyc",
    },
    {
      label: "Wallet",
      icon: "◈",
      path: "/wallet",
    },
    {
      label: "Send",
      icon: "↗",
      path: "/send",
    },
    {
      label: "Receive",
      icon: "↙",
      path: "/receive",
    },
    {
      label: "Transactions",
      icon: "↔",
      path: "/transactions",
    },
    {
      label: "Escrow",
      icon: "E",
      path: "/escrow",
    },
    {
      label: "Security",
      icon: "⚿",
      path: "/security",
    },
  ];

  return (
    <aside className="vectro-sidebar" style={styles.sidebar}>
      <div style={styles.menuTitle}>
        MAIN MENU
      </div>

      <nav>
        {menuItems.map((item) => {
          const active = location.pathname === item.path;

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              style={{
                ...styles.menuItem,
                ...(active ? styles.activeItem : {}),
              }}
            >
              <span
                style={{
                  ...styles.menuIcon,
                  ...(active ? styles.activeIcon : {}),
                }}
              >
                {item.icon}
              </span>

              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={styles.bottomSection}>
        <div style={styles.menuTitle}>
          ACCOUNT
        </div>

        <button
          type="button"
          onClick={() => {}}
          style={styles.menuItem}
        >
          <span style={styles.menuIcon}>
            ⚙
          </span>

          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 230,
    minWidth: 230,
    height: "100%",
    padding: "24px 14px",
    background: "rgba(11,17,32,0.96)",
    borderRight: "1px solid rgba(148,163,184,0.10)",
    boxSizing: "border-box",
    overflow: "hidden",
  },

  menuTitle: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1.2,
    color: "#475569",
    padding: "0 12px 10px",
  },

  menuItem: {
    width: "100%",
    height: 46,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "0 12px",
    marginBottom: 5,
    border: "none",
    borderRadius: 10,
    background: "transparent",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    textAlign: "left",
  },

  activeItem: {
    background:
      "linear-gradient(90deg, rgba(139,92,246,0.16), rgba(37,99,235,0.12))",
    color: "#ffffff",
    border: "1px solid rgba(139,92,246,0.18)",
  },

  menuIcon: {
    width: 25,
    height: 25,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    background: "rgba(148,163,184,0.06)",
    fontSize: 14,
  },

  activeIcon: {
    background:
      "linear-gradient(135deg, #8b5cf6, #2563eb)",
    color: "#ffffff",
  },

  bottomSection: {
    marginTop: 35,
  },
};