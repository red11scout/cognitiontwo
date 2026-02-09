import type { Express } from "express";
import { createServer, type Server } from "http";
import { generateSuggestions, applyToneEditor } from "./anthropic";
import { organizationProfileSchema } from "@shared/schema";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { runAgentCrew, convertCrewResultToAnalysis } from "./agents";

// Configure multer for PDF uploads (2MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  }
});
import { z } from "zod";

// Validation schemas for calculation endpoints
const trustTaxInputSchema = z.object({
  currentHumanCost: z.number().positive("Current human cost must be positive"),
  aiEfficiencyPercent: z.number().min(0).max(100).default(75),
  trustTaxPercent: z.number().min(0).max(100).default(15),
});

const cognitiveNodeSchema = z.object({
  humanCognitiveLoad: z.number().min(1).max(10),
  aiCognitiveLoad: z.number().min(1).max(10),
});

const cognitiveMetricsInputSchema = z.object({
  cognitiveNodes: z.array(cognitiveNodeSchema).min(1),
});

const useCaseSchema = z.object({
  estimatedSavings: z.string(),
  dataReadiness: z.number().min(1).max(10),
  businessValue: z.number().min(1).max(10),
  implementationRisk: z.number().min(1).max(10),
  horizon: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

const totalSavingsInputSchema = z.object({
  useCases: z.array(useCaseSchema).min(1),
});

const roiInputSchema = z.object({
  estimatedSavings: z.number().positive(),
  implementationCost: z.number().positive(),
  yearsToPayback: z.number().positive().default(1),
});

const formulaInputSchema = z.object({
  formula: z.string().startsWith("=", "Formula must start with '='"),
});
import { storage } from "./storage";
import { getCalculationEngine } from "./calculation-engine";
import { generatePdfFromUrl, isPdfAvailable } from "./pdf-generator";
import { dubService } from "./dub-service";
import type {
  OrganizationProfile,
  AnalysisResult,
  CognitiveNode,
  UseCase,
  TrustTaxBreakdown,
  CognitiveLoadHeatmapData,
  HorizonsBubbleData,
} from "@shared/schema";
import { randomUUID } from "crypto";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  function transformAnalysisToResult(analysis: any) {
    return {
      id: analysis.id,
      organizationProfile: {
        companyName: analysis.companyName,
        industry: analysis.industry,
        coreBusinessGoal: analysis.coreBusinessGoal,
        currentPainPoints: analysis.currentPainPoints,
        dataLandscape: analysis.dataLandscape,
      },
      executiveSummary: analysis.executiveSummary,
      cognitiveNodes: analysis.cognitiveNodes,
      useCases: analysis.useCases,
      trustTaxBreakdown: analysis.trustTaxBreakdown,
      cognitiveLoadData: analysis.cognitiveLoadData,
      trustTaxData: analysis.trustTaxData,
      horizonsBubbleData: analysis.horizonsBubbleData,
      createdAt: analysis.createdAt?.toISOString?.() || analysis.createdAt || new Date().toISOString(),
    };
  }

  // Get saved analyses by owner token
  app.get("/api/analyses", async (req, res) => {
    try {
      const ownerToken = (req.query.ownerToken as string) || (req.headers["x-owner-token"] as string);
      if (!ownerToken) {
        return res.status(400).json({ error: "Owner token required" });
      }
      const analyses = await storage.getAnalysesByOwner(ownerToken);
      res.json(analyses.map(transformAnalysisToResult));
    } catch (error) {
      console.error("Error fetching analyses:", error);
      res.status(500).json({ error: "Failed to fetch analyses" });
    }
  });

  // Get the most recent analysis for an owner (used for timeout recovery)
  app.get("/api/analyses/latest", async (req, res) => {
    try {
      const ownerToken = req.query.ownerToken as string;
      if (!ownerToken) {
        return res.status(400).json({ error: "Owner token required" });
      }
      const allAnalyses = await storage.getAnalysesByOwner(ownerToken);
      if (allAnalyses.length === 0) {
        return res.status(404).json({ error: "No analyses found" });
      }
      const latest = allAnalyses[0];
      res.json(transformAnalysisToResult(latest));
    } catch (error) {
      console.error("Error fetching latest analysis:", error);
      res.status(500).json({ error: "Failed to fetch latest analysis" });
    }
  });

  // Get a specific analysis
  app.get("/api/analyses/:id", async (req, res) => {
    try {
      const analysis = await storage.getAnalysis(req.params.id);
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }
      res.json(transformAnalysisToResult(analysis));
    } catch (error) {
      console.error("Error fetching analysis:", error);
      res.status(500).json({ error: "Failed to fetch analysis" });
    }
  });

  // Delete an analysis
  app.delete("/api/analyses/:id", async (req, res) => {
    try {
      const ownerToken = req.headers["x-owner-token"] as string;
      if (!ownerToken) {
        return res.status(400).json({ error: "Owner token required" });
      }
      const deleted = await storage.deleteAnalysis(req.params.id, ownerToken);
      if (!deleted) {
        return res.status(404).json({ error: "Analysis not found or unauthorized" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting analysis:", error);
      res.status(500).json({ error: "Failed to delete analysis" });
    }
  });

  // Generate PDF report using Puppeteer
  app.post("/api/reports/:id/pdf", async (req, res) => {
    try {
      const pdfAvailable = await isPdfAvailable();
      if (!pdfAvailable) {
        return res.status(503).json({ 
          error: "PDF generation unavailable",
          details: "PDF generation is not available in this environment. This feature requires Chromium which may not be available in deployed environments."
        });
      }

      const analysisId = req.params.id;
      const analysis = await storage.getAnalysis(analysisId);
      
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      const protocol = req.headers["x-forwarded-proto"] || "http";
      const host = req.headers.host || "localhost:5000";
      const reportUrl = `${protocol}://${host}/report-print/${analysisId}`;
      
      console.log(`Generating PDF from: ${reportUrl}`);
      
      const pdfBuffer = await generatePdfFromUrl(reportUrl, 60000);
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition", 
        `attachment; filename="${analysis.companyName || "analysis"}-report.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("PDF generation error:", error);
      if (error.message?.includes("not available")) {
        return res.status(503).json({ 
          error: "PDF generation unavailable",
          details: error.message 
        });
      }
      res.status(500).json({ 
        error: "Failed to generate PDF", 
        details: error.message 
      });
    }
  });

  // Get all templates
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getAllTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  // Get a specific template
  app.get("/api/templates/:id", async (req, res) => {
    try {
      const template = await storage.getTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ error: "Failed to fetch template" });
    }
  });
  
  // PDF parsing endpoint
  app.post("/api/parse-pdf", (req, res, next) => {
    upload.single("file")(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "File exceeds 2MB limit" });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      }
      if (err) {
        return res.status(400).json({ error: err.message || "Invalid file" });
      }
      next();
    });
  }, async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // Use PDFParse class from pdf-parse v2
      const parser = new PDFParse({ data: file.buffer });
      const textResult = await parser.getText();
      const text = textResult.text?.trim() || "";
      const pages = textResult.pages?.length || 0;
      await parser.destroy();
      
      // Truncate to reasonable length for AI context (~50K chars max)
      const maxChars = 50000;
      const truncatedText = text.length > maxChars 
        ? text.slice(0, maxChars) + "\n\n[Document truncated for analysis...]"
        : text;
      
      return res.json({
        success: true,
        text: truncatedText,
        pages: pages,
        originalLength: text.length
      });
    } catch (error: any) {
      console.error("PDF parsing error:", error);
      return res.status(500).json({ 
        error: "Failed to parse PDF",
        details: error.message 
      });
    }
  });

  // AI suggestions endpoint
  app.post("/api/suggestions", async (req, res) => {
    try {
      const { companyName, industry } = req.body;
      
      if (!companyName || typeof companyName !== 'string' || companyName.trim().length < 2) {
        return res.status(400).json({ 
          success: false, 
          error: "Company name must be at least 2 characters" 
        });
      }
      
      const suggestions = await generateSuggestions(companyName.trim(), industry);
      
      return res.json({
        success: true,
        suggestions,
      });
    } catch (error: any) {
      console.error("Suggestions error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to generate suggestions",
      });
    }
  });

  // Analyze endpoint
  app.post("/api/analyze", async (req, res) => {
    try {
      // Extract saveAnalysis and ownerToken before validation
      const { saveAnalysis: shouldSave, ownerToken, ...profileData } = req.body;
      
      const parseResult = organizationProfileSchema.safeParse(profileData);
      
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          error: "Invalid organization profile: " + parseResult.error.message,
        });
      }

      const profile: OrganizationProfile = parseResult.data;
      const saveAnalysis = shouldSave !== false; // Default to true if not explicitly false
      
      console.log("[Analyze] Starting multi-agent crew analysis...", { saveAnalysis, hasOwnerToken: !!ownerToken });
      
      // Run the multi-agent crew analysis with timeout protection
      const ANALYSIS_TIMEOUT_MS = 85000; // 85 seconds (Cloudflare times out at 100s)
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Analysis timed out. Please try again with a simpler organization profile or without a document.")), ANALYSIS_TIMEOUT_MS);
      });
      
      const crewResult = await Promise.race([
        runAgentCrew(
          profile,
          profile.uploadedDocumentContent,
          profile.uploadedDocumentName
        ),
        timeoutPromise
      ]);
      
      // Convert crew result to the expected analysis format
      const crewAnalysis = convertCrewResultToAnalysis(crewResult);
      
      // Map to existing schema format
      let parsedAnalysis: {
        executiveSummary: string;
        cognitiveNodes: CognitiveNode[];
        useCases: UseCase[];
        trustTaxBreakdown: TrustTaxBreakdown;
      };
      
      try {
        // Helper to clamp values to valid range
        const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val || min));
        
        // Safely access arrays with defaults
        const rawNodes = crewAnalysis?.cognitiveNodes || [];
        const rawUseCases = crewAnalysis?.useCases || [];
        
        // Transform cognitive nodes to match existing schema
        const cognitiveNodes: CognitiveNode[] = rawNodes.map((node, i) => {
          const automationPotential = clamp(node.automationPotential || 50, 0, 100);
          return {
            id: `node-${i}`,
            name: node.name || `Node ${i + 1}`,
            description: (node.description || '') + (node.documentEvidence ? ` (Evidence: ${node.documentEvidence})` : ''),
            humanCognitiveLoad: clamp(node.cognitiveLoad === 'high' ? 9 : node.cognitiveLoad === 'medium' ? 6 : 3, 1, 10),
            aiCognitiveLoad: clamp(Math.round((100 - automationPotential) / 10), 1, 10),
            translationTax: `Pattern: ${node.agenticPattern || 'orchestrator'}`,
            contextSwitchingCost: `Data readiness: ${node.dataReadiness || 'medium'}`,
          };
        });
        
        // Pattern detection with fallback
        const detectPattern = (title: string): 'drafter-critic' | 'reasoning-engine' | 'orchestrator' | 'tool-user' => {
          const lower = (title || '').toLowerCase();
          if (lower.includes('draft') || lower.includes('review') || lower.includes('critic')) return 'drafter-critic';
          if (lower.includes('reason') || lower.includes('analysis') || lower.includes('intelligence')) return 'reasoning-engine';
          if (lower.includes('tool') || lower.includes('automat') || lower.includes('execut')) return 'tool-user';
          return 'orchestrator';
        };
        
        const getPatternName = (pattern: string): string => {
          const names: Record<string, string> = {
            'drafter-critic': 'Drafter-Critic Loop',
            'reasoning-engine': 'Reasoning Engine',
            'tool-user': 'Tool User',
            'orchestrator': 'The Orchestrator'
          };
          return names[pattern] || 'The Orchestrator';
        };
        
        // Transform use cases to match existing schema
        const useCases: UseCase[] = rawUseCases.map((uc, i) => {
          const pattern = detectPattern(uc.title);
          const trustTax = clamp(uc.trustTaxPercent || 20, 0, 100);
          const savings = uc.savingsAmount || 50000;
          const payback = uc.paybackMonths || 12;
          
          return {
            id: `usecase-${i}`,
            title: uc.title || `Use Case ${i + 1}`,
            pattern,
            patternName: getPatternName(pattern),
            oldWay: uc.currentState || 'Legacy manual process',
            agenticWay: (uc.description || '') + (uc.documentJustification ? ` (${uc.documentJustification})` : ''),
            horizon: (uc.horizon === 'H1' ? 1 : uc.horizon === 'H2' ? 2 : 3) as 1 | 2 | 3,
            horizonLabel: uc.horizon === 'H1' ? 'Deflationary Core' : uc.horizon === 'H2' ? 'Augmented Workforce' : 'Strategic Optionality',
            dataReadiness: clamp(Math.round(7 - trustTax / 15), 1, 10),
            businessValue: clamp(Math.round(savings / 25000) + 3, 1, 10),
            implementationRisk: clamp(Math.round(payback / 4), 1, 10),
            estimatedSavings: `$${savings.toLocaleString()}/year`,
          };
        });
        
        // Calculate trust tax breakdown from crew results
        const totalSavings = crewResult.financialAnalysis.structuredData?.totalProjectedSavings || 100000;
        const trustTaxData = crewResult.financialAnalysis.structuredData?.trustTaxBreakdown || {
          humanReview: 20,
          errorCorrection: 10,
          complianceOverhead: 5,
          trainingMaintenance: 5
        };
        const avgTrustTax = (trustTaxData.humanReview + trustTaxData.errorCorrection + 
                            trustTaxData.complianceOverhead + trustTaxData.trainingMaintenance) / 4;
        
        const trustTaxBreakdown: TrustTaxBreakdown = {
          currentHumanCost: crewResult.financialAnalysis.structuredData?.totalCurrentCost || 200000,
          aiEfficiencySavings: totalSavings,
          trustTaxCost: Math.round(totalSavings * avgTrustTax / 100),
          finalLCOAI: Math.round(totalSavings * (1 - avgTrustTax / 100)),
          currency: '$'
        };
        
        // Apply executive tone editing to the summary with robust error handling
        let finalSummary = crewAnalysis?.executiveSummary || "Analysis complete. Review the detailed findings below.";
        try {
          const polishedSummary = await applyToneEditor(JSON.stringify({ executiveSummary: finalSummary }));
          const parsed = JSON.parse(polishedSummary);
          if (parsed?.executiveSummary) {
            finalSummary = parsed.executiveSummary;
          }
        } catch (toneError) {
          console.log("[Analyze] Tone editor skipped, using original summary");
          // Keep original if tone editing fails
        }
        
        parsedAnalysis = {
          executiveSummary: finalSummary,
          cognitiveNodes,
          useCases,
          trustTaxBreakdown
        };
        
        console.log("[Analyze] Multi-agent analysis complete:", {
          cognitiveNodes: cognitiveNodes.length,
          useCases: useCases.length,
          documentInsights: crewAnalysis.documentInsights ? 'included' : 'none'
        });
        
      } catch (parseError: any) {
        console.error("Failed to process crew analysis:", parseError);
        return res.status(500).json({
          success: false,
          error: `Failed to process agent analysis: ${parseError.message}`,
        });
      }

      const cognitiveLoadData: CognitiveLoadHeatmapData = {
        labels: parsedAnalysis.cognitiveNodes.map((n) => n.name),
        humanLoad: parsedAnalysis.cognitiveNodes.map((n) => n.humanCognitiveLoad),
        aiLoad: parsedAnalysis.cognitiveNodes.map((n) => n.aiCognitiveLoad),
      };

      const horizonsBubbleData: HorizonsBubbleData = {
        useCases: parsedAnalysis.useCases.map((uc) => ({
          label: uc.title,
          x: uc.dataReadiness,
          y: uc.businessValue,
          r: uc.implementationRisk,
          horizon: uc.horizon,
        })),
      };

      const trustTaxData = {
        labels: [
          "Current Human Cost",
          "AI Efficiency Savings",
          "Trust Tax",
          "Final LCOAI",
        ],
        values: [
          parsedAnalysis.trustTaxBreakdown.currentHumanCost,
          -parsedAnalysis.trustTaxBreakdown.aiEfficiencySavings,
          parsedAnalysis.trustTaxBreakdown.trustTaxCost,
          parsedAnalysis.trustTaxBreakdown.finalLCOAI,
        ],
        colors: ["#001278", "#36bf78", "#f59e0b", "#02a2fd"],
      };

      const analysisId = randomUUID();
      
      const result: AnalysisResult = {
        id: analysisId,
        organizationProfile: profile,
        executiveSummary: parsedAnalysis.executiveSummary,
        cognitiveNodes: parsedAnalysis.cognitiveNodes,
        useCases: parsedAnalysis.useCases,
        trustTaxBreakdown: parsedAnalysis.trustTaxBreakdown,
        cognitiveLoadData,
        trustTaxData,
        horizonsBubbleData,
        createdAt: new Date().toISOString(),
        ownerToken,
      };

      // Save to database FIRST (before sending response) so even if
      // Cloudflare kills the connection at 100s, the data is persisted
      if (saveAnalysis && ownerToken) {
        try {
          console.log("[Analyze] Saving analysis to database BEFORE response...");
          await storage.createAnalysis({
            id: analysisId,
            ownerToken,
            companyName: profile.companyName,
            industry: profile.industry,
            coreBusinessGoal: profile.coreBusinessGoal,
            currentPainPoints: profile.currentPainPoints,
            dataLandscape: profile.dataLandscape,
            executiveSummary: parsedAnalysis.executiveSummary,
            cognitiveNodes: parsedAnalysis.cognitiveNodes,
            useCases: parsedAnalysis.useCases,
            trustTaxBreakdown: parsedAnalysis.trustTaxBreakdown,
            cognitiveLoadData,
            trustTaxData,
            horizonsBubbleData,
          });
          console.log("[Analyze] Analysis saved to database successfully:", analysisId);
        } catch (dbError: any) {
          console.error("[Analyze] Database save failed (continuing with response):", dbError.message);
        }
      }

      return res.json({
        success: true,
        result,
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Analysis failed",
      });
    }
  });

  // Generate shareable short link for a report
  app.post("/api/reports/:id/share", async (req, res) => {
    try {
      const analysisId = req.params.id;
      const analysis = await storage.getAnalysis(analysisId);
      
      if (!analysis) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      if (!dubService.isConfigured()) {
        const protocol = req.headers["x-forwarded-proto"] || "http";
        const host = req.headers.host || "localhost:5000";
        const shareUrl = `${protocol}://${host}/share/${analysisId}`;
        return res.json({
          success: true,
          shortLink: shareUrl,
          fullUrl: shareUrl,
          dubConfigured: false
        });
      }

      const existingLink = await dubService.getLinkByExternalId(`ext_report_${analysisId}`);
      if (existingLink) {
        return res.json({
          success: true,
          shortLink: existingLink.shortLink,
          qrCode: existingLink.qrCode,
          clicks: existingLink.clicks,
          dubConfigured: true
        });
      }

      const protocol = req.headers["x-forwarded-proto"] || "http";
      const host = req.headers.host || "localhost:5000";
      const shareUrl = `${protocol}://${host}/share/${analysisId}`;
      
      const link = await dubService.createReportLink(
        shareUrl,
        analysisId,
        analysis.companyName || "Unknown"
      );

      res.json({
        success: true,
        shortLink: link.shortLink,
        qrCode: link.qrCode,
        fullUrl: shareUrl,
        dubConfigured: true
      });
    } catch (error: any) {
      console.error("Share link generation error:", error);
      res.status(500).json({ 
        error: "Failed to generate share link", 
        details: error.message 
      });
    }
  });

  // Calculate Trust Tax using HyperFormula engine
  app.post("/api/calculate/trust-tax", async (req, res) => {
    try {
      const parseResult = trustTaxInputSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid input", 
          details: parseResult.error.flatten().fieldErrors 
        });
      }

      const { currentHumanCost, aiEfficiencyPercent, trustTaxPercent } = parseResult.data;
      const engine = getCalculationEngine();
      const result = engine.calculateTrustTax(currentHumanCost, aiEfficiencyPercent, trustTaxPercent);
      
      res.json({
        success: true,
        result,
      });
    } catch (error: any) {
      console.error("Trust Tax calculation error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Calculation failed",
      });
    }
  });

  // Calculate cognitive metrics from nodes
  app.post("/api/calculate/cognitive-metrics", async (req, res) => {
    try {
      const parseResult = cognitiveMetricsInputSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid input", 
          details: parseResult.error.flatten().fieldErrors 
        });
      }

      const { cognitiveNodes } = parseResult.data;
      const engine = getCalculationEngine();
      const result = engine.calculateCognitiveMetrics(cognitiveNodes as any);
      
      res.json({
        success: true,
        result,
      });
    } catch (error: any) {
      console.error("Cognitive metrics calculation error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Calculation failed",
      });
    }
  });

  // Calculate total savings from use cases
  app.post("/api/calculate/total-savings", async (req, res) => {
    try {
      const parseResult = totalSavingsInputSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid input", 
          details: parseResult.error.flatten().fieldErrors 
        });
      }

      const { useCases } = parseResult.data;
      const engine = getCalculationEngine();
      const result = engine.calculateTotalSavings(useCases as any);
      
      res.json({
        success: true,
        result,
      });
    } catch (error: any) {
      console.error("Total savings calculation error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Calculation failed",
      });
    }
  });

  // Calculate ROI for a use case
  app.post("/api/calculate/roi", async (req, res) => {
    try {
      const parseResult = roiInputSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid input", 
          details: parseResult.error.flatten().fieldErrors 
        });
      }

      const { estimatedSavings, implementationCost, yearsToPayback } = parseResult.data;
      const engine = getCalculationEngine();
      const result = engine.calculateUseCaseROI(estimatedSavings, implementationCost, yearsToPayback);
      
      res.json({
        success: true,
        result,
      });
    } catch (error: any) {
      console.error("ROI calculation error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Calculation failed",
      });
    }
  });

  // Evaluate custom formula
  app.post("/api/calculate/formula", async (req, res) => {
    try {
      const parseResult = formulaInputSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid input", 
          details: parseResult.error.flatten().fieldErrors 
        });
      }

      const { formula } = parseResult.data;
      const engine = getCalculationEngine();
      const result = engine.evaluateFormula(formula);
      
      res.json({
        success: true,
        result,
      });
    } catch (error: any) {
      console.error("Formula evaluation error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Formula evaluation failed",
      });
    }
  });

  return httpServer;
}
