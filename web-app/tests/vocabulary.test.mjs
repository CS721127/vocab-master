import test from "node:test";
import assert from "node:assert/strict";
import {
  parseVocabularyCSV,
  exportVocabularyCSV,
  safeNextPath,
  parseEnhancements,
  validateWord,
} from "../src/lib/vocabulary.ts";
import { checkSupabaseReadiness } from "../src/lib/readiness.ts";

test("imports desktop CSV headers, multiline definitions and BOM", () => {
  const words = parseVocabularyCSV(
    '\uFEFFTerm,Definition,Example,Notes\r\nserendipity,"a happy, unexpected discovery",A lucky find.,noun\r\nresilient,"able to recover\nfrom difficulty",,adjective',
  );
  assert.equal(words.length, 2);
  assert.equal(words[0].definition, "a happy, unexpected discovery");
  assert.equal(words[1].definition, "able to recover\nfrom difficulty");
});
test("rejects invalid CSV instead of silently losing rows", () => {
  assert.throws(
    () => parseVocabularyCSV("Term,Definition\nhello,"),
    /definition/i,
  );
  assert.throws(() => parseVocabularyCSV("something,else\na,b"), /header/i);
});
test("CSV export neutralizes spreadsheet formulas and round trips Chinese", () => {
  const csv = exportVocabularyCSV([
    { term: "=CMD()", definition: "中文释义", example: "", notes: "" },
  ]);
  assert.match(csv, /'=CMD/);
  assert.match(csv, /中文释义/);
});
test("auth destinations cannot escape the dashboard", () => {
  for (const path of [
    "//evil.com",
    "/\\evil.com",
    "https://evil.com",
    "/login",
    "/dashboard/../login",
  ]) {
    assert.equal(safeNextPath(path), "/dashboard");
  }
  assert.equal(safeNextPath("/dashboard?list=abc"), "/dashboard?list=abc");
});
test("AI output must match requested IDs and include both fields", () => {
  const result = parseEnhancements(
    '```json\n[{"id":"a","definition":"A new definition","example":"A natural sentence."},{"id":"foreign","definition":"x","example":"y"}]\n```',
    ["a"],
  );
  assert.deepEqual(result, [
    { id: "a", definition: "A new definition", example: "A natural sentence." },
  ]);
  assert.throws(() => parseEnhancements('[{"id":"a","definition":""}]', ["a"]));
});
test("word validation trims input and rejects blank or oversized values", () => {
  assert.equal(
    validateWord({ term: " hello ", definition: " 你好 ", notes: null }).term,
    "hello",
  );
  assert.throws(() => validateWord({ term: "  ", definition: "test" }));
  assert.throws(() =>
    validateWord({ term: "a".repeat(201), definition: "test" }),
  );
});
test("readiness accepts authenticated-only table endpoints", async () => {
  const ready = await checkSupabaseReadiness({
    baseUrl: "https://example.supabase.co",
    key: "public-key",
    fetchImpl: async (input) => {
      const path = new URL(input).pathname;
      if (path === "/auth/v1/settings") return new Response("{}", { status: 200 });
      return new Response("", { status: path.endsWith("lists") ? 401 : 403 });
    },
  });
  assert.equal(ready, true);
});
test("readiness fails when Auth is unavailable", async () => {
  const ready = await checkSupabaseReadiness({
    baseUrl: "https://example.supabase.co",
    key: "public-key",
    fetchImpl: async () => new Response("", { status: 503 }),
  });
  assert.equal(ready, false);
});
