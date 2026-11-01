"use client";
import {
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
} from "react";
import {
  Plus,
  Search,
  Sparkles,
  Download,
  Upload,
  BookOpen,
  Pencil,
  Trash2,
  Folder,
  ArrowUpDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  exportVocabularyCSV,
  parseVocabularyCSV,
  type Vocab,
  type VocabList,
  type WordInput,
} from "@/lib/vocabulary";
import WordForm from "./WordForm";
import Practice from "./Practice";
import Modal from "./Modal";

const sampleLists: VocabList[] = [
  { id: "everyday", name: "Everyday discoveries" },
  { id: "reading", name: "From my reading" },
];
const sampleWords: Vocab[] = [
  {
    id: "one",
    list_id: "everyday",
    term: "serendipity",
    definition: "The chance discovery of something pleasant or valuable.",
    example: "Finding that little bookshop was pure serendipity.",
    notes: "noun · a happy accident",
  },
  {
    id: "two",
    list_id: "everyday",
    term: "resilient",
    definition: "Able to recover after difficulty or change.",
    example: "The resilient garden grew back after the storm.",
    notes: "adjective",
  },
  {
    id: "three",
    list_id: "reading",
    term: "eloquent",
    definition: "Expressing ideas clearly and effectively.",
    example: "She gave an eloquent account of her journey.",
    notes: "adjective",
  },
  {
    id: "four",
    list_id: "reading",
    term: "nuance",
    definition: "A subtle difference in meaning, expression, or feeling.",
    example: "Reading the original helped me understand every nuance.",
    notes: "noun",
  },
  {
    id: "five",
    list_id: null,
    term: "wander",
    definition: "To walk or move without a fixed destination.",
    example: "We wandered through the quiet streets.",
    notes: "verb",
  },
];
const storageKey = "vocab-master-demo-v1";
const subscribe = (notify: () => void) => {
  window.addEventListener("storage", notify);
  window.addEventListener("vocab-demo-change", notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener("vocab-demo-change", notify);
  };
};
const snapshot = () => {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
};
const serverSnapshot = () => null;

