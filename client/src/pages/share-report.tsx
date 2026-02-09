import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ReportTemplate } from "@/components/report-template";
import { type AnalysisResult } from "@shared/schema";
import { Loader2, AlertCircle } from "lucide-react";
import { BlueAllyLogo } from "@/components/blueally-logo";

export default function ShareReport() {
  const params = useParams<{ id: string }>();
  const reportId = params.id;

  const { data: analysis, isLoading, error } = useQuery<AnalysisResult>({
    queryKey: ["/api/analyses", reportId],
    queryFn: async () => {
      const response = await fetch(`/api/analyses/${reportId}?share=true`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Report not found");
        }
        throw new Error("Failed to load report");
      }
      return response.json();
    },
    enabled: !!reportId,
    retry: false
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#02a2fd] mx-auto mb-4" />
          <p className="text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Report Not Found</h1>
          <p className="text-gray-600 mb-6">
            This report may have been deleted or the link is invalid.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <BlueAllyLogo className="h-5" />
            <span>Cognitive Zero-Base Analysis</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <ReportTemplate data={analysis} />
    </div>
  );
}
