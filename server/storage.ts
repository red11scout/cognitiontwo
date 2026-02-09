import {
  analyses,
  templates,
  type InsertAnalysis,
  type SelectAnalysis,
  type InsertTemplate,
  type SelectTemplate,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Analysis operations
  createAnalysis(analysis: InsertAnalysis): Promise<SelectAnalysis>;
  getAnalysis(id: string): Promise<SelectAnalysis | undefined>;
  getAnalysesByOwner(ownerToken: string): Promise<SelectAnalysis[]>;
  deleteAnalysis(id: string, ownerToken: string): Promise<boolean>;
  
  // Template operations
  getAllTemplates(): Promise<SelectTemplate[]>;
  getTemplatesByIndustry(industry: string): Promise<SelectTemplate[]>;
  getTemplate(id: string): Promise<SelectTemplate | undefined>;
  createTemplate(template: InsertTemplate): Promise<SelectTemplate>;
}

export class DatabaseStorage implements IStorage {
  // Analysis operations
  async createAnalysis(analysis: InsertAnalysis): Promise<SelectAnalysis> {
    const [created] = await db.insert(analyses).values(analysis).returning();
    return created;
  }

  async getAnalysis(id: string): Promise<SelectAnalysis | undefined> {
    const [analysis] = await db.select().from(analyses).where(eq(analyses.id, id));
    return analysis;
  }

  async getAnalysesByOwner(ownerToken: string): Promise<SelectAnalysis[]> {
    return db
      .select()
      .from(analyses)
      .where(eq(analyses.ownerToken, ownerToken))
      .orderBy(desc(analyses.createdAt));
  }

  async deleteAnalysis(id: string, ownerToken: string): Promise<boolean> {
    const result = await db
      .delete(analyses)
      .where(and(eq(analyses.id, id), eq(analyses.ownerToken, ownerToken)))
      .returning();
    return result.length > 0;
  }

  // Template operations
  async getAllTemplates(): Promise<SelectTemplate[]> {
    return db.select().from(templates).orderBy(templates.industry);
  }

  async getTemplatesByIndustry(industry: string): Promise<SelectTemplate[]> {
    return db
      .select()
      .from(templates)
      .where(eq(templates.industry, industry));
  }

  async getTemplate(id: string): Promise<SelectTemplate | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template;
  }

  async createTemplate(template: InsertTemplate): Promise<SelectTemplate> {
    const [created] = await db.insert(templates).values(template).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
