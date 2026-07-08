import React from "react";

export default function CustomInput(props) {
  return (
    <input
      {...props}
      value={props.value || ""}
      style={{
        width: "100%",
        padding: 10,
        margin: "8px 0",
        borderRadius: 10,
        border: "none",
        background: "rgba(255,255,255,0.6)",
        outline: "none",
      }}
    />
  );
}