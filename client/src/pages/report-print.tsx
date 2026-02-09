import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { ReportTemplate } from "@/components/report-template";
import { type AnalysisResult } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function ReportPrint() {
  const params = useParams<{ id: string }>();

  const { data: analysis, isLoading, error } = useQuery<AnalysisResult>({
    queryKey: ["/api/analyses", params.id],
    queryFn: async () => {
      const response = await fetch(`/api/analyses/${params.id}?share=true`);
      if (!response.ok) throw new Error("Failed to fetch analysis");
      return response.json();
    },
    enabled: !!params.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#02a2fd]" />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <p className="text-red-500">Failed to load analysis</p>
      </div>
    );
  }

  return <ReportTemplate data={analysis} />;
}