export default function VocabDashboard({
  serverWords,
  serverLists,
  userId,
  demo = false,
}: {
  serverWords: Vocab[];
  serverLists: VocabList[];
  userId: string;
  demo?: boolean;
}) {
  const [cloudWords, setCloudWords] = useState(serverWords);
  const [cloudLists, setCloudLists] = useState(serverLists);
  const stored = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const demoData = useMemo(() => {
    try {
      const value = stored ? JSON.parse(stored) : null;
      if (value && Array.isArray(value.words) && Array.isArray(value.lists))
        return value as { words: Vocab[]; lists: VocabList[] };
    } catch {
      /* fall back to the demo collection */
    }
    return { words: sampleWords, lists: sampleLists };
  }, [stored]);
  const words = demo ? demoData.words : cloudWords;
  const lists = demo ? demoData.lists : cloudLists;
  const [activeList, setActiveList] = useState("all");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  const [editing, setEditing] = useState<Vocab | "new" | null>(null);
  const [practice, setPractice] = useState(false);
  const [newList, setNewList] = useState(false);
  const [listName, setListName] = useState("");
  const [deleteWord, setDeleteWord] = useState<Vocab | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const visible = useMemo(
    () =>
      words
        .filter(
          (w) =>
            (activeList === "all" ||
              (activeList === "unfiled"
                ? !w.list_id
                : w.list_id === activeList)) &&
            [w.term, w.definition, w.notes, w.example].some((value) =>
              (value ?? "").toLowerCase().includes(query.toLowerCase().trim()),
            ),
        )
        .sort((a, b) =>
          sort === "az"
            ? a.term.localeCompare(b.term)
            : sort === "za"
              ? b.term.localeCompare(a.term)
              : 0,
        ),
    [words, activeList, query, sort],
  );
  const totalPages = Math.max(1, Math.ceil(visible.length / 50));
  const currentPage = Math.min(page, totalPages);
  const pageWords = visible.slice((currentPage - 1) * 50, currentPage * 50);
  const title =
    activeList === "all"
      ? "Your collection"
      : activeList === "unfiled"
        ? "Unfiled words"
        : (lists.find((l) => l.id === activeList)?.name ?? "Your collection");
  function update(nextWords: Vocab[], nextLists = lists) {
    if (demo) {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ words: nextWords, lists: nextLists }),
        );
        window.dispatchEvent(new Event("vocab-demo-change"));
      } catch {
        throw new Error(
          "Browser storage is unavailable or full. Export your words before continuing.",
        );
      }
    } else {
      setCloudWords(nextWords);
      setCloudLists(nextLists);
    }
  }
  async function act(task: () => Promise<void>) {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await task();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function saveWord(input: WordInput, listId: string | null) {
    setNotice("");
    setError("");
    if (demo) {
      if (editing && editing !== "new")
        update(
          words.map((w) =>
            w.id === editing.id ? { ...w, ...input, list_id: listId } : w,
          ),
        );
      else
        update([
          { ...input, id: crypto.randomUUID(), list_id: listId },
          ...words,
        ]);
    } else {
      const supabase = createClient();
      const result =
        editing && editing !== "new"
          ? await supabase
              .from("words")
              .update({ ...input, list_id: listId })
              .eq("id", editing.id)
              .eq("user_id", userId)
              .select()
              .single()
          : await supabase
              .from("words")
              .insert({ ...input, user_id: userId, list_id: listId })
              .select()
              .single();
      if (result.error)
        throw new Error(
          "Unable to save your word. Check your connection and try again.",
        );
      update(
        editing && editing !== "new"
          ? words.map((w) => (w.id === editing.id ? result.data : w))
          : [result.data, ...words],
      );
    }
    setNotice("Word saved.");
  }
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await act(async () => {
      if (file.size > 2 * 1024 * 1024)
        throw new Error("Choose a CSV file smaller than 2 MB.");
      const input = parseVocabularyCSV(await file.text());
      const listId = ["all", "unfiled"].includes(activeList)
        ? null
        : activeList;
      const known = new Set(
        words
          .filter((w) => w.list_id === listId)
          .map((w) => w.term.toLowerCase()),
      );
      const fresh = input.filter((w) => {
        const key = w.term.toLowerCase();
        if (known.has(key)) return false;
        known.add(key);
        return true;
      });
      if (!fresh.length) {
        setNotice(
          "These words are already in this list. No duplicates were added.",
        );
        return;
      }
      let added: Vocab[];
      if (demo)
        added = fresh.map((w) => ({
          ...w,
          id: crypto.randomUUID(),
          list_id: listId,
        }));
      else {
        const result = await createClient()
          .from("words")
          .insert(
            fresh.map((w) => ({ ...w, user_id: userId, list_id: listId })),
          )
          .select();
        if (result.error)
          throw new Error(
            "Import failed. No words were added. Check your connection and try again.",
          );
        added = result.data;
      }
      update([...added, ...words]);
      setNotice(
        `Imported ${added.length} words.${input.length > fresh.length ? ` Skipped ${input.length - fresh.length} duplicates.` : ""}`,
      );
    });
  }
  function exportCSV() {
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + exportVocabularyCSV(visible)], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "vocab-master.csv";
    link.click();
    URL.revokeObjectURL(url);
    setNotice(`Exported ${visible.length} words.`);
  }
  async function createList() {
    await act(async () => {
      const name = listName.trim();
      if (!name || name.length > 80)
        throw new Error("Use a list name between 1 and 80 characters.");
      if (lists.some((l) => l.name.toLowerCase() === name.toLowerCase()))
        throw new Error("You already have a list with this name.");
      let list: VocabList;
      if (demo) list = { id: crypto.randomUUID(), name };
      else {
        const result = await createClient()
          .from("lists")
          .insert({ name, user_id: userId })
          .select("id,name")
          .single();
        if (result.error)
          throw new Error("Unable to create the list. Please try again.");
        list = result.data;
      }
      update(words, [...lists, list]);
      setActiveList(list.id);
      setNewList(false);
      setListName("");
      setNotice("List created. New words will be added here.");
    });
  }
  async function enhance() {
    await act(async () => {
      if (demo)
        throw new Error(
          "AI enhancement is available in your cloud account. The demo does not send words to AI.",
        );
      const response = await fetch("/api/ai-enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordIds: visible.slice(0, 10).map((w) => w.id),
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "AI enhancement failed. Please retry.");
      const updated = new Map<string, Vocab>(
        data.updatedWords.map((w: Vocab) => [w.id, w]),
      );
      update(words.map((w) => updated.get(w.id) ?? w));
      setNotice(
        `Enhanced ${data.updatedWords.length} words with definitions and examples.${visible.length > 10 ? " Up to 10 words are processed per request; filter your collection to choose another group." : ""}`,
      );
    });
  }
  function listButton(id: string, name: string, count: number) {
    return (
      <button
        key={id}
        className={`list-button ${activeList === id ? "active" : ""}`}
        aria-pressed={activeList === id}
        onClick={() => {
          setActiveList(id);
          setQuery("");
          setPage(1);
        }}
      >
        <span className="flex items-center gap-2">
          <Folder size={15} />
          {name}
        </span>
        <span className="text-xs text-muted">{count}</span>
      </button>
    );
  }
  return (
    <div className="workspace">
      <aside className="sidebar">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm">My lists</h2>
          <button
            className="icon-button"
            aria-label="Create list"
            onClick={() => {
              setError("");
              setNewList(true);
            }}
          >
            <Plus size={16} />
          </button>
        </div>
        <nav aria-label="Vocabulary lists">
          {listButton("all", "All words", words.length)}
          {lists.map((list) =>
            listButton(
              list.id,
              list.name,
              words.filter((w) => w.list_id === list.id).length,
            ),
          )}
          {listButton(
            "unfiled",
            "Unfiled",
            words.filter((w) => !w.list_id).length,
          )}
        </nav>
        <p className="hidden sm:block text-xs text-muted leading-6 mt-8">
          {demo
            ? "Demo words stay in this browser. Export a CSV to keep a copy."
            : "Your collection syncs with your account."}
        </p>
      </aside>
      <section className="workspace-content">
        <div className="flex items-start justify-between gap-4 mb-7">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight break-words">
              {title}
            </h1>
            <p className="text-muted text-sm mt-2">
              {visible.length} {visible.length === 1 ? "word" : "words"}
              {query ? " matching your search" : " to make your own"}
            </p>
          </div>
          <button
            className="button primary shrink-0"
            disabled={busy}
            onClick={() => setEditing("new")}
          >
            <Plus size={17} />
            <span>Add word</span>
          </button>
        </div>
        <div className="flex flex-wrap justify-between gap-3 mb-5">
          <div className="relative flex-1 min-w-40 max-w-sm">
            <Search className="absolute left-3 top-3.5 text-muted" size={17} />
            <input
              aria-label="Search words"
              type="search"
              className="pl-10! text-sm"
              placeholder="Search your collection"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="button secondary compact"
              disabled={!visible.length || busy}
              onClick={() => setPractice(true)}
            >
              <BookOpen size={16} />
              Practice
            </button>
            <button
              title="CSV headers: Term, Definition, Example, Notes"
              className="button secondary compact"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
            >
              <Upload size={16} />
              Import
            </button>
            <input
              ref={fileInput}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={importFile}
            />
            <button
              className="button secondary compact"
              disabled={!visible.length || busy}
              onClick={exportCSV}
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <label className="inline-flex items-center gap-2 text-xs text-muted">
            <ArrowUpDown size={14} />
            <select
              aria-label="Sort words"
              className="py-2! text-xs! w-auto!"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
            >
              <option value="recent">Recently added</option>
              <option value="az">Term A–Z</option>
              <option value="za">Term Z–A</option>
            </select>
          </label>
          <button
            className="inline-flex items-center gap-2 text-xs font-semibold text-accent p-2"
            disabled={busy || !visible.length}
            onClick={enhance}
          >
            <Sparkles size={15} />
            {busy ? "Working…" : "Refine with AI"}
            <span className="text-muted font-normal">· up to 10 words</span>
          </button>
        </div>
        {(error || notice) && (
          <div
            className={`notice mb-5 ${error ? "error" : ""}`}
            role={error ? "alert" : "status"}
          >
            {error || notice}
          </div>
        )}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {visible.length ? (
            <table className="word-table">
              <thead>
                <tr>
                  <th scope="col">Term</th>
                  <th scope="col">Definition</th>
                  <th scope="col">In context</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageWords.map((word) => (
                  <tr key={word.id}>
                    <td>
                      <button
                        className="font-semibold text-base text-accent text-left hover:underline"
                        onClick={() => setEditing(word)}
                      >
                        {word.term}
                      </button>
                      {word.notes && (
                        <p className="text-xs text-muted mt-1">{word.notes}</p>
                      )}
                    </td>
                    <td>{word.definition}</td>
                    <td className="text-muted italic">
                      {word.example ||
                        "Add an example to give this word context."}
                    </td>
                    <td>
                      <div className="flex justify-end">
                        <button
                          className="icon-button text-muted"
                          disabled={busy}
                          aria-label={`Edit ${word.term}`}
                          onClick={() => setEditing(word)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="icon-button text-muted hover:text-red-700"
                          disabled={busy}
                          aria-label={`Delete ${word.term}`}
                          onClick={() => setDeleteWord(word)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center px-6 py-20">
              <BookOpen size={34} className="mx-auto mb-5 text-muted" />
              <h2 className="font-semibold text-xl mb-3">
                {query ? "No words found." : "Your next discovery starts here."}
              </h2>
              <p className="text-sm text-muted mb-6">
                {query
                  ? "Try another term, definition, or note."
                  : "Add a word or import a CSV with Term and Definition columns."}
              </p>
              <button
                className="button secondary"
                onClick={() => (query ? setQuery("") : setEditing("new"))}
              >
                {query ? "Clear search" : "Add your first word"}
              </button>
            </div>
          )}
        </div>
        <nav
          aria-label="Collection pages"
          className="flex justify-between items-center mt-5 text-xs text-muted"
        >
          <span>
            {visible.length
              ? `${(currentPage - 1) * 50 + 1}–${Math.min(currentPage * 50, visible.length)} of ${visible.length} words`
              : "0 words"}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-3">
              <button
                className="button secondary compact"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous
              </button>
              <span>
                {currentPage} / {totalPages}
              </span>
              <button
                className="button secondary compact"
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </nav>
      </section>
      {editing && (
        <WordForm
          lists={lists}
          initialListId={
            editing === "new"
              ? ["all", "unfiled"].includes(activeList)
                ? null
                : activeList
              : editing.list_id
          }
          initial={editing === "new" ? undefined : editing}
          onSave={saveWord}
          onClose={() => setEditing(null)}
        />
      )}
      {practice && (
        <Practice words={visible} onClose={() => setPractice(false)} />
      )}
      {newList && (
        <Modal
          title="Create a list"
          onClose={() => {
            if (!busy) setNewList(false);
          }}
        >
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              void createList();
            }}
          >
            <label className="field">
              List name
              <input
                autoFocus
                required
                maxLength={80}
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="e.g. Words from my reading"
              />
            </label>
            {error && (
              <p className="notice error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary justify-center" disabled={busy}>
              {busy ? "Creating…" : "Create list"}
            </button>
          </form>
        </Modal>
      )}
      {deleteWord && (
        <Modal
          title={`Delete “${deleteWord.term}”?`}
          onClose={() => {
            if (!busy) setDeleteWord(null);
          }}
        >
          <p className="text-muted text-sm mb-6">
            This removes the word from your collection. Export a copy first if
            you want to keep it.
          </p>
          {error && (
            <p className="notice error mb-4" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setDeleteWord(null)}
            >
              Cancel
            </button>
            <button
              className="button primary"
              disabled={busy}
              onClick={() =>
                void act(async () => {
                  if (!demo) {
                    const result = await createClient()
                      .from("words")
                      .delete()
                      .eq("id", deleteWord.id)
                      .eq("user_id", userId)
                      .select("id")
                      .single();
                    if (result.error)
                      throw new Error(
                        "Unable to delete the word. Please try again.",
                      );
                  }
                  update(words.filter((w) => w.id !== deleteWord.id));
                  setDeleteWord(null);
                  setNotice("Word deleted.");
                })
              }
            >
              {busy ? "Deleting…" : "Delete word"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
