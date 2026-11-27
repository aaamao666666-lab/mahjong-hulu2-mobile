import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = document.getElementById("app");
if (!root) throw new Error("Missing #app mount element");
createRoot(root).render(<React.StrictMode><App /></React.StrictMode>);
