"use client";

import { LearningLevel } from "@/lib/learning-types";
import { Loader2, Sparkles, Volume2 } from "lucide-react";

interface ModeOption {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface PracticeToolbarProps {
  modeOptions: ModeOption[];
  mode: string;
  levelOptions: LearningLevel[];
  level: LearningLevel;
  topic: string;
  error: string | null;
  hasSession: boolean;
  dictationSentence: string;
  isGenerating: boolean;
  isGeneratingDictation: boolean;
  onModeChange: (nextMode: string) => void;
  onLevelChange: (nextLevel: LearningLevel) => void;
  onTopicChange: (nextTopic: string) => void;
  onGenerate: () => void;
  onContinue: () => void;
  onGenerateDictation: () => void;
  onPlayDictation: () => void;
}

export function PracticeToolbar({
  modeOptions,
  mode,
  levelOptions,
  level,
  topic,
  error,
  hasSession,
  dictationSentence,
  isGenerating,
  isGeneratingDictation,
  onModeChange,
  onLevelChange,
  onTopicChange,
  onGenerate,
  onContinue,
  onGenerateDictation,
  onPlayDictation,
}: PracticeToolbarProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        {modeOptions.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onModeChange(item.id)}
              className={`rounded-lg border p-3 text-left transition-colors transform-none active:scale-100 ${
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
          onChange={(event) => onLevelChange(event.target.value as LearningLevel)}
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
          onChange={(event) => onTopicChange(event.target.value)}
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
        {mode === "dictation" ? (
          <>
            <button
              onClick={onGenerateDictation}
              disabled={isGeneratingDictation || !topic.trim()}
              className="rounded-lg bg-primary px-5 py-2.5 text-primary-foreground font-medium inline-flex items-center gap-2 disabled:opacity-60"
            >
              {isGeneratingDictation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Generate
            </button>
            <button
              onClick={onPlayDictation}
              disabled={!dictationSentence}
              className="rounded-lg border border-border px-5 py-2.5 font-medium hover:border-primary disabled:opacity-60 inline-flex items-center gap-2"
            >
              <Volume2 className="h-4 w-4" />
              Play Sentence
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onGenerate}
              disabled={isGenerating || !topic.trim()}
              className="rounded-lg bg-primary px-5 py-2.5 text-primary-foreground font-medium inline-flex items-center gap-2 disabled:opacity-60"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {hasSession ? "Start New Session" : "Generate"}
            </button>
            <button
              onClick={onContinue}
              disabled={isGenerating || !hasSession}
              className="rounded-lg border border-border px-5 py-2.5 font-medium hover:border-primary disabled:opacity-60"
            >
              Continue Generating
            </button>
          </>
        )}
      </div>
    </div>
  );
}
