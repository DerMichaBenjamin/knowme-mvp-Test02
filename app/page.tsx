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
  "Ich gehe im Herbst Pilze sammeln.",
  "Mein größter Traum ist ein Fallschirm-Sprung.",
  "Ich hatte schon mal eine Affäre mit einer Person, die in der Öffentlichkeit bekannt ist.",
  "Ich putze mir abends manchmal länger als 10 Minuten die Zähne.",
  "Ich habe schon mal bei einem offiziellen Weltrekord-Versuch mitgemacht.",
  "Ich habe schon mal in einem Freizeitpark gearbeitet.",
  "Ich habe schon mal als Animateur oder Animateurin gearbeitet.",
  "Ich habe schon mal als Promoter in einem Club oder auf Events gearbeitet.",
  "Ich habe schon mal in einem Tattoo-Studio gearbeitet.",
  "Ich habe schon mal auf einem Kreuzfahrtschiff gearbeitet.",
  "Ich war schon mal auf einer Swingerparty oder an einem Ort mit ähnlich offenem Publikum.",
  "Ich habe schon mal Sex gehabt, während andere Leute zugeguckt haben.",
  "Ich bin schon mal alleine in den Urlaub gefahren, nur um völlig meine Ruhe zu haben.",
  "Ich war früher öfter heimlich nachts im Freibad schwimmen.",
  "Ich habe schon mal auf einem Friedhof nachts Zeit verbracht.",
  "Ich war schon mal der Hauptdarsteller in einem Theaterstück",
  "Ich habe schon mal an einem Nudistenstrand oder in einer Sauna völlig selbstverständlich mit Fremden nackt Zeit verbracht.",
  "Ich habe schon mal als Kellner oder Kellnerin gearbeitet und dabei absichtlich Gästen etwas vorgespielt.",
  "Ich hatte mal eine Phase, in der ich fast jeden Tag Tarot, Horoskope oder ähnliche Sachen gelesen habe.",
  "Ich habe schon mal aus Neugier einen Sprachkurs angefangen, obwohl ich die Sprache nie wirklich gebraucht habe.",
  "Ich habe schon mal ein Messer, eine Axt oder ein anderes Werkzeug zum Werfen ausprobiert.",
  "Ich habe schon mal einen Schnupperkurs in Pole Dance, Burlesque oder etwas Ähnlichem gemacht.",
  "Ich habe schon mal einen Kampfsport gemacht, von dem heute fast niemand mehr etwas weiß.",
  "Ich habe schon mal bei einer Casting-Show, einem Talentwettbewerb oder etwas Ähnlichem mitgemacht.",
  "Ich war schon mal Backstage bei einem Konzert oder einer TV-Produktion, obwohl man mir das kaum zutrauen würde.",
  "Ich habe schon mal in einem Kostüm gearbeitet, in dem mich niemand erkannt hätte.",
  "Ich habe bis vor 5 Jahren fast nur von Energy Drinks und schlechtem Essen gelebt.",
  "Ich habe schon mal absichtlich ein Date sausen lassen und stattdessen lieber alleine etwas völlig Unnötiges gemacht.",
  "Ich habe mal leere Feuerzeuge gesammelt.",
  "Ich habe mal drei Jahre lang fast jeden Tag nur Party gemacht und kaum geschlafen.",
  "Ich habe schon mal mit voller Absicht eine peinliche Situation nicht aufgeklärt, weil sie zu lustig war.",
  "Ich habe schon mal bei einer Beerdigung laut lachen müssen.",
  "Ich war schon mal in einem Stadion, und habe mich mit gegenerischen Fans gepügelt.",
  "Ich habe schon mal für Geld etwas gemacht, das illegal ist.",
  "Ich bin schon mal aus einer Kirche raus geschmissen worden",
  "Ich habe schon mal 24 Stunden am Stück im Stau gestanden.",
  "Ich habe schon mal 30 Stunden in einem Zug fest gehangen.",
  "Ich war schon mal auf einer Afterhour oder in einer Situation, in der andere längst schlafen waren.",
  "Ich habe schon mal absichtlich eine Identität oder Rolle gespielt, nur um zu schauen, ob es jemand glaubt.",
  "Ich habe schon mal mit einem deutlich älteren oder deutlich jüngeren Menschen geflirtet, einfach weil es spannend war."
];

