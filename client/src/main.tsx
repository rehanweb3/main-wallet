import { createRoot } from "react-dom/client";
import { Buffer } from "buffer";
import App from "./App";
import "./index.css";

// Polyfill Buffer for browser environment
globalThis.Buffer = Buffer;

createRoot(document.getElementById("root")!).render(<App />);
