import React from "react";

const styles = {
  input: {
    border: "1px solid #ccc",
    padding: "10px",
    borderRadius: "8px",
    margin: "5px 0",
    width: "100%",
    boxSizing: "border-box", // ensures padding doesn't break width
  },
};

export default function CustomInput(props) {
  return <input style={styles.input} {...props} />;
}