import { ageText } from "../lib/dates";
import { gFor } from "../lib/data";
import { levelInfo } from "../lib/gamify";
import { useActiveDog } from "../lib/store";
import { useUI } from "../lib/ui";
import { Icon } from "./Icons";
import ProgressRing from "./ProgressRing";
import { DogAvatar } from "./ui";

export default function TopBar({ title }: { title?: string }) {
  const dog = useActiveDog();
  const openSheet = useUI((s) => s.openSheet);
  if (!dog) return null;
  const lvl = levelInfo(dog.xp);
  const g = gFor(dog.sex);
  const age = dog.birth ? `${g("בן", "בת")} ${ageText(dog.birth)}` : dog.breed;
  return (
    <header className="topbar">
      <button type="button" className="dog-chip" onClick={() => openSheet("dog")} aria-label={`הפרופיל של ${dog.name} והגדרות`}>
        <DogAvatar dog={dog} size={40} />
        <span className="dog-chip-text">
          <strong>{dog.name}</strong>
          <small>{age}</small>
        </span>
        <Icon name="chevron" size={16} />
      </button>
      {title && <h1 className="topbar-title">{title}</h1>}
      <button type="button" className="level-btn" onClick={() => openSheet("badges")} aria-label={`רמה ${lvl.level}: ${lvl.title}. הישגים`}>
        <ProgressRing value={lvl.pct} size={46} stroke={5}>
          <span className="level-num">{lvl.level}</span>
        </ProgressRing>
      </button>
    </header>
  );
}
