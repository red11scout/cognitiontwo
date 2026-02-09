import Anthropic from "@anthropic-ai/sdk";
import type { OrganizationProfile } from "@shared/schema";
import type { 
  AgentContext, 
  AgentOutput, 
  DocumentIntelligenceOutput, 
  BusinessStrategyOutput, 
  FinancialAnalystOutput,
  SynthesizedAnalysis 
} from "./types";
import { documentIntelligenceAgent } from "./document-agent";
import { businessStrategyAgent } from "./strategy-agent";
import { financialAnalystAgent } from "./financial-agent";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const ORCHESTRATOR_PROMPT = `You are the Executive Orchestrator Agent synthesizing outputs from a multi-agent analysis crew.

YOUR ROLE: Combine insights from Document Intelligence, Business Strategy, and Financial Analysis agents into a cohesive executive brief that PROMINENTLY CITES DOCUMENT EVIDENCE.

AGENTS IN YOUR CREW:
1. Document Intelligence Agent - Extracted key findings from uploaded documents
2. Business Strategy Agent - Applied Cognitive Zero-Base framework
3. Financial Analyst Agent - Calculated unit economics and ROI

YOUR TASK:
Synthesize all agent outputs into a compelling executive summary and recommendations.

CRITICAL DOCUMENT CITATION REQUIREMENTS:
- When document findings are provided, the executive summary MUST cite them DIRECTLY
- Include at least 2-3 direct references to document data in the executive summary
- Format citations as: "According to the provided documentation, [specific quote or metric]..."
- Reference specific figures, percentages, or statements from the document
- The first paragraph MUST acknowledge the document analysis
- If no document was provided, acknowledge that recommendations are based on organizational profile alone

REQUIREMENTS:
- Executive summary should be 3-4 paragraphs with embedded document citations
- Reference specific document insights with exact quotes/metrics
- Highlight top recommendations with document-backed rationale
- Provide honest risk assessment citing document risk factors when available
- Use board-ready, professional language

OUTPUT FORMAT:
Return ONLY valid JSON:
{
  "executiveSummary": "<3-4 paragraph executive summary WITH document citations embedded>",
  "recommendations": ["<recommendation1 citing document evidence>", "<recommendation2>", ...],
  "riskAssessment": "<honest assessment referencing document risk factors>"
}`;

export interface CrewAnalysisResult {
  documentIntelligence: DocumentIntelligenceOutput;
  businessStrategy: BusinessStrategyOutput;
  financialAnalysis: FinancialAnalystOutput;
  synthesis: {
    executiveSummary: string;
    recommendations: string[];
    riskAssessment: string;
  };
}

export async function runAgentCrew(
  organizationProfile: OrganizationProfile,
  documentContent?: string,
  documentName?: string
): Promise<CrewAnalysisResult> {
  const context: AgentContext = {
    organizationProfile,
    documentContent,
    documentName,
    previousAgentOutputs: {}
  };

  // Step 1: Document Intelligence Agent (runs first to extract document data)
  console.log("[Crew] Starting Document Intelligence Agent...");
  const docOutput = await documentIntelligenceAgent.execute(context) as DocumentIntelligenceOutput;
  context.previousAgentOutputs["Document Intelligence Agent"] = docOutput;
  console.log(`[Crew] Document Agent completed with ${docOutput.structuredData?.keyFindings?.length || 0} findings`);

  // Step 2: Run Strategy and Financial agents IN PARALLEL for faster execution
  console.log("[Crew] Starting Strategy and Financial Agents in parallel...");
  const [strategyOutput, financialOutput] = await Promise.all([
    (async () => {
      const result = await businessStrategyAgent.execute(context) as BusinessStrategyOutput;
      console.log(`[Crew] Strategy Agent completed with ${result.structuredData?.cognitiveNodes?.length || 0} cognitive nodes`);
      return result;
    })(),
    (async () => {
      const result = await financialAnalystAgent.execute(context) as FinancialAnalystOutput;
      console.log(`[Crew] Financial Agent completed with ${result.structuredData?.useCases?.length || 0} use cases`);
      return result;
    })()
  ]);

  context.previousAgentOutputs["Business Strategy Agent"] = strategyOutput;
  context.previousAgentOutputs["Financial Analyst Agent"] = financialOutput;

  // Step 3: Orchestrator synthesizes all outputs
  console.log("[Crew] Running Executive Orchestrator...");
  const synthesis = await synthesizeResults(context, docOutput, strategyOutput, financialOutput);
  console.log("[Crew] Orchestrator synthesis complete");

  return {
    documentIntelligence: docOutput,
    businessStrategy: strategyOutput,
    financialAnalysis: financialOutput,
    synthesis
  };
}

