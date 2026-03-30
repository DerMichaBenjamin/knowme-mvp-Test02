"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Page() {
  const [screen, setScreen] = useState("welcome");
  const [creatorName, setCreatorName] = useState("");
  const [quizTitle, setQuizTitle] = useState("Wie gut kennst du ...?");
  const [shareUrl, setShareUrl] = useState("");

  const [questions, setQuestions] = useState([
    { text: "", answer: null },
    { text: "", answer: null },
    { text: "", answer: null },
  ]);

  const [playerName, setPlayerName] = useState("");
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<boolean | null>(null);

  const [currentPercent, setCurrentPercent] = useState<number | null>(null);
  const [averagePercent, setAveragePercent] = useState<number | null>(null);

  useEffect(() => {
    const clean = creatorName.trim();
    setQuizTitle(clean ? `Wie gut kennst du ${clean}?` : "Wie gut kennst du ...?");
  }, [creatorName]);

  const canCreate =
    creatorName.trim() &&
    questions.length >= 3 &&
    questions.length <= 5 &&
    questions.every((q) => q.text.trim() && q.answer !== null);

  // ---------------- SHARE LOGIC ----------------

  const generateChallengeText = () => {
    const percent = currentPercent ?? 50;

    if (percent >= 80) {
      return `Ich kenne ${creatorName} besser als fast alle 😄 (${percent}%)\nSchaffst du das auch?\n${shareUrl}`;
    }

    if (percent >= 50) {
      return `Ich dachte ich kenne ${creatorName} gut… (${percent}%) 😅\nDu schaffst mehr!\n${shareUrl}`;
    }

    return `Das war peinlich 😂 nur ${percent}%\nDu bist besser!\n${shareUrl}`;
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(generateChallengeText());
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareOther = async () => {
    const text = generateChallengeText();

    if (navigator.share) {
      try {
        await navigator.share({
          text,
          url: shareUrl,
        });
        return;
      } catch {}
    }

    await navigator.clipboard.writeText(text);
    alert("Text kopiert – jetzt in Instagram oder TikTok einfügen");
  };

  // ---------------- CREATE ----------------

  const createQuiz = async () => {
    if (!canCreate) return;

    const { data } = await supabase
      .from("quizzes")
      .insert({
        creator_name: creatorName,
        title: quizTitle,
        question_count: questions.length,
      })
      .select()
      .single();

    const quizId = data.id;

    await supabase.from("quiz_questions").insert(
      questions.map((q, i) => ({
        quiz_id: quizId,
        text: q.text,
        correct_answer: q.answer,
        position: i + 1,
      }))
    );

    const url = `${window.location.origin}/?q=${quizId}`;
    setShareUrl(url);
    setScreen("share");
  };

  // ---------------- QUIZ ----------------

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
      quiz_id: shareUrl.split("q=")[1],
      player_name: playerName,
      score: newScore,
      total: questions.length,
      percent,
    });

    setScreen("result");
  };

  // ---------------- UI ----------------

  return (
    <main style={{ padding: 40, color: "white", background: "#0f172a", minHeight: "100vh" }}>
      {screen === "welcome" && (
        <>
          <h1>Wie gut kennen dich deine Freunde?</h1>
          <button onClick={() => setScreen("create")}>Quiz erstellen</button>
        </>
      )}

      {screen === "create" && (
        <>
          <h2>Quiz erstellen</h2>

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

          <button onClick={createQuiz}>Link erstellen</button>
        </>
      )}

      {screen === "share" && (
        <>
          <h2>Teilen</h2>
          <p>{shareUrl}</p>

          <button onClick={shareWhatsApp}>WhatsApp</button>
          <button onClick={shareOther}>Instagram / TikTok</button>

          <button onClick={() => setScreen("play")}>Test spielen</button>
        </>
      )}

      {screen === "play" && (
        <>
          <h2>{questions[step].text}</h2>

          <button onClick={() => answer(true)}>Wahr</button>
          <button onClick={() => answer(false)}>Falsch</button>
        </>
      )}

      {screen === "result" && (
        <>
          <h1>{currentPercent}%</h1>

          <button onClick={shareWhatsApp}>WhatsApp teilen</button>
          <button onClick={shareOther}>Instagram / TikTok</button>

          <button onClick={() => setScreen("create")}>Eigenes Quiz</button>
        </>
      )}
    </main>
  );
}
