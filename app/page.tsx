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

/* ---------- TEMPLATE-DATEN ---------- */

const QUESTION_TEMPLATES = [
  "Ich trinke lieber Bier als Wein",
  "Ich bin öfter zu spät als pünktlich",
  "Ich gehe lieber feiern als zu Hause zu bleiben",
  "Ich habe schon mal etwas Peinliches im Suff gemacht",
  "Ich esse lieber Pizza als Salat",
  "Ich höre öfter Party-Musik als ruhige Musik",
  "Ich bin eher spontan als geplant",
  "Ich gebe mehr Geld für Feiern als für Kleidung aus",
  "Ich bin morgens schlechter drauf als nachts",
  "Ich habe schon mal aus Impuls etwas Dummes gekauft",
  "Ich bin im Urlaub entspannter als zu Hause",
  "Ich kann schlecht stillsitzen und nichts tun",
  "Ich höre Songs oft tot, wenn ich sie feiere",
  "Ich bleibe auf Partys meist länger als geplant",
  "Ich bin in Gruppen lauter als allein",
  "Ich habe schon mal eine Nachricht bereut, die ich nachts geschickt habe",
  "Ich mag süßes Frühstück mehr als herzhaftes",
  "Ich würde eher spontan verreisen als lange planen",
  "Ich bin bei Spielen ehrgeiziger als ich zugebe",
  "Ich mache öfter Screenshots, als ich später jemals wieder anschaue",
];

const POPULAR_QUESTION_TEMPLATES = [
  "Ich bin eher chaotisch als organisiert",
  "Ich war schon mal peinlich betrunken",
  "Ich würde lieber ans Meer als in die Berge fahren",
  "Ich gebe zu viel Geld für Essen oder Trinken aus",
  "Ich höre heimlich Songs, die nicht zu meinem Image passen",
  "Ich antworte manchmal absichtlich nicht sofort",
  "Ich bin in Wahrheit empfindlicher, als andere denken",
  "Ich bleibe gern länger wach, auch wenn ich müde bin",
];

/* ---------- STYLES ---------- */

const pageStyle: CSSProperties = {
  padding: 20,
  color: "white",
  background: "#0f172a",
  minHeight: "100vh",
  fontFamily: "Arial, sans-serif",
};

