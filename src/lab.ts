// עמוד בדיקה פנימי לכלב התלת־ממדי (לא נכלל בבילד)
import { DogScene } from "./three/DogScene";
import type { CoatId, Mood, Pattern } from "./lib/types";

const q = new URLSearchParams(location.search);
const canvas = document.getElementById("c") as HTMLCanvasElement;
const scene = new DogScene(
  canvas,
  { coat: (q.get("coat") as CoatId) || "golden", pattern: (q.get("pattern") as Pattern) || "plain" },
  { framing: (q.get("framing") as "stage" | "face" | "full") || "stage", fur: q.get("fur") !== "0" },
);
scene.setMood((q.get("mood") as Mood) || "happy");
scene.resize(innerWidth, innerHeight);
const steps = Number(q.get("t") || 60);
for (let i = 0; i < steps; i++) scene.update(1 / 30);
scene.render();
(window as unknown as { ready: boolean }).ready = true;
(window as unknown as { scene: DogScene }).scene = scene;
