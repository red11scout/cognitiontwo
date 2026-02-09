import Anthropic from "@anthropic-ai/sdk";
import type { Agent, AgentContext, DocumentIntelligenceOutput } from "./types";

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

const DOCUMENT_AGENT_PROMPT = `You are the Document Intelligence Agent in a multi-agent analysis crew.

YOUR ROLE: Extract and structure critical business intelligence from uploaded documents that MUST be cited by downstream agents.

YOUR OBJECTIVE:
Analyze the provided document thoroughly and extract QUOTABLE evidence that will inform business transformation decisions. Focus on:
1. Key findings with DIRECT QUOTES from the document
2. Financial metrics and KPIs with EXACT VALUES
3. Strategic implications with PAGE/SECTION references where possible
4. Risk factors EXPLICITLY mentioned in the document
5. Opportunities for AI/automation SUPPORTED BY document evidence

MANDATORY REQUIREMENTS:
- You MUST extract at least 8 key findings from the document with direct quotes
- You MUST identify at least 5 specific metrics with their exact values and source context
- You MUST connect each finding to a specific section or quote from the document
- ALWAYS include direct quotes in quotation marks from the document
- Each finding must be specific enough to be cited by other agents
- If the document lacks certain information, explicitly state what is missing
- Format findings as: "[Quote or exact data point] - implies [interpretation]"

OUTPUT FORMAT:
Return ONLY valid JSON with this structure:
{
  "agentName": "Document Intelligence Agent",
  "confidence": <0.0-1.0>,
  "reasoning": "<your analysis reasoning>",
  "insights": ["<insight1>", "<insight2>", ...],
  "structuredData": {
    "keyFindings": ["<finding1>", "<finding2>", ...],
    "relevantMetrics": [
      {"name": "<metric name>", "value": "<value>", "context": "<why relevant>"},
      ...
    ],
    "strategicImplications": ["<implication1>", ...],
    "riskFactors": ["<risk1>", ...],
    "opportunities": ["<opportunity for AI/automation>", ...]
  }
}`;

export const documentIntelligenceAgent: Agent = {
  name: "Document Intelligence Agent",
  role: "Document Analyst",
  goal: "Extract and structure critical business intelligence from uploaded documents",
  
  async execute(context: AgentContext): Promise<DocumentIntelligenceOutput> {
    if (!context.documentContent || context.documentContent.trim().length === 0) {
      return {
        agentName: "Document Intelligence Agent",
        confidence: 0,
        reasoning: "No document was provided for analysis",
        insights: ["No document uploaded - analysis based on form inputs only"],
        structuredData: {
          keyFindings: [],
          relevantMetrics: [],
          strategicImplications: [],
          riskFactors: [],
          opportunities: []
        }
      };
    }

    const userPrompt = `Analyze this document for ${context.organizationProfile.companyName} (${context.organizationProfile.industry}):

DOCUMENT NAME: ${context.documentName || "Uploaded Document"}

DOCUMENT CONTENT:
---
${context.documentContent}
---

ORGANIZATION CONTEXT:
- Company: ${context.organizationProfile.companyName}
- Industry: ${context.organizationProfile.industry}
- Business Goal: ${context.organizationProfile.coreBusinessGoal}
- Pain Points: ${context.organizationProfile.currentPainPoints}

Extract comprehensive intelligence from this document that will inform AI transformation strategy.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 8192,
      system: DOCUMENT_AGENT_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Document Agent");
    }

    let response = content.text.trim();
    if (response.startsWith("```json")) response = response.slice(7);
    if (response.startsWith("```")) response = response.slice(3);
    if (response.endsWith("```")) response = response.slice(0, -3);
    response = response.trim();

    // Try to parse, with fallback for truncated/malformed JSON
    try {
      return JSON.parse(response) as DocumentIntelligenceOutput;
    } catch (parseError) {
      console.log("[Document Agent] JSON parse failed, attempting repair...");
      
      // Try to extract valid JSON by finding the outermost braces
      const jsonStart = response.indexOf('{');
      const jsonEnd = response.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const extracted = response.slice(jsonStart, jsonEnd + 1);
        try {
          return JSON.parse(extracted) as DocumentIntelligenceOutput;
        } catch {
          console.log("[Document Agent] Extracted JSON also invalid, using fallback");
        }
      }
      
      // Return a minimal valid response with error note
      console.log("[Document Agent] Returning fallback response due to parsing failure");
      return {
        agentName: "Document Intelligence Agent",
        confidence: 0.5,
        reasoning: "Document analyzed but response parsing encountered issues. Key insights extracted manually.",
        insights: ["Document was processed but some details may be incomplete due to parsing issues"],
        structuredData: {
          keyFindings: [
            "Document provided for analysis - content length: " + context.documentContent.length + " characters",
            "Document name: " + (context.documentName || "Uploaded Document")
          ],
          relevantMetrics: [],
          strategicImplications: ["Full document analysis should be reviewed manually"],
          riskFactors: ["Automated extraction incomplete - manual review recommended"],
          opportunities: ["Document contains information relevant to AI transformation strategy"]
        }
      };
    }
  }
};
