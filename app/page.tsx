"use client";

import { useState } from "react";

const questions = [
  { text: "Ich trinke lieber Bier als Wein.", answer: true },
  { text: "Ich bin ein Morgenmensch.", answer: false },
  { text: "Ich war schon mal auf Mallorca.", answer: true }
];

export default function Page() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);

  const answer = (value: boolean) => {
    if (value === questions[step].answer) {
      setScore(score + 1);
    }

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setStep(999); // Ergebnis
    }
  };

  if (step === 999) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Ergebnis: {score} / {questions.length}</h1>
        <button onClick={() => {
          setStep(0);
          setScore(0);
        }}>
          Nochmal spielen
        </button>
      </main>
    );
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Frage {step + 1}</h1>
      <p>{questions[step].text}</p>

      <button onClick={() => answer(true)}>Wahr</button>
      <button onClick={() => answer(false)}>Falsch</button>
    </main>
  );
}
