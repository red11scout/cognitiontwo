import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { Download, RefreshCw, Loader2, HelpCircle, FileText, FileOutput } from "lucide-react";
import { type AnalysisResult, type CognitiveNode, type UseCase } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ExecutiveSummary } from "./executive-summary";
import { CognitiveNodesDisplay } from "./cognitive-nodes-display";
import { UseCaseCard } from "./use-case-card";
import { CognitiveHeatmap } from "./charts/cognitive-heatmap";
import { TrustTaxWaterfall } from "./charts/trust-tax-waterfall";
import { HorizonsBubble } from "./charts/horizons-bubble";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import logoDark from "@assets/image_1765400105626.png";

interface AnalysisResultsProps {
  result: AnalysisResult;
  onReset: () => void;
}

function SectionExplainer({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 p-5 bg-[#02a2fd]/5 dark:bg-[#02a2fd]/10 rounded-md mb-4 border border-[#02a2fd]/20" data-explainer>
      <HelpCircle className="h-6 w-6 text-[#02a2fd] flex-shrink-0 mt-0.5" />
      <div>
        <h4 className="font-semibold text-foreground text-lg mb-2">{title}</h4>
        <p className="text-base text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

async function loadLogoAsDataUrl(): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        reject(new Error("Could not get canvas context"));
      }
    };
    img.onerror = reject;
    img.src = logoDark;
  });
}

async function renderSectionToCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(element, {
    scale: 3,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    allowTaint: true,
  });
}

function generateMarkdown(result: AnalysisResult): string {
  const { organizationProfile, executiveSummary, cognitiveNodes, useCases, trustTaxBreakdown } = result;
  const generatedDate = new Date(result.createdAt).toLocaleDateString();
  
  const patternLabels: Record<string, string> = {
    "drafter-critic": "Drafter-Critic Loop",
    "reasoning-engine": "Reasoning Engine",
    "orchestrator": "Orchestrator",
    "tool-user": "Tool User"
  };

  const decodeHtmlEntities = (text: string): string => {
    if (!text) return '';
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  const formatCurrency = (value: number) => {
    const currencySymbol = trustTaxBreakdown?.currency || '$';
    if (currencySymbol === '$' || currencySymbol === 'USD') {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD',
        maximumFractionDigits: 0 
      }).format(value || 0);
    }
    return `${currencySymbol}${(value || 0).toLocaleString()}`;
  };

  let md = `# Cognitive Zero-Base Analysis

**Company:** ${decodeHtmlEntities(organizationProfile.companyName)}  
**Industry:** ${decodeHtmlEntities(organizationProfile.industry)}  
**Generated:** ${generatedDate}

---

## Executive Summary

${decodeHtmlEntities(executiveSummary)}

---

## Organization Profile

### Core Business Goal
${decodeHtmlEntities(organizationProfile.coreBusinessGoal)}

### Current Pain Points
${decodeHtmlEntities(organizationProfile.currentPainPoints)}

### Data Landscape
${decodeHtmlEntities(organizationProfile.dataLandscape)}

---

## Trust Tax Analysis

| Metric | Value |
|--------|-------|
| Current Human Cost | ${formatCurrency(trustTaxBreakdown?.currentHumanCost)} |
| AI Efficiency Savings | ${formatCurrency(trustTaxBreakdown?.aiEfficiencySavings)} |
| Trust Tax (Human Oversight) | ${formatCurrency(trustTaxBreakdown?.trustTaxCost)} |
| **Final LCOAI** | **${formatCurrency(trustTaxBreakdown?.finalLCOAI)}** |

---

## Cognitive Nodes

`;

  (cognitiveNodes || []).forEach((node: CognitiveNode, index: number) => {
    md += `### ${index + 1}. ${decodeHtmlEntities(node.name)}

${decodeHtmlEntities(node.description)}

| Attribute | Value |
|-----------|-------|
| Human Cognitive Load | ${node.humanCognitiveLoad}/10 |
| AI Cognitive Load | ${node.aiCognitiveLoad}/10 |
| Translation Tax | ${decodeHtmlEntities(node.translationTax)} |
| Context Switching Cost | ${decodeHtmlEntities(node.contextSwitchingCost)} |

`;
  });

  md += `---

## Recommended AI Use Cases

`;

  (useCases || []).forEach((useCase: UseCase, index: number) => {
    md += `### ${index + 1}. ${decodeHtmlEntities(useCase.title)}

**Horizon:** ${decodeHtmlEntities(useCase.horizonLabel)} (H${useCase.horizon})  
**Agentic Pattern:** ${patternLabels[useCase.pattern] || decodeHtmlEntities(useCase.patternName)}  
**Estimated Savings:** ${decodeHtmlEntities(useCase.estimatedSavings)}

#### The Legacy Way
${decodeHtmlEntities(useCase.oldWay)}

#### The Agentic Way
${decodeHtmlEntities(useCase.agenticWay)}

| Metric | Score |
|--------|-------|
| Data Readiness | ${useCase.dataReadiness}/10 |
| Business Value | ${useCase.businessValue}/10 |
| Implementation Risk | ${useCase.implementationRisk}/10 |

`;
  });

  md += `---

*Generated by BlueAlly Cognitive Zero-Base Analysis*
`;

  return md;
}

