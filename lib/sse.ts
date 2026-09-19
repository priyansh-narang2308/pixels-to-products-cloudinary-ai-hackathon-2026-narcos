export type PipelineStep =
  | "upload"
  | "audit_1"
  | "decision"
  | "transform"
  | "audit_2"
  | "compile"
  | "complete"
  | "error";

export type StepStatus =
  | "idle"
  | "started"
  | "in_progress"
  | "complete"
  | "failed";

export interface PipelineEvent {
  assetId: string;
  step: PipelineStep;
  status: StepStatus;
  progress?: number; // 0 to 100
  message?: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

type EventListener = (event: PipelineEvent) => void;

class SSEBus {
  private channels: Map<string, Set<EventListener>> = new Map();

  private globalListeners: Set<EventListener> = new Set();

  public subscribe(assetId: string, listener: EventListener): () => void {
    if (!this.channels.has(assetId)) {
      this.channels.set(assetId, new Set());
    }

    const listeners = this.channels.get(assetId)!;
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.channels.delete(assetId);
      }
    };
  }

  public subscribeGlobal(listener: EventListener): () => void {
    this.globalListeners.add(listener);
    return () => {
      this.globalListeners.delete(listener);
    };
  }

  public emit(assetId: string, event: Omit<PipelineEvent, "timestamp">): void {
    const fullEvent: PipelineEvent = {
      ...event,
      timestamp: Date.now(),
    };

    const listeners = this.channels.get(assetId);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(fullEvent);
        } catch (err) {
          console.error(
            `[SSEBus] Error dispatching to listener for asset ${assetId}:`,
            err,
          );
        }
      }
    }

    for (const globalListener of this.globalListeners) {
      try {
        globalListener(fullEvent);
      } catch (err) {
        console.error(`[SSEBus] Error dispatching to global listener:`, err);
      }
    }
  }

  public getStats() {
    let totalListeners = 0;
    for (const set of this.channels.values()) {
      totalListeners += set.size;
    }
    return {
      activeChannels: this.channels.size,
      totalAssetListeners: totalListeners,
      globalListeners: this.globalListeners.size,
    };
  }
}

const globalForSSE = globalThis as unknown as { sseBus?: SSEBus };
export const sseBus = globalForSSE.sseBus ?? new SSEBus();
if (process.env.NODE_ENV !== "production") {
  globalForSSE.sseBus = sseBus;
}