const containerStyle: CSSProperties = {
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

const smallGhostBtn: CSSProperties = {
  ...ghostBtn,
  fontSize: 16,
  padding: "10px 14px",
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
  boxSizing: "border-box",
};

const inputInvalidStyle: CSSProperties = {
  ...inputStyle,
  border: "2px solid #ef4444",
  background: "#fff7f7",
  color: "#111827",
};

const cardStyle: CSSProperties = {
  background: "#1e293b",
  padding: 16,
  borderRadius: 14,
  marginBottom: 16,
};

const warningStyle: CSSProperties = {
  background: "#3f1d1d",
  color: "#fecaca",
  border: "1px solid #7f1d1d",
  padding: 14,
  borderRadius: 12,
  marginBottom: 16,
  maxWidth: 720,
};

const shareHeroStyle: CSSProperties = {
  background: "#1e293b",
  padding: 20,
  borderRadius: 18,
  marginBottom: 20,
  maxWidth: 760,
};

const shareLinkBoxStyle: CSSProperties = {
  background: "#0f172a",
  border: "1px solid #334155",
  padding: 14,
  borderRadius: 12,
  marginTop: 14,
  marginBottom: 16,
  wordBreak: "break-all",
  fontSize: 16,
  opacity: 0.95,
};

const badgeStyle: CSSProperties = {
  display: "inline-block",
  padding: "8px 12px",
  borderRadius: 999,
  background: "#334155",
  fontSize: 14,
  fontWeight: 700,
  marginBottom: 14,
};

const swipeCardStyle: CSSProperties = {
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
  position: "relative",
  boxSizing: "border-box",
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

const progressTrackStyle: CSSProperties = {
  width: "100%",
  maxWidth: 720,
  height: 12,
  background: "#334155",
  borderRadius: 999,
  overflow: "hidden",
  marginBottom: 20,
};

const templateBoxStyle: CSSProperties = {
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: 12,
  padding: 10,
  marginBottom: 12,
  maxWidth: 600,
};

const templateItemStyle: CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 15,
  marginBottom: 6,
  background: "#1e293b",
};

/* ---------- HELPERS ---------- */

const getResultHeadline = (percent: number | null) => {
  if (percent === null) return "";
  if (percent >= 85) return "Stark. Das war fast schon unfair gut.";
  if (percent >= 65) return "Nicht schlecht. Du kennst die Person ziemlich gut.";
  if (percent >= 45) return "Ganz okay, aber da war noch Luft nach oben.";
  return "Autsch. Das war eher geraten.";
};

const buildChallengeText = (
  creatorName: string,
  percent: number | null,
  shareUrl: string,
  betterThanPercent: number | null
) => {
  const person = creatorName || "diese Person";
  const p = percent ?? 50;

  if (p >= 85) {
    return `Ich kenne ${person} besser als fast alle 😄 (${p}%)
${betterThanPercent !== null ? `Ich war besser als ${betterThanPercent}% der Teilnehmer.` : ""}
Jetzt bist du dran:
${shareUrl}`;
  }

  if (p >= 60) {
    return `Ich dachte, ich kenne ${person} gut… (${p}%) 😅
${betterThanPercent !== null ? `Ich war immerhin besser als ${betterThanPercent}% der Teilnehmer.` : ""}
Meinst du, du schaffst mehr?
${shareUrl}`;
  }

  return `Das war peinlich 😂 nur ${p}%
${betterThanPercent !== null ? `Vielleicht bist du besser als ${betterThanPercent}%?` : ""}
Mach es besser:
${shareUrl}`;
};

const shuffleArray = <T,>(arr: T[]) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
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
  const [copied, setCopied] = useState(false);
  const [openTemplateIndex, setOpenTemplateIndex] = useState<number | null>(null);
  const [showPopularTemplates, setShowPopularTemplates] = useState(false);

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
    if (dragX > threshold) {
      void answer(true);
    } else if (dragX < -threshold) {
      void answer(false);
    }
    setDragX(0);
    startX.current = null;
  };

  /* ---------- INIT ---------- */

  useEffect(() => {
    const clean = creatorName.trim();
    setQuizTitle(clean ? `Wie gut kennst du ${clean}?` : "Wie gut kennst du ...?");
  }, [creatorName]);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) {
      void loadQuiz(q);
    }
  }, []);

  /* ---------- DERIVED ---------- */

  const validationIssues = useMemo(() => {
    const issues: string[] = [];

    if (!creatorName.trim()) {
      issues.push("Bitte den Namen des Quiz-Erstellers eingeben.");
    }

    questions.forEach((q, i) => {
      if (!q.text.trim()) issues.push(`Frage ${i + 1}: Text fehlt.`);
      if (q.answer === null) issues.push(`Frage ${i + 1}: Wahr/Falsch fehlt.`);
    });

    return issues;
  }, [creatorName, questions]);

  const canCreate =
    creatorName.trim().length > 0 &&
    questions.length >= 3 &&
    questions.length <= 5 &&
    questions.every((q) => q.text.trim().length > 0 && q.answer !== null);

  const progressPercent =
    questions.length > 0 ? Math.round(((step + 1) / questions.length) * 100) : 0;

  const betterThanPercent = useMemo(() => {
    if (!rank || leaderboard.length === 0) return null;
    return Math.max(
      0,
      Math.round(((leaderboard.length - rank) / leaderboard.length) * 100)
    );
  }, [rank, leaderboard]);

  const challengeText = useMemo(
    () => buildChallengeText(creatorName, currentPercent, shareUrl, betterThanPercent),
    [creatorName, currentPercent, shareUrl, betterThanPercent]
  );

  const resultCTA = useMemo(() => {
    const p = currentPercent ?? 0;
    if (p >= 85) return "Fordere jetzt jemanden heraus, der behauptet, dich besser zu kennen.";
    if (p >= 60) return "Schick das jetzt an Freunde und schau, wer wirklich besser abschneidet.";
    return "Das musst du jetzt weiterleiten. Irgendwer wird es besser machen.";
  }, [currentPercent]);

  /* ---------- LOGIC ---------- */

  const addQuestion = () => {
    if (questions.length >= 5) return;
    setQuestions((prev) => [...prev, { text: "", answer: null }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 3) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const setQuestionText = (index: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, text } : q))
    );
  };

  const setQuestionAnswer = (index: number, answer: boolean) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, answer } : q))
    );
  };

  const generateAutoQuiz = () => {
    const picked = shuffleArray(QUESTION_TEMPLATES).slice(0, 5);
    setQuestions(
      picked.map((text) => ({
        text,
        answer: null,
      }))
    );
    setOpenTemplateIndex(null);
    setShowPopularTemplates(false);
  };

  const applyPopularTemplate = (template: string) => {
    const firstEmptyIndex = questions.findIndex((q) => !q.text.trim());

    if (firstEmptyIndex >= 0) {
      setQuestionText(firstEmptyIndex, template);
      return;
    }

    if (questions.length < 5) {
      setQuestions((prev) => [...prev, { text: template, answer: null }]);
      return;
    }

    setQuestionText(0, template);
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
      console.error("createQuiz error:", error);
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
      console.error("createQuiz question error:", questionError);
      alert("Fragen konnten nicht gespeichert werden.");
      return;
    }

    setQuizId(id);
    setShareUrl(`${window.location.origin}/?q=${id}`);
    setStep(0);
    setScore(0);
    setCurrentPercent(null);
    setLeaderboard([]);
    setDashboard([]);
    setAverage(null);
    setRank(null);
    setCopied(false);
    setScreen("share");
  };

  const loadQuiz = async (id: string) => {
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("id, creator_name, title, question_count")
      .eq("id", id)
      .single();

    const { data: qs, error: qsError } = await supabase
      .from("quiz_questions")
      .select("id, quiz_id, text, correct_answer, position")
      .eq("quiz_id", id)
      .order("position", { ascending: true });

    if (quizError || !quiz || qsError || !qs) {
      console.error("loadQuiz error:", quizError || qsError);
      return;
    }

    const quizRow = quiz as QuizRow;
    const questionRows = qs as QuizQuestionRow[];

    setQuizId(quizRow.id);
    setCreatorName(quizRow.creator_name);
    setQuizTitle(quizRow.title);
    setQuestions(
      questionRows.map((x) => ({
        text: x.text,
        answer: x.correct_answer,
      }))
    );
    setShareUrl(`${window.location.origin}/?q=${quizRow.id}`);
    setStep(0);
    setScore(0);
    setCurrentPercent(null);
    setRank(null);
    setCopied(false);
    setScreen("intro");
  };

  const loadStats = async (id: string) => {
    const { data, error } = await supabase
      .from("quiz_results")
      .select("*")
      .eq("quiz_id", id)
      .order("percent", { ascending: false })
      .order("score", { ascending: false });

    if (error || !data) {
      console.error("loadStats error:", error);
      setDashboard([]);
      setLeaderboard([]);
      setAverage(null);
      return [];
    }

    const rows = data as ResultEntry[];
    setDashboard(rows);
    setLeaderboard(rows.slice(0, 10));

    const avg =
      rows.length > 0
        ? rows.reduce((acc, r) => acc + Number(r.percent), 0) / rows.length
        : null;

    setAverage(avg);
    return rows;
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
      console.error("quizId fehlt");
      setScreen("result");
      return;
    }

    const player = playerName.trim() || "Anonymous";

    const { error } = await supabase.from("quiz_results").insert({
      quiz_id: quizId,
      player_name: player,
      score: newScore,
      total: questions.length,
      percent,
    });

    if (error) {
      console.error("answer insert error:", error);
    } else {
      const rows = await loadStats(quizId);
      const playerIndex = rows.findIndex(
        (r) =>
          r.player_name === player &&
          Number(r.percent) === percent &&
          Number(r.score) === newScore
      );
      setRank(playerIndex >= 0 ? playerIndex + 1 : null);
    }

    setDragX(0);
    setScreen("result");
  };

  const openDashboard = async () => {
    if (!quizId) return;
    await loadStats(quizId);
    setScreen("dashboard");
  };

  const copyQuizLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch (e) {
      console.error(e);
      alert("Link konnte nicht kopiert werden.");
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(challengeText);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const startPlay = () => {
    if (!playerName.trim()) return;
    setStep(0);
    setScore(0);
    setCurrentPercent(null);
    setRank(null);
    setDragX(0);
    setScreen("play");
  };

  /* ---------- UI ---------- */

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        {screen === "welcome" && (
          <>
            <h1>Wie gut kennen dich deine Freunde?</h1>
            <button onClick={() => setScreen("create")} style={bigBtn}>
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
              style={!creatorName.trim() ? inputInvalidStyle : inputStyle}
            />

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              <button onClick={generateAutoQuiz} style={primaryBtn}>
                1-Klick Auto-Quiz
              </button>
              <button
                onClick={() => setShowPopularTemplates((prev) => !prev)}
                style={ghostBtn}
              >
                {showPopularTemplates ? "Top-Fragen ausblenden" : "Top-Fragen anzeigen"}
              </button>
            </div>

            {showPopularTemplates && (
              <div style={templateBoxStyle}>
                <strong style={{ display: "block", marginBottom: 10 }}>
                  Beliebte Fragen
                </strong>
                {POPULAR_QUESTION_TEMPLATES.map((template, index) => (
                  <div
                    key={`${template}-${index}`}
                    onClick={() => applyPopularTemplate(template)}
                    style={templateItemStyle}
                  >
                    {template}
                  </div>
                ))}
              </div>
            )}

            {validationIssues.length > 0 && (
              <div style={warningStyle}>
                <strong>Bitte noch ergänzen:</strong>
                <ul style={{ marginBottom: 0 }}>
                  {validationIssues.map((issue, i) => (
                    <li key={`${issue}-${i}`}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {questions.map((q, i) => {
              const missingText = !q.text.trim();
              const missingAnswer = q.answer === null;

              return (
                <div key={i} style={cardStyle}>
                  <input
                    placeholder={`Frage ${i + 1}`}
                    value={q.text}
                    onChange={(e) => setQuestionText(i, e.target.value)}
                    style={missingText ? inputInvalidStyle : inputStyle}
                  />

                  <button
                    onClick={() =>
                      setOpenTemplateIndex(openTemplateIndex === i ? null : i)
                    }
                    style={smallGhostBtn}
                  >
                    {openTemplateIndex === i
                      ? "Inspiration ausblenden"
                      : "Inspiration anzeigen"}
                  </button>

                  {openTemplateIndex === i && (
                    <div style={templateBoxStyle}>
                      {QUESTION_TEMPLATES.map((template, tIndex) => (
                        <div
                          key={`${template}-${tIndex}`}
                          onClick={() => {
                            setQuestionText(i, template);
                            setOpenTemplateIndex(null);
                          }}
                          style={templateItemStyle}
                        >
                          {template}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={() => setQuestionAnswer(i, true)}
                      style={{
                        ...ghostBtn,
                        background: q.answer === true ? "white" : "transparent",
                        color: q.answer === true ? "#0f172a" : "white",
                        border:
                          missingAnswer && q.answer === null
                            ? "2px solid #ef4444"
                            : ghostBtn.border,
                      }}
                    >
                      Wahr
                    </button>

                    <button
                      onClick={() => setQuestionAnswer(i, false)}
                      style={{
                        ...ghostBtn,
                        background: q.answer === false ? "white" : "transparent",
                        color: q.answer === false ? "#0f172a" : "white",
                        border:
                          missingAnswer && q.answer === null
                            ? "2px solid #ef4444"
                            : ghostBtn.border,
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
              );
            })}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={addQuestion}
                disabled={questions.length >= 5}
                style={{
                  ...ghostBtn,
                  opacity: questions.length >= 5 ? 0.4 : 1,
                }}
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
            <div style={shareHeroStyle}>
              <div style={badgeStyle}>Bereit zum Verschicken</div>
              <h2 style={{ marginTop: 0, marginBottom: 10 }}>
                Schick dein Quiz jetzt an Freunde
              </h2>
              <p style={{ fontSize: 18, marginTop: 0, marginBottom: 10 }}>
                Deine Freunde bekommen einen Link und können sofort testen,
                wie gut sie dich wirklich kennen.
              </p>
              <p style={{ fontSize: 16, opacity: 0.85, marginTop: 0 }}>
                Dauert nur ca. 20 Sekunden. Je schneller du den Link jetzt verschickst,
                desto eher spielen sie direkt.
              </p>

              <div style={shareLinkBoxStyle}>{shareUrl}</div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={copyQuizLink} style={primaryBtn}>
                  {copied ? "Kopiert" : "Link zum Quiz kopieren"}
                </button>
                <button onClick={shareWhatsApp} style={ghostBtn}>
                  WhatsApp
                </button>
                <button onClick={openDashboard} style={ghostBtn}>
                  Dashboard
                </button>
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>Selbst testen</h3>
              <p style={{ opacity: 0.85 }}>
                Du kannst das Quiz auch direkt selbst starten und schauen, wie
                sich der Flow für andere anfühlt.
              </p>

              <input
                placeholder="Dein Name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                style={inputStyle}
              />

              <button onClick={startPlay} disabled={!playerName.trim()} style={primaryBtn}>
                Start
              </button>
            </div>
          </>
        )}

        {screen === "intro" && (
          <>
            <h1>{quizTitle}</h1>
            <p>
              {questions.length} Fragen · dauert ca. 20 Sekunden
            </p>

            <input
              placeholder="Dein Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              style={inputStyle}
            />

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={startPlay} disabled={!playerName.trim()} style={bigBtn}>
                Start
              </button>
              <button onClick={openDashboard} style={ghostBtn}>
                Dashboard
              </button>
            </div>
          </>
        )}

        {screen === "play" && (
          <>
            <p style={{ opacity: 0.8 }}>
              Frage {step + 1} von {questions.length}
            </p>

            <div style={progressTrackStyle}>
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: "100%",
                  background: "white",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                maxWidth: 720,
                marginBottom: 10,
                opacity: 0.75,
              }}
            >
              <span>← Falsch</span>
              <span>Wahr →</span>
            </div>

            <h2>{questions[step]?.text}</h2>

            <div
              style={{
                ...swipeCardStyle,
                transform: `translateX(${dragX}px) rotate(${dragX / 15}deg)`,
              }}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
            >
              <div
                style={{
                  position: "absolute",
                  left: 18,
                  top: 18,
                  color: "#ef4444",
                  opacity: dragX < -18 ? 1 : 0.3,
                  fontWeight: 700,
                }}
              >
                FALSCH
              </div>
              <div
                style={{
                  position: "absolute",
                  right: 18,
                  top: 18,
                  color: "#22c55e",
                  opacity: dragX > 18 ? 1 : 0.3,
                  fontWeight: 700,
                }}
              >
                WAHR
              </div>
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
            <p>{getResultHeadline(currentPercent)}</p>

            {rank && <p>Du bist Platz {rank}.</p>}
            {betterThanPercent !== null && (
              <p>Besser als {betterThanPercent}% der Teilnehmer.</p>
            )}
            {average !== null && (
              <p>Durchschnitt bisher: {Math.round(average)}%</p>
            )}

            <p style={{ fontSize: 20, fontWeight: 700, marginTop: 16 }}>
              {resultCTA}
            </p>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              <button onClick={shareWhatsApp} style={primaryBtn}>
                Freund herausfordern
              </button>
              <button onClick={copyQuizLink} style={ghostBtn}>
                {copied ? "Kopiert" : "Link zum Quiz kopieren"}
              </button>
              <button onClick={openDashboard} style={ghostBtn}>
                Statistik
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

        {screen === "dashboard" && (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              <button onClick={() => setScreen("share")} style={primaryBtn}>
                Zurück
              </button>
            </div>

            <h1>Dashboard</h1>
            <p>Teilnehmer: {dashboard.length}</p>
            <p>Durchschnitt: {average !== null ? `${Math.round(average)}%` : "-"}</p>

            {dashboard.length === 0 ? (
              <p>Noch keine Ergebnisse vorhanden.</p>
            ) : (
              <div style={{ display: "grid", gap: 10, maxWidth: 720 }}>
                {dashboard.map((r, i) => (
                  <div key={`${r.player_name}-${i}`} style={resultRowStyle}>
                    <span>
                      #{i + 1} {r.player_name}
                    </span>
                    <span>{Math.round(Number(r.percent))}%</span>
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