function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function AnalysisResults({ result, onReset }: AnalysisResultsProps) {
  const [, setLocation] = useLocation();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingMd, setIsExportingMd] = useState(false);
  const { toast } = useToast();

  const handleExportPDF = async () => {
    if (!reportRef.current || isExporting) return;

    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 12;
      const headerHeight = 22;
      const contentWidth = pdfWidth - (margin * 2);
      const usableHeight = pdfHeight - margin - headerHeight - margin;
      const canvasScale = 3;

      let logoDataUrl: string | null = null;
      try {
        logoDataUrl = await loadLogoAsDataUrl();
      } catch (e) {
        console.warn("Could not load logo for PDF", e);
      }

      const generatedDate = new Date().toLocaleDateString();
      
      const addHeader = (pageNum: number, totalPages: number) => {
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pdfWidth, headerHeight + margin, "F");
        
        if (logoDataUrl) {
          pdf.addImage(logoDataUrl, "PNG", margin, margin, 35, 10);
        }
        
        pdf.setFontSize(11);
        pdf.setTextColor(80, 80, 80);
        pdf.text(
          `Cognitive Zero-Base Analysis: ${result.organizationProfile.companyName}`,
          pdfWidth - margin,
          margin + 5,
          { align: "right" }
        );
        pdf.setFontSize(10);
        pdf.text(
          `Generated ${generatedDate} | Page ${pageNum} of ${totalPages}`,
          pdfWidth - margin,
          margin + 11,
          { align: "right" }
        );
        
        pdf.setDrawColor(0, 18, 120);
        pdf.setLineWidth(0.5);
        pdf.line(margin, headerHeight + margin - 2, pdfWidth - margin, headerHeight + margin - 2);
      };

      const sections = Array.from(reportRef.current.querySelectorAll('[data-pdf-section]'));
      const sectionCanvases: { canvas: HTMLCanvasElement; name: string }[] = [];

      for (const section of sections) {
        const sectionEl = section as HTMLElement;
        const sectionName = sectionEl.getAttribute('data-pdf-section') || 'section';
        const canvas = await renderSectionToCanvas(sectionEl);
        sectionCanvases.push({ canvas, name: sectionName });
      }

      let currentY = headerHeight + margin;
      let pageNum = 1;
      const pages: { sections: { canvas: HTMLCanvasElement; y: number; height: number }[] }[] = [{ sections: [] }];

      const sectionSpacing = 6;
      const bottomSafetyMargin = margin + 5; // Extra buffer to prevent clipping

      for (const { canvas } of sectionCanvases) {
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = contentWidth / (imgWidth / canvasScale);
        const scaledHeight = (imgHeight / canvasScale) * ratio;

        // Calculate remaining space on current page with safety buffer
        const remainingSpace = pdfHeight - bottomSafetyMargin - currentY;
        const fitsOnCurrentPage = scaledHeight <= remainingSpace;
        
        // If section doesn't fit on current page, move to next page
        if (!fitsOnCurrentPage) {
          pageNum++;
          pages.push({ sections: [] });
          currentY = headerHeight + margin;
        }

        // Add the section to the current page (keeping it whole)
        pages[pageNum - 1].sections.push({
          canvas,
          y: currentY,
          height: scaledHeight
        });
        currentY += scaledHeight + sectionSpacing;
      }

      const totalPages = pages.length;
      
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        
        addHeader(i + 1, totalPages);
        
        for (const section of pages[i].sections) {
          const imgData = section.canvas.toDataURL("image/png");
          const imgWidth = section.canvas.width / canvasScale;
          const ratio = contentWidth / imgWidth;
          const scaledHeight = (section.canvas.height / canvasScale) * ratio;
          pdf.addImage(imgData, "PNG", margin, section.y, contentWidth, scaledHeight);
        }
      }

      const fileName = `${result.organizationProfile.companyName.replace(/\s+/g, "_")}_Cognitive_Analysis_${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "PDF Exported",
        description: "Your branded analysis report has been downloaded.",
      });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({
        title: "Export Failed",
        description: "Unable to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMarkdown = () => {
    if (isExportingMd) return;
    
    setIsExportingMd(true);
    try {
      const markdown = generateMarkdown(result);
      const companyName = result.organizationProfile?.companyName || 'Analysis';
      const safeCompanyName = companyName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, "_");
      const fileName = `${safeCompanyName}_Cognitive_Analysis_${new Date().toISOString().split("T")[0]}.md`;
      downloadMarkdown(markdown, fileName);
      
      toast({
        title: "Markdown Exported",
        description: "Your analysis report has been downloaded as a markdown file.",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Markdown export error:", errorMessage, error);
      toast({
        title: "Export Failed",
        description: "Unable to generate markdown. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExportingMd(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#001278] dark:text-white">
            Analysis Complete
          </h2>
          <p className="text-muted-foreground">
            Generated on {new Date(result.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={onReset}
            data-testid="button-new-analysis"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            New Analysis
          </Button>
          <Button
            variant="outline"
            onClick={handleExportMarkdown}
            disabled={isExportingMd}
            data-testid="button-export-markdown"
          >
            {isExportingMd ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Export Markdown
              </>
            )}
          </Button>
          <Button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="bg-[#36bf78] hover:bg-[#2ea866] text-white"
            data-testid="button-export-pdf"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocation(`/report-builder?id=${result.id}`)}
            className="border-[#02a2fd] text-[#02a2fd]"
            data-testid="button-open-report-builder"
          >
            <FileOutput className="mr-2 h-4 w-4" />
            Report Builder
          </Button>
        </div>
      </div>

      <div ref={reportRef} data-report-container className="space-y-8 bg-background p-6 rounded-lg">
        <div data-pdf-section="executive-summary">
          <ExecutiveSummary
            summary={result.executiveSummary}
            companyName={result.organizationProfile.companyName}
          />
        </div>

        <div data-pdf-section="charts-intro">
          <SectionExplainer
            title="Understanding the Visualizations"
            description="The following charts provide a data-driven view of your AI transformation opportunity. The Cognitive Load Heatmap shows where human effort is highest and where AI can help most. The Trust Tax Waterfall breaks down the financial impact of implementing AI with human oversight."
          />
        </div>
        
        <div data-pdf-section="cognitive-heatmap">
          <CognitiveHeatmap data={result.cognitiveLoadData} />
        </div>
        
        <div data-pdf-section="trust-tax-waterfall">
          <TrustTaxWaterfall data={result.trustTaxBreakdown} />
        </div>

        <div data-pdf-section="horizons-intro">
          <SectionExplainer
            title="Strategic Horizons Portfolio"
            description="This bubble chart maps your use cases across three strategic horizons. Position on the chart shows data readiness (x-axis) vs business value (y-axis), while bubble size indicates implementation risk. Use this to prioritize which initiatives to tackle first."
          />
        </div>
        
        <div data-pdf-section="horizons-bubble">
          <HorizonsBubble data={result.horizonsBubbleData} />
        </div>

        <div data-pdf-section="cognitive-nodes-intro">
          <SectionExplainer
            title="Cognitive Nodes Analysis"
            description="Cognitive nodes are the decision points in your business where humans convert unstructured information into structured outputs. These are prime candidates for AI augmentation. Higher cognitive load scores indicate more mental effort required - and greater automation potential."
          />
        </div>
        
        <CognitiveNodesDisplay nodes={result.cognitiveNodes} />

        <div data-pdf-section="usecases-intro" className="bg-[#001278] dark:bg-[#02a2fd] p-8 rounded-lg">
          <h3 className="text-3xl font-bold text-white mb-4">
            Recommended AI Use Cases
          </h3>
          <p className="text-white/90 text-lg leading-relaxed">
            Based on the analysis, these are the specific AI implementations we recommend. Each use case shows how you currently handle the task (Legacy Way) versus how AI agents could transform it (Agentic Way). Horizons indicate implementation timeline: H1 is immediate, H2 is near-term, H3 is strategic.
          </p>
        </div>
        
        {result.useCases.map((useCase, index) => (
          <div key={useCase.id} data-pdf-section={`usecase-${index}`}>
            <UseCaseCard useCase={useCase} index={index} />
          </div>
        ))}

      </div>
    </div>
  );
}
