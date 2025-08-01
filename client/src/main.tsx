import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./lib/pwa";

// Register service worker for PWA functionality
registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
