"use client";

import { useEffect, useMemo, useState } from "react";

type Q = { text: string; answer: boolean | null };

type Result = { score: number; total: number };

const defaultQuestions: Q[] = [
  { text: "Ich trinke lieber Bier als Wein.", answer: null },
  { text: "Ich bin eher ein Morgenmensch.", answer: null },
  { text: "Ich war schon mal auf Mallorca.", answer: null },
  { text: "Ich esse gerne scharf.", answer: null },
  { text: "Ich mag keine Hunde.", answer: null }
];

const demoQuizAnswers = [true, false, true, true, false];

export default function Page() {
  const [screen, setScreen] = useState<"welcome" | "create" | "quiz" | "result">("welcome");
  const [questions, setQuestions] = useState<Q[]>(defaultQuestions);
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("knowme-results");
      if (saved) setResults(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("knowme-results", JSON.stringify(results));
    } catch {}
  }, [results]);

  const averageScore = useMemo(() => {
    if (!results.length) return null;
    const totalScores = results.reduce((acc, item) => acc + item.score, 0);
    return (totalScores / results.length).toFixed(1);
  }, [results]);

  const updateQ = (i: number, patch: Partial<Q>) => {
    setQuestions(prev => prev.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  };

  const startQuiz = () => {
    setStep(0);
    setScore(0);
    setScreen("quiz");
  };

  const startOwnQuizCreation = () => {
    setQuestions(defaultQuestions);
    setStep(0);
    setScore(0);
    setScreen("create");
  };

  const canStartCreatedQuiz = questions.every(q => q.text.trim() && q.answer !== null);

  const answer = (value: boolean) => {
    let nextScore = score;
    const correctAnswers = questions.map((q, i) => q.answer ?? demoQuizAnswers[i]);

    if (value === correctAnswers[step]) nextScore += 1;
    setScore(nextScore);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setResults(prev => [...prev, { score: nextScore, total: questions.length }]);
      setScreen("result");
    }
  };

  const restartQuizDirectly = () => {
    setStep(0);
    setScore(0);
    setScreen("quiz");
  };

  return (
    <main style={{ minHeight: "100vh", padding: "32px 20px", display: "flex", justifyContent: "center", background: "#0f172a", color: "white" }}>
      <div style={{ width: "100%", maxWidth: 760, background: "#1e293b", borderRadius: 20, padding: "28px 24px" }}>

        {screen === "welcome" && (
          <div>
            <div style={{ fontSize: 14, opacity: 0.75, marginBottom: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>KnowMe MVP</div>
            <h1 style={{ fontSize: 42, marginBottom: 16, lineHeight: 1.1 }}>Wie gut kennen dich deine Freunde wirklich?</h1>
            <p style={{ fontSize: 22, marginBottom: 12, color: "#cbd5e1", lineHeight: 1.5 }}>
              Erstelle ein eigenes Quiz oder teste direkt das Beispiel.
            </p>
            <p style={{ fontSize: 20, marginBottom: 28, color: "#94a3b8", lineHeight: 1.5 }}>
              Am Ende sehen die Teilnehmer ihren Score und du kannst das Quiz weiterschicken.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={startOwnQuizCreation} style={btnPrimary}>Eigenes Quiz erstellen</button>
              <button
                onClick={() => {
                  setQuestions(defaultQuestions);
                  startQuiz();
                }}
                style={btnGhost}
              >
                Demo spielen
              </button>
            </div>
          </div>
        )}

        {screen === "create" && (
          <div>
            <h2 style={{ fontSize: 34, marginBottom: 16 }}>Dein Quiz erstellen</h2>
            <p style={{ fontSize: 18, marginBottom: 20, color: "#94a3b8", lineHeight: 1.5 }}>
              Bearbeite die 5 Aussagen und setze die richtigen Antworten. Nichts ist vorausgewählt.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {questions.map((q, i) => (
                <div key={i} style={{ background: "#0f172a", padding: 14, borderRadius: 12 }}>
                  <input
                    value={q.text}
                    onChange={(e) => updateQ(i, { text: e.target.value })}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "none", marginBottom: 10, boxSizing: "border-box" }}
                  />
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => updateQ(i, { answer: true })} style={q.answer === true ? btnPrimarySmall : btnGhostSmall}>Wahr</button>
                    <button onClick={() => updateQ(i, { answer: false })} style={q.answer === false ? btnPrimarySmall : btnGhostSmall}>Falsch</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={startQuiz} style={{ ...btnPrimary, opacity: canStartCreatedQuiz ? 1 : 0.5, cursor: canStartCreatedQuiz ? "pointer" : "not-allowed" }} disabled={!canStartCreatedQuiz}>Quiz starten</button>
              <button onClick={() => setScreen("welcome")} style={btnGhost}>Zurück</button>
            </div>
          </div>
        )}

        {screen === "quiz" && (
          <div>
            <div style={{ marginBottom: 10, fontSize: 18, color: "#cbd5e1" }}>Frage {step + 1} / {questions.length}</div>
            <div style={{ height: 10, background: "#334155", borderRadius: 999, overflow: "hidden", marginBottom: 24 }}>
              <div style={{ width: `${((step + 1) / questions.length) * 100}%`, height: "100%", background: "white" }} />
            </div>
            <h2 style={{ fontSize: 34, marginBottom: 24, lineHeight: 1.25 }}>{questions[step].text}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <button onClick={() => answer(true)} style={btnPrimary}>Wahr</button>
              <button onClick={() => answer(false)} style={btnGhost}>Falsch</button>
            </div>
          </div>
        )}

        {screen === "result" && (
          <div>
            <div style={{ fontSize: 14, opacity: 0.75, marginBottom: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>Ergebnis</div>
            <h1 style={{ fontSize: 48, lineHeight: 1.1, marginBottom: 12 }}>{score} / {questions.length}</h1>
            <p style={{ fontSize: 22, marginBottom: 12, color: "#cbd5e1", lineHeight: 1.5 }}>
              {score === questions.length
                ? "Stark. Du kennst die Person wirklich gut."
                : score >= 3
                ? "Gar nicht schlecht. Aber da geht noch mehr."
                : "Das war eher schwierig. Ihr solltet vielleicht nochmal reden."}
            </p>
            <p style={{ fontSize: 20, marginBottom: 10, color: "#94a3b8", lineHeight: 1.5 }}>
              Durchschnitt aller bisherigen Teilnehmer: {averageScore !== null ? `${averageScore} / ${questions.length}` : "noch keine Daten"}
            </p>
            <p style={{ fontSize: 22, marginBottom: 28, color: "#94a3b8", lineHeight: 1.5 }}>
              Jetzt bist du dran: Erstelle dein eigenes Quiz und verschick es.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={startOwnQuizCreation} style={btnPrimary}>Eigenes Quiz erstellen</button>
              <button onClick={restartQuizDirectly} style={btnGhost}>Nochmal spielen</button>
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
