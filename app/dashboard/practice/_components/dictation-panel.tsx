"use client";

import { Volume2 } from "lucide-react";

interface DictationComparisonItem {
  index: number;
  expected: string;
  actual: string;
  isCorrect: boolean;
}

interface DictationStats {
  expectedCount: number;
  correctCount: number;
  accuracy: number;
}

interface DictationPanelProps {
  sentence: string;
  hint: string;
  translation: string;
  inputValue: string;
  checked: boolean;
  comparison: DictationComparisonItem[];
  stats: DictationStats;
  onPlay: () => void;
  onInputChange: (value: string) => void;
  onCheck: () => void;
  onReset: () => void;
}

export function DictationPanel({
  sentence,
  hint,
  translation,
  inputValue,
  checked,
  comparison,
  stats,
  onPlay,
  onInputChange,
  onCheck,
  onReset,
}: DictationPanelProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Dictation sentence</p>
          <p className="font-semibold">Listen and type exactly what you hear</p>
        </div>
        <button
          onClick={onPlay}
          disabled={!sentence}
          className="rounded-lg border border-border px-3 py-2 text-sm inline-flex items-center gap-2 hover:border-primary disabled:opacity-60"
        >
          <Volume2 className="h-4 w-4" />
          Play
        </button>
      </div>

      {hint && (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">Hint:</span> {hint}
        </p>
      )}

      {!sentence && (
        <p className="text-sm text-muted-foreground">
          Click Generate Dictation to get one sentence for listening.
        </p>
      )}

      <div className="space-y-2">
        <textarea
          value={inputValue}
          onChange={(event) => onInputChange(event.target.value)}
          rows={4}
          disabled={!sentence}
          className="w-full rounded-lg border border-input bg-background px-3 py-2"
          placeholder="Type what you hear..."
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onCheck}
            disabled={!sentence || !inputValue.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60"
          >
            Check Dictation
          </button>
          <button
            onClick={onReset}
            disabled={!inputValue && !checked}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:border-primary disabled:opacity-60"
          >
            Reset Input
          </button>
        </div>
      </div>

      {checked && (
        <div className="space-y-3">
          <div className="rounded-lg bg-blue-50/60 dark:bg-blue-950/40 px-3 py-2 text-sm">
            <p>
              Accuracy:{" "}
              <span className="font-semibold">
                {stats.correctCount}/{stats.expectedCount} ({stats.accuracy}%)
              </span>
            </p>
            {!!translation && (
              <p className="text-muted-foreground">
                <span className="font-medium">Translation:</span> {translation}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {comparison.map((item) => (
              <div
                key={`dictation-${item.index}`}
                className={`min-w-[70px] rounded-lg border px-2 py-1 text-center text-sm ${
                  item.isCorrect
                    ? "border-green-500/60 bg-green-50/70 dark:bg-green-950/40"
                    : "border-red-500/60 bg-red-50/70 dark:bg-red-950/40"
                }`}
              >
                <p className="font-medium">{item.actual || "(missing)"}</p>
                {!item.isCorrect && (
                  <p className="text-xs text-red-700 dark:text-red-400">
                    {item.expected || "(extra)"}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
