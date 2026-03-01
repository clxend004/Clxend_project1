import { useNavigate } from "react-router-dom";

export default function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Welcome !</h1>
      <p style={styles.subtitle}>Your smart wallet companion</p>

      <div style={{ marginTop: 40 }} />

      <button
        style={styles.registerButton}
        onClick={() => navigate("/register")}
      >
        Register
      </button>

      <div style={{ marginTop: 15 }} />

      <button style={styles.loginButton} onClick={() => navigate("/login")}>
        Login
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    padding: 20,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    margin: 0,
  },
  subtitle: {
    fontSize: 16,
    color: "gray",
    marginTop: 10,
    marginBottom: 0,
  },
  registerButton: {
    width: "50%",
    padding: 15,
    backgroundColor: "#4CAF50",
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  loginButton: {
    width: "50%",
    padding: 15,
    backgroundColor: "#2196F3",
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
};