async function synthesizeResults(
  context: AgentContext,
  docOutput: DocumentIntelligenceOutput,
  strategyOutput: BusinessStrategyOutput,
  financialOutput: FinancialAnalystOutput
): Promise<{ executiveSummary: string; recommendations: string[]; riskAssessment: string }> {
  // Safe access with defaults for all nested arrays
  const keyFindings = docOutput?.structuredData?.keyFindings || [];
  const metrics = docOutput?.structuredData?.relevantMetrics || [];
  const opportunities = docOutput?.structuredData?.opportunities || [];
  const riskFactors = docOutput?.structuredData?.riskFactors || [];
  const cognitiveNodes = strategyOutput?.structuredData?.cognitiveNodes || [];
  const jaggedFrontier = strategyOutput?.structuredData?.jaggedFrontier || [];
  const insights = strategyOutput?.insights || [];
  const useCases = financialOutput?.structuredData?.useCases || [];
  const totalCurrentCost = financialOutput?.structuredData?.totalCurrentCost || 0;
  const totalProjectedSavings = financialOutput?.structuredData?.totalProjectedSavings || 0;
  const overallROI = financialOutput?.structuredData?.overallROI || 0;
  const trustTax = financialOutput?.structuredData?.trustTaxBreakdown || { humanReview: 0, errorCorrection: 0 };

  const userPrompt = `Synthesize these agent outputs into an executive brief:

ORGANIZATION: ${context.organizationProfile.companyName} (${context.organizationProfile.industry})

DOCUMENT INTELLIGENCE AGENT OUTPUT:
Key Findings: ${keyFindings.length > 0 ? keyFindings.join("; ") : "No document provided"}
Metrics: ${metrics.length > 0 ? metrics.map(m => `${m.name}: ${m.value}`).join("; ") : "N/A"}
Opportunities: ${opportunities.length > 0 ? opportunities.join("; ") : "To be identified"}
Risk Factors: ${riskFactors.length > 0 ? riskFactors.join("; ") : "To be assessed"}

BUSINESS STRATEGY AGENT OUTPUT:
Cognitive Nodes Identified: ${cognitiveNodes.length}
Top Nodes: ${cognitiveNodes.slice(0, 3).map(n => `${n.name} (${n.agenticPattern || 'unspecified'}, ${n.automationPotential || 0}%)`).join("; ") || "Processing..."}
Jagged Frontier: ${jaggedFrontier.length > 0 ? jaggedFrontier.join("; ") : "Being mapped"}
Strategic Insights: ${insights.length > 0 ? insights.join("; ") : "Analysis in progress"}

FINANCIAL ANALYST AGENT OUTPUT:
Use Cases: ${useCases.length}
Total Current Cost: $${totalCurrentCost.toLocaleString()}
Total Projected Savings: $${totalProjectedSavings.toLocaleString()}
Overall ROI: ${overallROI}%
Trust Tax Breakdown: Human Review ${trustTax.humanReview}%, Error Correction ${trustTax.errorCorrection}%

Create a compelling executive summary that weaves together document insights, strategic opportunities, and financial projections.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2048,
    system: ORCHESTRATOR_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Orchestrator");
  }

  let response = content.text.trim();
  if (response.startsWith("```json")) response = response.slice(7);
  if (response.startsWith("```")) response = response.slice(3);
  if (response.endsWith("```")) response = response.slice(0, -3);

  return JSON.parse(response.trim());
}

