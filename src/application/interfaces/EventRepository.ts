import { EventModel } from "@/types/event";

export interface EventRepository {
  getAll(): Promise<EventModel[]>;
  getById(id: string): Promise<EventModel | null>;
  save(event: EventModel): Promise<EventModel>;
  delete(id: string): Promise<boolean>;
  resetToDemo(): Promise<EventModel[]>;
}
