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

      <header className="text-white p-8 no-break" style={{ background: 'linear-gradient(135deg, #001278 0%, #02a2fd 100%)' }}>
        <div className="flex items-center justify-between gap-4 mb-8">
          <img src="/blueally-logo-light.png" alt="BlueAlly" className="h-10 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <Badge variant="outline" className="border-white/30 text-white text-xs">
            {formatDate(data.createdAt || new Date().toISOString())}
          </Badge>
        </div>
        <p className="text-sm uppercase tracking-widest opacity-70 mb-2">Cognitive Zero-Base Analysis</p>
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <Building2 className="h-8 w-8 opacity-80" />
          {decodeHtmlEntities(organizationProfile.companyName)}
        </h1>
        {organizationProfile.industry && (
          <div className="text-lg opacity-80 mb-6">{decodeHtmlEntities(organizationProfile.industry)}</div>
        )}

        {/* Hero metrics */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
          <div>
            <div className="text-sm opacity-70">Use Cases Identified</div>
            <div className="text-3xl font-bold">{safeArray(data.useCases).length}</div>
          </div>
          <div>
            <div className="text-sm opacity-70">Cognitive Nodes</div>
            <div className="text-3xl font-bold">{safeArray(data.cognitiveNodes).length}</div>
          </div>
          <div>
            <div className="text-sm opacity-70">Total Projected Savings</div>
            <div className="text-3xl font-bold">
              {trustTaxBreakdown.currency || '$'}{Math.round(trustTaxBreakdown.aiEfficiencySavings).toLocaleString()}
            </div>
          </div>
        </div>
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

      {/* Financial Sensitivity Analysis */}
      {data.scenarioAnalysis && (
        <>
          <div className="page-break" />
          <section className="p-8">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="h-5 w-5 text-[#02a2fd]" />
              <h2 className="text-xl font-bold text-[#001278]">Financial Sensitivity Analysis</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">Three scenarios based on adoption rate and organizational readiness.</p>
            <div className="grid grid-cols-3 gap-4">
              {(["conservative", "baseCase", "optimistic"] as const).map((key) => {
                const s = data.scenarioAnalysis![key];
                const colors = {
                  conservative: { border: "border-gray-300", bg: "bg-gray-50", text: "text-gray-700" },
                  baseCase: { border: "border-[#02a2fd]", bg: "bg-blue-50", text: "text-[#02a2fd]" },
                  optimistic: { border: "border-[#36bf78]", bg: "bg-green-50", text: "text-[#36bf78]" },
                };
                const c = colors[key];
                const fmt = (n: number) => n >= 1_000_000 ? `$${(n/1_000_000).toFixed(1)}M` : `$${(n/1_000).toFixed(0)}K`;
                return (
                  <div key={key} className={`rounded-lg border ${c.border} ${key === "baseCase" ? "border-2" : ""} overflow-hidden`}>
                    <div className={`${c.bg} p-3`}>
                      <h3 className={`font-bold ${c.text}`}>{s.label}</h3>
                      <p className="text-xs text-gray-500 mt-1">{s.description}</p>
                    </div>
                    <div className="p-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Annual Benefit</span>
                        <span className={`font-bold ${c.text}`}>{fmt(s.annualBenefit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">3-Year NPV</span>
                        <span className="font-semibold">{fmt(s.threeYearNPV)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Payback</span>
                        <span className="font-semibold">{s.paybackMonths} months</span>
                      </div>
                      <hr className="border-gray-200" />
                      <div className="grid grid-cols-3 text-center text-xs">
                        <div><div className="text-gray-400">Adoption</div><div className="font-semibold">{s.adoptionRate}</div></div>
                        <div><div className="text-gray-400">Ramp</div><div className="font-semibold">{s.rampTime}</div></div>
                        <div><div className="text-gray-400">Realization</div><div className="font-semibold">{s.realizationRate}</div></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

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
                        <div className="bg-white rounded p-3 border border-gray-100">
                          <div className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Legacy Way</div>
                          {uc.legacyAnnualCost ? (
                            <div className="space-y-2">
                              <p className="text-red-600 font-bold">${uc.legacyAnnualCost.toLocaleString()}/yr</p>
                              {uc.legacyProcessSteps && uc.legacyProcessSteps.length > 0 && (
                                <ol className="text-xs text-gray-600 space-y-0.5">
                                  {uc.legacyProcessSteps.map((s: string, si: number) => (
                                    <li key={si}>{si + 1}. {decodeHtmlEntities(s)}</li>
                                  ))}
                                </ol>
                              )}
                              {uc.legacyPainPoints && uc.legacyPainPoints.length > 0 && (
                                <ul className="text-xs text-red-500 space-y-0.5">
                                  {uc.legacyPainPoints.map((p: string, pi: number) => (
                                    <li key={pi}>&bull; {decodeHtmlEntities(p)}</li>
                                  ))}
                                </ul>
                              )}
                              <div className="flex flex-wrap gap-2 text-[10px] text-gray-400">
                                {uc.legacyCognitionNodes != null && <span>{uc.legacyCognitionNodes} cognition nodes</span>}
                                {uc.legacyTranslationTax && <span>{decodeHtmlEntities(uc.legacyTranslationTax)}</span>}
                                {uc.legacyTimeConsumed && <span>{decodeHtmlEntities(uc.legacyTimeConsumed)}</span>}
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-700">{decodeHtmlEntities(uc.oldWay)}</p>
                          )}
                        </div>
                        <div className="bg-blue-50 rounded p-3 border border-blue-100">
                          <div className="text-[#02a2fd] text-xs font-semibold uppercase tracking-wider mb-2">Agentic Way</div>
                          {uc.agenticTransformSteps && uc.agenticTransformSteps.length > 0 ? (
                            <div className="space-y-2">
                              {uc.agenticPatternRationale && (
                                <p className="text-xs text-gray-700">{decodeHtmlEntities(uc.agenticPatternRationale)}</p>
                              )}
                              <ul className="text-xs text-gray-700 space-y-0.5">
                                {uc.agenticTransformSteps.map((s: string, si: number) => (
                                  <li key={si} className="flex gap-1">
                                    <span className="text-[#02a2fd]">&rarr;</span> {decodeHtmlEntities(s)}
                                  </li>
                                ))}
                              </ul>
                              {uc.agenticPrimitives && uc.agenticPrimitives.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {uc.agenticPrimitives.map((p: string, pi: number) => (
                                    <span key={pi} className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">{decodeHtmlEntities(p)}</span>
                                  ))}
                                </div>
                              )}
                              {uc.agenticHitlCheckpoints && uc.agenticHitlCheckpoints.length > 0 && (
                                <div className="text-[10px] text-gray-400">
                                  HITL: {uc.agenticHitlCheckpoints.map((c: string) => decodeHtmlEntities(c)).join("; ")}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-700">{decodeHtmlEntities(uc.agenticWay)}</p>
                          )}
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
                        {uc.agenticAutomationLevel && (
                          <span className="text-gray-500">
                            Automation: <strong className="text-[#001278]">{uc.agenticAutomationLevel}</strong>
                          </span>
                        )}
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
