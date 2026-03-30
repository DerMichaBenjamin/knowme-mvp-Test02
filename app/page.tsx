"use client";

import { useEffect, useMemo, useState } from "react";

type Q = { id: string; text: string; answer: boolean | null };
type Result = { name: string; score: number; total: number };

const uid = () => Math.random().toString(36).slice(2, 9);

const makeDefaults = (): Q[] => [
  { id: uid(), text: "Ich trinke lieber Bier als Wein.", answer: null },
  { id: uid(), text: "Ich bin eher ein Morgenmensch.", answer: null },
  { id: uid(), text: "Ich war schon mal auf Mallorca.", answer: null },
];

export default function Page() {
  const [screen, setScreen] = useState<"welcome" | "create" | "share" | "play_intro" | "quiz" | "result">("welcome");
  const [questions, setQuestions] = useState<Q[]>(makeDefaults());
  const [answersKey, setAnswersKey] = useState<boolean[]>([]);
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [quizId, setQuizId] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const r = localStorage.getItem("knowme-results");
      if (r) setResults(JSON.parse(r));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("knowme-results", JSON.stringify(results)); } catch {}
  }, [results]);

  const average = useMemo(() => {
    if (!results.length) return null;
    const s = results.reduce((a, b) => a + b.score, 0);
    return (s / results.length).toFixed(1);
  }, [results]);

  const canStartCreated = questions.length >= 3 && questions.length <= 5 && questions.every(q => q.text.trim() && q.answer !== null);

  const updateQ = (id: string, patch: Partial<Q>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...patch } : q));
  };

  const addQ = () => {
    if (questions.length >= 5) return;
    setQuestions(prev => [...prev, { id: uid(), text: "", answer: null }]);
  };

  const removeQ = (id: string) => {
    if (questions.length <= 3) return;
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const startCreate = () => {
    setQuestions(makeDefaults());
    setScreen("create");
  };

  const toShare = () => {
    const id = uid();
    const key = questions.map(q => q.answer as boolean);
    setAnswersKey(key);
    setQuizId(id);
    const url = `${window.location.origin}/?q=${id}`; // simple link (MVP)
    setShareUrl(url);
    try { localStorage.setItem(`quiz-${id}`, JSON.stringify({ questions, key })); } catch {}
    setScreen("share");
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(shareUrl); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const loadFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("q");
    if (!id) return false;
    try {
      const raw = localStorage.getItem(`quiz-${id}`);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      setQuestions(parsed.questions);
      setAnswersKey(parsed.key);
      setQuizId(id);
      return true;
    } catch { return false; }
  };

  const startPlay = () => {
    const loaded = loadFromUrl();
    if (!loaded && answersKey.length === 0) {
      // fallback: use current questions with answers as key
      setAnswersKey(questions.map(q => q.answer ?? false));
    }
    setPlayerName("");
    setStep(0);
    setScore(0);
    setScreen("play_intro");
  };

  const answer = (v: boolean) => {
    const correct = answersKey[step];
    const nextScore = score + (v === correct ? 1 : 0);
    setScore(nextScore);
    if (step < questions.length - 1) {
      setStep(s => s + 1);
    } else {
      setResults(prev => [{ name: playerName || "Anonymous", score: nextScore, total: questions.length }, ...prev]);
      setScreen("result");
    }
  };

  const restartDirect = () => {
    setStep(0);
    setScore(0);
    setScreen("quiz");
  };

  return (
    <main style={{ minHeight: "100vh", padding: "32px 20px", display: "flex", justifyContent: "center", background: "#0f172a", color: "white" }}>
      <div style={{ width: "100%", maxWidth: 760, background: "#1e293b", borderRadius: 20, padding: "28px 24px" }}>

        {screen === "welcome" && (
          <div>
            <h1 style={{ fontSize: 42, marginBottom: 16 }}>Wie gut kennen dich deine Freunde wirklich?</h1>
            <p style={{ fontSize: 20, marginBottom: 24, color: "#cbd5e1" }}>Erstelle ein Quiz (3–5 Fragen) oder spiele eins.</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={startCreate} style={btnPrimary}>Eigenes Quiz</button>
              <button onClick={startPlay} style={btnGhost}>Quiz spielen</button>
            </div>
          </div>
        )}

        {screen === "create" && (
          <div>
            <h2 style={{ fontSize: 32, marginBottom: 12 }}>Quiz erstellen (3–5 Fragen)</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {questions.map((q, i) => (
                <div key={q.id} style={{ background: "#0f172a", padding: 12, borderRadius: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <strong>Frage {i + 1}</strong>
                    <button onClick={() => removeQ(q.id)} style={{ ...btnGhostSmall, opacity: questions.length > 3 ? 1 : 0.4 }}>x</button>
                  </div>
                  <input value={q.text} onChange={e => updateQ(q.id, { text: e.target.value })} style={input} />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button onClick={() => updateQ(q.id, { answer: true })} style={q.answer === true ? btnPrimarySmall : btnGhostSmall}>Wahr</button>
                    <button onClick={() => updateQ(q.id, { answer: false })} style={q.answer === false ? btnPrimarySmall : btnGhostSmall}>Falsch</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
              <button onClick={addQ} style={{ ...btnGhost, opacity: questions.length < 5 ? 1 : 0.4 }}>+ Frage</button>
              <button onClick={toShare} disabled={!canStartCreated} style={{ ...btnPrimary, opacity: canStartCreated ? 1 : 0.4 }}>Weiter / Link erstellen</button>
            </div>
          </div>
        )}

        {screen === "share" && (
          <div>
            <h2 style={{ fontSize: 32, marginBottom: 12 }}>Link teilen</h2>
            <div style={{ background: "#0f172a", padding: 12, borderRadius: 10, marginBottom: 12 }}>{shareUrl}</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={copy} style={btnPrimary}>{copied ? "Kopiert" : "Link kopieren"}</button>
              <button onClick={startPlay} style={btnGhost}>Vorschau spielen</button>
            </div>
          </div>
        )}

        {screen === "play_intro" && (
          <div>
            <h2 style={{ fontSize: 28, marginBottom: 12 }}>Name eingeben</h2>
            <input value={playerName} onChange={e => setPlayerName(e.target.value)} style={input} placeholder="Dein Name" />
            <div style={{ marginTop: 12 }}>
              <button onClick={() => setScreen("quiz")} disabled={!playerName.trim()} style={{ ...btnPrimary, opacity: playerName.trim() ? 1 : 0.4 }}>Start</button>
            </div>
          </div>
        )}

        {screen === "quiz" && (
          <div>
            <div style={{ marginBottom: 10 }}>Frage {step + 1} / {questions.length}</div>
            <h2 style={{ fontSize: 32, marginBottom: 20 }}>{questions[step].text}</h2>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => answer(true)} style={btnPrimary}>Wahr</button>
              <button onClick={() => answer(false)} style={btnGhost}>Falsch</button>
            </div>
          </div>
        )}

        {screen === "result" && (
          <div>
            <h1 style={{ fontSize: 44 }}>{score} / {questions.length}</h1>
            <p style={{ marginBottom: 10, color: "#cbd5e1" }}>Durchschnitt: {average ? `${average} / ${questions.length}` : "noch keine Daten"}</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={startCreate} style={btnPrimary}>Eigenes Quiz</button>
              <button onClick={restartDirect} style={btnGhost}>Nochmal spielen</button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

const input = { width: "100%", padding: 10, borderRadius: 8, border: "none" } as const;
const btnPrimary = { padding: "12px 16px", borderRadius: 10, border: 0, background: "white", color: "#0f172a", fontWeight: 700 } as const;
const btnGhost = { padding: "12px 16px", borderRadius: 10, border: "1px solid #94a3b8", background: "transparent", color: "white", fontWeight: 700 } as const;
const btnPrimarySmall = { ...btnPrimary, padding: "8px 12px" } as const;
const btnGhostSmall = { ...btnGhost, padding: "8px 12px" } as const;
