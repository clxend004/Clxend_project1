import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import BackgroundWrapper from "../components/BackgroundWrapper";

export default function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <BackgroundWrapper>
      <AppLayout>
        <div style={styles.wrapper}>
          <div style={styles.card}>
            <h1 style={styles.title}>Welcome To Vectro !</h1>
            <p style={styles.subtitle}>Your smart wallet companion</p>

            <button
              style={{ ...styles.button, backgroundColor: "#4CAF50" }}
              onClick={() => navigate("/register")}
            >
              Register
            </button>

            <button
              style={{ ...styles.button, backgroundColor: "#2196F3" }}
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          </div>
        </div>
      </AppLayout>
    </BackgroundWrapper>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "80vh",
  },

  card: {
    width: "100%",
    maxWidth: "350px",
    padding: "30px 20px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.9)",
    boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
    textAlign: "center",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 14,
    color: "gray",
    marginBottom: 25,
  },

  button: {
    width: "100%",
    padding: 14,
    fontSize: 16,
    fontWeight: "bold",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    marginTop: 10,
    transition: "0.3s",
  },
};