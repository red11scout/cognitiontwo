import { useState, useEffect, useRef } from "react";
import { useLocation, useParams, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ReportTemplate } from "@/components/report-template";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Download, FileText, Eye, Loader2, CheckCircle, AlertCircle, Share2, Copy, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { type AnalysisResult } from "@shared/schema";

function getOwnerToken(): string {
  let token = localStorage.getItem("workspace_token");
  if (!token) {
    token = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem("workspace_token", token);
  }
  return token;
}

export default function ReportBuilder() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const analysisIdFromUrl = urlParams.get("id");
  
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(analysisIdFromUrl);
  const [showSections, setShowSections] = useState({
    executiveSummary: true,
    cognitiveNodes: true,
    financialCharts: true,
    horizons: true,
    useCases: true
  });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<"idle" | "success" | "error">("idle");
  const [isGeneratingShareLink, setIsGeneratingShareLink] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: directAnalysis, isLoading: loadingDirect } = useQuery<AnalysisResult>({
    queryKey: ["/api/analyses", analysisIdFromUrl],
    queryFn: async () => {
      const response = await fetch(`/api/analyses/${analysisIdFromUrl}`);
      if (!response.ok) throw new Error("Failed to fetch analysis");
      return response.json();
    },
    enabled: !!analysisIdFromUrl
  });

  const { data: analyses, isLoading: loadingAnalyses } = useQuery<AnalysisResult[]>({
    queryKey: ["/api/analyses", getOwnerToken()],
    queryFn: async () => {
      const response = await fetch(`/api/analyses?ownerToken=${getOwnerToken()}`);
      if (!response.ok) throw new Error("Failed to fetch analyses");
      return response.json();
    },
    enabled: !analysisIdFromUrl
  });

  const allAnalyses = analysisIdFromUrl && directAnalysis ? [directAnalysis] : (analyses || []);
  const selectedAnalysis = allAnalyses.find(a => a.id === selectedAnalysisId) || directAnalysis;

  const handleDownloadPdf = async () => {
    if (!selectedAnalysisId) return;
    
    setIsGeneratingPdf(true);
    setPdfStatus("idle");
    
    try {
      const response = await fetch(`/api/reports/${selectedAnalysisId}/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: "html" })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || "PDF generation failed");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedAnalysis?.organizationProfile.companyName || "analysis"}-report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setPdfStatus("success");
      toast({
        title: "PDF Downloaded",
        description: "Your report has been saved"
      });
    } catch (err: any) {
      console.error("PDF export error:", err?.message || err);
      setPdfStatus("error");
      toast({
        title: "PDF Export Failed",
        description: err?.message || "Could not generate PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  useEffect(() => {
    if (directAnalysis && !selectedAnalysisId) {
      setSelectedAnalysisId(directAnalysis.id);
    } else if (analyses && analyses.length > 0 && !selectedAnalysisId) {
      setSelectedAnalysisId(analyses[0].id);
    }
  }, [directAnalysis?.id, analyses?.length]);

  useEffect(() => {
    setShareLink(null);
  }, [selectedAnalysisId]);

  const handleGenerateShareLink = async () => {
    if (!selectedAnalysisId) return;
    
    setIsGeneratingShareLink(true);
    
    try {
      const response = await fetch(`/api/reports/${selectedAnalysisId}/share`, {
        method: "POST",
      });
      
      if (!response.ok) throw new Error("Failed to generate share link");
      
      const data = await response.json();
      setShareLink(data.shortLink);
      
      toast({
        title: "Share link created",
        description: data.dubConfigured 
          ? "Shortened URL ready to share" 
          : "Share link generated (add DUB_API_KEY for short URLs)"
      });
    } catch (err) {
      console.error("Share link error:", err);
      toast({
        title: "Error",
        description: "Failed to generate share link",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingShareLink(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;
    
    try {
      await navigator.clipboard.writeText(shareLink);
      toast({
        title: "Copied",
        description: "Share link copied to clipboard"
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/")}
            data-testid="button-back-home"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-lg font-semibold text-[#001278] dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#02a2fd]" />
            Report Builder
          </h1>
          <Button 
            onClick={handleDownloadPdf}
            disabled={!selectedAnalysis || isGeneratingPdf}
            data-testid="button-download-pdf"
          >
            {isGeneratingPdf ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : pdfStatus === "success" ? (
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
            ) : pdfStatus === "error" ? (
              <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isGeneratingPdf ? "Generating..." : "Download PDF"}
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[300px_1fr] gap-6">
          <aside className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Select Analysis</CardTitle>
                <CardDescription className="text-xs">Choose a report to preview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {(loadingAnalyses || loadingDirect) ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : allAnalyses && allAnalyses.length > 0 ? (
                  allAnalyses.map((analysis) => (
                    <button
                      key={analysis.id}
                      onClick={() => setSelectedAnalysisId(analysis.id)}
                      className={`w-full text-left p-3 rounded-md border transition-colors ${
                        selectedAnalysisId === analysis.id 
                          ? "border-[#02a2fd] bg-[#02a2fd]/5" 
                          : "border-border hover-elevate"
                      }`}
                      data-testid={`button-select-analysis-${analysis.id}`}
                    >
                      <div className="font-medium text-sm">{analysis.organizationProfile.companyName}</div>
                      <div className="text-xs text-muted-foreground">{analysis.organizationProfile.industry}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(analysis.createdAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No analyses found. Create one first.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Section Visibility
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(showSections).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <Label htmlFor={key} className="text-xs capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </Label>
                    <Switch
                      id={key}
                      checked={value}
                      onCheckedChange={(checked) => 
                        setShowSections(prev => ({ ...prev, [key]: checked }))
                      }
                      data-testid={`switch-section-${key}`}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share Report
                </CardTitle>
                <CardDescription className="text-xs">Create a shareable link</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {shareLink ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input 
                        value={shareLink} 
                        readOnly 
                        className="text-xs"
                        data-testid="input-share-link"
                      />
                      <Button 
                        size="icon" 
                        variant="outline"
                        onClick={handleCopyLink}
                        data-testid="button-copy-link"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(shareLink, "_blank")}
                      data-testid="button-open-share-link"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in new tab
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={handleGenerateShareLink}
                    disabled={!selectedAnalysis || isGeneratingShareLink}
                    className="w-full"
                    data-testid="button-generate-share-link"
                  >
                    {isGeneratingShareLink ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Share2 className="h-4 w-4 mr-2" />
                    )}
                    {isGeneratingShareLink ? "Generating..." : "Generate Share Link"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </aside>

          <main className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden border">
            {selectedAnalysis ? (
              <div ref={reportRef} className="overflow-auto max-h-[calc(100vh-180px)]">
                <ReportTemplate data={selectedAnalysis} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Select an analysis to preview the report</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
