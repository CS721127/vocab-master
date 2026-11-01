type ReadinessFetch = (input: URL, init?: RequestInit) => Promise<Response>;

export async function checkSupabaseReadiness({
  baseUrl,
  key,
  fetchImpl = fetch,
}: {
  baseUrl: string;
  key: string;
  fetchImpl?: ReadinessFetch;
}) {
  try {
    const responses = await Promise.all(
      [
        "/auth/v1/settings",
        "/rest/v1/lists?select=id&limit=0",
        "/rest/v1/words?select=id&limit=0",
      ].map(path =>
        fetchImpl(new URL(path, baseUrl), {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
          cache: "no-store",
          signal: AbortSignal.timeout(3000),
        }),
      ),
    );

    const [auth, ...tables] = responses;
    return auth.ok && tables.every(response => response.ok || [401, 403].includes(response.status));
  } catch {
    return false;
  }
}