const POPULAR_QUESTION_TEMPLATES = [
  "Ich gehe im Herbst Pilze sammeln.",
  "Mein größter Traum ist ein Fallschirm-Sprung.",
  "Ich habe schon mal bei einem offiziellen Weltrekord-Versuch mitgemacht.",
  "Ich habe schon mal in einem Freizeitpark gearbeitet.",
  "Ich habe schon mal als Animateur oder Animateurin gearbeitet.",
  "Ich war schon mal als Angeklagter vor Gericht.",
  "Ich habe schon mal auf einer Swingerparty oder an einem ähnlich offenen Ort Zeit verbracht.",
  "Ich putze mir abends manchmal länger als 10 Minuten die Zähne.",
  "Ich habe schon mal bei einer TV-Produktion vor der Kamera gestanden.",
  "Ich habe schon mal in einer Höhle übernachtet."
];

/* ---------- STYLES ---------- */

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: 20,
  color: "#1f2937",
  background:
    "linear-gradient(135deg, #fff7ed 0%, #fdf2f8 20%, #eef2ff 45%, #cffafe 70%, #dcfce7 100%)",
  fontFamily:
    'Inter, Arial, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const shellStyle: CSSProperties = {
  maxWidth: 980,
  margin: "0 auto",
};

const heroTitleStyle: CSSProperties = {
  fontSize: 46,
  lineHeight: 1.02,
  marginBottom: 12,
  letterSpacing: "-0.035em",
  color: "#0f172a",
};

const heroTextStyle: CSSProperties = {
  fontSize: 18,
  color: "#475569",
  maxWidth: 760,
  lineHeight: 1.55,
};

const cardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.78)",
  border: "1px solid rgba(255,255,255,0.65)",
  boxShadow: "0 18px 50px rgba(99, 102, 241, 0.14)",
  backdropFilter: "blur(12px)",
  borderRadius: 24,
  padding: 20,
  marginBottom: 18,
};

const subCardStyle: CSSProperties = {
  background: "linear-gradient(135deg, rgba(236, 253, 245, 0.9), rgba(224, 231, 255, 0.85))",
  border: "1px solid rgba(129, 140, 248, 0.18)",
  borderRadius: 18,
  padding: 16,
  marginBottom: 16,
};

const badgeStyle: CSSProperties = {
  display: "inline-block",
  padding: "8px 12px",
  borderRadius: 999,
  background: "linear-gradient(135deg, #fde68a, #f9a8d4)",
  color: "#7c2d12",
  fontSize: 13,
  fontWeight: 800,
  marginBottom: 14,
};

const primaryBtn: CSSProperties = {
  fontSize: 20,
  padding: "15px 20px",
  borderRadius: 16,
  border: 0,
  background: "linear-gradient(135deg, #f97316 0%, #ec4899 55%, #8b5cf6 100%)",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 14px 34px rgba(236,72,153,0.24)",
};

const ghostBtn: CSSProperties = {
  fontSize: 18,
  padding: "14px 18px",
  borderRadius: 16,
  border: "1px solid rgba(148, 163, 184, 0.24)",
  background: "rgba(255,255,255,0.7)",
  color: "#334155",
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
  maxWidth: 720,
  padding: "15px 16px",
  marginBottom: 12,
  borderRadius: 16,
  border: "1px solid rgba(148, 163, 184, 0.18)",
  background: "rgba(255,255,255,0.96)",
  color: "#0f172a",
  fontSize: 17,
  boxSizing: "border-box",
  outline: "none",
  boxShadow: "0 4px 16px rgba(15,23,42,0.04)",
};

