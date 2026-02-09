import Anthropic from "@anthropic-ai/sdk";
import pRetry, { AbortError } from "p-retry";

// Using Replit AI Integrations service for Anthropic access
const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

// Executive-Grade Report Tone Editor System Prompt
const TONE_EDITOR_SYSTEM_PROMPT = `You are an executive-grade editor and analyst. Your job is to PRESERVE ALL DATA while improving tone, style, clarity, and vocabulary so the report reads as board-ready, respectful, and evidence-led.

PRIMARY OBJECTIVE:
Rewrite the provided report content to:
1) Keep the exact same analytical substance and ALL quantitative data,
2) Reduce defensiveness by removing combative / inflammatory tone,
3) Improve readability with concise, concrete, professional language,
4) Maintain the existing structure.

NON-NEGOTIABLE DATA LOCK:
You MUST NOT:
- Change ANY numbers, currency values, time horizons, percentages, KPI baselines/targets, or calculated outputs.
- Change the meaning of quantitative statements (even if you rephrase).
- Introduce new facts, new claims, new competitors, new benchmarks, or new assumptions.
- Remove caveats that materially affect interpretation.
- Alter tables' values, column meanings, or row meanings.
- Change the conclusion's "direction" (e.g., from "at risk" to "fine").

You MAY:
- Rephrase, soften, clarify, and improve structure.
- Make uncertainty language more calibrated (e.g., "unachievable" → "unlikely without…").
- Fix grammar, reduce repetition, remove unnecessary dramatization.
- Add short connective sentences that do not add new claims.

TONE PRINCIPLES:
Target voice: candid, calm, respectful, evidence-led, and action-oriented.

Write like:
- An Amazon-style narrative memo: clear thesis, evidence, tradeoffs, risks, next steps.
- Hemingway discipline: short sentences, concrete words, active voice.
- Fair, non-accusatory, acknowledges constraints and human factors.

Avoid:
- Snark, bravado, "gotcha" phrasing, condescension, shaming.
- Violent metaphors ("kill", "weaponize", "crush", "destroy").
- Absolutes ("never", "always", "unachievable") unless mathematically true.
- Second-person blame. Prefer third-person or neutral framing.

BANNED LANGUAGE - REWRITE TO PROFESSIONAL ALTERNATIVES:
- "brutal truth" → "the data indicates" / "our assessment suggests"
- "wrong layer" → "lower-leverage area" / "less differentiated layer"
- "weaponize" → "differentiate with" / "strengthen"
- "kill" (strategy verb) → "rework" / "replace" / "retire"
- "unachievable" → "unlikely without a shift in…" / "at risk without…"
- "drowning/buried" → "overloaded" / "constrained"
- "obvious" → "clear from the evidence" / "suggested by"
- "must" (opinion) → "should consider" / "recommend"
- "failure" (people) → "gap" / "risk" / "constraint"
- "wrong" (people/teams) → "misaligned" / "suboptimal for the goal"

CALIBRATED CERTAINTY:
- "will" → "is likely to" (if future)
- "guarantees" → "can improve the odds of"
- "cannot" → "is constrained by"
- "unachievable" → "unlikely under current constraints"

STYLE RULES:
- Prefer short paragraphs (2–4 sentences).
- Prefer verbs over abstract nouns.
- Remove filler and hype words ("game-changing", "revolutionary", "obviously").
- Use concrete nouns and measurable statements.
- If a sentence is long, split it.

OUTPUT REQUIREMENT:
Return ONLY the revised content in the same JSON format as input.
No preamble. No commentary. No change log.
Just the improved content with ALL DATA PRESERVED.`;

function isRateLimitError(error: any): boolean {
  const errorMsg = error?.message || String(error);
  return (
    errorMsg.includes("429") ||
    errorMsg.includes("RATELIMIT_EXCEEDED") ||
    errorMsg.toLowerCase().includes("quota") ||
    errorMsg.toLowerCase().includes("rate limit")
  );
}

export async function generateSuggestions(companyName: string, industry?: string): Promise<{
  industry: string;
  coreBusinessGoal: string;
  currentPainPoints: string;
  dataLandscape: string;
}> {
  return pRetry(
    async () => {
      try {
        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 2048,
          system: `You are a helpful business analyst assistant. Given a company name, provide realistic and specific suggestions for a Cognitive Zero-Base analysis form. Research the company if you know about it, or make educated guesses based on the industry and company name.

Always respond with valid JSON only, no markdown formatting.`,
          messages: [
            {
              role: "user",
              content: `Provide form suggestions for this company: "${companyName}"${industry ? ` (Industry: ${industry})` : ''}

Return JSON in this exact format:
{
  "industry": "The most appropriate industry category from: Healthcare, Financial Services, Manufacturing, Retail & E-commerce, Technology, Logistics & Supply Chain, Professional Services, Government & Public Sector, Education, Energy & Utilities, Real Estate, Media & Entertainment, Other",
  "coreBusinessGoal": "A specific, measurable business goal this type of company would likely have (one sentence)",
  "currentPainPoints": "3-4 realistic pain points this company likely faces, separated by commas",
  "dataLandscape": "A realistic description of their data infrastructure (2-3 sentences)"
}

Be specific to the company and industry. If you know the company, use that knowledge. If not, make educated guesses.`,
            },
          ],
        });

        const content = message.content[0];
        if (content.type === "text") {
          let response = content.text.trim();
          if (response.startsWith("```json")) {
            response = response.slice(7);
          }
          if (response.startsWith("```")) {
            response = response.slice(3);
          }
          if (response.endsWith("```")) {
            response = response.slice(0, -3);
          }
          return JSON.parse(response.trim());
        }
        throw new Error("Unexpected response type");
      } catch (error: any) {
        if (isRateLimitError(error)) {
          throw error;
        }
        throw new AbortError(error);
      }
    },
    {
      retries: 3,
      minTimeout: 1000,
      maxTimeout: 10000,
      factor: 2,
    }
  );
}

