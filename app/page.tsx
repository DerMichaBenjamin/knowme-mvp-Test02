"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Question = {
  id?: string;
  text: string;
  answer: boolean | null;
  position: number;
};

type QuizRow = {
  id: string;
  creator_name: string;
  title: string;
  question_count: number;
};

type QuestionRow = {
  id: string;
  quiz_id: string;
  text: string;
  correct_answer: boolean;
  position: number;
};

type ResultRow = {
  id?: string;
  quiz_id: string;
  player_name: string;
  score: number;
  total: number;
  percent: number;
};

type Screen =
  | "loading"
  | "welcome"
  | "create"
  | "share"
  | "play_intro"
  | "quiz"
  | "result";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

const makeQuestion = (position: number): Question => ({
  text: "",
  answer: null,
  position,
});

const makeDefaultQuestions = (): Question[] => [
  { text: "Ich trinke lieber Bier als Wein.", answer: null, position: 1 },
  { text: "Ich bin eher ein Morgenmensch.", answer: null, position: 2 },
  { text: "Ich war schon mal auf Mallorca.", answer: null, position: 3 },
];

export default function Page() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [creatorName, setCreatorName] = useState("");
  const [quizTitle, setQuizTitle] = useState("Wie gut kennst du ...?");
  const [quizId, setQuizId] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [questions, setQuestions] = useState<Question[]>(makeDefaultQuestions());
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [averagePercent, setAveragePercent] = useState<number | null>(null);
  const [currentPercent, setCurrentPercent] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");

    if (!q) {
      setScreen("welcome");
      return;
    }

    void loadQuizFromSupabase(q);
  }, []);

  useEffect(() => {
    const cleanName = creatorName.trim();
    setQuizTitle(cleanName ? `Wie gut kennst du ${cleanName}?` : "Wie gut kennst du ...?");
  }, [creatorName]);

  const canContinueCreate = useMemo(() => {
    return (
      !!creatorName.trim() &&
      questions.length >= 3 &&
      questions.length <= 5 &&
      questions.every((q) => q.text.trim() && q.answer !== null)
    );
  }, [creatorName, questions]);

  async function loadQuizFromSupabase(id: string) {
    if (!supabase) {
      setError("Supabase ist noch nicht konfiguriert.");
      setScreen("welcome");
      return;
    }

    setBusy(true);
    setError("");

    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("id, creator_name, title, question_count")
      .eq("id", id)
      .single<QuizRow>();

    if (quizError || !quiz) {
      setError("Quiz konnte nicht geladen werden.");
      setScreen("welcome");
      setBusy(false);
      return;
    }

    const { data: questionRows, error: questionsError } = await supabase
      .from("quiz_questions")
      .select("id, quiz_id, text, correct_answer, position")
      .eq("quiz_id", id)
      .order("position", { ascending: true })
      .returns<QuestionRow[]>();

    if (questionsError || !questionRows) {
      setError("Fragen konnten nicht geladen werden.");
      setScreen("welcome");
      setBusy(false);
      return;
    }

    setQuizId(quiz.id);
    setCreatorName(quiz.creator_name);
    setQuizTitle(quiz.title);
    setQuestions(
      questionRows.map((q) => ({
        id: q.id,
        text: q.text,
        answer: q.correct_answer,
        position: q.position,
      }))
    );
    setShareUrl(`${window.location.origin}/?q=${quiz.id}`);
    await refreshAveragePercent(quiz.id);
    setScreen("play_intro");
    setBusy(false);
  }

  async function refreshAveragePercent(id: string) {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("quiz_results")
      .select("percent")
      .eq("quiz_id", id);

    if (error || !data || !data.length) {
      setAveragePercent(null);
      return;
    }

    const avg =
      data.reduce((acc, row) => acc + Number(row.percent || 0), 0) / data.length;

    setAveragePercent(avg);
  }

  const updateQuestion = (position: number, patch: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.position === position ? { ...q, ...patch } : q))
    );
  };

  const addQuestion = () => {
    if (questions.length >= 5) return;
    setQuestions((prev) => [...prev, makeQuestion(prev.length + 1)]);
  };

  const removeQuestion = (position: number) => {
    if (questions.length <= 3) return;
    setQuestions((prev) =>
      prev
        .filter((q) => q.position !== position)
        .map((q, index) => ({ ...q, position: index + 1 }))
    );
  };

  const startCreate = () => {
    setCreatorName("");
    setQuizTitle("Wie gut kennst du ...?");
    setQuizId("");
    setShareUrl("");
    setQuestions(makeDefaultQuestions());
    setScore(0);
    setStep(0);
    setSelectedAnswer(null);
    setPlayerName("");
    setCurrentPercent(null);
    setAveragePercent(null);
    setError("");
    setScreen("create");
  };

  const createQuizAndShare = async () => {
    if (!supabase) {
      setError("Supabase ist noch nicht verbunden.");
      return;
    }

    if (!canContinueCreate) {
      setError("Bitte Name, 3 bis 5 Fragen und alle Antworten vollständig ausfüllen.");
      return;
    }

    setBusy(true);
    setError("");

    const { data: createdQuiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        creator_name: creatorName.trim(),
        title: quizTitle,
        question_count: questions.length,
      })
      .select("id, creator_name, title, question_count")
      .single<QuizRow>();

    if (quizError || !createdQuiz) {
      setError(`Quiz konnte nicht gespeichert werden: ${quizError?.message || "unbekannter Fehler"}`);
      setBusy(false);
      return;
    }

    const payload = questions.map((q, index) => ({
      quiz_id: createdQuiz.id,
      text: q.text.trim(),
      correct_answer: Boolean(q.answer),
      position: index + 1,
    }));

    const { error: questionError } = await supabase
      .from("quiz_questions")
      .insert(payload);

    if (questionError) {
      setError(`Fragen konnten nicht gespeichert werden: ${questionError.message}`);
      setBusy(false);
      return;
    }

    const url = `${window.location.origin}/?q=${createdQuiz.id}`;
    setQuizId(createdQuiz.id);
    setShareUrl(url);
    setBusy(false);
    setScreen("share");
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  const beginQuiz = () => {
    setStep(0);
    setScore(0);
    setSelectedAnswer(null);
    setScreen("quiz");
  };

  const answerQuestion = async () => {
    if (selectedAnswer === null) return;

    const correct = questions[step].answer === true;
    const nextScore = score + (selectedAnswer === correct ? 1 : 0);
    setScore(nextScore);

    if (step < questions.length - 1) {
      setStep((prev) => prev + 1);
      setSelectedAnswer(null);
      return;
    }

    const percent = Math.round((nextScore / questions.length) * 100);
    setCurrentPercent(percent);

    if (supabase && quizId) {
      await supabase.from("quiz_results").insert({
        quiz_id: quizId,
        player_name: playerName.trim(),
        score: nextScore,
        total: questions.length,
        percent,
      } satisfies ResultRow);

      await refreshAveragePercent(quizId);
    }

    setSelectedAnswer(null);
    setScreen("result");
  };

  const replayQuiz = () => {
    setStep(0);
    setScore(0);
    setSelectedAnswer(null);
    setScreen("play_intro");
  };

  const comparisonText = useMemo(() => {
    if (currentPercent === null || averagePercent === null) {
      return "Noch kein Vergleich verfügbar.";
    }

    const roundedAverage = Math.round(averagePercent);

    if (currentPercent > roundedAverage) {
      return `Du liegst über dem bisherigen Durchschnitt von ${roundedAverage}%.`;
    }

    if (currentPercent < roundedAverage) {
      return `Du liegst unter dem bisherigen Durchschnitt von ${roundedAverage}%.`;
    }

    return `Du liegst genau auf dem bisherigen Durchschnitt von ${roundedAverage}%.`;
  }, [currentPercent, averagePercent]);

  if (screen === "loading") {
    return (
      <main style={pageStyle}>
        <div style={cardStyle}>
          <h2>Lädt ...</h2>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        {screen === "welcome" && (
          <div>
            <h1 style={h1Style}>Wie gut kennen dich deine Freunde wirklich?</h1>
            <p style={pStyle}>
              Erstelle ein eigenes Quiz mit 3 bis 5 Fragen oder spiele ein bereits geteiltes Quiz.
            </p>
            {error && <p style={errorStyle}>{error}</p>}
            {!supabase && (
              <p style={errorStyle}>
                Supabase ist noch nicht verbunden. Trage zuerst die beiden
                NEXT_PUBLIC_SUPABASE-Umgebungsvariablen ein.
              </p>
            )}
            <div style={rowStyle}>
              <button onClick={startCreate} style={btnPrimary}>
                Eigenes Quiz erstellen
              </button>
            </div>
          </div>
        )}

        {screen === "create" && (
          <div>
            <h2 style={h2Style}>Quiz erstellen</h2>
            <p style={subStyle}>
              Der Name des Erstellers ist Pflicht und taucht direkt im Titel auf.
            </p>

            <label style={labelStyle}>Name des Quiz-Erstellers</label>
            <input
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              style={inputStyle}
              placeholder="z. B. Micha"
            />

            <label style={labelStyle}>Automatischer Titel</label>
            <div style={titleBoxStyle}>{quizTitle}</div>

            <div style={{ display: "grid", gap: 14 }}>
              {questions.map((q, index) => (
                <div key={q.position} style={questionCardStyle}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      marginBottom: 8,
                    }}
                  >
                    <strong>Frage {index + 1}</strong>
                    <button
                      onClick={() => removeQuestion(q.position)}
                      style={{
                        ...btnGhostSmall,
                        opacity: questions.length > 3 ? 1 : 0.45,
                      }}
                    >
                      Entfernen
                    </button>
                  </div>

                  <input
                    value={q.text}
                    onChange={(e) =>
                      updateQuestion(q.position, { text: e.target.value })
                    }
                    style={inputStyle}
                    placeholder="Aussage eingeben"
                  />

                  <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                    <button
                      onClick={() => updateQuestion(q.position, { answer: true })}
                      style={q.answer === true ? btnPrimarySmall : btnGhostSmall}
                    >
                      Wahr
                    </button>
                    <button
                      onClick={() => updateQuestion(q.position, { answer: false })}
                      style={q.answer === false ? btnPrimarySmall : btnGhostSmall}
                    >
                      Falsch
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ ...rowStyle, marginTop: 16 }}>
              <button
                onClick={addQuestion}
                style={{ ...btnGhost, opacity: questions.length < 5 ? 1 : 0.45 }}
              >
                + Frage hinzufügen
              </button>
              <button
                onClick={createQuizAndShare}
                disabled={!canContinueCreate || busy}
                style={{
                  ...btnPrimary,
                  opacity: canContinueCreate && !busy ? 1 : 0.45,
                }}
              >
                {busy ? "Speichert ..." : "Link erstellen"}
              </button>
            </div>

            {error && <p style={errorStyle}>{error}</p>}
          </div>
        )}

        {screen === "share" && (
          <div>
            <h2 style={h2Style}>Quiz-Link teilen</h2>
            <p style={subStyle}>
              Der Link ist jetzt echt und kann an andere Geräte und andere Personen verschickt werden.
            </p>
            <div style={titleBoxStyle}>{shareUrl}</div>
            <div style={rowStyle}>
              <button onClick={copyShareLink} style={btnPrimary}>
                {copied ? "Kopiert" : "Link kopieren"}
              </button>
              <button onClick={() => setScreen("play_intro")} style={btnGhost}>
                Vorschau spielen
              </button>
            </div>
          </div>
        )}

        {screen === "play_intro" && (
          <div>
            <h2 style={h2Style}>{quizTitle}</h2>
            <p style={subStyle}>
              Vor dem Start muss der Teilnehmername eingegeben werden.
            </p>
            <label style={labelStyle}>Dein Name</label>
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              style={inputStyle}
              placeholder="z. B. Anna"
            />
            <div style={rowStyle}>
              <button
                onClick={beginQuiz}
                disabled={!playerName.trim()}
                style={{ ...btnPrimary, opacity: playerName.trim() ? 1 : 0.45 }}
              >
                Quiz starten
              </button>
            </div>
          </div>
        )}

        {screen === "quiz" && (
          <div>
            <div style={{ marginBottom: 12, color: "#cbd5e1", fontSize: 18 }}>
              Frage {step + 1} / {questions.length}
            </div>

            <div style={progressTrackStyle}>
              <div
                style={{
                  ...progressBarStyle,
                  width: `${((step + 1) / questions.length) * 100}%`,
                }}
              />
            </div>

            <h2 style={h2Style}>{questions[step].text}</h2>

            <div style={rowStyle}>
              <button
                onClick={() => setSelectedAnswer(true)}
                style={selectedAnswer === true ? btnPrimary : btnGhost}
              >
                Wahr
              </button>
              <button
                onClick={() => setSelectedAnswer(false)}
                style={selectedAnswer === false ? btnPrimary : btnGhost}
              >
                Falsch
              </button>
            </div>

            <div style={{ ...rowStyle, marginTop: 14 }}>
              <button
                onClick={answerQuestion}
                disabled={selectedAnswer === null}
                style={{ ...btnPrimary, opacity: selectedAnswer === null ? 0.45 : 1 }}
              >
                Weiter
              </button>
            </div>
          </div>
        )}

        {screen === "result" && (
          <div>
            <div style={smallOverlineStyle}>Ergebnis</div>
            <h1 style={h1Style}>
              {score} / {questions.length}
            </h1>
            <p style={pStyle}>Dein aktueller Test liegt bei {currentPercent ?? 0}%.</p>
            <p style={pStyle}>
              Bisheriger Gesamtdurchschnitt aller Teilnehmer:{" "}
              {averagePercent !== null ? `${Math.round(averagePercent)}%` : "noch keine Daten"}.
            </p>
            <p style={subStyle}>{comparisonText}</p>

            <div style={rowStyle}>
              <button onClick={startCreate} style={btnPrimary}>
                Eigenes Quiz erstellen
              </button>
              <button onClick={replayQuiz} style={btnGhost}>
                Nochmal spielen
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  padding: "32px 20px",
  display: "flex",
  justifyContent: "center",
  background: "#0f172a",
  color: "white",
} as const;

const cardStyle = {
  width: "100%",
  maxWidth: 760,
  background: "#1e293b",
  borderRadius: 20,
  padding: "28px 24px",
  boxSizing: "border-box" as const,
};

const h1Style = {
  fontSize: 44,
  lineHeight: 1.1,
  margin: "0 0 14px 0",
} as const;

const h2Style = {
  fontSize: 34,
  lineHeight: 1.2,
  margin: "0 0 18px 0",
} as const;

const pStyle = {
  fontSize: 22,
  color: "#cbd5e1",
  lineHeight: 1.5,
  margin: "0 0 12px 0",
} as const;

const subStyle = {
  fontSize: 20,
  color: "#94a3b8",
  lineHeight: 1.5,
  margin: "0 0 18px 0",
} as const;

const labelStyle = {
  display: "block",
  fontSize: 16,
  margin: "0 0 8px 0",
  color: "#cbd5e1",
} as const;

const inputStyle = {
  width: "100%",
  padding: 12,
  borderRadius: 10,
  border: "none",
  boxSizing: "border-box" as const,
  marginBottom: 16,
} as const;

const titleBoxStyle = {
  padding: 14,
  borderRadius: 10,
  background: "#0f172a",
  marginBottom: 16,
  color: "#e2e8f0",
} as const;

const questionCardStyle = {
  background: "#0f172a",
  padding: 14,
  borderRadius: 12,
} as const;

const rowStyle = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap" as const,
} as const;

const progressTrackStyle = {
  height: 10,
  background: "#334155",
  borderRadius: 999,
  overflow: "hidden",
  marginBottom: 22,
} as const;

const progressBarStyle = {
  height: "100%",
  background: "white",
} as const;

const smallOverlineStyle = {
  fontSize: 14,
  opacity: 0.75,
  marginBottom: 12,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
} as const;

const errorStyle = {
  color: "#fca5a5",
  fontSize: 18,
  marginTop: 14,
} as const;

const btnPrimary = {
  fontSize: 20,
  padding: "14px 18px",
  borderRadius: 12,
  border: 0,
  background: "white",
  color: "#0f172a",
  fontWeight: 700,
  cursor: "pointer",
} as const;

const btnGhost = {
  fontSize: 20,
  padding: "14px 18px",
  borderRadius: 12,
  border: "1px solid #94a3b8",
  background: "transparent",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
} as const;

const btnPrimarySmall = {
  ...btnPrimary,
  fontSize: 16,
  padding: "9px 12px",
} as const;

const btnGhostSmall = {
  ...btnGhost,
  fontSize: 16,
  padding: "9px 12px",
} as const;
