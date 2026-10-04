import { useLocation, useNavigate } from "react-router-dom";

export default function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    {
      label: "KYC",
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
  ];

  return (
    <nav
      className="vectro-mobile-nav"
      style={styles.nav}
    >
      {items.map((item) => {
        const active =
          location.pathname === item.path;

        return (
          <button
            key={item.path}
            type="button"
            onClick={() => navigate(item.path)}
            style={{
              ...styles.item,
              ...(active
                ? styles.active
                : {}),
            }}
          >
            <span style={styles.icon}>
              {item.icon}
            </span>

            <span>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

const styles = {
  nav: {
    display: "none",

    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,

    height: 65,

    background:
      "rgba(11,17,32,0.97)",

    borderTop:
      "1px solid rgba(148,163,184,0.12)",

    zIndex: 200,

    justifyContent: "space-around",
    alignItems: "center",
  },

  item: {
    border: "none",
    background: "transparent",

    color: "#64748b",

    display: "flex",
    flexDirection: "column",
    alignItems: "center",

    gap: 3,

    fontSize: 9,
    fontWeight: 600,

    cursor: "pointer",
  },

  active: {
    color: "#ffffff",
  },

  icon: {
    fontSize: 18,
  },
};