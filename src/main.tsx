import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./normal-edition.css";

const isNormalEdition = new URLSearchParams(window.location.search).get("edition") === "normal";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <div className={isNormalEdition ? "normal-edition" : ""}>
      <App />
    </div>
  </React.StrictMode>
);
