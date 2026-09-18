import { describe, it, expect, vi, afterEach } from "vitest";
import { getPlanFromApi, getProgramsFromApi } from "./api";
import { DEFAULT_ANSWERS } from "./store";

const originalBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

afterEach(() => {
  process.env.NEXT_PUBLIC_API_BASE_URL = originalBaseUrl;
  vi.unstubAllGlobals();
});

describe("getPlanFromApi / getProgramsFromApi", () => {
  it("throws a clear error instead of calling fetch when the base URL isn't configured", async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    await expect(getPlanFromApi(DEFAULT_ANSWERS)).rejects.toThrow(/NEXT_PUBLIC_API_BASE_URL/);
    await expect(getProgramsFromApi()).rejects.toThrow(/NEXT_PUBLIC_API_BASE_URL/);
  });

  it("POSTs answers and selected to /api/plan and returns the parsed Plan", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000";
    const fakePlan = { diagnosis: {}, recommendations: [], roadmap: {} };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => fakePlan });
    vi.stubGlobal("fetch", fetchMock);

    const result = await getPlanFromApi(DEFAULT_ANSWERS, ["a", "b"]);

    expect(result).toEqual(fakePlan);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/plan",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: DEFAULT_ANSWERS, selected: ["a", "b"] }),
      }),
    );
  });

  it("throws when /api/plan responds with a non-2xx status", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await expect(getPlanFromApi(DEFAULT_ANSWERS)).rejects.toThrow(/500/);
  });

  it("GETs /api/programs and returns the parsed list", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000";
    const fakePrograms = [{ id: "p1" }];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => fakePrograms }));

    const result = await getProgramsFromApi();
    expect(result).toEqual(fakePrograms);
  });
});
