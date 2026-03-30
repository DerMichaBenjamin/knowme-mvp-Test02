"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createClient } from "@supabase/supabase-js";

type Screen =
  | "welcome"
  | "create"
  | "share"
  | "intro"
  | "play"
  | "result"
  | "dashboard";

type Question = {
  text: string;
  answer: boolean | null;
};

type ResultEntry = {
  player_name: string;
  score: number;
  total: number;
  percent: number;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* ---------- STYLES ---------- */

const pageStyle: CSSProperties = {
  padding: 20,
  color: "white",
  background: "#0f172a",
  minHeight: "100vh",
  fontFamily: "Arial",
};

const primaryBtn: CSSProperties = {
  fontSize: 22,
  padding: "16px 22px",
  borderRadius: 14,
  border: 0,
  background: "white",
  color: "#0f172a",
  fontWeight: 700,
  cursor: "pointer",
};

const ghostBtn: CSSProperties = {
  ...primaryBtn,
  background: "transparent",
  color: "white",
  border: "1px solid #94a3b8",
};

const swipeCard: CSSProperties = {
  width: "100%",
  maxWidth: 720,
  minHeight: 260,
  borderRadius: 24,
  background: "#1e293b",
  border: "1px solid #334155",
  padding: 24,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  position: "relative",
  userSelect: "none",
};

/* ---------- COMPONENT ---------- */

export default function Page() {
  const [screen, setScreen] = useState<Screen>("welcome");

  const [creatorName, setCreatorName] = useState("");
  const [quizTitle, setQuizTitle] = useState("Wie gut kennst du ...?");
  const [shareUrl, setShareUrl] = useState("");
  const [quizId, setQuizId] = useState("");

  const [questions, setQuestions] = useState<Question[]>([
    { text: "", answer: null },
    { text: "", answer: null },
    { text: "", answer: null },
  ]);

  const [playerName, setPlayerName] = useState("");
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);

  const [currentPercent, setCurrentPercent] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<ResultEntry[]>([]);

  /* ---------- SWIPE ---------- */

  const [dragX, setDragX] = useState(0);
  const startX = useRef<number | null>(null);
  const threshold = 80;

  const onPointerDown = (e: React.PointerEvent) => {
    startX.current = e.clientX;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (startX.current === null) return;
    setDragX(e.clientX - startX.current);
  };

  const onPointerUp = () => {
    if (dragX > threshold) answer(true);
    else if (dragX < -threshold) answer(false);

    setDragX(0);
    startX.current = null;
  };

  /* ---------- LOGIC ---------- */

  useEffect(() => {
    setQuizTitle(
      creatorName.trim()
        ? `Wie gut kennst du ${creatorName}?`
        : "Wie gut kennst du ...?"
    );
  }, [creatorName]);

  const canCreate =
    creatorName &&
    questions.every((q) => q.text && q.answer !== null) &&
    questions.length >= 3 &&
    questions.length <= 5;

  const createQuiz = async () => {
    if (!canCreate) return;

    const { data } = await supabase
      .from("quizzes")
      .insert({
        creator_name: creatorName,
        title: quizTitle,
        question_count: questions.length,
      })
      .select("id")
      .single();

    const id = data.id;

    await supabase.from("quiz_questions").insert(
      questions.map((q, i) => ({
        quiz_id: id,
        text: q.text,
        correct_answer: q.answer,
        position: i + 1,
      }))
    );

    const url = `${window.location.origin}/?q=${id}`;
    setQuizId(id);
    setShareUrl(url);
    setScreen("share");
  };

  const answer = async (val: boolean) => {
    const correct = questions[step].answer;
    const newScore = score + (val === correct ? 1 : 0);
    setScore(newScore);

    if (step < questions.length - 1) {
      setStep(step + 1);
      return;
    }

    const percent = Math.round((newScore / questions.length) * 100);
    setCurrentPercent(percent);

    await supabase.from("quiz_results").insert({
      quiz_id: quizId,
      player_name: playerName || "Anonymous",
      score: newScore,
      total: questions.length,
      percent,
    });

    setScreen("result");
  };

  /* ---------- UI ---------- */

  return (
    <main style={pageStyle}>
      {screen === "welcome" && (
        <>
          <h1>Wie gut kennen dich deine Freunde?</h1>
          <button onClick={() => setScreen("create")} style={primaryBtn}>
            Quiz erstellen
          </button>
        </>
      )}

      {screen === "create" && (
        <>
          <input
            placeholder="Dein Name"
            value={creatorName}
            onChange={(e) => setCreatorName(e.target.value)}
          />

          {questions.map((q, i) => (
            <div key={i}>
              <input
                placeholder={`Frage ${i + 1}`}
                value={q.text}
                onChange={(e) => {
                  const copy = [...questions];
                  copy[i].text = e.target.value;
                  setQuestions(copy);
                }}
              />

              <button
                onClick={() => {
                  const copy = [...questions];
                  copy[i].answer = true;
                  setQuestions(copy);
                }}
              >
                Wahr
              </button>

              <button
                onClick={() => {
                  const copy = [...questions];
                  copy[i].answer = false;
                  setQuestions(copy);
                }}
              >
                Falsch
              </button>
            </div>
          ))}

          <button onClick={createQuiz} disabled={!canCreate}>
            Quiz teilen
          </button>
        </>
      )}

      {screen === "share" && (
        <>
          <p>{shareUrl}</p>
          <button
            onClick={() => navigator.clipboard.writeText(shareUrl)}
            style={primaryBtn}
          >
            Link kopieren
          </button>

          <input
            placeholder="Dein Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />

          <button onClick={() => setScreen("play")} disabled={!playerName}>
            Start
          </button>
        </>
      )}

      {screen === "play" && (
        <>
          <h2>{questions[step].text}</h2>

          <div
            style={{
              ...swipeCard,
              transform: `translateX(${dragX}px) rotate(${dragX / 15}deg)`,
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            Swipe →
          </div>

          <button onClick={() => answer(true)}>Wahr</button>
          <button onClick={() => answer(false)}>Falsch</button>
        </>
      )}

      {screen === "result" && (
        <>
          <h1>{currentPercent}%</h1>

          <button
            onClick={() => navigator.clipboard.writeText(shareUrl)}
            style={primaryBtn}
          >
            Link teilen
          </button>

          <button onClick={() => setScreen("create")}>
            Neues Quiz erstellen
          </button>
        </>
      )}
    </main>
  );
}
