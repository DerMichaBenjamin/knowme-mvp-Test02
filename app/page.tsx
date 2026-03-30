"use client";

import { useState } from "react";

const questions = [
  { text: "Ich trinke lieber Bier als Wein.", answer: true },
  { text: "Ich bin eher ein Morgenmensch.", answer: false },
  { text: "Ich war schon mal auf Mallorca.", answer: true }
];

export default function Page() {
  const [screen, setScreen] = useState<"welcome" | "quiz" | "result">("welcome");
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);

  const answer = (value: boolean) => {
    let nextScore = score;
    if (value === questions[step].answer) {
      nextScore += 1;
      setScore(nextScore);
    }

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setScreen("result");
    }
  };

  const restart = () => {
    setStep(0);
    setScore(0);
    setScreen("welcome");
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px 20px",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        background: "#0f172a",
        color: "white"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 760,
          background: "#1e293b",
          borderRadius: 20,
          padding: "28px 24px",
          boxSizing: "border-box"
        }}
      >
        {screen === "welcome" && (
          <div>
            <div style={{ fontSize: 14, opacity: 0.75, marginBottom: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              KnowMe MVP
            </div>
            <h1 style={{ fontSize: 42, lineHeight: 1.1, margin: "0 0 16px 0" }}>
              Wie gut kennen dich deine Freunde wirklich?
            </h1>
            <p style={{ fontSize: 22, lineHeight: 1.5, margin: "0 0 12px 0", color: "#cbd5e1" }}>
              In diesem Quiz beantworten deine Freunde ein paar Aussagen über dich mit wahr oder falsch.
            </p>
            <p style={{ fontSize: 20, lineHeight: 1.5, margin: "0 0 28px 0", color: "#94a3b8" }}>
              Am Ende bekommen sie eine Punktzahl und können danach selbst ein Quiz erstellen und weiterschicken.
            </p>
            <button
              onClick={() => setScreen("quiz")}
              style={{
                fontSize: 22,
                padding: "16px 22px",
                borderRadius: 14,
                border: 0,
                background: "white",
                color: "#0f172a",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Quiz starten
            </button>
          </div>
        )}

        {screen === "quiz" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 18, color: "#cbd5e1", fontSize: 18 }}>
              <span>Frage {step + 1}</span>
              <span>{step + 1} / {questions.length}</span>
            </div>

            <div style={{ height: 10, background: "#334155", borderRadius: 999, overflow: "hidden", marginBottom: 26 }}>
              <div
                style={{
                  width: `${((step + 1) / questions.length) * 100}%`,
                  height: "100%",
                  background: "white"
                }}
              />
            </div>

            <h2 style={{ fontSize: 36, lineHeight: 1.2, margin: "0 0 28px 0" }}>{questions[step].text}</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <button
                onClick={() => answer(true)}
                style={{
                  fontSize: 24,
                  padding: "18px 16px",
                  borderRadius: 14,
                  border: 0,
                  background: "white",
                  color: "#0f172a",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Wahr
              </button>
              <button
                onClick={() => answer(false)}
                style={{
                  fontSize: 24,
                  padding: "18px 16px",
                  borderRadius: 14,
                  border: "1px solid #94a3b8",
                  background: "transparent",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Falsch
              </button>
            </div>
          </div>
        )}

        {screen === "result" && (
          <div>
            <div style={{ fontSize: 14, opacity: 0.75, marginBottom: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Ergebnis
            </div>
            <h1 style={{ fontSize: 48, lineHeight: 1.1, margin: "0 0 12px 0" }}>
              {score} / {questions.length}
            </h1>
            <p style={{ fontSize: 24, lineHeight: 1.5, margin: "0 0 12px 0", color: "#cbd5e1" }}>
              {score === questions.length
                ? "Stark. Du kennst die Person wirklich gut."
                : score >= 2
                ? "Gar nicht schlecht. Aber da geht noch mehr."
                : "Das war eher schwierig. Ihr solltet vielleicht nochmal reden."}
            </p>
            <p style={{ fontSize: 22, lineHeight: 1.5, margin: "0 0 28px 0", color: "#94a3b8" }}>
              Jetzt bist du dran: Erstelle dein eigenes Quiz und verschick es an deine Freunde.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
              <button
                onClick={restart}
                style={{
                  fontSize: 22,
                  padding: "16px 22px",
                  borderRadius: 14,
                  border: 0,
                  background: "white",
                  color: "#0f172a",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Eigenes Quiz erstellen
              </button>
              <button
                onClick={restart}
                style={{
                  fontSize: 22,
                  padding: "16px 22px",
                  borderRadius: 14,
                  border: "1px solid #94a3b8",
                  background: "transparent",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Nochmal spielen
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
