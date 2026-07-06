import { ItemView, WorkspaceLeaf, Platform, Notice } from "obsidian";
import { TimeRecorderSettings, Segment } from "./types";
import { RecordsFileManager } from "./recordsFile";
import { getTodayDateString, addDays } from "./date";
import { parseHHMM, formatHHMM, nowHHMM, isOpenEnd } from "./time";
import { formatSegmentLine, replaceLine } from "./parser";
import { SegmentEditorModal } from "./SegmentEditorModal";
import { segmentColor } from "./segmentColor";
import { serialize } from "./serialize";
import {
  halfHourGridTicks,
  emptySlotFill,
  isShortSegment,
  SHORT_SEGMENT_THRESHOLD_PX,
} from "./timelineGrid";

export const VIEW_TYPE_TIMELINE = "time-recorder-timeline";

const PIXELS_PER_HOUR = 60;
const TOTAL_HEIGHT_PX = PIXELS_PER_HOUR * 24;

export class TimelineView extends ItemView {
  private currentDate: string = getTodayDateString();
  private container!: HTMLElement;

  constructor(
    leaf: WorkspaceLeaf,
    private settings: TimeRecorderSettings,
    private recordsFile: RecordsFileManager,
    private onDataChanged?: () => void,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_TIMELINE;
  }

  getDisplayText(): string {
    return "Timeline Back-fill";
  }

  getIcon(): string {
    return "clock-3";
  }

  async onOpen() {
    this.container = this.containerEl.children[1] as HTMLElement;
    await this.render();
  }

  async onClose() {
    /* noop */
  }

  /** 串行化渲染：并发 render 交错会导致时间轴重复渲染（根因见 serialize.ts 注释） */
  render: () => Promise<void> = serialize(() => this.doRender());

