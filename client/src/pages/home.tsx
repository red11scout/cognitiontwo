import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, Zap, Brain, Target, BarChart3, History, Loader2, Trash2 } from "lucide-react";
import { type OrganizationProfile, type AnalysisResult, type AnalysisPhase, type SelectAnalysis } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useOwnerToken } from "@/hooks/useOwnerToken";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BlueAllyLogo } from "@/components/blueally-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { OrganizationForm } from "@/components/organization-form";
import { AnalysisResults } from "@/components/analysis-results";
import { ProcessingOverlay } from "@/components/processing-overlay";
import { MobilePhaseProgress } from "@/components/phase-stepper";

const analysisPhases: AnalysisPhase[] = [
  "cognitive-audit",
  "agentic-design",
  "epoch-filter",
  "unit-economics",
  "horizons-portfolio",
];

export default function Home() {
  const [currentPhase, setCurrentPhase] = useState<AnalysisPhase>("input");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [saveAnalysis, setSaveAnalysis] = useState(true);
  const phaseIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { ownerToken } = useOwnerToken();

  const { data: savedAnalyses = [], isLoading: analysesLoading } = useQuery<SelectAnalysis[]>({
    queryKey: ["/api/analyses", ownerToken],
    queryFn: async () => {
      const res = await fetch("/api/analyses", {
        headers: { "x-owner-token": ownerToken },
      });
      if (!res.ok) throw new Error("Failed to fetch analyses");
      return res.json();
    },
    enabled: !!ownerToken,
  });

  const deleteAnalysisMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/analyses/${id}`, {
        method: "DELETE",
        headers: { "x-owner-token": ownerToken },
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analyses", ownerToken] });
      toast({
        title: "Analysis Deleted",
        description: "The analysis has been removed from your history.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Unable to delete the analysis.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    return () => {
      if (phaseIntervalRef.current) {
        clearInterval(phaseIntervalRef.current);
      }
    };
  }, []);

  const startPhaseSimulation = () => {
    let phaseIndex = 0;
    setCurrentPhase(analysisPhases[0]);
    
    phaseIntervalRef.current = setInterval(() => {
      phaseIndex++;
      if (phaseIndex < analysisPhases.length) {
        setCurrentPhase(analysisPhases[phaseIndex]);
      } else {
        if (phaseIntervalRef.current) {
          clearInterval(phaseIntervalRef.current);
        }
      }
    }, 3000);
  };

  const stopPhaseSimulation = () => {
    if (phaseIntervalRef.current) {
      clearInterval(phaseIntervalRef.current);
      phaseIntervalRef.current = null;
    }
  };

  const analysisMutation = useMutation({
    mutationFn: async (profile: OrganizationProfile) => {
      const response = await apiRequest("POST", "/api/analyze", {
        ...profile,
        saveAnalysis,
        ownerToken,
      });
      return response.json();
    },
    onMutate: () => {
      startPhaseSimulation();
    },
    onSuccess: (data) => {
      stopPhaseSimulation();
      if (data.success && data.result) {
        setAnalysisResult(data.result);
        setCurrentPhase("complete");
        queryClient.invalidateQueries({ queryKey: ["/api/analyses", ownerToken] });

        // Store in localStorage as backup
        try {
          localStorage.setItem(`analysis_backup_${data.result.id}`, JSON.stringify(data.result));
        } catch {}

        if (data.saved === false && data.saveError) {
          toast({
            title: "Analysis Complete (Save Failed)",
            description: `Your analysis is ready but could not be saved: ${data.saveError}. You can still view and export it.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Analysis Complete",
            description: "Your Cognitive Zero-Base analysis is ready.",
          });
        }
      } else {
        throw new Error(data.error || "Analysis failed");
      }
    },
    onError: async (error: Error) => {
      stopPhaseSimulation();
      const isTimeout = error.message.includes('timed out') || error.message.includes('AbortError') || error.message.includes('Failed to fetch');
      
      if (isTimeout && ownerToken) {
        setCurrentPhase("cognitive-audit");
        toast({
          title: "Connection interrupted",
          description: "Checking if your analysis was saved...",
        });
        
        try {
          await new Promise(resolve => setTimeout(resolve, 3000));
          const recoveryRes = await fetch(`/api/analyses/latest?ownerToken=${encodeURIComponent(ownerToken)}`);
          
          if (recoveryRes.ok) {
            const latestAnalysis = await recoveryRes.json();
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
            const analysisTime = new Date(latestAnalysis.createdAt).getTime();
            
            if (analysisTime > fiveMinutesAgo) {
              setAnalysisResult(latestAnalysis);
              setCurrentPhase("complete");
              queryClient.invalidateQueries({ queryKey: ["/api/analyses", ownerToken] });
              toast({
                title: "Analysis Recovered",
                description: "Your analysis was saved successfully despite the connection issue.",
              });
              return;
            }
          }
        } catch (recoveryError) {
          console.error("Recovery check failed:", recoveryError);
        }
      }
      
      setCurrentPhase("input");
      toast({
        title: "Analysis Failed",
        description: isTimeout
          ? "The analysis timed out. Your report may still be processing — check your saved analyses in a moment."
          : error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: OrganizationProfile) => {
    analysisMutation.mutate(data);
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setCurrentPhase("input");
    setShowForm(false);
    setShowDashboard(false);
  };

  const handleViewSavedAnalysis = (analysis: SelectAnalysis) => {
    const result: AnalysisResult = {
      id: analysis.id,
      organizationProfile: {
        companyName: analysis.companyName,
        industry: analysis.industry,
        coreBusinessGoal: analysis.coreBusinessGoal,
        currentPainPoints: analysis.currentPainPoints,
        dataLandscape: analysis.dataLandscape,
      },
      executiveSummary: analysis.executiveSummary,
      cognitiveNodes: analysis.cognitiveNodes as any,
      useCases: analysis.useCases as any,
      trustTaxBreakdown: analysis.trustTaxBreakdown as any,
      cognitiveLoadData: analysis.cognitiveLoadData as any,
      trustTaxData: analysis.trustTaxData as any,
      horizonsBubbleData: analysis.horizonsBubbleData as any,
      createdAt: analysis.createdAt ? new Date(analysis.createdAt).toISOString() : new Date().toISOString(),
      ownerToken: analysis.ownerToken,
    };
    setAnalysisResult(result);
    setCurrentPhase("complete");
    setShowDashboard(false);
  };

  const isProcessing = analysisMutation.isPending;

  const AppHeader = () => (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <button
            onClick={handleReset}
            className="cursor-pointer"
            data-testid="button-logo-home"
          >
            <BlueAllyLogo />
          </button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowDashboard(true);
                setShowForm(false);
                setAnalysisResult(null);
                setCurrentPhase("input");
              }}
              data-testid="button-dashboard"
            >
              <History className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">My Reports</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );

  if (showDashboard) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[#001278] dark:text-white">
                My Reports
              </h1>
              <p className="text-muted-foreground">
                View and manage your saved Cognitive Zero-Base analyses
              </p>
            </div>
            <Button
              onClick={() => {
                setShowDashboard(false);
                setShowForm(true);
              }}
              className="bg-[#02a2fd] hover:bg-[#0291e3] text-white"
              data-testid="button-new-analysis-dashboard"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              New Analysis
            </Button>
          </div>

          {analysesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#02a2fd]" />
            </div>
          ) : savedAnalyses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <History className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No reports yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Start your first Cognitive Zero-Base analysis to see it here.
                </p>
                <Button
                  onClick={() => {
                    setShowDashboard(false);
                    setShowForm(true);
                  }}
                  className="bg-[#02a2fd] hover:bg-[#0291e3] text-white"
                >
                  Begin Analysis
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {savedAnalyses.map((analysis) => (
                <Card key={analysis.id} className="hover-elevate cursor-pointer" data-testid={`card-analysis-${analysis.id}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg text-[#001278] dark:text-white line-clamp-1">
                        {analysis.companyName}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAnalysisMutation.mutate(analysis.id);
                        }}
                        data-testid={`button-delete-analysis-${analysis.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {analysis.industry && (
                      <Badge variant="secondary" className="w-fit">
                        {analysis.industry}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {analysis.executiveSummary.slice(0, 150)}...
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {analysis.createdAt ? new Date(analysis.createdAt).toLocaleDateString() : "Recently"}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewSavedAnalysis(analysis)}
                        data-testid={`button-view-analysis-${analysis.id}`}
                      >
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  if (analysisResult && currentPhase === "complete") {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnalysisResults result={analysisResult} onReset={handleReset} />
        </main>
      </div>
    );
  }

  if (showForm || isProcessing) {
    return (
      <div className="min-h-screen bg-background">
        {isProcessing && <ProcessingOverlay currentPhase={currentPhase} />}

        <AppHeader />

        <MobilePhaseProgress currentPhase={currentPhase} isProcessing={isProcessing} />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-[#001278] dark:text-white mb-3">
              Cognitive Zero-Base Analysis
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Enter a company name and our AI agents will research and generate a complete transformation analysis.
            </p>
          </div>

          <OrganizationForm
            onSubmit={handleSubmit}
            isLoading={isProcessing}
            showSaveOption={true}
            saveAnalysis={saveAnalysis}
            onSaveAnalysisChange={setSaveAnalysis}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main>
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-[#001278] dark:text-white mb-6 leading-tight">
              Cognitive Zero-Base Analysis
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Stop optimizing legacy processes. Redesign your business model with{" "}
              <span className="text-[#02a2fd] font-medium">Agentic AI</span> and the{" "}
              <span className="text-[#02a2fd] font-medium">Cognitive Zero-Base</span>{" "}
              framework.
            </p>
            <Button
              size="lg"
              onClick={() => setShowForm(true)}
              className="bg-[#02a2fd] hover:bg-[#0291e3] text-white font-bold text-lg px-8"
              data-testid="button-start-analysis"
            >
              Begin Analysis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>

        <section className="py-16 bg-muted/30 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-[#001278] dark:text-white text-center mb-12">
              The 5-Phase Framework
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={Brain}
                title="Cognitive Audit"
                description="Identify cognitive nodes where expensive human capital converts unstructured data into structured decisions."
              />
              <FeatureCard
                icon={Zap}
                title="Agentic Design"
                description="Map problems to powerful patterns: Drafter-Critic, Reasoning Engine, Orchestrator, and Tool User."
              />
              <FeatureCard
                icon={Target}
                title="EPOCH Filter"
                description="Filter tasks by Empathy, Physicality, Opinion, and Leadership to find the Jagged Frontier."
              />
              <FeatureCard
                icon={BarChart3}
                title="Unit Economics"
                description="Calculate LCOAI (Levelized Cost of AI) and the Trust Tax of human verification."
              />
              <FeatureCard
                icon={Target}
                title="Horizons Portfolio"
                description="Allocate use cases across Deflationary Core, Augmented Workforce, and Strategic Optionality."
              />
              <Card className="flex items-center justify-center bg-[#02a2fd]/10 border-[#02a2fd]/30">
                <CardContent className="text-center py-8">
                  <p className="text-lg font-medium text-[#001278] dark:text-white mb-4">
                    Ready to transform?
                  </p>
                  <Button
                    onClick={() => setShowForm(true)}
                    className="bg-[#001278] hover:bg-[#001278]/90 text-white"
                    data-testid="button-get-started"
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-[#001278] dark:text-white text-center mb-8">
              What You Will Receive
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <OutputCard
                title="Executive Summary"
                description="A biting, honest assessment of your organization's AI transformation potential with strategic recommendations."
              />
              <OutputCard
                title="Cognitive Load Heatmap"
                description="Visual comparison of human cognitive burden vs. AI automation potential across process steps."
              />
              <OutputCard
                title="Trust Tax Waterfall"
                description="Financial breakdown showing human cost, AI savings, verification overhead, and final LCOAI."
              />
              <OutputCard
                title="Horizons Bubble Chart"
                description="Strategic portfolio view plotting use cases by data readiness, business value, and implementation risk."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <BlueAllyLogo />
          <p className="text-sm text-muted-foreground text-center">
            Applying Cognitive Zero-Basing and Agentic Design.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Brain;
  title: string;
  description: string;
}) {
  return (
    <Card className="hover-elevate">
      <CardContent className="pt-6">
        <div className="w-12 h-12 bg-[#02a2fd]/10 rounded-md flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-[#02a2fd]" />
        </div>
        <h3 className="text-lg font-bold text-[#001278] dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function OutputCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 p-4 bg-muted/30 rounded-md">
      <div className="w-2 h-full bg-[#02a2fd] rounded-full flex-shrink-0" />
      <div>
        <h4 className="font-bold text-foreground mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
