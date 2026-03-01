import React from "react";

const spinnerStyle = {
  display: "inline-block",
  width: "50px",
  height: "50px",
  border: "6px solid #f3f3f3",
  borderTop: "6px solid #007BFF",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  margin: "20px auto",
};

// Add keyframes for spinning
const styleSheet = document.styleSheets[0];
const keyframes =
  `@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }`;
styleSheet.insertRule(keyframes, styleSheet.cssRules.length);

export default function Loader() {
  return <div style={spinnerStyle}></div>;
}