"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Screen = "welcome" | "create" | "share" | "play" | "result";

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

export default function Page() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [creatorName, setCreatorName] = useState("");
  const [quizTitle, setQuizTitle] = useState("Wie gut kennst du ...?");
  const [shareUrl, setShareUrl] = useState("");
  const [quizId, setQuizId] = useState("");
  const [copied, setCopied] = useState(false);
  const [loadingSharedQuiz, setLoadingSharedQuiz] = useState(true);

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
  const [playerRank, setPlayerRank] = useState<number | null>(null);

  useEffect(() => {
    const clean = creatorName.trim();
    setQuizTitle(clean ? `Wie gut kennst du ${clean}?` : "Wie gut kennst du ...?");
  }, [creatorName]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");

    if (!q) {
      setLoadingSharedQuiz(false);
      return;
    }

    void loadQuiz(q);
  }, []);

  const canCreate =
    !!creatorName.trim() &&
    questions.length >= 3 &&
    questions.length <= 5 &&
    questions.every((q) => q.text.trim() && q.answer !== null);

  const leaderboardText = useMemo(() => {
    if (!playerRank) return "";
    return `Du bist Platz ${playerRank} von ${leaderboard.length}.`;
  }, [playerRank, leaderboard.length]);

  const generateChallengeText = () => {
    const percent = currentPercent ?? 50;
    const person = creatorName || "diese Person";

    if (percent >= 80) {
      return `Ich kenne ${person} besser als fast alle 😄 (${percent}%)\nSchaffst du das auch?\n${shareUrl}`;
    }

    if (percent >= 50) {
      return `Ich dachte ich kenne ${person} gut… (${percent}%) 😅\nDu schaffst mehr!\n${shareUrl}`;
    }

    return `Das war peinlich 😂 nur ${percent}%\nDu bist besser!\n${shareUrl}`;
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(generateChallengeText());
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      alert("Link konnte nicht kopiert werden.");
    }
  };

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
      alert(`Quiz konnte nicht gespeichert werden: ${error?.message || "unbekannter Fehler"}`);
      return;
    }

    const newQuizId = data.id as string;

    const { error: questionError } = await supabase.from("quiz_questions").insert(
      questions.map((q, i) => ({
        quiz_id: newQuizId,
        text: q.text,
        correct_answer: q.answer,
        position: i + 1,
      }))
    );

    if (questionError) {
      alert(`Fragen konnten nicht gespeichert werden: ${questionError.message}`);
      return;
    }

    const url = `${window.location.origin}/?q=${newQuizId}`;
    setQuizId(newQuizId);
    setShareUrl(url);
    setStep(0);
    setScore(0);
    setCurrentPercent(null);
    setLeaderboard([]);
    setPlayerRank(null);
    setScreen("share");
  };

  const loadQuiz = async (id: string) => {
    setLoadingSharedQuiz(true);

    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("id, creator_name, title, question_count")
      .eq("id", id)
      .single();

    if (quizError || !quiz) {
      setLoadingSharedQuiz(false);
      alert("Quiz konnte nicht geladen werden.");
      return;
    }

    const { data: questionsData, error: questionsError } = await supabase
      .from("quiz_questions")
      .select("id, quiz_id, text, correct_answer, position")
      .eq("quiz_id", id)
      .order("position", { ascending: true });

    if (questionsError || !questionsData) {
      setLoadingSharedQuiz(false);
      alert("Fragen konnten nicht geladen werden.");
      return;
    }

    const loadedQuiz = quiz as QuizRow;
    const loadedQuestions = questionsData as QuizQuestionRow[];

    setQuizId(loadedQuiz.id);
    setCreatorName(loadedQuiz.creator_name);
    setQuizTitle(loadedQuiz.title);
    setQuestions(
      loadedQuestions.map((q) => ({
        text: q.text,
        answer: q.correct_answer,
      }))
    );
    setShareUrl(`${window.location.origin}/?q=${loadedQuiz.id}`);
    setStep(0);
    setScore(0);
    setCurrentPercent(null);
    setLeaderboard([]);
    setPlayerRank(null);
    setScreen("share");
    setLoadingSharedQuiz(false);
  };

  const loadLeaderboard = async (
    id: string,
    currentPlayer?: string,
    currentPlayerPercent?: number
  ) => {
    const { data, error } = await supabase
      .from("quiz_results")
      .select("player_name, score, total, percent")
      .eq("quiz_id", id)
      .order("percent", { ascending: false })
      .order("score", { ascending: false });

    if (error || !data) {
      setLeaderboard([]);
      setPlayerRank(null);
      return;
    }

    const rows = data as ResultEntry[];
    setLeaderboard(rows.slice(0, 10));

    if (currentPlayer && typeof currentPlayerPercent === "number") {
      const rank =
        rows.findIndex(
          (r) =>
            r.player_name === currentPlayer &&
            Number(r.percent) === currentPlayerPercent
        ) + 1;

      setPlayerRank(rank > 0 ? rank : null);
    } else {
      setPlayerRank(null);
    }
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

    const finalQuizId = quizId || shareUrl.split("q=")[1] || "";

    if (finalQuizId) {
      const { error } = await supabase.from("quiz_results").insert({
        quiz_id: finalQuizId,
        player_name: playerName || "Anonymous",
        score: newScore,
        total: questions.length,
        percent,
      });

      if (!error) {
        await loadLeaderboard(finalQuizId, playerName || "Anonymous", percent);
      }
    }

    setScreen("result");
  };

  if (loadingSharedQuiz) {
    return (
      <main
        style={{
          padding: 40,
          color: "white",
          background: "#0f172a",
          minHeight: "100vh",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h2>Lädt...</h2>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: 40,
        color: "white",
        background: "#0f172a",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {screen === "welcome" && (
        <>
          <h1 style={{ fontSize: 42, marginBottom: 16 }}>
            Wie gut kennen dich deine Freunde?
          </h1>
          <button
            onClick={() => setScreen("create")}
            style={{
              fontSize: 28,
              padding: "18px 28px",
              borderRadius: 14,
              border: 0,
              background: "white",
              color: "#0f172a",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
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
            style={{
              display: "block",
              marginBottom: 16,
              padding: 10,
              width: "100%",
              maxWidth: 500,
            }}
          />

          <p style={{ marginBottom: 12, opacity: 0.8 }}>
            Du kannst 3 bis 5 Fragen erstellen.
          </p>

          {questions.map((q, i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <strong>Frage {i + 1}</strong>
                <button
                  onClick={() => removeQuestion(i)}
                  disabled={questions.length <= 3}
                  style={{
                    opacity: questions.length <= 3 ? 0.4 : 1,
                    padding: "6px 10px",
                  }}
                >
                  Entfernen
                </button>
              </div>

              <input
                placeholder={`Frage ${i + 1}`}
                value={q.text}
                onChange={(e) => {
                  const copy = [...questions];
                  copy[i].text = e.target.value;
                  setQuestions(copy);
                }}
                style={{
                  display: "block",
                  marginBottom: 8,
                  padding: 10,
                  width: "100%",
                  maxWidth: 500,
                }}
              />

              <button
                onClick={() => {
                  const copy = [...questions];
                  copy[i].answer = true;
                  setQuestions(copy);
                }}
                style={{
                  marginRight: 8,
                  background: q.answer === true ? "white" : "transparent",
                  color: q.answer === true ? "#0f172a" : "white",
                  border: "1px solid white",
                  padding: "10px 14px",
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
                  background: q.answer === false ? "white" : "transparent",
                  color: q.answer === false ? "#0f172a" : "white",
                  border: "1px solid white",
                  padding: "10px 14px",
                }}
              >
                Falsch
              </button>
            </div>
          ))}

          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <button
              onClick={addQuestion}
              disabled={questions.length >= 5}
              style={{ opacity: questions.length >= 5 ? 0.4 : 1 }}
            >
              + Frage hinzufügen
            </button>
          </div>

          <button onClick={createQuiz} disabled={!canCreate}>
            Quiz mit deinen Freunden teilen
          </button>
        </>
      )}

      {screen === "share" && (
        <>
          <h2>Teilen</h2>
          <p>{shareUrl}</p>

          <button onClick={shareWhatsApp} style={{ marginRight: 8 }}>
            WhatsApp
          </button>
          <button onClick={copyLink} style={{ marginRight: 8 }}>
            {copied ? "Kopiert" : "Link kopieren"}
          </button>

          <div style={{ marginTop: 20 }}>
            <input
              placeholder="Dein Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              style={{
                display: "block",
                marginBottom: 12,
                padding: 10,
                width: "100%",
                maxWidth: 500,
              }}
            />

            <button
              onClick={() => {
                setStep(0);
                setScore(0);
                setCurrentPercent(null);
                setLeaderboard([]);
                setPlayerRank(null);
                setScreen("play");
              }}
              disabled={!playerName.trim()}
            >
              Test spielen
            </button>
          </div>
        </>
      )}

      {screen === "play" && (
        <>
          <h2>{questions[step].text}</h2>

          <button onClick={() => answer(true)} style={{ marginRight: 8 }}>
            Wahr
          </button>
          <button onClick={() => answer(false)}>Falsch</button>
        </>
      )}

      {screen === "result" && (
        <>
          <h1>{currentPercent}%</h1>

          {playerRank && (
            <p style={{ fontSize: 22, marginBottom: 16 }}>{leaderboardText}</p>
          )}

          <button onClick={shareWhatsApp} style={{ marginRight: 8 }}>
            WhatsApp teilen
          </button>
          <button onClick={copyLink} style={{ marginRight: 8 }}>
            {copied ? "Kopiert" : "Link kopieren"}
          </button>

          <button onClick={() => setScreen("create")}>Eigenes Quiz</button>

          <div style={{ marginTop: 30, maxWidth: 600 }}>
            <h2>Leaderboard</h2>

            {leaderboard.length === 0 ? (
              <p>Noch keine Ergebnisse vorhanden.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {leaderboard.map((entry, index) => (
                  <div
                    key={`${entry.player_name}-${index}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#1e293b",
                      padding: 14,
                      borderRadius: 12,
                    }}
                  >
                    <div>
                      <strong>
                        #{index + 1} {entry.player_name}
                      </strong>
                      <div style={{ opacity: 0.8, fontSize: 14 }}>
                        {entry.score} / {entry.total} richtig
                      </div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>
                      {Math.round(Number(entry.percent))}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
