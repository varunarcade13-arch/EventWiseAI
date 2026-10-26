import { EventRepository } from "@/application/interfaces/EventRepository";
import { BudgetCategory, EventModel } from "@/types/event";

export interface AddBudgetCategoryInput {
  eventId: string;
  category: Omit<BudgetCategory, "id">;
}

export interface UpdateBudgetCategoryInput {
  eventId: string;
  categoryId: string;
  allocated?: number;
  actual?: number;
  notes?: string;
  name?: string;
}

export interface DeleteBudgetCategoryInput {
  eventId: string;
  categoryId: string;
}

export class UpdateBudgetUseCase {
  constructor(private readonly repository: EventRepository) {}

  public async addCategory(input: AddBudgetCategoryInput): Promise<EventModel> {
    const event = await this.repository.getById(input.eventId);
    if (!event) {
      throw new Error(`Event with ID "${input.eventId}" not found.`);
    }

    if (!input.category.name?.trim()) {
      throw new Error("Category name is required.");
    }

    const newCategory: BudgetCategory = {
      id: `cat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: input.category.name.trim(),
      allocated: Math.max(0, Number(input.category.allocated) || 0),
      actual: Math.max(0, Number(input.category.actual) || 0),
      notes: input.category.notes?.trim() || "",
    };

    const updatedEvent: EventModel = {
      ...event,
      budgetCategories: [...event.budgetCategories, newCategory],
      updatedAt: new Date().toISOString(),
    };

    return await this.repository.save(updatedEvent);
  }

  public async updateCategory(
    input: UpdateBudgetCategoryInput
  ): Promise<EventModel> {
    const event = await this.repository.getById(input.eventId);
    if (!event) {
      throw new Error(`Event with ID "${input.eventId}" not found.`);
    }

    const categoryIndex = event.budgetCategories.findIndex(
      (c) => c.id === input.categoryId
    );
    if (categoryIndex === -1) {
      throw new Error(`Budget category "${input.categoryId}" not found.`);
    }

    const currentCat = event.budgetCategories[categoryIndex]!;
    const updatedCategory: BudgetCategory = {
      ...currentCat,
      name: input.name !== undefined ? input.name.trim() : currentCat.name,
      allocated:
        input.allocated !== undefined
          ? Math.max(0, Number(input.allocated) || 0)
          : currentCat.allocated,
      actual:
        input.actual !== undefined
          ? Math.max(0, Number(input.actual) || 0)
          : currentCat.actual,
      notes:
        input.notes !== undefined ? input.notes.trim() : currentCat.notes,
    };

    const updatedCategories = [...event.budgetCategories];
    updatedCategories[categoryIndex] = updatedCategory;

    const updatedEvent: EventModel = {
      ...event,
      budgetCategories: updatedCategories,
      updatedAt: new Date().toISOString(),
    };

    return await this.repository.save(updatedEvent);
  }

  public async deleteCategory(
    input: DeleteBudgetCategoryInput
  ): Promise<EventModel> {
    const event = await this.repository.getById(input.eventId);
    if (!event) {
      throw new Error(`Event with ID "${input.eventId}" not found.`);
    }

    const filtered = event.budgetCategories.filter(
      (c) => c.id !== input.categoryId
    );

    const updatedEvent: EventModel = {
      ...event,
      budgetCategories: filtered,
      updatedAt: new Date().toISOString(),
    };

    return await this.repository.save(updatedEvent);
  }
}
