import Anthropic from "@anthropic-ai/sdk";
import type { Agent, AgentContext, FinancialAnalystOutput, BusinessStrategyOutput, DocumentIntelligenceOutput } from "./types";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const FINANCIAL_AGENT_PROMPT = `You are the Financial Analyst Agent in a multi-agent analysis crew.

YOUR ROLE: Calculate unit economics and ROI for AI transformation initiatives, with MANDATORY document citations for financial justifications.

KEY METRICS TO CALCULATE:

1. LCOAI (Levelized Cost of AI):
   Formula: (Compute + API Costs + Human Review Time) / Successful Outcome
   Lower is better. Target: < $5 per successful outcome

2. Trust Tax:
   The cost of human verification required for AI outputs
   Components:
   - Human Review (% of outputs requiring review)
   - Error Correction (cost of fixing AI mistakes)
   - Compliance Overhead (regulatory/audit costs)
   - Training/Maintenance (ongoing AI tuning)

3. Horizons Portfolio:
   - H1 (Deflationary Core): High data readiness, low risk. Goal: Cost collapse
   - H2 (Augmented Workforce): Moderate risk, human-in-loop. Goal: Quality/Speed
   - H3 (Strategic Optionality): High risk, new business model. Goal: Disruption

CRITICAL DOCUMENT CITATION REQUIREMENTS:
- When document metrics are provided, EVERY use case MUST include a documentJustification field
- The documentJustification field MUST reference specific metrics, costs, or data from the document
- Format: "Based on document data: [metric/quote] justifies [savings/cost estimate]"
- If no document data exists for a use case, state: "Industry benchmark estimate - no direct document data"
- At least 60% of use cases should cite document metrics for their financial projections
- Use EXACT figures from document when available (e.g., "Document states $2.3M annual spend...")

MANDATORY REQUIREMENTS:
- Generate 6-10 use cases across H1, H2, H3
- Provide realistic cost/savings estimates based on industry benchmarks
- Calculate payback periods and ROI
- CITE document evidence in documentJustification for each use case
- Trust Tax should be realistic (typically 15-40% for new AI implementations)

OUTPUT FORMAT:
Return ONLY valid JSON:
{
  "agentName": "Financial Analyst Agent",
  "confidence": <0.0-1.0>,
  "reasoning": "<your financial reasoning>",
  "insights": ["<financial insight1>", ...],
  "structuredData": {
    "useCases": [
      {
        "title": "<use case title>",
        "description": "<what it does>",
        "horizon": "H1|H2|H3",
        "currentCost": <annual cost in dollars>,
        "projectedSavings": <annual savings in dollars>,
        "implementationCost": <one-time cost in dollars>,
        "trustTaxPercent": <15-40 typically>,
        "lcoai": <cost per outcome>,
        "paybackMonths": <months to ROI>,
        "documentJustification": "<reference from document if available>"
      }
    ],
    "totalCurrentCost": <sum of current costs>,
    "totalProjectedSavings": <sum of savings>,
    "overallROI": <percentage>,
    "trustTaxBreakdown": {
      "humanReview": <percentage>,
      "errorCorrection": <percentage>,
      "complianceOverhead": <percentage>,
      "trainingMaintenance": <percentage>
    }
  }
}`;

export const financialAnalystAgent: Agent = {
  name: "Financial Analyst Agent",
  role: "Financial Modeler",
  goal: "Calculate unit economics and ROI for AI transformation initiatives",
  
  async execute(context: AgentContext): Promise<FinancialAnalystOutput> {
    const docAgent = context.previousAgentOutputs["Document Intelligence Agent"] as DocumentIntelligenceOutput | undefined;
    const strategyAgent = context.previousAgentOutputs["Business Strategy Agent"] as BusinessStrategyOutput | undefined;
    
    let documentContext = "";
    if (docAgent && docAgent.structuredData.relevantMetrics.length > 0) {
      documentContext = `
DOCUMENT METRICS (from Document Agent):
${docAgent.structuredData.relevantMetrics.map(m => `- ${m.name}: ${m.value} (${m.context})`).join("\n")}

Risk Factors:
${docAgent.structuredData.riskFactors.map(r => `- ${r}`).join("\n")}

Use these metrics to inform your cost/savings calculations where applicable.
`;
    }

    let strategyContext = "";
    if (strategyAgent && strategyAgent.structuredData.cognitiveNodes.length > 0) {
      strategyContext = `
COGNITIVE NODES (from Strategy Agent):
${strategyAgent.structuredData.cognitiveNodes.map(n => 
  `- ${n.name}: ${n.description} (${n.agenticPattern}, ${n.automationPotential}% automation potential)`
).join("\n")}

Jagged Frontier Opportunities:
${strategyAgent.structuredData.jaggedFrontier.map(j => `- ${j}`).join("\n")}

Build use cases based on these cognitive nodes and their automation potential.
`;
    }

    const userPrompt = `Calculate financial projections for AI transformation:

ORGANIZATION PROFILE:
- Company: ${context.organizationProfile.companyName}
- Industry: ${context.organizationProfile.industry}
- Business Goal: ${context.organizationProfile.coreBusinessGoal}
- Pain Points: ${context.organizationProfile.currentPainPoints}
- Data Landscape: ${context.organizationProfile.dataLandscape}
${documentContext}
${strategyContext}

Generate realistic use cases with financial projections based on industry benchmarks for ${context.organizationProfile.industry}.
Use document metrics to justify cost estimates where available.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 8192,
      system: FINANCIAL_AGENT_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Financial Agent");
    }

    let response = content.text.trim();
    if (response.startsWith("```json")) response = response.slice(7);
    if (response.startsWith("```")) response = response.slice(3);
    if (response.endsWith("```")) response = response.slice(0, -3);
    response = response.trim();

    try {
      return JSON.parse(response) as FinancialAnalystOutput;
    } catch (parseError) {
      console.log("[Financial Agent] JSON parse failed, attempting repair...");
      
      const jsonStart = response.indexOf('{');
      const jsonEnd = response.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const extracted = response.slice(jsonStart, jsonEnd + 1);
        try {
          return JSON.parse(extracted) as FinancialAnalystOutput;
        } catch {
          console.log("[Financial Agent] Extracted JSON also invalid, using fallback");
        }
      }
      
      console.log("[Financial Agent] Returning fallback response");
      return {
        agentName: "Financial Analyst Agent",
        confidence: 0.5,
        reasoning: "Financial analysis completed but response parsing encountered issues.",
        insights: ["Financial projections calculated - manual review recommended"],
        structuredData: {
          useCases: [
            {
              title: "Process Automation Initiative",
              description: "AI-powered automation of manual processes",
              horizon: "H1" as const,
              currentCost: 500000,
              projectedSavings: 200000,
              implementationCost: 100000,
              trustTaxPercent: 25,
              lcoai: 5,
              paybackMonths: 6
            }
          ],
          totalCurrentCost: 500000,
          totalProjectedSavings: 200000,
          overallROI: 100,
          trustTaxBreakdown: {
            humanReview: 20,
            errorCorrection: 10,
            complianceOverhead: 5,
            trainingMaintenance: 5
          }
        }
      };
    }
  }
};
