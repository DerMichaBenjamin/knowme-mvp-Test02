"use client";

import { useEffect, useMemo, useState } from "react";
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

type QuizInsert = {
  creator_name: string;
  title: string;
  question_count: number;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const pageStyle: React.CSSProperties = {
  padding: 20,
  color: "white",
  background: "#0f172a",
  minHeight: "100vh",
  fontFamily: "Arial, sans-serif",
};

const containerStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 860,
  margin: "0 auto",
};

const inputStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 16,
  padding: 14,
  width: "100%",
  maxWidth: 640,
  borderRadius: 12,
  border: "none",
  fontSize: 18,
  boxSizing: "border-box",
};

const linkBoxStyle: React.CSSProperties = {
  background: "#1e293b",
  padding: 16,
  borderRadius: 14,
  marginBottom: 18,
  maxWidth: 900,
  wordBreak: "break-all",
  fontSize: 17,
};

const primaryButton: React.CSSProperties = {
  fontSize: 22,
  padding: "16px 22px",
  borderRadius: 14,
  border: 0,
  background: "white",
  color: "#0f172a",
  fontWeight: 700,
  cursor: "pointer",
};

const ghostButton: React.CSSProperties = {
  fontSize: 22,
  padding: "16px 22px",
  borderRadius: 14,
  border: "1px solid #94a3b8",
  background: "transparent",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const bigPrimaryButton: React.CSSProperties = {
  fontSize: 30,
  padding: "20px 30px",
  borderRadius: 16,
  border: 0,
  background: "white",
  color: "#0f172a",
  fontWeight: 700,
  cursor: "pointer",
};

const answerButtonBase: React.CSSProperties = {
  fontSize: 30,
  padding: "24px 28px",
  borderRadius: 18,
  border: "1px solid white",
  cursor: "pointer",
  minWidth: 180,
  minHeight: 90,
  fontWeight: 700,
};

const statCardStyle: React.CSSProperties = {
  background: "#1e293b",
  padding: 16,
  borderRadius: 14,
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 15,
  color: "#94a3b8",
  marginBottom: 6,
};

const statValueStyle: React.CSSProperties = {
  fontSize: 30,
  fontWeight: 700,
};

const resultRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  background: "#1e293b",
  padding: 16,
  borderRadius: 14,
};

const warningBoxStyle: React.CSSProperties = {
  background: "#3f1d1d",
  color: "#fecaca",
  border: "1px solid #7f1d1d",
  padding: 14,
  borderRadius: 12,
  marginBottom: 18,
  maxWidth: 720,
};

const progressTrackStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 700,
  height: 14,
  background: "#334155",
  borderRadius: 999,
  overflow: "hidden",
  marginBottom: 24,
};

