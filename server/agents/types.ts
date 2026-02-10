import type { OrganizationProfile } from "@shared/schema";

export interface AgentContext {
  organizationProfile: OrganizationProfile;
  documentContent?: string;
  documentName?: string;
  previousAgentOutputs: Record<string, AgentOutput>;
}

export interface AgentOutput {
  agentName: string;
  insights: string[];
  structuredData?: Record<string, any>;
  confidence: number;
  reasoning: string;
}

export interface DocumentIntelligenceOutput extends AgentOutput {
  structuredData: {
    keyFindings: string[];
    relevantMetrics: { name: string; value: string; context: string }[];
    strategicImplications: string[];
    riskFactors: string[];
    opportunities: string[];
  };
}

export interface BusinessStrategyOutput extends AgentOutput {
  structuredData: {
    cognitiveNodes: Array<{
      name: string;
      description: string;
      cognitiveLoad: "high" | "medium" | "low";
      dataReadiness: "high" | "medium" | "low";
      agenticPattern: string;
      automationPotential: number;
      documentEvidence?: string;
    }>;
    epochFilters: {
      empathy: string[];
      physicality: string[];
      opinion: string[];
      leadership: string[];
    };
    jaggedFrontier: string[];
  };
}

export interface FinancialAnalystOutput extends AgentOutput {
  structuredData: {
    useCases: Array<{
      title: string;
      description: string;
      horizon: "H1" | "H2" | "H3";
      currentCost: number;
      projectedSavings: number;
      implementationCost: number;
      trustTaxPercent: number;
      lcoai: number;
      paybackMonths: number;
      documentJustification?: string;
      // Enriched Legacy Way data
      legacyProcessSteps?: string[];
      legacyPainPoints?: string[];
      legacyCognitionNodes?: number;
      legacyTranslationTax?: string;
      legacyContextSwitching?: string;
      legacyTimeConsumed?: string;
      // Enriched Agentic Way data
      agenticPatternRationale?: string;
      agenticAutomationLevel?: string;
      agenticPrimitives?: string[];
      agenticHitlCheckpoints?: string[];
      agenticTransformSteps?: string[];
    }>;
    totalCurrentCost: number;
    totalProjectedSavings: number;
    overallROI: number;
    trustTaxBreakdown: {
      humanReview: number;
      errorCorrection: number;
      complianceOverhead: number;
      trainingMaintenance: number;
    };
    scenarioAnalysis?: {
      conservative: ScenarioDetailRaw;
      baseCase: ScenarioDetailRaw;
      optimistic: ScenarioDetailRaw;
    };
  };
}

interface ScenarioDetailRaw {
  label: string;
  description: string;
  adoptionRate: string;
  rampTime: string;
  realizationRate: string;
  annualBenefit: number;
  threeYearNPV: number;
  paybackMonths: number;
  keyAssumptions: string[];
}

export interface SynthesizedAnalysis {
  executiveSummary: string;
  cognitiveNodes: BusinessStrategyOutput["structuredData"]["cognitiveNodes"];
  useCases: FinancialAnalystOutput["structuredData"]["useCases"];
  trustTaxBreakdown: FinancialAnalystOutput["structuredData"]["trustTaxBreakdown"];
  documentInsights?: DocumentIntelligenceOutput["structuredData"];
  recommendations: string[];
  riskAssessment: string;
}

export interface Agent {
  name: string;
  role: string;
  goal: string;
  execute(context: AgentContext): Promise<AgentOutput>;
}
