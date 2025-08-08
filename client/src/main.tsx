import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add error handling for debugging
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element not found!");
} else {
  console.log("Starting React application...");
  
  // Add temporary content for debugging
  rootElement.innerHTML = '<div style="background: white; color: black; padding: 20px; font-size: 24px;">LOADING REACT APP...</div>';
  
  setTimeout(() => {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  }, 1000);
}
