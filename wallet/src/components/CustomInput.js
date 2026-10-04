import React, { useState, forwardRef } from "react";

const CustomInput = forwardRef((props, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
      }}
    >
      <input
        {...props}
        ref={ref}
        className={
          props.type === "date"
            ? "vectro-date-input"
            : undefined
        }
        value={props.value || ""}
        type={
          props.type === "password"
            ? showPassword
              ? "text"
              : "password"
            : props.type
        }
        style={{
          width: "100%",
          height: 52,
          padding: "0 14px",
          paddingRight:
            props.type === "password" ? 45 : 14,

          margin: "8px 0",

          borderRadius: 11,

          border:
            "1px solid rgba(148,163,184,0.18)",

          background: "#0b1220",

          color: "#ffffff",

          outline: "none",

          boxSizing: "border-box",

          fontSize: 14,

          ...props.style,
        }}
      />

      {props.type === "password" && (
        <span
          onClick={() =>
            setShowPassword(!showPassword)
          }
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",

            cursor: "pointer",
            userSelect: "none",

            fontSize: 16,
            color: "#94a3b8",
          }}
        >
          {showPassword ? "🙈" : "👁"}
        </span>
      )}
    </div>
  );
});

export default CustomInput;