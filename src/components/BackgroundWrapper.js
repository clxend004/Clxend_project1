import "./background.css";

export default function BackgroundWrapper({ children }) {
  return (
    <div className="app-bg">
      <div className="content">{children}</div>
    </div>
  );
}