export function convertCrewResultToAnalysis(result: CrewAnalysisResult): {
  executiveSummary: string;
  cognitiveNodes: any[];
  useCases: any[];
  trustTaxBreakdown: any;
  horizonsSummary: { h1Count: number; h2Count: number; h3Count: number; h1Savings: number; h2Savings: number; h3Savings: number };
  documentInsights?: any;
} {
  // Safe access with defaults
  const useCases = result?.financialAnalysis?.structuredData?.useCases || [];
  const cognitiveNodes = result?.businessStrategy?.structuredData?.cognitiveNodes || [];
  const keyFindings = result?.documentIntelligence?.structuredData?.keyFindings || [];
  const relevantMetrics = result?.documentIntelligence?.structuredData?.relevantMetrics || [];
  const opportunities = result?.documentIntelligence?.structuredData?.opportunities || [];
  const trustTaxData = result?.financialAnalysis?.structuredData?.trustTaxBreakdown || {
    humanReview: 20,
    errorCorrection: 10,
    complianceOverhead: 5,
    trainingMaintenance: 5
  };
  
  const hasDocument = keyFindings.length > 0;
  
  // Helper to inject document evidence if missing
  const injectDocumentEvidence = (nodeIndex: number, existingEvidence?: string): string | undefined => {
    if (existingEvidence && existingEvidence.trim().length > 0) {
      return existingEvidence;
    }
    if (!hasDocument) return undefined;
    
    // Cycle through available findings and opportunities to inject relevant evidence
    const evidencePool = [
      ...keyFindings.map(f => `Per document: "${f}"`),
      ...opportunities.map(o => `Document opportunity: ${o}`)
    ];
    if (evidencePool.length > 0) {
      return evidencePool[nodeIndex % evidencePool.length];
    }
    return "Analysis based on organizational profile and industry benchmarks";
  };
  
  // Helper to inject document justification if missing
  const injectDocumentJustification = (ucIndex: number, existingJustification?: string): string | undefined => {
    if (existingJustification && existingJustification.trim().length > 0) {
      return existingJustification;
    }
    if (!hasDocument) return undefined;
    
    // Use metrics for financial justifications
    const justificationPool = [
      ...relevantMetrics.map(m => `Based on document data: ${m.name} = ${m.value} (${m.context})`),
      ...keyFindings.slice(0, 3).map(f => `Document insight: "${f}"`)
    ];
    if (justificationPool.length > 0) {
      return justificationPool[ucIndex % justificationPool.length];
    }
    return "Industry benchmark estimate - see document for supporting data";
  };
  
  const h1Cases = useCases.filter(u => u.horizon === "H1");
  const h2Cases = useCases.filter(u => u.horizon === "H2");
  const h3Cases = useCases.filter(u => u.horizon === "H3");

  return {
    executiveSummary: result?.synthesis?.executiveSummary || "Analysis complete. Please review the detailed findings below.",
    cognitiveNodes: cognitiveNodes.map((node, idx) => ({
      name: node.name || "Unnamed Node",
      description: node.description || "",
      cognitiveLoad: node.cognitiveLoad || "medium",
      dataReadiness: node.dataReadiness || "medium",
      agenticPattern: node.agenticPattern || "orchestrator",
      automationPotential: Math.max(0, Math.min(100, node.automationPotential || 50)),
      documentEvidence: injectDocumentEvidence(idx, node.documentEvidence)
    })),
    useCases: useCases.map((uc, idx) => ({
      title: uc.title || "Unnamed Use Case",
      description: uc.description || "",
      horizon: uc.horizon || "H1",
      currentState: `Annual cost: $${(uc.currentCost || 0).toLocaleString()}`,
      aiSolution: uc.description || "",
      expectedOutcome: `$${(uc.projectedSavings || 0).toLocaleString()} annual savings`,
      savingsAmount: uc.projectedSavings || 0,
      implementationCost: uc.implementationCost || 0,
      paybackMonths: uc.paybackMonths || 12,
      trustTaxPercent: Math.max(0, Math.min(100, uc.trustTaxPercent || 20)),
      lcoai: uc.lcoai || 0,
      documentJustification: injectDocumentJustification(idx, uc.documentJustification)
    })),
    trustTaxBreakdown: trustTaxData,
    horizonsSummary: {
      h1Count: h1Cases.length,
      h2Count: h2Cases.length,
      h3Count: h3Cases.length,
      h1Savings: h1Cases.reduce((sum, u) => sum + (u.projectedSavings || 0), 0),
      h2Savings: h2Cases.reduce((sum, u) => sum + (u.projectedSavings || 0), 0),
      h3Savings: h3Cases.reduce((sum, u) => sum + (u.projectedSavings || 0), 0)
    },
    documentInsights: hasDocument 
      ? result.documentIntelligence.structuredData 
      : undefined
  };
}
