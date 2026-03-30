"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Question = {
  text: string;
  answer: boolean | null;
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

export default function Page() {
  const [screen, setScreen] = useState<"welcome" | "create" | "share" | "play" | "result">("welcome");
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

  useEffect(() => {
    const clean = creatorName.trim();
    setQuizTitle(clean ? `Wie gut kennst du ${clean}?` : "Wie gut kennst du ...?");
  }, [creatorName]);

  const canCreate =
    !!creatorName.trim() &&
    questions.length >= 3 &&
    questions.length <= 5 &&
    questions.every((q) => q.text.trim() && q.answer !== null);

  const generateChallengeText = () => {
    const percent = currentPercent ?? 50;

    if (percent >= 80) {
      return `Ich kenne ${creatorName || "diese Person"} besser als fast alle 😄 (${percent}%)\nSchaffst du das auch?\n${shareUrl}`;
    }

    if (percent >= 50) {
      return `Ich dachte ich kenne ${creatorName || "die Person"} gut… (${percent}%) 😅\nDu schaffst mehr!\n${shareUrl}`;
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
      } catch {
        // ignore cancel
      }
    }

    await navigator.clipboard.writeText(text);
    alert("Text kopiert – jetzt in Instagram oder TikTok einfügen");
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

    const finalQuizId = quizId || shareUrl.split("q=")[1] || "";

    if (finalQuizId) {
      await supabase.from("quiz_results").insert({
        quiz_id: finalQuizId,
        player_name: playerName || "Anonymous",
        score: newScore,
        total: questions.length,
        percent,
      });
    }

    setScreen("result");
  };

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
            style={{ display: "block", marginBottom: 16, padding: 10, width: "100%", maxWidth: 500 }}
          />

          {questions.map((q, i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <input
                placeholder={`Frage ${i + 1}`}
                value={q.text}
                onChange={(e) => {
                  const copy = [...questions];
                  copy[i].text = e.target.value;
                  setQuestions(copy);
                }}
                style={{ display: "block", marginBottom: 8, padding: 10, width: "100%", maxWidth: 500 }}
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

          <button onClick={createQuiz} disabled={!canCreate}>
            Link erstellen
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
          <button onClick={shareOther} style={{ marginRight: 8 }}>
            Instagram / TikTok
          </button>

          <div style={{ marginTop: 20 }}>
            <input
              placeholder="Dein Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              style={{ display: "block", marginBottom: 12, padding: 10, width: "100%", maxWidth: 500 }}
            />

            <button onClick={() => setScreen("play")} disabled={!playerName.trim()}>
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

          <button onClick={shareWhatsApp} style={{ marginRight: 8 }}>
            WhatsApp teilen
          </button>
          <button onClick={shareOther} style={{ marginRight: 8 }}>
            Instagram / TikTok
          </button>

          <button onClick={() => setScreen("create")}>Eigenes Quiz</button>
        </>
      )}
    </main>
  );
}
