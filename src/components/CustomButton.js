import React from "react";

// styling
const styles = {
  button: {
    backgroundColor: "#007BFF",
    padding: "12px 20px",
    borderRadius: "8px",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    margin: "5px 0",
    border: "none",
  },
};

export default function CustomButton({ title, onClick }) {
  return (
    <button style={styles.button} onClick={onClick}>
      {title}
    </button>
  );
}