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
  "Ich habe schon mal so getan, als hätte ich jemanden nicht gesehen, um nicht reden zu müssen.",
  "Ich habe schon mal eine Party verlassen, ohne mich zu verabschieden.",
  "Ich habe schon mal nachts eine Nachricht geschrieben und sie am nächsten Morgen bereut.",
  "Ich habe schon mal heimlich das Handy von jemandem angeschaut.",
  "Ich habe schon mal so getan, als würde ich etwas wissen, obwohl ich keine Ahnung hatte.",
  "Ich habe schon mal gelogen, um früher nach Hause gehen zu können.",
  "Ich habe schon mal jemanden geghostet und später so getan, als wäre nichts gewesen.",
  "Ich habe schon mal etwas Peinliches gelöscht und gehofft, dass es niemand gesehen hat.",
  "Ich habe schon mal aus Eifersucht komisch reagiert, obwohl ich es nie zugeben würde.",
  "Ich habe schon mal ein Geschenk weitergeschenkt.",
  "Ich habe schon mal jemanden online gestalkt, ohne dass die Person es ahnte.",
  "Ich habe schon mal eine Sprachnachricht mehrfach aufgenommen, damit ich cooler wirke.",
  "Ich habe schon mal Interesse vorgetäuscht, obwohl ich einfach nur höflich sein wollte.",
  "Ich habe schon mal eine Einladung abgesagt und dann doch woanders gefeiert.",
  "Ich habe schon mal so getan, als wäre ich beschäftigt, um nicht helfen zu müssen.",
  "Ich habe schon mal einen Streit absichtlich weiterlaufen lassen, obwohl ich ihn hätte klären können.",
  "Ich habe schon mal im Suff etwas erzählt, das eigentlich geheim bleiben sollte.",
  "Ich habe schon mal etwas geklaut, das eigentlich nur eine Kleinigkeit war.",
  "Ich habe schon mal aus Trotz etwas kaputtgehen lassen, ohne etwas zu sagen.",
  "Ich habe schon mal jemanden falsch eingeschätzt und erst viel später gemerkt, wie daneben ich lag.",
  "Ich habe schon mal mit jemandem geflirtet, nur um zu testen, ob es funktioniert.",
  "Ich habe schon mal eine Ausrede benutzt, die komplett erfunden war.",
  "Ich habe schon mal auf einer Feier jemandem zugestimmt, obwohl ich das Gegenteil dachte.",
  "Ich habe schon mal heimlich gehofft, dass ein Date kurzfristig abgesagt wird.",
];

const POPULAR_QUESTION_TEMPLATES = [
  "Ich habe schon mal Interesse geheuchelt, nur um nett zu wirken.",
  "Ich habe schon mal aus Versehen etwas sehr Peinliches in die falsche Gruppe geschickt.",
  "Ich habe schon mal jemanden ignoriert und später behauptet, ich hätte die Nachricht übersehen.",
  "Ich habe schon mal bei einem Spiel oder Wettkampf geschummelt.",
  "Ich habe schon mal etwas weitererzählt, das ich eigentlich für mich behalten sollte.",
  "Ich habe schon mal so getan, als würde ich jemanden mögen, den ich eigentlich anstrengend finde.",
  "Ich habe schon mal nach einem peinlichen Abend gehofft, dass sich niemand daran erinnert.",
  "Ich habe schon mal absichtlich dramatischer reagiert, als es eigentlich nötig gewesen wäre.",
];

/* ---------- STYLES ---------- */

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: 24,
  color: "#f8fafc",
  background:
    "radial-gradient(circle at top left, #312e81 0%, #111827 35%, #020617 100%)",
  fontFamily:
    'Inter, Arial, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const shellStyle: CSSProperties = {
  maxWidth: 980,
  margin: "0 auto",
};

const heroTitleStyle: CSSProperties = {
  fontSize: 44,
  lineHeight: 1.05,
  marginBottom: 12,
  letterSpacing: "-0.03em",
};

const heroTextStyle: CSSProperties = {
  fontSize: 18,
  color: "#cbd5e1",
  maxWidth: 760,
  lineHeight: 1.5,
};

const cardStyle: CSSProperties = {
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  boxShadow: "0 18px 60px rgba(0,0,0,0.28)",
  backdropFilter: "blur(10px)",
  borderRadius: 22,
  padding: 20,
  marginBottom: 18,
};

