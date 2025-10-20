import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import "@google/model-viewer";
import { initReveal } from "./lib/reveal";

initReveal();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
