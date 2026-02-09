import { FileText, AlertCircle, TrendingUp, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExecutiveSummaryProps {
  summary: string;
  companyName: string;
}

export function ExecutiveSummary({ summary, companyName }: ExecutiveSummaryProps) {
  const sections = summary.split("\n\n").filter(Boolean);

  return (
    <Card className="bg-[#cde5f1]/30 dark:bg-[#001278]/20 border-[#02a2fd]/30">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl text-[#001278] dark:text-white flex items-center gap-3">
          <FileText className="h-5 w-5 text-[#02a2fd]" />
          Executive Summary: {companyName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.map((section, index) => {
          const isWarning = section.toLowerCase().includes("warning") || 
                           section.toLowerCase().includes("risk") ||
                           section.toLowerCase().includes("critical");
          const isOpportunity = section.toLowerCase().includes("opportunity") ||
                               section.toLowerCase().includes("potential") ||
                               section.toLowerCase().includes("recommend");
          const isInsight = section.toLowerCase().includes("insight") ||
                           section.toLowerCase().includes("analysis") ||
                           section.toLowerCase().includes("finding");

          let Icon = Lightbulb;
          let iconColor = "text-[#02a2fd]";

          if (isWarning) {
            Icon = AlertCircle;
            iconColor = "text-amber-500";
          } else if (isOpportunity) {
            Icon = TrendingUp;
            iconColor = "text-[#36bf78]";
          } else if (isInsight) {
            Icon = Lightbulb;
            iconColor = "text-[#02a2fd]";
          }

          return (
            <div
              key={index}
              className="flex gap-3 p-4 bg-background rounded-md"
              data-testid={`summary-section-${index}`}
            >
              <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0 mt-0.5`} />
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {section}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
