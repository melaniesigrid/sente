import { useRef, useState } from "react";
import { FolderOpen, AlertCircle } from "lucide-react";
import { Card } from "./ui.jsx";
import { readSgf, importSummary } from "../views/sgfImport.js";
import { useT } from "./langStore.js";

/* ----------------------- OPEN AN SGF -----------------------
   The file end of review. All this does is get text off a disk and hand it to
   `readSgf`, which decides whether it is a game Joseki is willing to show; every
   judgment lives there, where it is tested.

   Failures are shown, named, and left on screen until the next attempt. A file
   picker that silently does nothing is the worst version of this feature. */

export function OpenSgf({ onOpen }) {
  const t = useT();
  const input = useRef(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);

  const take = (file) => {
    if (!file) return;
    setError(null);
    const reader = new FileReader();
    reader.onerror = () => setError(t("sgf.unreadable", { name: file.name }));
    reader.onload = () => {
      const res = readSgf(String(reader.result ?? ""), file.name);
      if (res.ok) onOpen(res.record, importSummary(res.record));
      else setError(res.message);
    };
    reader.readAsText(file);
  };

  return (
    <Card inset className={`open-sgf ${dragging ? "dragging" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); take(e.dataTransfer.files[0]); }}>
      <div className="stat-head"><FolderOpen size={17} /><span>{t("sgf.head")}</span></div>
      <p className="fine">{t("sgf.note")}</p>
      <input ref={input} type="file" accept=".sgf,application/x-go-sgf,text/plain"
        className="visually-hidden" id="sgf-file"
        onChange={(e) => { take(e.target.files[0]); e.target.value = ""; }} />
      <label htmlFor="sgf-file" className="btn btn-file">
        <FolderOpen size={15} /> {t("sgf.choose")}
      </label>
      {error && (
        <p className="open-sgf-error" role="alert">
          <AlertCircle size={14} /> {error}
        </p>
      )}
    </Card>
  );
}
