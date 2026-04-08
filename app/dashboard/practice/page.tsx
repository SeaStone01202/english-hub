"use client";

import {
  LearningLevel,
  LearningMode,
  LearningSession,
  SessionQuestion,
  VocabularyItem,
} from "@/lib/learning-types";
import { useAuth } from "@/contexts/auth-context";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import {
  BookOpen,
  Languages,
  Loader2,
  Sparkles,
  Volume2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const modeOptions: Array<{
  id: LearningMode;
  label: string;
  description: string;
  icon: typeof BookOpen;
}> = [
  {
    id: "grammar",
    label: "Grammar",
    description: "10 mixed grammar questions",
    icon: BookOpen,
  },
  {
    id: "vocabulary",
    label: "Vocabulary",
    description: "Topic words + meaning + voice",
    icon: Languages,
  },
];

const levelOptions: LearningLevel[] = ["beginner", "intermediate", "advanced"];

export default function PracticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [mode, setMode] = useState<LearningMode>("grammar");
  const [level, setLevel] = useState<LearningLevel>("beginner");
  const [topic, setTopic] = useState("Daily English");
  const [session, setSession] = useState<LearningSession | null>(null);
  const [questions, setQuestions] = useState<SessionQuestion[]>([]);
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [recentSessions, setRecentSessions] = useState<LearningSession[]>([]);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>(
    {},
  );
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    {},
  );
  const [blankInputs, setBlankInputs] = useState<Record<string, string>>({});
  const [matchingSelections, setMatchingSelections] = useState<
    Record<string, Record<string, string>>
  >({});
  const [matchingChecked, setMatchingChecked] = useState<Record<string, boolean>>(
    {},
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const modeMeta = useMemo(
    () => modeOptions.find((item) => item.id === mode) || modeOptions[0],
    [mode],
  );

  const fetchRecentSessions = async () => {
    setIsLoadingRecent(true);
    setRecentError(null);

    try {
      const params = new URLSearchParams();
      params.set("limit", "8");
      const response = await fetch(`/api/exercises/fetch?${params.toString()}`);

      if (response.ok) {
        const payload = (await response.json()) as { sessions: LearningSession[] };
        setRecentSessions(payload.sessions || []);
        return;
      }

      // Fallback query directly from client in case API auth/cookie fails on reload.
      if (user?.id) {
        const supabase = createSupabaseClient();
        const { data, error: fallbackError } = await supabase
          .from("learning_sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(8);

        if (fallbackError) {
          setRecentError(fallbackError.message);
          return;
        }

        const mapped: LearningSession[] = (data || []).map((item: any) => ({
          id: item.id,
          userId: item.user_id,
          mode: item.mode,
          level: item.level,
          topic: item.topic,
          title: item.title,
          status: item.status,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));
        setRecentSessions(mapped);
      }
    } catch (fetchError) {
      setRecentError(
        fetchError instanceof Error ? fetchError.message : "Failed to load sessions",
      );
    } finally {
      setIsLoadingRecent(false);
    }
  };

  const loadSession = async (sessionId: string) => {
    setIsLoadingSession(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/exercises/fetch?sessionId=${encodeURIComponent(sessionId)}`,
      );
      if (!response.ok) throw new Error("Failed to load session");
      const payload = (await response.json()) as {
        session: LearningSession;
        questions: SessionQuestion[];
        vocabulary: VocabularyItem[];
      };
      if (payload.session.mode === "mock_test") {
        setError("Session mock test đang tạm dừng.");
        setSession(null);
        setQuestions([]);
        setVocabulary([]);
        return;
      }
      setSession(payload.session);
      setMode(payload.session.mode);
      setLevel(payload.session.level);
      setTopic(payload.session.topic);
      setQuestions(payload.questions || []);
      setVocabulary(payload.vocabulary || []);
      setRevealedAnswers({});
      setSelectedOptions({});
      setBlankInputs({});
      setMatchingSelections({});
      setMatchingChecked({});
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Load failed");
    } finally {
      setIsLoadingSession(false);
    }
  };

  useEffect(() => {
    const sessionId = searchParams.get("session");
    const modeParam = searchParams.get("mode");
    if (modeParam === "grammar" || modeParam === "vocabulary") {
      setMode(modeParam);
    }
    fetchRecentSessions();
    if (sessionId) {
      loadSession(sessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const generate = async (continueCurrent: boolean) => {
    if (mode === "mock_test") {
      setError("Mock test is temporarily disabled. Use grammar or vocabulary.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch("/api/exercises/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          level,
          topic: topic.trim() || "General English",
          quantity: mode === "vocabulary" ? 8 : 10,
          sessionId: continueCurrent ? session?.id : undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Generation failed");

      setSession(payload.session);
      setQuestions((prev) =>
        continueCurrent ? [...prev, ...(payload.questions || [])] : payload.questions || [],
      );
      setVocabulary((prev) =>
        continueCurrent
          ? [...prev, ...(payload.vocabulary || [])]
          : payload.vocabulary || [],
      );
      if (!continueCurrent) {
        setRevealedAnswers({});
        setSelectedOptions({});
        setBlankInputs({});
        setMatchingSelections({});
        setMatchingChecked({});
      }

      const params = new URLSearchParams();
      params.set("mode", payload.session.mode);
      params.set("session", payload.session.id);
      router.replace(`/dashboard/practice?${params.toString()}`);
      fetchRecentSessions();
    } catch (generateError) {
      setError(
        generateError instanceof Error ? generateError.message : "Unexpected error",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const playVoice = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">AI Practice Studio</h1>
        <p className="text-muted-foreground">
          {modeMeta.label}: {modeMeta.description}
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          {modeOptions.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setMode(item.id);
                  fetchRecentSessions();
                  if (session && session.mode !== item.id) {
                    setSession(null);
                    setQuestions([]);
                    setVocabulary([]);
                    setRevealedAnswers({});
                    setSelectedOptions({});
                    setBlankInputs({});
                    setMatchingSelections({});
                    setMatchingChecked({});
                    router.replace(`/dashboard/practice?mode=${item.id}`);
                  }
                }}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  mode === item.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value as LearningLevel)}
            className="rounded-lg border border-input bg-background px-3 py-2"
          >
            {levelOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            className="md:col-span-2 rounded-lg border border-input bg-background px-3 py-2"
            placeholder="Topic"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-100/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => generate(false)}
            disabled={isGenerating || !topic.trim()}
            className="rounded-lg bg-primary px-5 py-2.5 text-primary-foreground font-medium inline-flex items-center gap-2 disabled:opacity-60"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {session ? "Start New Session" : "Generate"}
          </button>
          <button
            onClick={() => generate(true)}
            disabled={isGenerating || !session}
            className="rounded-lg border border-border px-5 py-2.5 font-medium hover:border-primary disabled:opacity-60"
          >
            Continue Generating
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {isLoadingSession && (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Loading session...</p>
            </div>
          )}

          {session && (
            <div className="rounded-lg border border-border bg-card p-4 text-sm">
              <p className="font-semibold">{session.title || "Learning Session"}</p>
              <p className="text-muted-foreground">Topic: {session.topic}</p>
            </div>
          )}

          {session?.mode === "vocabulary" &&
            vocabulary.map((item, index) => (
              <div key={item.id} className="rounded-lg border border-border bg-card p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Word #{index + 1}</p>
                    <h3 className="text-2xl font-bold">{item.word}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.phonetic || "No phonetic"} {item.partOfSpeech ? `- ${item.partOfSpeech}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => playVoice(item.exampleSentence)}
                    className="rounded-lg border border-border px-3 py-2 text-sm inline-flex items-center gap-2 hover:border-primary"
                  >
                    <Volume2 className="h-4 w-4" />
                    Play
                  </button>
                </div>
                <p><span className="font-medium">Meaning:</span> {item.meaningVi}</p>
                <p className="text-sm"><span className="font-medium">Example:</span> {item.exampleSentence}</p>
                <p className="text-sm text-muted-foreground">{item.exampleTranslation}</p>
              </div>
            ))}

          {session && session.mode !== "vocabulary" &&
            questions.map((question, index) => {
              const revealed = !!revealedAnswers[question.id];
              const selectedOption = selectedOptions[question.id];
              const fillInput = (blankInputs[question.id] || "").trim();
              const acceptableAnswers =
                question.metadata.acceptableAnswers &&
                question.metadata.acceptableAnswers.length > 0
                  ? question.metadata.acceptableAnswers
                  : [question.correctAnswer];
              const isBlankCorrect = acceptableAnswers.some(
                (answer) => answer.toLowerCase().trim() === fillInput.toLowerCase(),
              );
              const pairs = question.metadata.pairs || [];
              const selectedMap = matchingSelections[question.id] || {};
              const allPairsSelected =
                pairs.length > 0 && pairs.every((pair) => !!selectedMap[pair.left]);
              const isMatchingAllCorrect =
                pairs.length > 0 &&
                pairs.every((pair) => selectedMap[pair.left] === pair.right);
              return (
                <div key={question.id} className="rounded-lg border border-border bg-card p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold">Q{index + 1}. {question.questionText}</h3>
                    <span className="rounded-full bg-muted px-2 py-1 text-xs">
                      {question.questionType.replace("_", " ")}
                    </span>
                  </div>
                  {question.metadata.instruction && (
                    <p className="text-sm text-muted-foreground">{question.metadata.instruction}</p>
                  )}

                  {question.questionType === "multiple_choice" &&
                    question.options.length > 0 && (
                    <div className="grid gap-2">
                      {question.options.map((option) => (
                        <button
                          key={`${question.id}-${option.optionOrder}`}
                          onClick={() => {
                            if (revealed) return;
                            setSelectedOptions((prev) => ({
                              ...prev,
                              [question.id]: option.optionText,
                            }));
                            setRevealedAnswers((prev) => ({
                              ...prev,
                              [question.id]: true,
                            }));
                          }}
                          className={`rounded-lg border px-3 py-2 text-sm text-left transition-colors ${
                            revealed
                              ? option.isCorrect
                                ? "border-green-500 bg-green-50/70 dark:bg-green-950/40"
                                : selectedOption === option.optionText
                                  ? "border-red-500 bg-red-50/70 dark:bg-red-950/40"
                                  : "border-border"
                              : "border-border hover:border-primary"
                          }`}
                        >
                          {option.optionText}
                        </button>
                      ))}
                    </div>
                  )}

                  {question.questionType === "fill_blank" && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          value={blankInputs[question.id] || ""}
                          onChange={(event) =>
                            setBlankInputs((prev) => ({
                              ...prev,
                              [question.id]: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-input bg-background px-3 py-2"
                          placeholder="Type your answer..."
                        />
                        <button
                          onClick={() =>
                            setRevealedAnswers((prev) => ({
                              ...prev,
                              [question.id]: true,
                            }))
                          }
                          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground font-medium hover:opacity-90"
                        >
                          Check
                        </button>
                      </div>

                      {revealed && (
                        <p
                          className={`text-sm ${
                            isBlankCorrect
                              ? "text-green-700 dark:text-green-400"
                              : "text-red-700 dark:text-red-400"
                          }`}
                        >
                          {isBlankCorrect
                            ? "Correct answer."
                            : `Not quite. Correct answer: ${question.correctAnswer}`}
                        </p>
                      )}
                    </div>
                  )}

                  {question.questionType === "matching" &&
                    question.metadata.pairs &&
                    question.metadata.pairs.length > 0 && (
                    <div className="space-y-2">
                      {pairs.map((pair, pairIndex) => {
                        const selectedValue = selectedMap[pair.left] || "";
                        const isPairCorrect = selectedValue === pair.right;

                        return (
                          <div
                            key={`${question.id}-${pairIndex}`}
                            className="grid gap-2 md:grid-cols-2"
                          >
                            <div className="rounded-lg border border-border px-3 py-2 text-sm font-medium">
                              {pair.left}
                            </div>
                            <select
                              value={selectedValue}
                              disabled={!!matchingChecked[question.id]}
                              onChange={(event) =>
                                setMatchingSelections((prev) => ({
                                  ...prev,
                                  [question.id]: {
                                    ...(prev[question.id] || {}),
                                    [pair.left]: event.target.value,
                                  },
                                }))
                              }
                              className={`rounded-lg border px-3 py-2 text-sm bg-background ${
                                matchingChecked[question.id]
                                  ? isPairCorrect
                                    ? "border-green-500"
                                    : "border-red-500"
                                  : "border-input"
                              }`}
                            >
                              <option value="">Select match</option>
                              {pairs.map((rightPair) => (
                                <option
                                  key={`${question.id}-${pair.left}-${rightPair.right}`}
                                  value={rightPair.right}
                                >
                                  {rightPair.right}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {question.questionType === "matching" && (
                    <button
                      onClick={() => {
                        if (!allPairsSelected) {
                          return;
                        }

                        setMatchingChecked((prev) => ({
                          ...prev,
                          [question.id]: true,
                        }));
                        setRevealedAnswers((prev) => ({
                          ...prev,
                          [question.id]: true,
                        }));
                      }}
                      className="rounded-lg border border-border px-3 py-2 text-sm hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!allPairsSelected || !!matchingChecked[question.id]}
                    >
                      {matchingChecked[question.id]
                        ? "Checked"
                        : "Check Matching"}
                    </button>
                  )}

                  {revealed && question.questionType !== "fill_blank" && (
                    <div className="rounded-lg bg-blue-50/60 dark:bg-blue-950/40 px-3 py-2 text-sm">
                      {question.questionType === "matching" && (
                        <p
                          className={`font-medium ${
                            isMatchingAllCorrect
                              ? "text-green-700 dark:text-green-400"
                              : "text-red-700 dark:text-red-400"
                          }`}
                        >
                          {isMatchingAllCorrect
                            ? "Great job. All matches are correct."
                            : "Some matches are incorrect."}
                        </p>
                      )}
                      <p><span className="font-medium">Correct:</span> {question.correctAnswer}</p>
                      <p className="text-muted-foreground">{question.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}

          {session && (
            <button
              onClick={() => generate(true)}
              disabled={isGenerating}
              className="w-full rounded-lg border border-border bg-card py-3 font-medium hover:border-primary disabled:opacity-60"
            >
              Continue Generating
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="font-semibold mb-2">Recent Sessions</p>
            {isLoadingRecent ? (
              <p className="text-sm text-muted-foreground">Loading sessions...</p>
            ) : recentError ? (
              <p className="text-sm text-red-700 dark:text-red-400">{recentError}</p>
            ) : recentSessions.length > 0 ? (
              <div className="space-y-2">
                {recentSessions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      loadSession(item.id);
                      const params = new URLSearchParams();
                      params.set("mode", item.mode);
                      params.set("session", item.id);
                      router.replace(`/dashboard/practice?${params.toString()}`);
                    }}
                    className="w-full rounded-lg border border-border px-3 py-2 text-left hover:border-primary"
                  >
                    <p className="text-sm font-medium line-clamp-1">{item.title || "Untitled session"}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {item.mode.replace("_", " ")} - {item.topic}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No sessions yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
