"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
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
  fontFamily: "Arial, sans-serif",
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

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  maxWidth: 560,
  padding: 14,
  marginBottom: 14,
  borderRadius: 12,
  border: "none",
  fontSize: 18,
  boxSizing: "border-box",
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
  touchAction: "pan-y",
  boxSizing: "border-box",
  transition: "transform 0.12s ease",
  marginBottom: 20,
};

const sectionStyle: CSSProperties = {
  maxWidth: 860,
};

const questionBoxStyle: CSSProperties = {
  background: "#1e293b",
  padding: 16,
  borderRadius: 14,
  marginBottom: 16,
  maxWidth: 720,
};

const resultRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  background: "#1e293b",
  padding: 14,
  borderRadius: 12,
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

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    startX.current = e.clientX;
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (startX.current === null) return;
    setDragX(e.clientX - startX.current);
  };

  const onPointerUp = () => {
    if (dragX > threshold) {
      void answer(true);
    } else if (dragX < -threshold) {
      void answer(false);
    }

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
    creatorName.trim().length > 0 &&
    questions.every((q) => q.text.trim().length > 0 && q.answer !== null) &&
    questions.length >= 3 &&
    questions.length <= 5;

  const addQuestion = () => {
    if (questions.length >= 5) return;
    setQuestions((prev) => [...prev, { text: "", answer: null }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 3) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const createQuiz = async () => {
    if (!canCreate) return;

    const { data, error } = await supabase
      .from("quizzes")
      .insert({
        creator_name: creatorName.trim(),
        title: quizTitle,
        question_count: questions.length,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Supabase create quiz error:", error);
      alert("Quiz konnte nicht gespeichert werden.");
      return;
    }

    const id = data.id as string;

    const { error: questionError } = await supabase.from("quiz_questions").insert(
      questions.map((q, i) => ({
        quiz_id: id,
        text: q.text.trim(),
        correct_answer: q.answer,
        position: i + 1,
      }))
    );

    if (questionError) {
      console.error("Supabase create question error:", questionError);
      alert("Fragen konnten nicht gespeichert werden.");
      return;
    }

    const url = `${window.location.origin}/?q=${id}`;
    setQuizId(id);
    setShareUrl(url);
    setScreen("share");
  };

  const loadLeaderboard = async (id: string) => {
    const { data, error } = await supabase
      .from("quiz_results")
      .select("player_name, score, total, percent")
      .eq("quiz_id", id)
      .order("percent", { ascending: false })
      .order("score", { ascending: false });

    if (error || !data) {
      setLeaderboard([]);
      return;
    }

    setLeaderboard(data as ResultEntry[]);
  };

  const answer = async (val: boolean) => {
    const correct = questions[step]?.answer;
    const newScore = score + (val === correct ? 1 : 0);
    setScore(newScore);

    if (step < questions.length - 1) {
      setStep((prev) => prev + 1);
      setDragX(0);
      return;
    }

    const percent = Math.round((newScore / questions.length) * 100);
    setCurrentPercent(percent);

    if (!quizId) {
      console.error("Kein quizId gesetzt.");
      setScreen("result");
      return;
    }

    const { error } = await supabase.from("quiz_results").insert({
      quiz_id: quizId,
      player_name: playerName.trim() || "Anonymous",
      score: newScore,
      total: questions.length,
      percent,
    });

    if (error) {
      console.error("Supabase result insert error:", error);
    } else {
      await loadLeaderboard(quizId);
    }

    setDragX(0);
    setScreen("result");
  };

  const progressPercent =
    questions.length > 0 ? Math.round(((step + 1) / questions.length) * 100) : 0;

  const startPlay = () => {
    if (!playerName.trim()) return;
    setStep(0);
    setScore(0);
    setCurrentPercent(null);
    setDragX(0);
    setScreen("play");
  };

  /* ---------- UI ---------- */

  return (
    <main style={pageStyle}>
      <div style={sectionStyle}>
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
            <h2>Quiz erstellen</h2>

            <input
              placeholder="Dein Name"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              style={inputStyle}
            />

            {questions.map((q, i) => (
              <div key={i} style={questionBoxStyle}>
                <input
                  placeholder={`Frage ${i + 1}`}
                  value={q.text}
                  onChange={(e) => {
                    const copy = [...questions];
                    copy[i].text = e.target.value;
                    setQuestions(copy);
                  }}
                  style={inputStyle}
                />

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={() => {
                      const copy = [...questions];
                      copy[i].answer = true;
                      setQuestions(copy);
                    }}
                    style={{
                      ...ghostBtn,
                      background: q.answer === true ? "white" : "transparent",
                      color: q.answer === true ? "#0f172a" : "white",
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
                    style={{
                      ...ghostBtn,
                      background: q.answer === false ? "white" : "transparent",
                      color: q.answer === false ? "#0f172a" : "white",
                    }}
                  >
                    Falsch
                  </button>

                  <button
                    onClick={() => removeQuestion(i)}
                    disabled={questions.length <= 3}
                    style={{
                      ...ghostBtn,
                      opacity: questions.length <= 3 ? 0.4 : 1,
                    }}
                  >
                    Entfernen
                  </button>
                </div>
              </div>
            ))}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              <button
                onClick={addQuestion}
                disabled={questions.length >= 5}
                style={{ ...ghostBtn, opacity: questions.length >= 5 ? 0.4 : 1 }}
              >
                + Frage hinzufügen
              </button>

              <button onClick={createQuiz} disabled={!canCreate} style={primaryBtn}>
                Quiz teilen
              </button>
            </div>
          </>
        )}

        {screen === "share" && (
          <>
            <h2>Quiz teilen</h2>
            <p>{shareUrl}</p>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              <button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                style={primaryBtn}
              >
                Link kopieren
              </button>
            </div>

            <input
              placeholder="Dein Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              style={inputStyle}
            />

            <button onClick={startPlay} disabled={!playerName.trim()} style={primaryBtn}>
              Start
            </button>
          </>
        )}

        {screen === "play" && (
          <>
            <p style={{ opacity: 0.8 }}>Frage {step + 1} von {questions.length}</p>

            <div
              style={{
                width: "100%",
                maxWidth: 720,
                height: 12,
                background: "#334155",
                borderRadius: 999,
                overflow: "hidden",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: "100%",
                  background: "white",
                }}
              />
            </div>

            <h2>{questions[step]?.text}</h2>

            <div
              style={{
                ...swipeCard,
                transform: `translateX(${dragX}px) rotate(${dragX / 15}deg)`,
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              Swipe →
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => void answer(true)} style={primaryBtn}>
                Wahr
              </button>
              <button onClick={() => void answer(false)} style={ghostBtn}>
                Falsch
              </button>
            </div>
          </>
        )}

        {screen === "result" && (
          <>
            <h1>{currentPercent}%</h1>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              <button
                onClick={() => navigator.clipboard.writeText(shareUrl)}
                style={primaryBtn}
              >
                Link teilen
              </button>

              <button onClick={() => setScreen("create")} style={ghostBtn}>
                Neues Quiz erstellen
              </button>
            </div>

            <h2>Leaderboard</h2>

            {leaderboard.length === 0 ? (
              <p>Noch keine Ergebnisse vorhanden.</p>
            ) : (
              <div style={{ display: "grid", gap: 10, maxWidth: 720 }}>
                {leaderboard.slice(0, 10).map((entry, index) => (
                  <div key={`${entry.player_name}-${index}`} style={resultRowStyle}>
                    <div>
                      <strong>
                        #{index + 1} {entry.player_name}
                      </strong>
                      <div style={{ opacity: 0.8, fontSize: 14 }}>
                        {entry.score} / {entry.total} richtig
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 22 }}>
                      {Math.round(Number(entry.percent))}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