const subCardStyle: CSSProperties = {
  background: "rgba(30, 41, 59, 0.75)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: 18,
  padding: 16,
  marginBottom: 16,
};

const badgeStyle: CSSProperties = {
  display: "inline-block",
  padding: "8px 12px",
  borderRadius: 999,
  background: "rgba(99, 102, 241, 0.18)",
  color: "#c7d2fe",
  border: "1px solid rgba(129, 140, 248, 0.25)",
  fontSize: 13,
  fontWeight: 700,
  marginBottom: 14,
};

const primaryBtn: CSSProperties = {
  fontSize: 20,
  padding: "15px 20px",
  borderRadius: 14,
  border: 0,
  background: "linear-gradient(135deg, #ffffff 0%, #c7d2fe 100%)",
  color: "#0f172a",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 10px 30px rgba(99,102,241,0.25)",
};

const ghostBtn: CSSProperties = {
  fontSize: 18,
  padding: "14px 18px",
  borderRadius: 14,
  border: "1px solid rgba(148, 163, 184, 0.28)",
  background: "rgba(15, 23, 42, 0.45)",
  color: "#f8fafc",
  fontWeight: 700,
  cursor: "pointer",
};

const bigBtn: CSSProperties = {
  ...primaryBtn,
  fontSize: 28,
  padding: "18px 26px",
};

const smallGhostBtn: CSSProperties = {
  ...ghostBtn,
  fontSize: 15,
  padding: "10px 12px",
};

const inputStyle: CSSProperties = {
  display: "block",
  width: "100%",
  maxWidth: 680,
  padding: "15px 16px",
  marginBottom: 12,
  borderRadius: 14,
  border: "1px solid rgba(148, 163, 184, 0.18)",
  background: "rgba(255,255,255,0.96)",
  color: "#0f172a",
  fontSize: 17,
  boxSizing: "border-box",
  outline: "none",
};

const inputInvalidStyle: CSSProperties = {
  ...inputStyle,
  border: "2px solid #ef4444",
  background: "#fff7f7",
};

const warningStyle: CSSProperties = {
  background: "rgba(127, 29, 29, 0.25)",
  color: "#fecaca",
  border: "1px solid rgba(239, 68, 68, 0.4)",
  padding: 14,
  borderRadius: 14,
  marginBottom: 16,
  maxWidth: 760,
};

const helperTextStyle: CSSProperties = {
  color: "#cbd5e1",
  fontSize: 15,
  lineHeight: 1.5,
};

const shareLinkBoxStyle: CSSProperties = {
  background: "rgba(2, 6, 23, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  padding: 14,
  borderRadius: 14,
  marginTop: 14,
  marginBottom: 16,
  wordBreak: "break-all",
  fontSize: 15,
  color: "#cbd5e1",
};

const swipeCardStyle: CSSProperties = {
  width: "100%",
  maxWidth: 760,
  minHeight: 280,
  borderRadius: 26,
  background: "linear-gradient(180deg, rgba(30,41,59,0.95), rgba(15,23,42,0.95))",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  padding: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  userSelect: "none",
  touchAction: "pan-y",
  transition: "transform 0.12s ease",
  marginBottom: 22,
  position: "relative",
  boxSizing: "border-box",
  boxShadow: "0 20px 60px rgba(0,0,0,0.32)",
};

const resultRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  background: "rgba(30, 41, 59, 0.85)",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  padding: 14,
  borderRadius: 14,
};

const progressTrackStyle: CSSProperties = {
  width: "100%",
  maxWidth: 760,
  height: 12,
  background: "rgba(51, 65, 85, 0.95)",
  borderRadius: 999,
  overflow: "hidden",
  marginBottom: 20,
};

const templateBoxStyle: CSSProperties = {
  background: "rgba(2, 6, 23, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: 14,
  padding: 10,
  marginBottom: 12,
  maxWidth: 680,
};

const templateItemStyle: CSSProperties = {
  padding: "11px 12px",
  borderRadius: 10,
  cursor: "pointer",
  fontSize: 15,
  marginBottom: 6,
  background: "rgba(30, 41, 59, 0.92)",
  color: "#e2e8f0",
};

