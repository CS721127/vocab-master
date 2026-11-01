"use client";
import { useState, type FormEvent } from "react";
import type { Vocab } from "@/lib/vocabulary";
import Modal from "./Modal";
export default function Practice({
  words,
  onClose,
}: {
  words: Vocab[];
  onClose: () => void;
}) {
  const [queue, setQueue] = useState(words);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [wrong, setWrong] = useState<Vocab[]>([]);
  const [result, setResult] = useState<boolean | null>(null);
  const [complete, setComplete] = useState(false);
  const [started, setStarted] = useState(false);
  function start(mode: string, retry?: Vocab[]) {
    const next = [...(retry ?? words)];
    if (mode === "reverse") next.reverse();
    if (mode === "random")
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
    setQueue(next);
    setIndex(0);
    setAnswer("");
    setWrong([]);
    setResult(null);
    setComplete(false);
    setStarted(true);
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    if (result !== null) {
      if (index + 1 === queue.length) setComplete(true);
      else {
        setIndex(index + 1);
        setAnswer("");
        setResult(null);
      }
      return;
    }
    const correct =
      answer.trim().toLocaleLowerCase() ===
      queue[index].term.trim().toLocaleLowerCase();
    if (!correct) setWrong([...wrong, queue[index]]);
    setResult(correct);
  }
  return (
    <Modal title="A little practice" onClose={onClose}>
      {!started ? (
        <div className="grid gap-4">
          <p className="text-muted text-sm leading-6">
            Read each definition and recall the term. You will revisit any
            missed words at the end.
          </p>
          <p className="text-sm font-semibold">
            {words.length} {words.length === 1 ? "word" : "words"} in this
            session
          </p>
          <button
            className="button primary justify-center"
            onClick={() => start("sequential")}
          >
            Sequential order
          </button>
          <button
            className="button secondary justify-center"
            onClick={() => start("reverse")}
          >
            Reverse order
          </button>
          <button
            className="button secondary justify-center"
            onClick={() => start("random")}
          >
            Shuffle words
          </button>
        </div>
      ) : complete ? (
        <div className="text-center grid gap-5">
          <h3 className="text-4xl font-semibold">
            {queue.length - wrong.length} / {queue.length}
          </h3>
          <p className="text-muted text-sm">
            {wrong.length
              ? "Keep going. Every revisit helps it stick."
              : "Nicely done. Every word is a little more yours."}
          </p>
          {wrong.length > 0 && (
            <button
              className="button primary justify-center"
              onClick={() => start("sequential", wrong)}
            >
              Retry {wrong.length} missed{" "}
              {wrong.length === 1 ? "word" : "words"}
            </button>
          )}
          <button className="button secondary justify-center" onClick={onClose}>
            Back to collection
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-5">
          <div className="flex justify-between text-xs text-muted">
            <span>
              WORD {index + 1} OF {queue.length}
            </span>
            <span>
              {index + (result === null ? 0 : 1) - wrong.length} correct
            </span>
          </div>
          <progress
            aria-label="Session progress"
            className="w-full h-2 accent-accent"
            max={queue.length}
            value={index}
          />
          <h3 className="text-xl leading-8 font-medium">
            {queue[index].definition}
          </h3>
          <label className="field">
            Your answer
            <input
              key={index}
              autoFocus
              value={answer}
              readOnly={result !== null}
              onChange={(e) => setAnswer(e.target.value)}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Type the term"
            />
          </label>
          {result !== null && (
            <p role="status" className={`notice ${result ? "" : "error"}`}>
              {result ? (
                "Correct — well remembered!"
              ) : (
                <>
                  The answer is <strong>{queue[index].term}</strong>. You can
                  revisit this word after the session.
                </>
              )}
            </p>
          )}
          <button
            className="button primary justify-center"
            disabled={result === null && !answer.trim()}
          >
            {result === null
              ? "Check answer"
              : index + 1 === queue.length
                ? "See results"
                : "Next word →"}
          </button>
        </form>
      )}
    </Modal>
  );
}