  private async doRender() {
    this.container.empty();
    this.container.addClass("tr-timeline-container");

    // Header: date navigation（昨天 / 标题 / 明天 / 今天）
    const header = this.container.createDiv({ cls: "tr-timeline-header" });

    const prevBtn = header.createEl("button", { text: "< 昨天" });
    prevBtn.addEventListener("click", async () => {
      this.currentDate = addDays(this.currentDate, -1);
      await this.render();
    });

    header.createDiv({ cls: "tr-timeline-title", text: this.currentDate });

    const nextBtn = header.createEl("button", { text: "明天 >" });
    nextBtn.addEventListener("click", async () => {
      this.currentDate = addDays(this.currentDate, 1);
      await this.render();
    });

    const todayBtn = header.createEl("button", { text: "今天" });
    todayBtn.addEventListener("click", async () => {
      this.currentDate = getTodayDateString();
      await this.render();
    });

    // Timeline body
    const body = this.container.createDiv({ cls: "tr-timeline-body" });
    body.style.height = `${TOTAL_HEIGHT_PX}px`;

    // 49 条半小时网格线（00:00 到 24:00，含底部午夜刻度）。半点行更淡（tr-half-row）。
    const pxPerMin = PIXELS_PER_HOUR / 60;
    for (const tick of halfHourGridTicks()) {
      const row = body.createDiv({
        cls: tick.isHalf ? "tr-hour-row tr-half-row" : "tr-hour-row",
      });
      row.style.top = `${tick.minutes * pxPerMin}px`;
      row.createDiv({ cls: "tr-hour-label", text: tick.label });
    }

    // 渲染当天 segments
    let day;
    try {
      day = await this.recordsFile.readDayRecord(this.currentDate);
    } catch {
      day = {
        date: this.currentDate,
        filePath: this.recordsFile.getDayFilePath(this.currentDate),
        segments: [],
      };
    }
    for (const seg of day.segments) {
      this.renderSegmentBlock(body, seg);
    }

    // 点击空白区域 → 智能填空 → 打开编辑器（点已有色块不触发，块编辑是 Task 21）
    body.addEventListener("click", (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(".tr-segment-block")) return;
      const rect = body.getBoundingClientRect();
      const yPx = e.clientY - rect.top;
      this.handleEmptySlotClick(yPx, day);
    });
  }

  private handleEmptySlotClick(yPx: number, day: { segments: Segment[] }) {
    const clickedMin = Math.floor((yPx / PIXELS_PER_HOUR) * 60);
    const isToday = this.currentDate === getTodayDateString();
    const { start, end } = emptySlotFill(clickedMin, day.segments, {
      isToday,
      nowMin: parseHHMM(nowHHMM()),
    });

    const editor = new SegmentEditorModal(
      this.app,
      this.settings,
      this.recordsFile,
      this.currentDate,
      { kind: "new", start, end },
      () => {
        // 保存后走 refreshAll（决策 #22）
        if (this.onDataChanged) this.onDataChanged();
        else void this.render();
      },
    );
    editor.open();
  }

  private renderSegmentBlock(parent: HTMLElement, seg: Segment) {
    const startMin = parseHHMM(seg.start);
    // 进行中段：看今天 → 渲染到此刻；看历史/未来某天 → 渲染到午夜（24:00）
    let endMin: number;
    if (isOpenEnd(seg.end)) {
      endMin =
        this.currentDate === getTodayDateString()
          ? parseHHMM(nowHHMM())
          : parseHHMM("24:00");
    } else {
      endMin = parseHHMM(seg.end);
    }
    if (isNaN(startMin) || isNaN(endMin) || endMin <= startMin) return;

    const top = (startMin / 60) * PIXELS_PER_HOUR;
    // 色块保持真实时长高度（绝不重叠）。短段太矮塞不下文字 → 标签横排到右侧空白（CSS）。
    const height = ((endMin - startMin) / 60) * PIXELS_PER_HOUR;

    const block = parent.createDiv({ cls: "tr-segment-block" });
    if (isShortSegment(startMin, endMin, SHORT_SEGMENT_THRESHOLD_PX)) {
      block.addClass("tr-segment-short");
    }
    block.style.top = `${top}px`;
    block.style.height = `${height}px`;

    const cat = this.settings.categories.find((c) => c.id === seg.categoryId);
    block.setText(`${cat?.emoji ?? "❓"} ${seg.activity} (${seg.start}-${seg.end})`);

    block.dataset.lineNumber = String(seg.lineNumber);

    const color = segmentColor(seg.categoryId, this.settings.categories);
    if (color) {
      block.style.setProperty("--tr-cat-bg", color.bg);
      block.style.setProperty("--tr-cat-border", color.border);
      block.style.setProperty("--tr-cat-accent", color.accent);
    }

    block.addEventListener("click", (e: MouseEvent) => {
      e.stopPropagation();
      const editor = new SegmentEditorModal(
        this.app,
        this.settings,
        this.recordsFile,
        this.currentDate,
        { kind: "edit", segment: seg },
        () => {
          if (this.onDataChanged) this.onDataChanged();
          else void this.render();
        },
      );
      editor.open();
    });

    // 桌面端：拖拽手柄改时长。进行中段（end 动态）不给手柄，仍走点击编辑。
    if (!Platform.isMobile && !isOpenEnd(seg.end)) {
      this.attachDragHandles(block, seg);
    }
  }

  private attachDragHandles(block: HTMLElement, seg: Segment) {
    const topHandle = block.createDiv({ cls: "tr-drag-handle tr-drag-top" });
    const bottomHandle = block.createDiv({ cls: "tr-drag-handle tr-drag-bottom" });

    const cat = this.settings.categories.find((c) => c.id === seg.categoryId);
    const emoji = cat?.emoji ?? "❓";
    const origStart = parseHHMM(seg.start);
    const origEnd = parseHHMM(seg.end); // 非进行中段，含 "24:00"=1440，必有效

    const onDrag = (which: "top" | "bottom") => (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const startY = e.clientY;

      const compute = (clientY: number): { newStart: number; newEnd: number } => {
        const deltaPx = clientY - startY;
        const deltaMin = Math.round((deltaPx / PIXELS_PER_HOUR) * 60 / 5) * 5; // 吸附 5 分钟
        if (which === "top") {
          const newStart = Math.max(0, Math.min(origStart + deltaMin, origEnd - 5));
          return { newStart, newEnd: origEnd };
        } else {
          const newEnd = Math.max(origStart + 5, Math.min(origEnd + deltaMin, 24 * 60));
          return { newStart: origStart, newEnd };
        }
      };

      const paint = (newStart: number, newEnd: number) => {
        block.style.top = `${(newStart / 60) * PIXELS_PER_HOUR}px`;
        // 与 render 口径一致：真实高度 + 同步 .tr-segment-short（短段标签左端上下微露）。
        block.style.height = `${((newEnd - newStart) / 60) * PIXELS_PER_HOUR}px`;
        block.toggleClass(
          "tr-segment-short",
          isShortSegment(newStart, newEnd, SHORT_SEGMENT_THRESHOLD_PX),
        );
        const endLabel = newEnd >= 24 * 60 ? "24:00" : formatHHMM(newEnd);
        block.setText(`${emoji} ${seg.activity} (${formatHHMM(newStart)}-${endLabel})`);
      };

      const onMove = (ev: MouseEvent) => {
        const { newStart, newEnd } = compute(ev.clientY);
        paint(newStart, newEnd);
      };

      const onUp = async (ev: MouseEvent) => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        const { newStart, newEnd } = compute(ev.clientY);
        if (newStart === origStart && newEnd === origEnd) return; // 没变化

        const updated: Segment = {
          ...seg,
          start: formatHHMM(newStart),
          end: newEnd >= 24 * 60 ? "24:00" : formatHHMM(newEnd),
        };
        try {
          const content = await this.recordsFile.readDayContent(this.currentDate);
          const after = replaceLine(content, seg.lineNumber, formatSegmentLine(updated));
          await this.recordsFile.writeDayContent(this.currentDate, after);
        } catch (err) {
          console.error("Time Recorder: failed to save dragged segment", err);
          new Notice(`保存失败：${(err as Error).message}`);
          return; // 失败不刷新，避免 UI 抖回误导
        }
        if (this.onDataChanged) this.onDataChanged();
        else void this.render();
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    };

    topHandle.addEventListener("mousedown", onDrag("top"));
    bottomHandle.addEventListener("mousedown", onDrag("bottom"));
  }
}