const truthySelectedStyle: CSSProperties = {
  ...ghostBtn,
  background: "rgba(34, 197, 94, 0.18)",
  border: "1px solid rgba(34, 197, 94, 0.5)",
  color: "#bbf7d0",
};

const falsySelectedStyle: CSSProperties = {
  ...ghostBtn,
  background: "rgba(239, 68, 68, 0.16)",
  border: "1px solid rgba(239, 68, 68, 0.48)",
  color: "#fecaca",
};

const guideListStyle: CSSProperties = {
  marginTop: 10,
  marginBottom: 0,
  paddingLeft: 20,
  color: "#cbd5e1",
  lineHeight: 1.7,
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
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

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

    if (questions.length < 1) {
      issues.push("Bitte mindestens 1 Frage hinzufügen.");
    }

    questions.forEach((q, i) => {
      if (!q.text.trim()) issues.push(`Frage ${i + 1}: Text fehlt.`);
      if (q.answer === null) issues.push(`Frage ${i + 1}: Wahr/Falsch fehlt.`);
    });

    return issues;
  }, [creatorName, questions]);

  const showValidation = hasTriedSubmit && validationIssues.length > 0;

  const canCreate =
    creatorName.trim().length > 0 &&
    questions.length >= 1 &&
    questions.length <= 10 &&
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
    if (questions.length >= 10) return;
    setQuestions((prev) => [...prev, { text: "", answer: null }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
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
    const count = Math.min(Math.max(questions.length, 3), 5);
    const picked = shuffleArray(QUESTION_TEMPLATES).slice(0, count);
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

    if (questions.length < 10) {
      setQuestions((prev) => [...prev, { text: template, answer: null }]);
      return;
    }

    setQuestionText(0, template);
  };

  const createQuiz = async () => {
    setHasTriedSubmit(true);
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
      <div style={shellStyle}>
        {screen === "welcome" && (
          <div style={cardStyle}>
            <div style={badgeStyle}>Quiz-App Demo</div>
            <h1 style={heroTitleStyle}>Wie gut kennen dich deine Freunde wirklich?</h1>
            <p style={heroTextStyle}>
              Erstelle ein überraschendes Wahr/Falsch-Quiz über dich, teile den Link
              und finde heraus, wer dich wirklich kennt — oder nur so tut.
            </p>
            <div style={{ marginTop: 20 }}>
              <button onClick={() => setScreen("create")} style={bigBtn}>
                Quiz erstellen
              </button>
            </div>
          </div>
        )}

        {screen === "create" && (
          <>
            <div style={cardStyle}>
              <div style={badgeStyle}>Quiz erstellen</div>
              <h2 style={{ marginTop: 0, fontSize: 34 }}>Mach es überraschend</h2>
              <p style={helperTextStyle}>
                Nutze Aussagen über Eigenheiten, peinliche Erlebnisse, ungewöhnliche
                Gewohnheiten oder Dinge, die andere vermutlich falsch einschätzen.
              </p>

              <div style={subCardStyle}>
                <strong style={{ display: "block", marginBottom: 8 }}>
                  Kurzanleitung
                </strong>
                <ol style={guideListStyle}>
                  <li>Schreibe 1 bis 10 überraschende Aussagen über dich.</li>
                  <li>Lege für jede Aussage Wahr oder Falsch fest.</li>
                  <li>Teile den Link und schau, wer dich wirklich kennt.</li>
                </ol>
              </div>

              <input
                placeholder="Dein Name"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                style={showValidation && !creatorName.trim() ? inputInvalidStyle : inputStyle}
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
                    Beliebte überraschende Fragen
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

              {showValidation && validationIssues.length > 0 && (
                <div style={warningStyle}>
                  <strong>Bitte noch ergänzen:</strong>
                  <ul style={{ marginBottom: 0 }}>
                    {validationIssues.map((issue, i) => (
                      <li key={`${issue}-${i}`}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p style={{ ...helperTextStyle, marginBottom: 8 }}>
                Aktuell: <strong>{questions.length}</strong> / 10 Fragen
              </p>
            </div>

            {questions.map((q, i) => {
              const missingText = !q.text.trim();
              const missingAnswer = q.answer === null;

              return (
                <div key={i} style={cardStyle}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                      marginBottom: 10,
                    }}
                  >
                    <strong style={{ fontSize: 18 }}>Frage {i + 1}</strong>
                    <button
                      onClick={() => removeQuestion(i)}
                      disabled={questions.length <= 1}
                      style={{
                        ...smallGhostBtn,
                        opacity: questions.length <= 1 ? 0.4 : 1,
                      }}
                    >
                      Entfernen
                    </button>
                  </div>

                  <input
                    placeholder={`Frage ${i + 1}`}
                    value={q.text}
                    onChange={(e) => setQuestionText(i, e.target.value)}
                    style={showValidation && missingText ? inputInvalidStyle : inputStyle}
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
                      style={
                        q.answer === true
                          ? truthySelectedStyle
                          : showValidation && missingAnswer
                            ? { ...ghostBtn, border: "2px solid #ef4444" }
                            : ghostBtn
                      }
                    >
                      Wahr
                    </button>

                    <button
                      onClick={() => setQuestionAnswer(i, false)}
                      style={
                        q.answer === false
                          ? falsySelectedStyle
                          : showValidation && missingAnswer
                            ? { ...ghostBtn, border: "2px solid #ef4444" }
                            : ghostBtn
                      }
                    >
                      Falsch
                    </button>
                  </div>
                </div>
              );
            })}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={addQuestion}
                disabled={questions.length >= 10}
                style={{
                  ...ghostBtn,
                  opacity: questions.length >= 10 ? 0.4 : 1,
                }}
              >
                + Frage hinzufügen
              </button>

              <button onClick={createQuiz} style={primaryBtn}>
                Quiz teilen
              </button>
            </div>
          </>
        )}

        {screen === "share" && (
          <>
            <div style={cardStyle}>
              <div style={badgeStyle}>Bereit zum Verschicken</div>
              <h2 style={{ marginTop: 0, marginBottom: 10 }}>
                Schick dein Quiz jetzt an Freunde
              </h2>
              <p style={helperTextStyle}>
                Deine Freunde bekommen einen Link und können sofort testen, wie gut
                sie dich wirklich kennen. Das dauert nur ca. 20 Sekunden.
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
              <p style={helperTextStyle}>
                Starte das Quiz selbst und prüfe direkt, wie sich der Flow für andere anfühlt.
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
          <div style={cardStyle}>
            <div style={badgeStyle}>Quiz bereit</div>
            <h1 style={{ marginTop: 0 }}>{quizTitle}</h1>
            <p style={helperTextStyle}>
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
          </div>
        )}

        {screen === "play" && (
          <div style={cardStyle}>
            <p style={{ opacity: 0.8 }}>
              Frage {step + 1} von {questions.length}
            </p>

            <div style={progressTrackStyle}>
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #22c55e 0%, #818cf8 100%)",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                maxWidth: 760,
                marginBottom: 10,
                opacity: 0.75,
              }}
            >
              <span>← Falsch</span>
              <span>Wahr →</span>
            </div>

            <h2 style={{ fontSize: 34, lineHeight: 1.25 }}>{questions[step]?.text}</h2>

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
              <button onClick={() => void answer(true)} style={truthySelectedStyle}>
                Wahr
              </button>
              <button onClick={() => void answer(false)} style={falsySelectedStyle}>
                Falsch
              </button>
            </div>
          </div>
        )}

        {screen === "result" && (
          <div style={cardStyle}>
            <h1 style={{ fontSize: 54, marginBottom: 10 }}>{currentPercent}%</h1>
            <p style={{ fontSize: 20 }}>{getResultHeadline(currentPercent)}</p>

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
              <div style={{ display: "grid", gap: 10, maxWidth: 760 }}>
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
          </div>
        )}

        {screen === "dashboard" && (
          <div style={cardStyle}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              <button onClick={() => setScreen("share")} style={primaryBtn}>
                Zurück
              </button>
            </div>

            <h1 style={{ marginTop: 0 }}>Dashboard</h1>
            <p>Teilnehmer: {dashboard.length}</p>
            <p>Durchschnitt: {average !== null ? `${Math.round(average)}%` : "-"}</p>

            {dashboard.length === 0 ? (
              <p>Noch keine Ergebnisse vorhanden.</p>
            ) : (
              <div style={{ display: "grid", gap: 10, maxWidth: 760 }}>
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
          </div>
        )}
      </div>
    </main>
  );
}
