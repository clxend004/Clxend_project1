import React from "react";

export default function Loader() {
  return (
    <div
      style={{
        width: 50,
        height: 50,
        border: "6px solid #f3f3f3",
        borderTop: "6px solid #007BFF",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        margin: "20px auto",
      }}
    />
  );
}
