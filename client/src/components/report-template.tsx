import { useEffect, useRef, useState } from "react";
import { type AnalysisResult } from "@shared/schema";
import { TrustTaxWaterfallEChart, HorizonsBubbleEChart, CognitiveHeatmapEChart } from "./charts-echarts";
import { Badge } from "@/components/ui/badge";
import { Building2, Target, Brain, Calculator, Layers, FileText, AlertCircle } from "lucide-react";
import { BlueAllyLogo } from "./blueally-logo";
import { decodeHtmlEntities, safeArray, safeNumber } from "@/lib/utils";

interface ReportTemplateProps {
  data: AnalysisResult;
  onReady?: () => void;
}

const defaultTrustTaxBreakdown = {
  currency: "$",
  currentHumanCost: 0,
  aiEfficiencySavings: 0,
  trustTaxCost: 0,
  finalLCOAI: 0,
};

const defaultCognitiveLoadData = {
  labels: [],
  humanLoad: [],
  aiLoad: [],
};

const defaultHorizonsBubbleData = {
  useCases: [],
};

export function ReportTemplate({ data, onReady }: ReportTemplateProps) {
  if (!data) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Report data unavailable</h2>
        <p className="text-gray-600 mt-2">Unable to load report data. Please try again.</p>
      </div>
    );
  }

  const cognitiveNodes = safeArray(data.cognitiveNodes);
  const useCases = safeArray(data.useCases);
  const trustTaxBreakdown = data.trustTaxBreakdown || defaultTrustTaxBreakdown;
  const cognitiveLoadData = data.cognitiveLoadData || defaultCognitiveLoadData;
  const horizonsBubbleData = data.horizonsBubbleData || defaultHorizonsBubbleData;
  const organizationProfile = data.organizationProfile || { companyName: "Unknown", industry: "Unknown" };
  const [chartsReady, setChartsReady] = useState({ waterfall: false, bubble: false, heatmap: false });
  const readyRef = useRef(false);

  useEffect(() => {
    if (chartsReady.waterfall && chartsReady.bubble && chartsReady.heatmap && !readyRef.current) {
      readyRef.current = true;
      try {
        (window as any).__REPORT_READY__ = true;
      } catch (e) {
        // Safe for non-browser contexts
      }
      onReady?.();
    }
  }, [chartsReady, onReady]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { 
      year: "numeric", month: "long", day: "numeric" 
    });
  };

  const horizonLabels = {
    1: "Deflationary Core",
    2: "Augmented Workforce", 
    3: "Strategic Optionality"
  };

  return (
    <div className="report-template bg-white text-gray-900 min-h-screen" id="report-content">
      <style>{`
        @media print {
          .report-template { background: white !important; }
          .page-break { page-break-before: always; }
          .no-break { page-break-inside: avoid; }
        }
        .report-template { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <header className="bg-[#001278] text-white p-8 no-break">
        <div className="flex items-center justify-between gap-4 mb-6">
          <img src="/blueally-logo-light.png" alt="BlueAlly" className="h-10 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <Badge variant="outline" className="border-white/30 text-white text-xs">
            {formatDate(data.createdAt || new Date().toISOString())}
          </Badge>
        </div>
        <h1 className="text-3xl font-bold mb-2">Cognitive Zero-Base Analysis</h1>
        <div className="flex items-center gap-2 text-xl opacity-90">
          <Building2 className="h-5 w-5" />
          {decodeHtmlEntities(organizationProfile.companyName)}
        </div>
        <div className="text-sm opacity-75 mt-1">{decodeHtmlEntities(organizationProfile.industry)}</div>
      </header>

      <section className="p-8 no-break">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-[#02a2fd]" />
          <h2 className="text-xl font-bold text-[#001278]">Executive Summary</h2>
        </div>
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
            {decodeHtmlEntities(data.executiveSummary)}
          </div>
        </div>
      </section>

      <section className="p-8 no-break">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-[#02a2fd]" />
          <h2 className="text-xl font-bold text-[#001278]">Cognitive Nodes Identified</h2>
        </div>
        {cognitiveNodes.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center text-gray-500">
            No cognitive nodes available
          </div>
        ) : (
          <div className="grid gap-3">
            {cognitiveNodes.map((node, idx) => (
              <div key={node.id || idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-[#001278]">{idx + 1}. {decodeHtmlEntities(node.name)}</h3>
                    <p className="text-sm text-gray-600 mt-1">{decodeHtmlEntities(node.description)}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      Human: {safeNumber(node.humanCognitiveLoad)}/10
                    </Badge>
                    <Badge className="bg-[#02a2fd] text-white text-xs">
                      AI: {safeNumber(node.aiCognitiveLoad)}/10
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="page-break" />

      <section className="p-8">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-5 w-5 text-[#02a2fd]" />
          <h2 className="text-xl font-bold text-[#001278]">Financial Analysis</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <TrustTaxWaterfallEChart 
            data={trustTaxBreakdown} 
            onReady={() => setChartsReady(prev => ({ ...prev, waterfall: true }))}
          />
          <CognitiveHeatmapEChart 
            data={cognitiveLoadData}
            onReady={() => setChartsReady(prev => ({ ...prev, heatmap: true }))}
          />
        </div>
      </section>

      <div className="page-break" />

      <section className="p-8">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-[#02a2fd]" />
          <h2 className="text-xl font-bold text-[#001278]">Strategic Horizons</h2>
        </div>
        <HorizonsBubbleEChart 
          data={horizonsBubbleData}
          onReady={() => setChartsReady(prev => ({ ...prev, bubble: true }))}
        />
      </section>

      <div className="page-break" />

      <section className="p-8 no-break">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="h-5 w-5 text-[#02a2fd]" />
          <h2 className="text-xl font-bold text-[#001278]">Use Cases by Horizon</h2>
        </div>
        {useCases.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 text-center text-gray-500">
            No use cases available
          </div>
        ) : (
          [1, 2, 3].map((horizon) => {
            const horizonUseCases = useCases.filter(uc => uc.horizon === horizon);
            if (horizonUseCases.length === 0) return null;
            return (
              <div key={horizon} className="mb-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span className={`inline-block w-3 h-3 rounded-full ${
                    horizon === 1 ? "bg-[#36bf78]" : horizon === 2 ? "bg-[#02a2fd]" : "bg-[#001278]"
                  }`} />
                  Horizon {horizon}: {horizonLabels[horizon as 1 | 2 | 3]}
                </h3>
                <div className="grid gap-3">
                  {horizonUseCases.map((uc, idx) => (
                    <div key={uc.id || idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h4 className="font-semibold text-[#001278]">{decodeHtmlEntities(uc.title)}</h4>
                        <Badge variant="outline" className="text-xs shrink-0">{decodeHtmlEntities(uc.patternName)}</Badge>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500 text-xs mb-1">Current Approach</div>
                          <p className="text-gray-700">{decodeHtmlEntities(uc.oldWay)}</p>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs mb-1">Agentic Approach</div>
                          <p className="text-gray-700">{decodeHtmlEntities(uc.agenticWay)}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-3 text-xs">
                        <span className="text-gray-500">
                          Data Readiness: <strong className="text-[#001278]">{safeNumber(uc.dataReadiness)}/10</strong>
                        </span>
                        <span className="text-gray-500">
                          Business Value: <strong className="text-[#02a2fd]">{safeNumber(uc.businessValue)}/10</strong>
                        </span>
                        <span className="text-gray-500">
                          Est. Savings: <strong className="text-[#36bf78]">{decodeHtmlEntities(uc.estimatedSavings)}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </section>

      <footer className="bg-gray-100 p-6 text-center text-sm text-gray-500 border-t no-break">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BlueAllyLogo className="h-6" />
        </div>
        <p>Cognitive Zero-Base Analysis powered by BlueAlly</p>
        <p className="text-xs mt-1">Generated on {formatDate(data.createdAt || new Date().toISOString())}</p>
      </footer>
    </div>
  );
}