const inputInvalidStyle: CSSProperties = {
  ...inputStyle,
  border: "2px solid #ef4444",
  background: "#fff7f7",
};

const warningStyle: CSSProperties = {
  background: "rgba(254, 226, 226, 0.88)",
  color: "#991b1b",
  border: "1px solid rgba(239, 68, 68, 0.28)",
  padding: 14,
  borderRadius: 16,
  marginBottom: 16,
  maxWidth: 760,
};

const helperTextStyle: CSSProperties = {
  color: "#475569",
  fontSize: 15,
  lineHeight: 1.55,
};

const shareLinkBoxStyle: CSSProperties = {
  background: "rgba(248, 250, 252, 0.95)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  padding: 14,
  borderRadius: 14,
  marginTop: 14,
  marginBottom: 16,
  wordBreak: "break-all",
  fontSize: 15,
  color: "#334155",
};

const swipeCardStyle: CSSProperties = {
  width: "100%",
  maxWidth: 760,
  minHeight: 280,
  borderRadius: 28,
  background: "linear-gradient(135deg, #ffffff 0%, #fdf2f8 45%, #e0f2fe 100%)",
  border: "1px solid rgba(255,255,255,0.72)",
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
  boxShadow: "0 22px 60px rgba(99, 102, 241, 0.16)",
};

const resultRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  background: "rgba(255,255,255,0.78)",
  border: "1px solid rgba(255,255,255,0.65)",
  padding: 14,
  borderRadius: 16,
};

const progressTrackStyle: CSSProperties = {
  width: "100%",
  maxWidth: 760,
  height: 12,
  background: "rgba(226, 232, 240, 0.95)",
  borderRadius: 999,
  overflow: "hidden",
  marginBottom: 20,
};

const templateBoxStyle: CSSProperties = {
  background: "rgba(255,255,255,0.82)",
  border: "1px solid rgba(255,255,255,0.7)",
  borderRadius: 16,
  padding: 10,
  marginBottom: 12,
  maxWidth: 720,
};

const templateItemStyle: CSSProperties = {
  padding: "11px 12px",
  borderRadius: 10,
  cursor: "pointer",
  fontSize: 15,
  marginBottom: 6,
  background: "linear-gradient(135deg, #eff6ff, #f5f3ff)",
  color: "#334155",
};

const truthySelectedStyle: CSSProperties = {
  ...ghostBtn,
  background: "linear-gradient(135deg, #22c55e, #16a34a)",
  border: "1px solid rgba(22, 163, 74, 0.5)",
  color: "white",
  boxShadow: "0 12px 26px rgba(34,197,94,0.2)",
};

const falsySelectedStyle: CSSProperties = {
  ...ghostBtn,
  background: "linear-gradient(135deg, #ef4444, #dc2626)",
  border: "1px solid rgba(220, 38, 38, 0.5)",
  color: "white",
  boxShadow: "0 12px 26px rgba(239,68,68,0.18)",
};

const guideListStyle: CSSProperties = {
  marginTop: 10,
  marginBottom: 0,
  paddingLeft: 20,
  color: "#475569",
  lineHeight: 1.7,
};

const questionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 10,
};

