import { UndoEntry } from "./types";

/** Tiny 1-step undo stack. Push overwrites any previous entry. */
export class UndoStack {
  private entry: UndoEntry | null = null;

  push(e: UndoEntry): void {
    this.entry = e;
  }

  pop(): UndoEntry | null {
    const e = this.entry;
    this.entry = null;
    return e;
  }

  peek(): UndoEntry | null {
    return this.entry;
  }

  size(): number {
    return this.entry ? 1 : 0;
  }
}
