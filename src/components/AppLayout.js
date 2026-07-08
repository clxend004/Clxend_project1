import { useNavigate } from "react-router-dom";

export default function AppLayout({ children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("kycStatus");
    navigate("/login");
  };

  return (
    <div className="center-screen">
      <div className="card" style={{ padding: 20, position: "relative" }}>

        {/* 🔴 Logout Button (top right) */}
        <button
          onClick={handleLogout}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            padding: "6px 12px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            backgroundColor: "#ff4d4f",
            color: "#fff",
            fontWeight: "bold",
          }}
        >
          Logout
        </button>

        {/* 🔹 Page Content */}
        {children}
      </div>
    </div>
  );
}