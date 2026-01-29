import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import "./index.css";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
);

if (import.meta.hot) {
  import.meta.hot.on("vite:beforeUpdate", () => {
    window.parent?.postMessage({ type: "sandbox:beforeUpdate" }, "*");
  });
  import.meta.hot.on("vite:afterUpdate", () => {
    window.parent?.postMessage({ type: "sandbox:afterUpdate" }, "*");
  });
}
