"use client";

import { VocabularyItem } from "@/lib/learning-types";
import { Volume2 } from "lucide-react";

interface VocabularyCardProps {
  item: VocabularyItem;
  index: number;
  onPlayExample: (sentence: string) => void;
}

export function VocabularyCard({ item, index, onPlayExample }: VocabularyCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Word #{index + 1}</p>
          <h3 className="text-2xl font-bold">{item.word}</h3>
          <p className="text-sm text-muted-foreground">
            {item.phonetic || "No phonetic"}{" "}
            {item.partOfSpeech ? `- ${item.partOfSpeech}` : ""}
          </p>
        </div>
        <button
          onClick={() => onPlayExample(item.exampleSentence)}
          className="rounded-lg border border-border px-3 py-2 text-sm inline-flex items-center gap-2 hover:border-primary"
        >
          <Volume2 className="h-4 w-4" />
          Play
        </button>
      </div>
      <p>
        <span className="font-medium">Meaning:</span> {item.meaningVi}
      </p>
      <p className="text-sm">
        <span className="font-medium">Example:</span> {item.exampleSentence}
      </p>
      <p className="text-sm text-muted-foreground">{item.exampleTranslation}</p>
    </div>
  );
}
