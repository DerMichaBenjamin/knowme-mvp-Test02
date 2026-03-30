"use client";

import {
  useEffect,
  useMemo,
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

type QuizRow = {
  id: string;
  creator_name: string;
  title: string;
  question_count: number;
};

type QuizQuestionRow = {
  id: string;
  quiz_id: string;
  text: string;
  correct_answer: boolean;
  position: number;
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

const container: CSSProperties = {
  maxWidth: 860,
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

const bigBtn: CSSProperties = {
  ...primaryBtn,
  fontSize: 30,
  padding: "20px 28px",
};

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  maxWidth: 600,
  padding: 14,
  marginBottom: 14,
  borderRadius: 12,
  border: "none",
  fontSize: 18,
};

const card: CSSProperties = {
  background: "#1e293b",
  padding: 16,
  borderRadius: 14,
  marginBottom: 16,
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
  userSelect: "none",
  touchAction: "pan-y",
  transition: "transform 0.12s ease",
  marginBottom: 20,
};

const resultRow: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
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
  const [dashboard, setDashboard] = useState<ResultEntry[]>([]);
  const [average, setAverage] = useState<number | null>(null);
  const [rank, setRank] = useState<number | null>(null);

  /* ---------- SWIPE ---------- */

  const [dragX, setDragX] = useState(0);
  const startX = useRef<number | null>(null);
  const threshold = 80;

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    startX.current = e.clientX;
  };

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (startX.current === null) return;
    setDragX(e.clientX - startX.current);
  };

  const onUp = () => {
    if (dragX > threshold) answer(true);
    else if (dragX < -threshold) answer(false);

    setDragX(0);
    startX.current = null;
  };

  /* ---------- LOGIC ---------- */

  useEffect(() => {
    const clean = creatorName.trim();
    setQuizTitle(clean ? `Wie gut kennst du ${clean}?` : "Wie gut kennst du ...?");
  }, [creatorName]);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) loadQuiz(q);
  }, []);

  const canCreate =
    creatorName &&
    questions.every((q) => q.text && q.answer !== null);

  const createQuiz = async () => {
    const { data, error } = await supabase
      .from("quizzes")
      .insert({
        creator_name: creatorName,
        title: quizTitle,
        question_count: questions.length,
      })
      .select("id")
      .single();

    if (error || !data) {
      alert("Fehler beim Speichern");
      return;
    }

    const id = data.id;

    await supabase.from("quiz_questions").insert(
      questions.map((q, i) => ({
        quiz_id: id,
        text: q.text,
        correct_answer: q.answer,
        position: i + 1,
      }))
    );

    setQuizId(id);
    setShareUrl(`${window.location.origin}/?q=${id}`);
    setScreen("share");
  };

  const loadQuiz = async (id: string) => {
    const { data: q } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", id)
      .single();

    const { data: qs } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", id)
      .order("position");

    if (!q || !qs) return;

    setQuizId(id);
    setCreatorName(q.creator_name);
    setQuizTitle(q.title);
    setQuestions(
      qs.map((x: any) => ({
        text: x.text,
        answer: x.correct_answer,
      }))
    );

    setScreen("intro");
  };

  const loadStats = async () => {
    const { data } = await supabase
      .from("quiz_results")
      .select("*")
      .eq("quiz_id", quizId)
      .order("percent", { ascending: false });

    if (!data) return;

    setDashboard(data);
    setLeaderboard(data.slice(0, 10));

    const avg =
      data.reduce((acc, r) => acc + Number(r.percent), 0) / data.length;
    setAverage(avg);
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

    if (quizId) {
      await supabase.from("quiz_results").insert({
        quiz_id: quizId,
        player_name: playerName || "Anon",
        score: newScore,
        total: questions.length,
        percent,
      });

      await loadStats();

      const index =
        leaderboard.findIndex((l) => l.percent <= percent) + 1;
      setRank(index);
    }

    setScreen("result");
  };

  /* ---------- UI ---------- */

  return (
    <main style={pageStyle}>
      <div style={container}>
        {screen === "welcome" && (
          <>
            <h1>Wie gut kennen dich deine Freunde?</h1>
            <button style={bigBtn} onClick={() => setScreen("create")}>
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
              style={inputStyle}
            />

            {questions.map((q, i) => (
              <div key={i} style={card}>
                <input
                  placeholder={`Frage ${i + 1}`}
                  value={q.text}
                  onChange={(e) => {
                    const c = [...questions];
                    c[i].text = e.target.value;
                    setQuestions(c);
                  }}
                  style={inputStyle}
                />

                <button onClick={() => (q.answer = true)}>Wahr</button>
                <button onClick={() => (q.answer = false)}>Falsch</button>
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
            <button onClick={() => navigator.clipboard.writeText(shareUrl)}>
              Link kopieren
            </button>

            <input
              placeholder="Dein Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              style={inputStyle}
            />

            <button onClick={() => setScreen("play")}>Start</button>
            <button onClick={() => setScreen("dashboard")}>Dashboard</button>
          </>
        )}

        {screen === "intro" && (
          <>
            <h1>{quizTitle}</h1>
            <input
              placeholder="Dein Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              style={inputStyle}
            />
            <button onClick={() => setScreen("play")}>Start</button>
          </>
        )}

        {screen === "play" && (
          <>
            <h2>{questions[step].text}</h2>

            <div
              style={{
                ...swipeCard,
                transform: `translateX(${dragX}px)`,
              }}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
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
            {rank && <p>Platz {rank}</p>}

            <button onClick={() => setScreen("dashboard")}>
              Statistik
            </button>
          </>
        )}

        {screen === "dashboard" && (
          <>
            <h1>Dashboard</h1>
            <p>Teilnehmer: {dashboard.length}</p>
            <p>Durchschnitt: {average ? Math.round(average) + "%" : "-"}</p>

            {dashboard.map((r, i) => (
              <div key={i} style={resultRow}>
                <span>{r.player_name}</span>
                <span>{r.percent}%</span>
              </div>
            ))}
          </>
        )}
      </div>
    </main>
  );
}
