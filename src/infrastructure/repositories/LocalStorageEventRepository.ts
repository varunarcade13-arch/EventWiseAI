import { EventRepository } from "@/application/interfaces/EventRepository";
import { DEMO_EVENTS } from "@/infrastructure/demo/demoData";
import { EventModel } from "@/types/event";

const STORAGE_KEY = "eventwise_ai_events_v1";

export class LocalStorageEventRepository implements EventRepository {
  private inMemoryFallback: Map<string, EventModel> = new Map();

  constructor() {
    this.seedFallback();
  }

  private seedFallback(): void {
    for (const e of DEMO_EVENTS) {
      this.inMemoryFallback.set(e.id, JSON.parse(JSON.stringify(e)));
    }
  }

  private isLocalStorageAvailable(): boolean {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }
    try {
      const testKey = "__test_storage__";
      window.localStorage.setItem(testKey, "1");
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private readStorage(): EventModel[] {
    if (!this.isLocalStorageAvailable()) {
      return Array.from(this.inMemoryFallback.values()).map((e) =>
        JSON.parse(JSON.stringify(e))
      );
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // Initialize with demo data
        const clonedDemo = JSON.parse(JSON.stringify(DEMO_EVENTS));
        this.writeStorage(clonedDemo);
        return clonedDemo;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        const clonedDemo = JSON.parse(JSON.stringify(DEMO_EVENTS));
        this.writeStorage(clonedDemo);
        return clonedDemo;
      }
      return parsed;
    } catch {
      return Array.from(this.inMemoryFallback.values()).map((e) =>
        JSON.parse(JSON.stringify(e))
      );
    }
  }

  private writeStorage(events: EventModel[]): void {
    if (!this.isLocalStorageAvailable()) {
      this.inMemoryFallback.clear();
      for (const e of events) {
        this.inMemoryFallback.set(e.id, JSON.parse(JSON.stringify(e)));
      }
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch {
      this.inMemoryFallback.clear();
      for (const e of events) {
        this.inMemoryFallback.set(e.id, JSON.parse(JSON.stringify(e)));
      }
    }
  }

  public async getAll(): Promise<EventModel[]> {
    return this.readStorage();
  }

  public async getById(id: string): Promise<EventModel | null> {
    const events = this.readStorage();
    const found = events.find((e) => e.id === id);
    return found ? JSON.parse(JSON.stringify(found)) : null;
  }

  public async save(event: EventModel): Promise<EventModel> {
    const events = this.readStorage();
    const index = events.findIndex((e) => e.id === event.id);

    const cloned = JSON.parse(JSON.stringify(event));

    if (index >= 0) {
      events[index] = cloned;
    } else {
      events.unshift(cloned);
    }

    this.writeStorage(events);
    return cloned;
  }

  public async delete(id: string): Promise<boolean> {
    const events = this.readStorage();
    const initialLen = events.length;
    const filtered = events.filter((e) => e.id !== id);
    if (filtered.length !== initialLen) {
      this.writeStorage(filtered);
      return true;
    }
    return false;
  }

  public async resetToDemo(): Promise<EventModel[]> {
    const cloned = JSON.parse(JSON.stringify(DEMO_EVENTS));
    this.writeStorage(cloned);
    return cloned;
  }
}
