"use client";

import { useState } from "react";

type Q = { text: string; answer: boolean };

const defaultQuestions: Q[] = [
  { text: "Ich trinke lieber Bier als Wein.", answer: true },
  { text: "Ich bin eher ein Morgenmensch.", answer: false },
  { text: "Ich war schon mal auf Mallorca.", answer: true },
  { text: "Ich esse gerne scharf.", answer: true },
  { text: "Ich mag keine Hunde.", answer: false }
];

export default function Page() {
  const [screen, setScreen] = useState<"welcome" | "create" | "quiz" | "result">("welcome");
  const [questions, setQuestions] = useState<Q[]>(defaultQuestions);
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);

  const updateQ = (i: number, patch: Partial<Q>) => {
    setQuestions(prev => prev.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  };

  const startQuiz = () => {
    setStep(0);
    setScore(0);
    setScreen("quiz");
  };

  const answer = (value: boolean) => {
    let nextScore = score;
    if (value === questions[step].answer) nextScore += 1;
    setScore(nextScore);

    if (step < questions.length - 1) setStep(step + 1);
    else setScreen("result");
  };

  const restart = () => {
    setStep(0);
    setScore(0);
    setScreen("welcome");
  };

  return (
    <main style={{ minHeight: "100vh", padding: "32px 20px", display: "flex", justifyContent: "center", background: "#0f172a", color: "white" }}>
      <div style={{ width: "100%", maxWidth: 760, background: "#1e293b", borderRadius: 20, padding: "28px 24px" }}>

        {screen === "welcome" && (
          <div>
            <div style={{ fontSize: 14, opacity: 0.75, marginBottom: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>KnowMe MVP</div>
            <h1 style={{ fontSize: 42, marginBottom: 16 }}>Wie gut kennen dich deine Freunde wirklich?</h1>
            <p style={{ fontSize: 22, marginBottom: 28, color: "#cbd5e1" }}>
              Erstelle ein eigenes Quiz oder teste direkt das Beispiel.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setScreen("create")} style={btnPrimary}>Eigenes Quiz erstellen</button>
              <button onClick={startQuiz} style={btnGhost}>Demo spielen</button>
            </div>
          </div>
        )}

        {screen === "create" && (
          <div>
            <h2 style={{ fontSize: 34, marginBottom: 16 }}>Dein Quiz erstellen</h2>
            <p style={{ fontSize: 18, marginBottom: 20, color: "#94a3b8" }}>Bearbeite die 5 Aussagen und setze die richtigen Antworten.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {questions.map((q, i) => (
                <div key={i} style={{ background: "#0f172a", padding: 14, borderRadius: 12 }}>
                  <input
                    value={q.text}
                    onChange={(e) => updateQ(i, { text: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "none", marginBottom: 10 }}
                  />
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => updateQ(i, { answer: true })} style={q.answer ? btnPrimarySmall : btnGhostSmall}>Wahr</button>
                    <button onClick={() => updateQ(i, { answer: false })} style={!q.answer ? btnPrimarySmall : btnGhostSmall}>Falsch</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
              <button onClick={startQuiz} style={btnPrimary}>Quiz starten</button>
              <button onClick={() => setScreen("welcome")} style={btnGhost}>Zurück</button>
            </div>
          </div>
        )}

        {screen === "quiz" && (
          <div>
            <div style={{ marginBottom: 10 }}>Frage {step + 1} / {questions.length}</div>
            <h2 style={{ fontSize: 34, marginBottom: 24 }}>{questions[step].text}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <button onClick={() => answer(true)} style={btnPrimary}>Wahr</button>
              <button onClick={() => answer(false)} style={btnGhost}>Falsch</button>
            </div>
          </div>
        )}

        {screen === "result" && (
          <div>
            <h1 style={{ fontSize: 48 }}>{score} / {questions.length}</h1>
            <p style={{ fontSize: 22, marginBottom: 20 }}>Jetzt bist du dran: Erstelle dein eigenes Quiz und verschick es.</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setScreen("create")} style={btnPrimary}>Eigenes Quiz erstellen</button>
              <button onClick={restart} style={btnGhost}>Nochmal spielen</button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

const btnPrimary = {
  fontSize: 20,
  padding: "14px 18px",
  borderRadius: 12,
  border: 0,
  background: "white",
  color: "#0f172a",
  fontWeight: 700,
  cursor: "pointer"
} as const;

const btnGhost = {
  fontSize: 20,
  padding: "14px 18px",
  borderRadius: 12,
  border: "1px solid #94a3b8",
  background: "transparent",
  color: "white",
  fontWeight: 700,
  cursor: "pointer"
} as const;

const btnPrimarySmall = { ...btnPrimary, fontSize: 16, padding: "10px 14px" } as const;
const btnGhostSmall = { ...btnGhost, fontSize: 16, padding: "10px 14px" } as const;