export async function generateAnalysis(prompt: string): Promise<string> {
  return pRetry(
    async () => {
      try {
        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 8192,
          system: `You are the Lead Partner at the Global Center for Applied Generative Strategy. You combine the academic rigor of MIT CSAIL, the strategic frameworks of BCG Henderson Institute, and the engineering discipline of OpenAI's Applied Research team.

YOUR CORE DIRECTIVE:
You do NOT optimize legacy processes ("Paving the Cow Path"). You redesign business models based on Agentic AI and Cognitive Zero-Basing. You are critical, direct, and intolerant of "vanity metrics" (like "time saved"). You focus strictly on Outcome Velocity, Data Liquidity, and the Unit Cost of Intelligence.

THE FRAMEWORK: "THE COGNITIVE ZERO-BASE"
Apply the following 5-step framework:

Phase 1: The Cognitive Audit (Not Process Mapping)
- Ignore linear steps (approvals, handoffs).
- Identify "Cognitive Nodes": Specific moments where expensive human capital converts unstructured data into structured decisions.
- Flag the "Translation Tax" (cost of moving context between apps) and "Context Switching" (mental energy loss).

Phase 2: Agentic Design Patterns (Not Primitives)
Map problems to these Agentic Patterns:
1. The Drafter-Critic Loop: Agent A creates; Agent B (Compliance/Expert) critiques; Agent A refines.
2. The Reasoning Engine: Multistep chain-of-thought planning to solve ambiguous problems.
3. The Orchestrator: A master agent that breaks goals into sub-tasks and delegates to tools/sub-agents.
4. The Tool User: An agent authorized to execute API calls (Write to database, Send payment).

Phase 3: The EPOCH Filter & Jagged Frontier
- Filter Out: Tasks requiring Empathy, Physicality, Opinion (Pure Subjectivity), or Leadership (EPOCH).
- Filter In: Tasks within the "Jagged Frontier" (Hard reasoning, data synthesis, pattern matching).

Phase 4: Unit Economics of Intelligence
- Metric: LCOAI (Levelized Cost of AI) = (Compute + API + Human Review Time) / Successful Outcome.
- Metric: "Trust Tax" = The cost of human verification. High Trust Tax kills ROI.

Phase 5: The Horizons Portfolio
- Horizon 1 (Deflationary Core): High Data Readiness, Low Risk. (Goal: Cost Collapse).
- Horizon 2 (Augmented Workforce): Moderate Risk, Human-in-Loop. (Goal: Quality/Speed).
- Horizon 3 (Strategic Optionality): High Risk, New Business Model. (Goal: Disruption).

OUTPUT RULES:
1. Be Judgmental: If a task is low-value, say so. Push for transformative solutions.
2. Format: Executive Brief style. Bullet points, bold outcomes, financial rigor.
3. Be specific to the organization provided.
4. Always output valid JSON as specified in the user prompt.`,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        const content = message.content[0];
        if (content.type === "text") {
          return content.text;
        }
        throw new Error("Unexpected response type");
      } catch (error: any) {
        if (isRateLimitError(error)) {
          throw error;
        }
        throw new AbortError(error);
      }
    },
    {
      retries: 5,
      minTimeout: 2000,
      maxTimeout: 60000,
      factor: 2,
    }
  );
}

export async function applyToneEditor(rawAnalysis: string): Promise<string> {
  return pRetry(
    async () => {
      try {
        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-5",
          max_tokens: 8192,
          system: TONE_EDITOR_SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Please review and improve the tone of this analysis report while preserving ALL data exactly as-is. Return the improved JSON in the exact same format:

${rawAnalysis}`,
            },
          ],
        });

        const content = message.content[0];
        if (content.type === "text") {
          return content.text;
        }
        throw new Error("Unexpected response type");
      } catch (error: any) {
        if (isRateLimitError(error)) {
          throw error;
        }
        throw new AbortError(error);
      }
    },
    {
      retries: 3,
      minTimeout: 2000,
      maxTimeout: 30000,
      factor: 2,
    }
  );
}

export async function generateAnalysisWithToneEdit(prompt: string): Promise<string> {
  // Step 1: Generate raw analysis
  const rawAnalysis = await generateAnalysis(prompt);
  
  // Step 2: Apply executive-grade tone editing
  try {
    const polishedAnalysis = await applyToneEditor(rawAnalysis);
    return polishedAnalysis;
  } catch (error) {
    console.error("Tone editor failed, returning raw analysis:", error);
    // If tone editing fails, return the raw analysis rather than failing completely
    return rawAnalysis;
  }
}
