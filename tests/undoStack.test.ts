import { describe, it, expect } from "vitest";
import { UndoStack } from "../src/undoStack";
import { UndoEntry } from "../src/types";

const makeEntry = (description: string): UndoEntry => ({
  filePath: "x.md",
  beforeLines: ["line1"],
  description,
  timestamp: Date.now(),
});

describe("UndoStack", () => {
  it("starts empty", () => {
    const stack = new UndoStack();
    expect(stack.size()).toBe(0);
    expect(stack.peek()).toBeNull();
  });

  it("push retains only the most recent entry (size=1)", () => {
    const stack = new UndoStack();
    stack.push(makeEntry("a"));
    stack.push(makeEntry("b"));
    expect(stack.size()).toBe(1);
    expect(stack.peek()?.description).toBe("b");
  });

  it("pop returns and clears the entry", () => {
    const stack = new UndoStack();
    stack.push(makeEntry("a"));
    const popped = stack.pop();
    expect(popped?.description).toBe("a");
    expect(stack.size()).toBe(0);
    expect(stack.pop()).toBeNull();
  });

  it("peek does not clear the entry", () => {
    const stack = new UndoStack();
    stack.push(makeEntry("a"));
    expect(stack.peek()?.description).toBe("a");
    expect(stack.size()).toBe(1);
    expect(stack.peek()?.description).toBe("a");
    expect(stack.size()).toBe(1);
  });
});