const getResultHeadline = (percent: number | null) => {
  if (percent === null) return "";
  if (percent >= 80) return "Stark. Du kennst die Person wirklich gut.";
  if (percent >= 60) return "Nicht schlecht. Da war schon einiges richtig.";
  if (percent >= 40) return "Ganz okay, aber da geht noch mehr.";
  return "Autsch. Das war eher geraten.";
};

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
  const [dashboardResults, setDashboardResults] = useState<ResultEntry[]>([]);
  const [averagePercent, setAveragePercent] = useState<number | null>(null);

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

  const missingFields = useMemo(() => {
    const issues: string[] = [];

    if (!creatorName.trim()) {
      issues.push("Bitte den Namen des Quiz-Erstellers eingeben.");
    }

    questions.forEach((q, index) => {
      if (!q.text.trim()) {
        issues.push(`Frage ${index + 1}: Text fehlt.`);
      }
      if (q.answer === null) {
        issues.push(`Frage ${index + 1}: Wahr/Falsch fehlt.`);
      }
    });

    return issues;
  }, [creatorName, questions]);

  const canCreate =
    !!creatorName.trim() &&
    questions.length >= 3 &&
    questions.length <= 5 &&
    questions.every((q) => q.text.trim() && q.answer !== null);

  const leaderboardText = useMemo(() => {
    if (!playerRank) return "";
    return `Du bist Platz ${playerRank} von ${
      leaderboard.length >= 10 ? "mindestens 10" : leaderboard.length
    }.`;
  }, [playerRank, leaderboard.length]);

  const betterThanText = useMemo(() => {
    if (!playerRank || leaderboard.length === 0) return "";
    const betterThan = Math.max(
      0,
      Math.round(((leaderboard.length - playerRank) / leaderboard.length) * 100)
    );
    return `Du warst besser als ${betterThan}% der bisherigen Teilnehmer.`;
  }, [playerRank, leaderboard.length]);

  const progressPercent = useMemo(() => {
    if (!questions.length) return 0;
    return Math.round(((step + 1) / questions.length) * 100);
  }, [step, questions.length]);

  const generateChallengeText = () => {
    const percent = currentPercent ?? 50;
    const person = creatorName || "diese Person";

    if (percent >= 80) {
      return `Ich kenne ${person} besser als fast alle 😄 (${percent}%)\nSchaffst du das auch?\n${shareUrl}`;
    }

    if (percent >= 50) {
      return `Ich dachte ich kenne ${person} gut… (${percent}%) 😅\nDu schaffst bestimmt mehr.\n${shareUrl}`;
    }

    return `Das war peinlich 😂 nur ${percent}%\nDu bist bestimmt besser.\n${shareUrl}`;
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(generateChallengeText());
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const copyChallengeText = async () => {
    try {
      await navigator.clipboard.writeText(generateChallengeText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      alert("Text konnte nicht kopiert werden.");
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
      } satisfies QuizInsert)
      .select("id")
      .single();

    if (error || !data) {
      alert(
        `Quiz konnte nicht gespeichert werden: ${
          error?.message || "unbekannter Fehler"
        }`
      );
      return;
    }

    const newQuizId = data.id as string;

    const { error: questionError } = await supabase
      .from("quiz_questions")
      .insert(
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
    setDashboardResults([]);
    setAveragePercent(null);
    setCopied(false);
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
    setDashboardResults([]);
    setAveragePercent(null);
    setCopied(false);
    setScreen("intro");
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

  const loadDashboard = async (id: string) => {
    const { data, error } = await supabase
      .from("quiz_results")
      .select("player_name, score, total, percent")
      .eq("quiz_id", id)
      .order("percent", { ascending: false })
      .order("score", { ascending: false });

    if (error || !data) {
      setDashboardResults([]);
      setAveragePercent(null);
      return;
    }

    const rows = data as ResultEntry[];
    setDashboardResults(rows);

    if (!rows.length) {
      setAveragePercent(null);
      return;
    }

    const avg =
      rows.reduce((acc, row) => acc + Number(row.percent), 0) / rows.length;
    setAveragePercent(avg);
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

  const startPlay = () => {
    setStep(0);
    setScore(0);
    setCurrentPercent(null);
    setLeaderboard([]);
    setPlayerRank(null);
    setScreen("play");
  };

  const openDashboard = async () => {
    const finalQuizId = quizId || shareUrl.split("q=")[1] || "";
    if (!finalQuizId) return;
    await loadDashboard(finalQuizId);
    setScreen("dashboard");
  };

  if (loadingSharedQuiz) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <h2>Lädt...</h2>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        {screen === "welcome" && (
          <>
            <h1 style={{ fontSize: 42, marginBottom: 16 }}>
              Wie gut kennen dich deine Freunde?
            </h1>
            <button onClick={() => setScreen("create")} style={bigPrimaryButton}>
              Quiz erstellen
            </button>
          </>
        )}

        {screen === "create" && (
          <>
            <h2 style={{ fontSize: 34 }}>Quiz erstellen</h2>

            <input
              placeholder="Dein Name"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              style={inputStyle}
            />

            <p style={{ marginBottom: 12, opacity: 0.8, fontSize: 18 }}>
              Du kannst 3 bis 5 Fragen erstellen.
            </p>

            {missingFields.length > 0 && (
              <div style={warningBoxStyle}>
                <strong>Bitte noch ergänzen:</strong>
                <ul style={{ marginTop: 10, marginBottom: 0, paddingLeft: 22 }}>
                  {missingFields.map((item, index) => (
                    <li key={`${item}-${index}`} style={{ marginBottom: 6 }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {questions.map((q, i) => (
              <div key={i} style={{ marginBottom: 24 }}>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    marginBottom: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <strong style={{ fontSize: 20 }}>Frage {i + 1}</strong>
                  <button
                    onClick={() => removeQuestion(i)}
                    disabled={questions.length <= 3}
                    style={{
                      opacity: questions.length <= 3 ? 0.4 : 1,
                      padding: "8px 12px",
                      fontSize: 16,
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
                  style={inputStyle}
                />

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    onClick={() => {
                      const copy = [...questions];
                      copy[i].answer = true;
                      setQuestions(copy);
                    }}
                    style={{
                      ...ghostButton,
                      background: q.answer === true ? "white" : "transparent",
                      color: q.answer === true ? "#0f172a" : "white",
                      fontSize: 20,
                      padding: "14px 18px",
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
                      ...ghostButton,
                      background: q.answer === false ? "white" : "transparent",
                      color: q.answer === false ? "#0f172a" : "white",
                      fontSize: 20,
                      padding: "14px 18px",
                    }}
                  >
                    Falsch
                  </button>
                </div>
              </div>
            ))}

            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              <button
                onClick={addQuestion}
                disabled={questions.length >= 5}
                style={{
                  ...ghostButton,
                  opacity: questions.length >= 5 ? 0.4 : 1,
                  fontSize: 18,
                  padding: "12px 16px",
                }}
              >
                + Frage hinzufügen
              </button>
            </div>

            <button onClick={createQuiz} disabled={!canCreate} style={primaryButton}>
              Quiz mit deinen Freunden teilen
            </button>
          </>
        )}

        {screen === "share" && (
          <>
            <h2 style={{ fontSize: 34 }}>Quiz teilen</h2>
            <p style={{ maxWidth: 700, fontSize: 18 }}>
              Dein Quiz ist fertig. Verschicke jetzt den Link an deine Freunde oder
              teste es selbst.
            </p>

            <div style={linkBoxStyle}>{shareUrl}</div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
              <button onClick={shareWhatsApp} style={primaryButton}>
                WhatsApp
              </button>
              <button onClick={copyChallengeText} style={ghostButton}>
                {copied ? "Kopiert" : "Challenge-Text kopieren"}
              </button>
              <button onClick={openDashboard} style={ghostButton}>
                Dashboard
              </button>
            </div>

            <div style={{ marginTop: 24 }}>
              <input
                placeholder="Dein Name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                style={inputStyle}
              />

              <button onClick={startPlay} disabled={!playerName.trim()} style={primaryButton}>
                Test spielen
              </button>
            </div>
          </>
        )}

        {screen === "intro" && (
          <>
            <h1 style={{ fontSize: 36, marginBottom: 12 }}>{quizTitle}</h1>
            <p style={{ fontSize: 22, marginBottom: 8 }}>
              {questions.length} Fragen · dauert ca. 20 Sekunden
            </p>
            <p style={{ marginBottom: 20, opacity: 0.85, fontSize: 18 }}>
              Beantworte die Aussagen mit Wahr oder Falsch und schau, wie gut du{" "}
              {creatorName || "die Person"} wirklich kennst.
            </p>

            <input
              placeholder="Dein Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              style={inputStyle}
            />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={startPlay}
                disabled={!playerName.trim()}
                style={bigPrimaryButton}
              >
                Quiz starten
              </button>
              <button onClick={openDashboard} style={ghostButton}>
                Dashboard
              </button>
            </div>
          </>
        )}

        {screen === "play" && (
          <>
            <p style={{ opacity: 0.8, marginBottom: 10, fontSize: 18 }}>
              Frage {step + 1} von {questions.length}
            </p>

            <div style={progressTrackStyle}>
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: "100%",
                  background: "white",
                  borderRadius: 999,
                }}
              />
            </div>

            <h2
              style={{
                fontSize: 38,
                marginBottom: 28,
                lineHeight: 1.25,
                maxWidth: 780,
              }}
            >
              {questions[step].text}
            </h2>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <button
                onClick={() => answer(true)}
                style={{
                  ...answerButtonBase,
                  background: "white",
                  color: "#0f172a",
                }}
              >
                Wahr
              </button>
              <button
                onClick={() => answer(false)}
                style={{
                  ...answerButtonBase,
                  background: "transparent",
                  color: "white",
                }}
              >
                Falsch
              </button>
            </div>
          </>
        )}

        {screen === "result" && (
          <>
            <h1 style={{ fontSize: 50, marginBottom: 10 }}>{currentPercent}%</h1>
            <p style={{ fontSize: 24, marginBottom: 12 }}>
              {getResultHeadline(currentPercent)}
            </p>

            {playerRank && (
              <>
                <p style={{ fontSize: 22, marginBottom: 8 }}>{leaderboardText}</p>
                <p style={{ fontSize: 18, opacity: 0.85, marginBottom: 20 }}>
                  {betterThanText}
                </p>
              </>
            )}

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 24,
              }}
            >
              <button onClick={shareWhatsApp} style={primaryButton}>
                Freund herausfordern
              </button>
              <button onClick={copyChallengeText} style={ghostButton}>
                {copied ? "Kopiert" : "Challenge-Text kopieren"}
              </button>
              <button onClick={openDashboard} style={ghostButton}>
                Dashboard
              </button>
              <button onClick={() => setScreen("create")} style={ghostButton}>
                Eigenes Quiz
              </button>
            </div>

            <div style={{ marginTop: 30, maxWidth: 700 }}>
              <h2 style={{ fontSize: 32 }}>Leaderboard</h2>

              {leaderboard.length === 0 ? (
                <p>Noch keine Ergebnisse vorhanden.</p>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {leaderboard.map((entry, index) => (
                    <div
                      key={`${entry.player_name}-${index}`}
                      style={resultRowStyle}
                    >
                      <div>
                        <strong style={{ fontSize: 20 }}>
                          #{index + 1} {entry.player_name}
                        </strong>
                        <div style={{ opacity: 0.8, fontSize: 15 }}>
                          {entry.score} / {entry.total} richtig
                        </div>
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>
                        {Math.round(Number(entry.percent))}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {screen === "dashboard" && (
          <>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
              <button onClick={() => setScreen("share")} style={primaryButton}>
                Zurück
              </button>
            </div>

            <h1 style={{ fontSize: 38, marginBottom: 12 }}>Dashboard</h1>
            <p style={{ fontSize: 20, marginBottom: 24 }}>{quizTitle}</p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
                marginBottom: 24,
                maxWidth: 900,
              }}
            >
              <div style={statCardStyle}>
                <div style={statLabelStyle}>Teilnehmer</div>
                <div style={statValueStyle}>{dashboardResults.length}</div>
              </div>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>Durchschnitt</div>
                <div style={statValueStyle}>
                  {averagePercent !== null ? `${Math.round(averagePercent)}%` : "-"}
                </div>
              </div>
              <div style={statCardStyle}>
                <div style={statLabelStyle}>Top-Score</div>
                <div style={statValueStyle}>
                  {dashboardResults.length
                    ? `${Math.round(
                        Math.max(...dashboardResults.map((r) => Number(r.percent)))
                      )}%`
                    : "-"}
                </div>
              </div>
            </div>

            <h2 style={{ fontSize: 30, marginBottom: 14 }}>Ergebnisse</h2>

            {dashboardResults.length === 0 ? (
              <p>Noch keine Ergebnisse vorhanden.</p>
            ) : (
              <div style={{ display: "grid", gap: 10, maxWidth: 800 }}>
                {dashboardResults.map((entry, index) => (
                  <div
                    key={`${entry.player_name}-${index}-dashboard`}
                    style={resultRowStyle}
                  >
                    <div>
                      <strong style={{ fontSize: 20 }}>
                        #{index + 1} {entry.player_name}
                      </strong>
                      <div style={{ opacity: 0.8, fontSize: 15 }}>
                        {entry.score} / {entry.total} richtig
                      </div>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>
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
