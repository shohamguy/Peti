import { fx } from "./fx";
import { initPersistence, setSaveErrorHandler } from "./persist";
import { useApp } from "./store";

let lastWarn = 0;
setSaveErrorHandler(() => {
  if (Date.now() - lastWarn < 20_000) return;
  lastWarn = Date.now();
  fx.emit({ type: "toast", emoji: "⚠️", text: "השמירה לא הצליחה. ננסה שוב עוד רגע." });
});

/** טעינת הנתונים השמורים והפעלת האפליקציה */
export async function boot(forceLocal = false) {
  useApp.setState({ ready: false, loadError: false });
  const res = await initPersistence(forceLocal);
  if (!res.ok) {
    useApp.setState({ loadError: true });
    return;
  }
  useApp.getState().hydrate(res.data, res.kind);
}
