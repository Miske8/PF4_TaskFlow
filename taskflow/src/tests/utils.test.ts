import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("filters falsy values and joins classes", () => {
    expect(cn("a", false, "b", undefined, "c")).toBe("a b c");
  });
});
