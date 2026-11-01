"use client";
import { useState, type FormEvent } from "react";
import { validateWord, type VocabList, type WordInput } from "@/lib/vocabulary";
import Modal from "./Modal";
export default function WordForm({
  initial,
  lists,
  initialListId,
  onSave,
  onClose,
}: {
  initial?: WordInput;
  lists: VocabList[];
  initialListId: string | null;
  onSave: (word: WordInput, listId: string | null) => Promise<void>;
  onClose: () => void;
}) {
  const [word, setWord] = useState(
    initial ?? { term: "", definition: "", example: "", notes: "" },
  );
  const [listId, setListId] = useState(initialListId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onSave(validateWord(word), listId || null);
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to save. Please retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={initial ? "Edit word" : "Add a new word"}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form onSubmit={submit} className="grid gap-4">
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        <label className="field">
          Term
          <input
            autoFocus
            required
            maxLength={200}
            value={word.term}
            onChange={(e) => setWord({ ...word, term: e.target.value })}
            placeholder="e.g. serendipity"
          />
        </label>
        <label className="field">
          Definition
          <textarea
            required
            maxLength={4000}
            value={word.definition}
            onChange={(e) => setWord({ ...word, definition: e.target.value })}
            placeholder="What does it mean?"
          />
        </label>
        <label className="field">
          Example sentence
          <textarea
            maxLength={4000}
            value={word.example}
            onChange={(e) => setWord({ ...word, example: e.target.value })}
            placeholder="Use the word in context"
          />
        </label>
        <label className="field">
          List
          <select value={listId} onChange={(e) => setListId(e.target.value)}>
            <option value="">Unfiled</option>
            {lists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Notes
          <input
            maxLength={2000}
            value={word.notes}
            onChange={(e) => setWord({ ...word, notes: e.target.value })}
            placeholder="Part of speech, a memory cue…"
          />
        </label>
        <div className="flex justify-end gap-3 mt-2">
          <button
            type="button"
            disabled={busy}
            className="button secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? "Saving…" : "Save word"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
