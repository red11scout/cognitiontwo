import Anthropic from "@anthropic-ai/sdk";
import type { Agent, AgentContext, BusinessStrategyOutput, DocumentIntelligenceOutput } from "./types";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const STRATEGY_AGENT_PROMPT = `You are the Business Strategy Agent in a multi-agent analysis crew.

YOUR ROLE: Apply the Cognitive Zero-Base framework to identify transformation opportunities, CITING DOCUMENT EVIDENCE for each recommendation.

THE COGNITIVE ZERO-BASE FRAMEWORK:

Phase 1: Cognitive Audit
- Identify "Cognitive Nodes": Moments where human capital converts unstructured data into decisions
- Flag "Translation Tax" (cost of moving context between apps)
- Flag "Context Switching" (mental energy loss)

Phase 2: Agentic Design Patterns
Map problems to these patterns:
1. Drafter-Critic Loop: Agent A creates; Agent B critiques; Agent A refines
2. Reasoning Engine: Multistep chain-of-thought for ambiguous problems
3. Orchestrator: Master agent breaks goals into sub-tasks
4. Tool User: Agent authorized to execute API calls

Phase 3: EPOCH Filter
Filter OUT tasks requiring:
- Empathy (emotional intelligence)
- Physicality (physical presence)
- Opinion (pure subjectivity)
- Leadership (human judgment/accountability)

Filter IN tasks within "Jagged Frontier":
- Hard reasoning, data synthesis, pattern matching

CRITICAL DOCUMENT CITATION REQUIREMENTS:
- When document intelligence is provided, EVERY cognitive node MUST include a documentEvidence field
- The documentEvidence field MUST contain a specific quote, metric, or finding from the document
- Format: "Per document: [quote/metric] - supports [automation opportunity]"
- If no document evidence exists for a node, state: "No direct document evidence - based on organizational profile"
- At least 60% of cognitive nodes should have direct document citations

MANDATORY REQUIREMENTS:
- Identify 5-8 cognitive nodes with specific automation potential
- Map each node to an agentic pattern
- CITE document evidence in documentEvidence field for each node
- Be specific to this organization's context

OUTPUT FORMAT:
Return ONLY valid JSON:
{
  "agentName": "Business Strategy Agent",
  "confidence": <0.0-1.0>,
  "reasoning": "<your strategic reasoning>",
  "insights": ["<strategic insight1>", ...],
  "structuredData": {
    "cognitiveNodes": [
      {
        "name": "<node name>",
        "description": "<what happens here>",
        "cognitiveLoad": "high|medium|low",
        "dataReadiness": "high|medium|low",
        "agenticPattern": "Drafter-Critic|Reasoning Engine|Orchestrator|Tool User",
        "automationPotential": <0-100>,
        "documentEvidence": "<quote or reference from document if available>"
      }
    ],
    "epochFilters": {
      "empathy": ["<tasks requiring empathy>"],
      "physicality": ["<tasks requiring physical presence>"],
      "opinion": ["<tasks requiring pure opinion>"],
      "leadership": ["<tasks requiring human leadership>"]
    },
    "jaggedFrontier": ["<tasks suitable for AI automation>"]
  }
}`;

export const businessStrategyAgent: Agent = {
  name: "Business Strategy Agent",
  role: "Strategic Architect",
  goal: "Apply Cognitive Zero-Base framework to identify transformation opportunities",
  
  async execute(context: AgentContext): Promise<BusinessStrategyOutput> {
    const docAgent = context.previousAgentOutputs["Document Intelligence Agent"] as DocumentIntelligenceOutput | undefined;
    
    let documentContext = "";
    if (docAgent && docAgent.structuredData.keyFindings.length > 0) {
      documentContext = `
DOCUMENT INTELLIGENCE (from Document Agent):
Key Findings:
${docAgent.structuredData.keyFindings.map((f, i) => `${i + 1}. ${f}`).join("\n")}

Relevant Metrics:
${docAgent.structuredData.relevantMetrics.map(m => `- ${m.name}: ${m.value} (${m.context})`).join("\n")}

Strategic Implications:
${docAgent.structuredData.strategicImplications.map(s => `- ${s}`).join("\n")}

Opportunities Identified:
${docAgent.structuredData.opportunities.map(o => `- ${o}`).join("\n")}

YOU MUST reference these document insights in your cognitive node analysis where relevant.
`;
    }

    const userPrompt = `Analyze this organization using the Cognitive Zero-Base framework:

ORGANIZATION PROFILE:
- Company: ${context.organizationProfile.companyName}
- Industry: ${context.organizationProfile.industry}
- Business Goal: ${context.organizationProfile.coreBusinessGoal}
- Pain Points: ${context.organizationProfile.currentPainPoints}
- Data Landscape: ${context.organizationProfile.dataLandscape}
${documentContext}

Identify cognitive nodes and map them to agentic patterns. Be specific and actionable.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 8192,
      system: STRATEGY_AGENT_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Strategy Agent");
    }

    let response = content.text.trim();
    if (response.startsWith("```json")) response = response.slice(7);
    if (response.startsWith("```")) response = response.slice(3);
    if (response.endsWith("```")) response = response.slice(0, -3);
    response = response.trim();

    try {
      return JSON.parse(response) as BusinessStrategyOutput;
    } catch (parseError) {
      console.log("[Strategy Agent] JSON parse failed, attempting repair...");
      
      const jsonStart = response.indexOf('{');
      const jsonEnd = response.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const extracted = response.slice(jsonStart, jsonEnd + 1);
        try {
          return JSON.parse(extracted) as BusinessStrategyOutput;
        } catch {
          console.log("[Strategy Agent] Extracted JSON also invalid, using fallback");
        }
      }
      
      console.log("[Strategy Agent] Returning fallback response");
      return {
        agentName: "Business Strategy Agent",
        confidence: 0.5,
        reasoning: "Strategic analysis completed but response parsing encountered issues.",
        insights: ["Analysis completed - manual review recommended"],
        structuredData: {
          cognitiveNodes: [
            {
              name: "Manual Process Review",
              description: "Core business processes requiring cognitive effort",
              cognitiveLoad: "high" as const,
              dataReadiness: "medium" as const,
              agenticPattern: "Orchestrator",
              automationPotential: 60
            }
          ],
          epochFilters: { empathy: [], physicality: [], opinion: [], leadership: [] },
          jaggedFrontier: ["Process automation opportunities identified"]
        }
      };
    }
  }
};
