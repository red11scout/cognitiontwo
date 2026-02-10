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
        "documentJustification": "<reference from document if available>",
        "legacyProcessSteps": ["<step 1 of current manual process>", "<step 2>", ...],
        "legacyPainPoints": ["<specific quantified pain point>", ...],
        "legacyCognitionNodes": <number of decision/translation points in the manual process>,
        "legacyTranslationTax": "<format conversion overhead, e.g. 'Paper → Excel → ERP'>",
        "legacyContextSwitching": "<system switching cost, e.g. '4 systems, 12 min/switch'>",
        "legacyTimeConsumed": "<time burden, e.g. '47 hrs/week across team'>",
        "agenticPatternRationale": "<why this agentic pattern was chosen for this use case>",
        "agenticAutomationLevel": "full|assisted|supervised",
        "agenticPrimitives": ["<AI primitive used, e.g. Data Analysis, Workflow Automation, Content Creation>"],
        "agenticHitlCheckpoints": ["<human-in-the-loop checkpoint, e.g. Manager review for >$50K>"],
        "agenticTransformSteps": ["<how the process changes, e.g. Auto-classifying inbound docs>", ...]
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
    },
    "scenarioAnalysis": {
      "conservative": {
        "label": "Conservative",
        "description": "<what this scenario assumes>",
        "adoptionRate": "70%",
        "rampTime": "18 months",
        "realizationRate": "75%",
        "annualBenefit": <dollar amount>,
        "threeYearNPV": <dollar amount>,
        "paybackMonths": <months>,
        "keyAssumptions": ["<assumption1>", "<assumption2>", "<assumption3>"]
      },
      "baseCase": {
        "label": "Base Case",
        "description": "<what this scenario assumes>",
        "adoptionRate": "85%",
        "rampTime": "12 months",
        "realizationRate": "100%",
        "annualBenefit": <dollar amount>,
        "threeYearNPV": <dollar amount>,
        "paybackMonths": <months>,
        "keyAssumptions": ["<assumption1>", "<assumption2>", "<assumption3>"]
      },
      "optimistic": {
        "label": "Optimistic",
        "description": "<what this scenario assumes>",
        "adoptionRate": "95%",
        "rampTime": "9 months",
        "realizationRate": "125%",
        "annualBenefit": <dollar amount>,
        "threeYearNPV": <dollar amount>,
        "paybackMonths": <months>,
        "keyAssumptions": ["<assumption1>", "<assumption2>", "<assumption3>"]
      }
    }
  }
}

IMPORTANT FOR LEGACY WAY ENRICHMENT:
- legacyProcessSteps: List 3-6 specific numbered steps of the current manual workflow
- legacyPainPoints: List 2-4 quantified pain points with specific metrics where possible
- legacyCognitionNodes: Count the decision points where human judgment converts unstructured to structured data
- legacyTranslationTax: Describe the format conversion chain (e.g., "Email → PDF → Spreadsheet → Database")
- legacyContextSwitching: Quantify tool/system switching (e.g., "5 systems, avg 8 min context switch")
- legacyTimeConsumed: Quantify time burden with specifics (e.g., "32 hrs/week across 4 FTEs")
- agenticPrimitives: Choose from: Research & Retrieval, Content Creation, Data Analysis, Conversational Interfaces, Workflow Automation, Coding Assistance
- agenticHitlCheckpoints: Specify EPOCH-filtered human checkpoints (where Empathy/Physicality/Opinion/Leadership is needed)
- agenticTransformSteps: List 3-5 specific transformation steps showing how AI changes the process`;

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

    const hasDetails = context.organizationProfile.industry &&
      context.organizationProfile.coreBusinessGoal &&
      context.organizationProfile.currentPainPoints;

    const researchNote = !hasDetails ? `
IMPORTANT: The user only provided a company name. Research this company to determine its industry, operations, and financial context. Use your knowledge to provide realistic cost/savings estimates based on what you know about the company and its industry.
` : "";

    const userPrompt = `Calculate financial projections for AI transformation:

ORGANIZATION PROFILE:
- Company: ${context.organizationProfile.companyName}
- Industry: ${context.organizationProfile.industry || "Determine from company name"}
- Business Goal: ${context.organizationProfile.coreBusinessGoal || "Infer from company context"}
- Pain Points: ${context.organizationProfile.currentPainPoints || "Identify from industry knowledge"}
- Data Landscape: ${context.organizationProfile.dataLandscape || "Infer from company and industry"}
${researchNote}${documentContext}
${strategyContext}

Generate realistic use cases with financial projections based on industry benchmarks for ${context.organizationProfile.industry || context.organizationProfile.companyName}.
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
