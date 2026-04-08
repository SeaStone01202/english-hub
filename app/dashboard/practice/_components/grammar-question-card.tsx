"use client";

import { SessionQuestion } from "@/lib/learning-types";

interface GrammarQuestionCardProps {
  question: SessionQuestion;
  index: number;
  revealed: boolean;
  selectedOption: string;
  blankInput: string;
  selectedMap: Record<string, string>;
  isMatchingChecked: boolean;
  onSelectOption: (value: string) => void;
  onBlankInputChange: (value: string) => void;
  onCheckBlank: () => void;
  onMatchingChange: (left: string, value: string) => void;
  onCheckMatching: () => void;
}

export function GrammarQuestionCard({
  question,
  index,
  revealed,
  selectedOption,
  blankInput,
  selectedMap,
  isMatchingChecked,
  onSelectOption,
  onBlankInputChange,
  onCheckBlank,
  onMatchingChange,
  onCheckMatching,
}: GrammarQuestionCardProps) {
  const fillInput = (blankInput || "").trim();
  const acceptableAnswers =
    question.metadata.acceptableAnswers && question.metadata.acceptableAnswers.length > 0
      ? question.metadata.acceptableAnswers
      : [question.correctAnswer];
  const isBlankCorrect = acceptableAnswers.some(
    (answer) => answer.toLowerCase().trim() === fillInput.toLowerCase(),
  );

  const pairs = question.metadata.pairs || [];
  const allPairsSelected =
    pairs.length > 0 && pairs.every((pair) => !!selectedMap[pair.left]);
  const isMatchingAllCorrect =
    pairs.length > 0 && pairs.every((pair) => selectedMap[pair.left] === pair.right);

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold">
          Q{index + 1}. {question.questionText}
        </h3>
        <span className="rounded-full bg-muted px-2 py-1 text-xs">
          {question.questionType.replace("_", " ")}
        </span>
      </div>

      {question.metadata.instruction && (
        <p className="text-sm text-muted-foreground">{question.metadata.instruction}</p>
      )}

      {question.questionType === "multiple_choice" && question.options.length > 0 && (
        <div className="grid gap-2">
          {question.options.map((option) => (
            <button
              key={`${question.id}-${option.optionOrder}`}
              onClick={() => {
                if (revealed) return;
                onSelectOption(option.optionText);
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
              value={blankInput || ""}
              onChange={(event) => onBlankInputChange(event.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2"
              placeholder="Type your answer..."
            />
            <button
              onClick={onCheckBlank}
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

      {question.questionType === "matching" && pairs.length > 0 && (
        <div className="space-y-2">
          {pairs.map((pair, pairIndex) => {
            const selectedValue = selectedMap[pair.left] || "";
            const isPairCorrect = selectedValue === pair.right;

            return (
              <div key={`${question.id}-${pairIndex}`} className="grid gap-2 md:grid-cols-2">
                <div className="rounded-lg border border-border px-3 py-2 text-sm font-medium">
                  {pair.left}
                </div>
                <select
                  value={selectedValue}
                  disabled={isMatchingChecked}
                  onChange={(event) => onMatchingChange(pair.left, event.target.value)}
                  className={`rounded-lg border px-3 py-2 text-sm bg-background ${
                    isMatchingChecked
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
            if (!allPairsSelected) return;
            onCheckMatching();
          }}
          className="rounded-lg border border-border px-3 py-2 text-sm hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!allPairsSelected || isMatchingChecked}
        >
          {isMatchingChecked ? "Checked" : "Check Matching"}
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
          <p>
            <span className="font-medium">Correct:</span> {question.correctAnswer}
          </p>
          <p className="text-muted-foreground">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