const subtleCountStyle: CSSProperties = {
  color: "#475569",
  fontSize: 14,
  fontWeight: 700,
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

const getRandomTemplate = (exclude?: string) => {
  const pool = QUESTION_TEMPLATES.filter((item) => item !== exclude);
  if (!pool.length) return QUESTION_TEMPLATES[0];
  return pool[Math.floor(Math.random() * pool.length)];
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

  const setRandomQuestionForIndex = (index: number) => {
    const current = questions[index]?.text;
    const next = getRandomTemplate(current);
    setQuestionText(index, next);
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
      alert(`Quiz konnte nicht gespeichert werden: ${error?.message || "Unbekannter Fehler"}`);
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
      alert(`Fragen konnten nicht gespeichert werden: ${questionError.message}`);
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
            <div style={badgeStyle}>Crazy Quiz</div>
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
              <h2 style={{ marginTop: 0, fontSize: 34, color: "#0f172a" }}>
                Mach es überraschend
              </h2>
              <p style={helperTextStyle}>
                Nutze Aussagen über schräge Gewohnheiten, peinliche Erlebnisse,
                ungewöhnliche Jobs, komische Orte oder Dinge, die andere niemals von dir erwarten würden.
              </p>

              <div style={subCardStyle}>
                <strong style={{ display: "block", marginBottom: 8, color: "#0f172a" }}>
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
                  <strong style={{ display: "block", marginBottom: 10, color: "#0f172a" }}>
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

              <p style={{ ...subtleCountStyle, marginBottom: 0 }}>
                Aktuell: {questions.length} / 10 Fragen
              </p>
            </div>

            {questions.map((q, i) => {
              const missingText = !q.text.trim();
              const missingAnswer = q.answer === null;

              return (
                <div key={i} style={cardStyle}>
                  <div style={questionHeaderStyle}>
                    <strong style={{ fontSize: 18, color: "#0f172a" }}>Frage {i + 1}</strong>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        onClick={() => setRandomQuestionForIndex(i)}
                        style={smallGhostBtn}
                      >
                        Zufallsfrage
                      </button>
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
                  </div>

                  <input
                    placeholder="Schreibe hier eine überraschende Aussage über dich"
                    value={q.text}
                    onChange={(e) => setQuestionText(i, e.target.value)}
                    style={showValidation && missingText ? inputInvalidStyle : inputStyle}
                  />

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
              <h2 style={{ marginTop: 0, marginBottom: 10, color: "#0f172a" }}>
                Schick dein Quiz jetzt an Freunde
              </h2>
              <p style={helperTextStyle}>
                Deine Freunde bekommen einen Link und können sofort testen,
                wie gut sie dich wirklich kennen. Das dauert nur ca. 20 Sekunden.
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
              <h3 style={{ marginTop: 0, color: "#0f172a" }}>Selbst testen</h3>
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
            <h1 style={{ marginTop: 0, color: "#0f172a" }}>{quizTitle}</h1>
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
            <p style={{ color: "#475569" }}>
              Frage {step + 1} von {questions.length}
            </p>

            <div style={progressTrackStyle}>
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #22c55e 0%, #f97316 50%, #ec4899 100%)",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                maxWidth: 760,
                marginBottom: 10,
                color: "#64748b",
              }}
            >
              <span>← Falsch</span>
              <span>Wahr →</span>
            </div>

            <h2 style={{ fontSize: 34, lineHeight: 1.2, color: "#0f172a" }}>
              {questions[step]?.text}
            </h2>

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
                  color: "#16a34a",
                  opacity: dragX > 18 ? 1 : 0.3,
                  fontWeight: 700,
                }}
              >
                WAHR
              </div>
              <span style={{ color: "#475569", fontWeight: 700 }}>Swipe →</span>
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
            <h1 style={{ fontSize: 54, marginBottom: 10, color: "#0f172a" }}>{currentPercent}%</h1>
            <p style={{ color: "#475569", fontSize: 20 }}>{getResultHeadline(currentPercent)}</p>

            {rank && <p>Du bist Platz {rank}.</p>}
            {betterThanPercent !== null && (
              <p>Besser als {betterThanPercent}% der Teilnehmer.</p>
            )}
            {average !== null && (
              <p>Durchschnitt bisher: {Math.round(average)}%</p>
            )}

            <p style={{ fontSize: 20, fontWeight: 800, marginTop: 16, color: "#0f172a" }}>
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

            <h2 style={{ color: "#0f172a" }}>Leaderboard</h2>

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
                      <div style={{ color: "#64748b", fontSize: 14 }}>
                        {entry.score} / {entry.total} richtig
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 22, color: "#0f172a" }}>
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

            <h1 style={{ marginTop: 0, color: "#0f172a" }}>Dashboard</h1>
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
