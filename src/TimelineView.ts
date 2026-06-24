import { ItemView, WorkspaceLeaf } from "obsidian";
import { TimeRecorderSettings, Segment } from "./types";
import { RecordsFileManager } from "./recordsFile";
import { getTodayDateString, addDays } from "./date";
import { parseHHMM, formatHHMM, nowHHMM, isOpenEnd } from "./time";
import { SegmentEditorModal } from "./SegmentEditorModal";

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

  async render() {
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

    // 24 条小时网格线
    for (let h = 0; h < 24; h++) {
      const row = body.createDiv({ cls: "tr-hour-row" });
      row.style.top = `${h * PIXELS_PER_HOUR}px`;
      row.createDiv({ cls: "tr-hour-label", text: String(h).padStart(2, "0") });
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
    const start = formatHHMM(Math.floor(clickedMin / 60) * 60); // 整点
    const startMin = parseHHMM(start);

    // 找第一个开始时间晚于 clickedMin 的已有段
    const candidates = day.segments
      .map((s) => parseHHMM(s.start))
      .filter((m) => !isNaN(m) && m > clickedMin)
      .sort((a, b) => a - b);

    let endMin: number;
    if (candidates.length > 0) {
      endMin = candidates[0]; // 智能填空：停在下一段开始处
    } else {
      endMin = Math.min(startMin + 60, 24 * 60); // 默认 1 小时，封顶 24:00
    }
    // formatHHMM(1440) 会绕回 "00:00"（编辑器 end>start 校验会拒）。
    // 到达全天末尾时用 "24:00"（数据层 verbatim 写、校验通过、时间轴渲染到底部）。
    const end = endMin >= 24 * 60 ? "24:00" : formatHHMM(endMin);

    const editor = new SegmentEditorModal(
      this.app,
      this.settings,
      this.recordsFile,
      this.currentDate,
      { kind: "new", start, end },
      () => {
        // 保存后走 refreshAll（决策 #22），刷新状态栏+今日汇总+所有时间轴
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
    const height = ((endMin - startMin) / 60) * PIXELS_PER_HOUR;

    const block = parent.createDiv({ cls: "tr-segment-block" });
    block.style.top = `${top}px`;
    block.style.height = `${height}px`;

    const cat = this.settings.categories.find((c) => c.id === seg.categoryId);
    block.setText(`${cat?.emoji ?? "❓"} ${seg.activity} (${seg.start}-${seg.end})`);

    block.dataset.lineNumber = String(seg.lineNumber);
  }
}
