import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { SavedProfile } from "./SavedProfile";
import { __resetProfileStoreForTests, useProfileStore } from "@/lib/store";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

beforeEach(() => {
  window.localStorage.clear();
  __resetProfileStoreForTests();
  replace.mockClear();
});

function CurrentProfileId({ onId }: { onId: (id: string) => void }) {
  const { profileId, hydrated } = useProfileStore();
  if (hydrated) onId(profileId);
  return null;
}

describe("SavedProfile", () => {
  it("shows a not-found state for an id that doesn't match this device's profile", () => {
    render(<SavedProfile id="some-other-device-id" />);
    expect(screen.getByText("Профиль не найден")).toBeInTheDocument();
  });

  it("redirects to /roadmap once the id matches this device's saved profile", () => {
    let id = "";
    render(<CurrentProfileId onId={(v) => (id = v)} />);
    expect(id).not.toBe("");

    render(<SavedProfile id={id} />);
    expect(replace).toHaveBeenCalledWith("/roadmap");
  });
});
