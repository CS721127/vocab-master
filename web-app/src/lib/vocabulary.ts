import Papa from "papaparse";

export type WordInput = {
  term: string;
  definition: string;
  example: string;
  notes: string;
};
export type Vocab = WordInput & { id: string; list_id: string | null };
export type VocabList = { id: string; name: string };

export function validateWord(input: Record<string, unknown>): WordInput {
  const read = (key: string, max: number, required = false) => {
    const value = typeof input[key] === "string" ? input[key].trim() : "";
    if ((required && !value) || value.length > max)
      throw new Error(
        `${key} ${required && !value ? "is required" : `must be at most ${max} characters`}.`,
      );
    return value;
  };
  return {
    term: read("term", 200, true),
    definition: read("definition", 4000, true),
    example: read("example", 4000),
    notes: read("notes", 2000),
  };
}

export function parseVocabularyCSV(text: string): WordInput[] {
  const result = Papa.parse<Record<string, string>>(
    text.replace(/^\uFEFF/, ""),
    {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim().toLowerCase(),
    },
  );
  if (result.errors.length)
    throw new Error(`Invalid CSV: ${result.errors[0].message}`);
  if (
    !result.meta.fields?.includes("term") ||
    !result.meta.fields.includes("definition")
  )
    throw new Error(
      "CSV headers must include Term and Definition; Example and Notes are optional.",
    );
  if (!result.data.length) throw new Error("The CSV contains no words.");
  if (result.data.length > 1000)
    throw new Error("Import at most 1,000 words at a time.");
  return result.data.map((row, i) => {
    try {
      return validateWord(row);
    } catch (e) {
      throw new Error(`Row ${i + 2}: ${(e as Error).message}`);
    }
  });
}

export function exportVocabularyCSV(words: WordInput[]) {
  return Papa.unparse(
    words.map((w) => ({
      Term: w.term,
      Definition: w.definition,
      Example: w.example,
      Notes: w.notes,
    })),
    { escapeFormulae: true },
  );
}

export function safeNextPath(value: string | null | undefined): string {
  if (!value || /[\\\r\n]/.test(value)) return "/dashboard";
  try {
    const url = new URL(value, "https://vocab.invalid");
    if (
      url.origin === "https://vocab.invalid" &&
      (url.pathname === "/dashboard" || url.pathname.startsWith("/dashboard/"))
    )
      return url.pathname + url.search;
  } catch {
    /* use the default destination */
  }
  return "/dashboard";
}

export function parseEnhancements(text: string, allowedIds: string[]) {
  const json = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const data: unknown = JSON.parse(json);
  if (!Array.isArray(data))
    throw new Error("AI returned an invalid response. Please retry.");
  const seen = new Set<string>();
  const entries: { id: string; definition: string; example: string }[] = [];
  for (const item of data) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof item.id !== "string" ||
      !allowedIds.includes(item.id) ||
      seen.has(item.id)
    )
      continue;
    const definition =
      typeof item.definition === "string" ? item.definition.trim() : "";
    const example = typeof item.example === "string" ? item.example.trim() : "";
    if (
      !definition ||
      !example ||
      definition.length > 4000 ||
      example.length > 4000
    )
      continue;
    entries.push({ id: item.id, definition, example });
    seen.add(item.id);
  }
  if (entries.length !== allowedIds.length)
    throw new Error(
      "AI did not return all requested words. No changes were saved.",
    );
  return entries;
}
