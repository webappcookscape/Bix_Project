
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { TaskProvider } from "./context/TaskContext";
// ToastProvider removed

ReactDOM.createRoot(document.getElementById("root")).render(
  <>
    <TaskProvider>
      <App />
    </TaskProvider>
  </>
);
