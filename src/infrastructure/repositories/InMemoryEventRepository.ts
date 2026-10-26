import { EventRepository } from "@/application/interfaces/EventRepository";
import { DEMO_EVENTS } from "@/infrastructure/demo/demoData";
import { EventModel } from "@/types/event";

export class InMemoryEventRepository implements EventRepository {
  private events: Map<string, EventModel> = new Map();

  constructor(initialEvents: EventModel[] = DEMO_EVENTS) {
    this.seed(initialEvents);
  }

  private seed(events: EventModel[]): void {
    this.events.clear();
    for (const event of events) {
      // Deep clone to avoid accidental mutation
      this.events.set(event.id, JSON.parse(JSON.stringify(event)));
    }
  }

  public async getAll(): Promise<EventModel[]> {
    return Array.from(this.events.values()).map((e) =>
      JSON.parse(JSON.stringify(e))
    );
  }

  public async getById(id: string): Promise<EventModel | null> {
    const event = this.events.get(id);
    if (!event) return null;
    return JSON.parse(JSON.stringify(event));
  }

  public async save(event: EventModel): Promise<EventModel> {
    const cloned = JSON.parse(JSON.stringify(event));
    this.events.set(cloned.id, cloned);
    return JSON.parse(JSON.stringify(cloned));
  }

  public async delete(id: string): Promise<boolean> {
    return this.events.delete(id);
  }

  public async resetToDemo(): Promise<EventModel[]> {
    this.seed(DEMO_EVENTS);
    return this.getAll();
  }
}
