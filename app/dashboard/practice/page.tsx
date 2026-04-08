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
import { DictationPanel } from "./_components/dictation-panel";
import { GrammarQuestionCard } from "./_components/grammar-question-card";
import { PracticeToolbar } from "./_components/practice-toolbar";
import { RecentSessions } from "./_components/recent-sessions";
import { VocabularyCard } from "./_components/vocabulary-card";
import { BookOpen, Headphones, Languages, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const modeOptions: Array<{
  id: LearningMode | "dictation";
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
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
  {
    id: "dictation",
    label: "Dictation",
    description: "Listen and type the full sentence",
    icon: Headphones,
  },
];

const levelOptions: LearningLevel[] = ["beginner", "intermediate", "advanced"];

type PracticeMode = LearningMode | "dictation";

function normalizeDictationText(input: string) {
  return input
    .toLowerCase()
    .replace(/[^\w\s]|_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitWords(input: string) {
  const normalized = normalizeDictationText(input);
  return normalized ? normalized.split(" ") : [];
}

export default function PracticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [mode, setMode] = useState<PracticeMode>("grammar");
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
  const [dictationSentence, setDictationSentence] = useState("");
  const [dictationTranslation, setDictationTranslation] = useState("");
  const [dictationHint, setDictationHint] = useState("");
  const [dictationInput, setDictationInput] = useState("");
  const [isGeneratingDictation, setIsGeneratingDictation] = useState(false);
  const [dictationChecked, setDictationChecked] = useState(false);

  const modeMeta = useMemo(
    () => modeOptions.find((item) => item.id === mode) || modeOptions[0],
    [mode],
  );

  const dictationComparison = useMemo(() => {
    if (!dictationChecked || !dictationSentence) {
      return [];
    }

    const expectedWords = splitWords(dictationSentence);
    const inputWords = splitWords(dictationInput);
    const maxLength = Math.max(expectedWords.length, inputWords.length);

    return Array.from({ length: maxLength }, (_, index) => {
      const expected = expectedWords[index] || "";
      const actual = inputWords[index] || "";
      return {
        index,
        expected,
        actual,
        isCorrect: !!expected && expected === actual,
      };
    });
  }, [dictationChecked, dictationInput, dictationSentence]);

  const dictationStats = useMemo(() => {
    if (!dictationChecked || !dictationSentence) {
      return { expectedCount: 0, correctCount: 0, accuracy: 0 };
    }

    const expectedCount = splitWords(dictationSentence).length;
    const correctCount = dictationComparison.filter((item) => item.isCorrect).length;
    const accuracy =
      expectedCount > 0 ? Math.round((correctCount / expectedCount) * 100) : 0;

    return {
      expectedCount,
      correctCount,
      accuracy,
    };
  }, [dictationChecked, dictationComparison, dictationSentence]);

  const resetDictationState = () => {
    setDictationSentence("");
    setDictationTranslation("");
    setDictationHint("");
    setDictationInput("");
    setDictationChecked(false);
  };

  const resetPracticeAnswerStates = () => {
    setRevealedAnswers({});
    setSelectedOptions({});
    setBlankInputs({});
    setMatchingSelections({});
    setMatchingChecked({});
  };

  const clearSessionData = () => {
    setSession(null);
    setQuestions([]);
    setVocabulary([]);
    resetPracticeAnswerStates();
  };

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
        setError("Session mock test Ä‘ang táº¡m dá»«ng.");
        clearSessionData();
        resetDictationState();
        return;
      }
      setSession(payload.session);
      setMode(payload.session.mode);
      setLevel(payload.session.level);
      setTopic(payload.session.topic);
      setQuestions(payload.questions || []);
      setVocabulary(payload.vocabulary || []);
      resetDictationState();
      resetPracticeAnswerStates();
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Load failed");
    } finally {
      setIsLoadingSession(false);
    }
  };

  useEffect(() => {
    const sessionId = searchParams.get("session");
    const modeParam = searchParams.get("mode");
    if (
      modeParam === "grammar" ||
      modeParam === "vocabulary" ||
      modeParam === "dictation"
    ) {
      setMode(modeParam);
    }
    fetchRecentSessions();
    if (sessionId) {
      loadSession(sessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const generate = async (continueCurrent: boolean) => {
    if (mode === "dictation") return;
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
        resetPracticeAnswerStates();
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

  const generateDictation = async () => {
    setIsGeneratingDictation(true);
    setError(null);

    try {
      const response = await fetch("/api/dictation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          topic: topic.trim() || "Daily English",
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Failed to generate dictation sentence");
      }

      setDictationSentence(payload.sentence || "");
      setDictationTranslation(payload.translationVi || "");
      setDictationHint(payload.hintVi || "");
      setDictationInput("");
      setDictationChecked(false);
    } catch (dictationError) {
      setError(
        dictationError instanceof Error
          ? dictationError.message
          : "Failed to generate dictation sentence",
      );
    } finally {
      setIsGeneratingDictation(false);
    }
  };

  const playVoice = (text: string) => {
    if (!text || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
  };

  const handleModeChange = (nextMode: string) => {
    if (
      nextMode !== "grammar" &&
      nextMode !== "vocabulary" &&
      nextMode !== "dictation"
    ) {
      return;
    }

    setMode(nextMode);
    setError(null);

    if (nextMode === "dictation") {
      clearSessionData();
      resetDictationState();
      return;
    }

    fetchRecentSessions();
    resetDictationState();
    if (session && session.mode !== nextMode) {
      clearSessionData();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">AI Practice Studio</h1>
        <p className="text-muted-foreground">
          {modeMeta.label}: {modeMeta.description}
        </p>
      </div>

      <PracticeToolbar
        modeOptions={modeOptions}
        mode={mode}
        levelOptions={levelOptions}
        level={level}
        topic={topic}
        error={error}
        hasSession={!!session}
        dictationSentence={dictationSentence}
        isGenerating={isGenerating}
        isGeneratingDictation={isGeneratingDictation}
        onModeChange={handleModeChange}
        onLevelChange={setLevel}
        onTopicChange={setTopic}
        onGenerate={() => generate(false)}
        onContinue={() => generate(true)}
        onGenerateDictation={generateDictation}
        onPlayDictation={() => playVoice(dictationSentence)}
      />

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

          {mode === "dictation" && (
            <DictationPanel
              sentence={dictationSentence}
              hint={dictationHint}
              translation={dictationTranslation}
              inputValue={dictationInput}
              checked={dictationChecked}
              comparison={dictationComparison}
              stats={dictationStats}
              onPlay={() => playVoice(dictationSentence)}
              onInputChange={setDictationInput}
              onCheck={() => setDictationChecked(true)}
              onReset={() => {
                setDictationInput("");
                setDictationChecked(false);
              }}
            />
          )}

          {session?.mode === "vocabulary" &&
            vocabulary.map((item, index) => (
              <VocabularyCard
                key={item.id}
                item={item}
                index={index}
                onPlayExample={playVoice}
              />
            ))}

          {session &&
            session.mode !== "vocabulary" &&
            questions.map((question, index) => (
              <GrammarQuestionCard
                key={question.id}
                question={question}
                index={index}
                revealed={!!revealedAnswers[question.id]}
                selectedOption={selectedOptions[question.id] || ""}
                blankInput={blankInputs[question.id] || ""}
                selectedMap={matchingSelections[question.id] || {}}
                isMatchingChecked={!!matchingChecked[question.id]}
                onSelectOption={(value) => {
                  setSelectedOptions((prev) => ({ ...prev, [question.id]: value }));
                  setRevealedAnswers((prev) => ({ ...prev, [question.id]: true }));
                }}
                onBlankInputChange={(value) => {
                  setBlankInputs((prev) => ({ ...prev, [question.id]: value }));
                }}
                onCheckBlank={() => {
                  setRevealedAnswers((prev) => ({ ...prev, [question.id]: true }));
                }}
                onMatchingChange={(left, value) => {
                  setMatchingSelections((prev) => ({
                    ...prev,
                    [question.id]: {
                      ...(prev[question.id] || {}),
                      [left]: value,
                    },
                  }));
                }}
                onCheckMatching={() => {
                  setMatchingChecked((prev) => ({ ...prev, [question.id]: true }));
                  setRevealedAnswers((prev) => ({ ...prev, [question.id]: true }));
                }}
              />
            ))}

          {session && mode !== "dictation" && (
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
          <RecentSessions
            mode={mode}
            isLoadingRecent={isLoadingRecent}
            recentError={recentError}
            sessions={recentSessions}
            onSelectSession={(sessionId, sessionMode) => {
              loadSession(sessionId);
              const params = new URLSearchParams();
              params.set("mode", sessionMode);
              params.set("session", sessionId);
              router.replace(`/dashboard/practice?${params.toString()}`);
            }}
          />
        </div>
      </div>
    </div>
  );
}
