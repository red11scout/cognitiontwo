import { z } from "zod";
import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  real,
} from "drizzle-orm/pg-core";

// Saved Analyses table - uses ownerToken for anonymous persistence
export const analyses = pgTable("analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerToken: varchar("owner_token").notNull(),
  companyName: varchar("company_name").notNull(),
  industry: varchar("industry").notNull(),
  coreBusinessGoal: text("core_business_goal").notNull(),
  currentPainPoints: text("current_pain_points").notNull(),
  dataLandscape: text("data_landscape").notNull(),
  executiveSummary: text("executive_summary").notNull(),
  cognitiveNodes: jsonb("cognitive_nodes").notNull().$type<CognitiveNode[]>(),
  useCases: jsonb("use_cases").notNull().$type<UseCase[]>(),
  trustTaxBreakdown: jsonb("trust_tax_breakdown").notNull().$type<TrustTaxBreakdown>(),
  cognitiveLoadData: jsonb("cognitive_load_data").notNull().$type<CognitiveLoadHeatmapData>(),
  trustTaxData: jsonb("trust_tax_data").notNull().$type<TrustTaxWaterfallData>(),
  horizonsBubbleData: jsonb("horizons_bubble_data").notNull().$type<HorizonsBubbleData>(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("IDX_analyses_owner_token").on(table.ownerToken)]);

export type InsertAnalysis = typeof analyses.$inferInsert;
export type SelectAnalysis = typeof analyses.$inferSelect;

// Industry Templates table
export const templates = pgTable("templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  industry: varchar("industry").notNull(),
  description: text("description").notNull(),
  samplePainPoints: text("sample_pain_points").notNull(),
  sampleDataLandscape: text("sample_data_landscape").notNull(),
  sampleBusinessGoal: text("sample_business_goal").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type InsertTemplate = typeof templates.$inferInsert;
export type SelectTemplate = typeof templates.$inferSelect;

// Organization Profile - User input for analysis
export const organizationProfileSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  industry: z.string().min(1, "Industry is required"),
  coreBusinessGoal: z.string().min(1, "Core business goal is required"),
  currentPainPoints: z.string().min(1, "Current pain points are required"),
  dataLandscape: z.string().min(1, "Data landscape description is required"),
  uploadedDocumentContent: z.string().optional(),
  uploadedDocumentName: z.string().optional(),
});

export type OrganizationProfile = z.infer<typeof organizationProfileSchema>;

// Cognitive Node - Identified during audit
export interface CognitiveNode {
  id: string;
  name: string;
  description: string;
  humanCognitiveLoad: number;
  aiCognitiveLoad: number;
  translationTax: string;
  contextSwitchingCost: string;
}

// Agentic Pattern Types
export type AgenticPatternType = 
  | "drafter-critic" 
  | "reasoning-engine" 
  | "orchestrator" 
  | "tool-user";

// Use Case - Agentic transformation proposal
export interface UseCase {
  id: string;
  title: string;
  pattern: AgenticPatternType;
  patternName: string;
  oldWay: string;
  agenticWay: string;
  horizon: 1 | 2 | 3;
  horizonLabel: string;
  dataReadiness: number;
  businessValue: number;
  implementationRisk: number;
  estimatedSavings: string;
}

// Trust Tax Calculation
export interface TrustTaxBreakdown {
  currentHumanCost: number;
  aiEfficiencySavings: number;
  trustTaxCost: number;
  finalLCOAI: number;
  currency: string;
}

// Chart Data Structures
export interface CognitiveLoadHeatmapData {
  labels: string[];
  humanLoad: number[];
  aiLoad: number[];
}

export interface TrustTaxWaterfallData {
  labels: string[];
  values: number[];
  colors: string[];
}

export interface HorizonsBubbleData {
  useCases: {
    label: string;
    x: number;
    y: number;
    r: number;
    horizon: 1 | 2 | 3;
  }[];
}

// Complete Analysis Result
export interface AnalysisResult {
  id: string;
  organizationProfile: OrganizationProfile;
  executiveSummary: string;
  cognitiveNodes: CognitiveNode[];
  useCases: UseCase[];
  trustTaxBreakdown: TrustTaxBreakdown;
  cognitiveLoadData: CognitiveLoadHeatmapData;
  trustTaxData: TrustTaxWaterfallData;
  horizonsBubbleData: HorizonsBubbleData;
  createdAt: string;
  ownerToken?: string;
}

// Analysis Request/Response types for API
export interface AnalysisRequest {
  organizationProfile: OrganizationProfile;
}

export interface AnalysisResponse {
  success: boolean;
  result?: AnalysisResult;
  error?: string;
}

// Phase tracking for multi-step workflow
export type AnalysisPhase = 
  | "input" 
  | "cognitive-audit" 
  | "agentic-design" 
  | "epoch-filter" 
  | "unit-economics" 
  | "horizons-portfolio"
  | "complete";

export const phaseLabels: Record<AnalysisPhase, string> = {
  "input": "Organization Profile",
  "cognitive-audit": "Cognitive Audit",
  "agentic-design": "Agentic Design",
  "epoch-filter": "EPOCH Filter",
  "unit-economics": "Unit Economics",
  "horizons-portfolio": "Horizons Portfolio",
  "complete": "Analysis Complete"
};

export const phaseDescriptions: Record<AnalysisPhase, string> = {
  "input": "Enter your organization details",
  "cognitive-audit": "Identifying cognitive nodes and translation tax",
  "agentic-design": "Mapping to agentic design patterns",
  "epoch-filter": "Filtering with EPOCH & Jagged Frontier",
  "unit-economics": "Calculating LCOAI and Trust Tax",
  "horizons-portfolio": "Allocating to strategic horizons",
  "complete": "Your analysis is ready"
};
