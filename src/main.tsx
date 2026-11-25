import { createRoot } from "react-dom/client";
import App from "./App";
import { boot } from "./lib/boot";
import { IS_ARTIFACT } from "./lib/persist";
import "./styles.css";

// בגרסת ה-Artifact אין לנו תגית <html> משלנו, אז קובעים כיוון ושפה כאן
document.documentElement.lang = "he";
document.documentElement.dir = "rtl";

createRoot(document.getElementById("root")!).render(<App />);
void boot();

if (!IS_ARTIFACT && import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* בלי מצב אופליין */
    });
  });
}
