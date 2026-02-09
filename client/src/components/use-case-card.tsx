import { 
  GitCompare, 
  Repeat, 
  Brain, 
  Workflow, 
  Wrench, 
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { type UseCase, type AgenticPatternType } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UseCaseCardProps {
  useCase: UseCase;
  index: number;
}

const patternIcons: Record<AgenticPatternType, typeof Brain> = {
  "drafter-critic": GitCompare,
  "reasoning-engine": Brain,
  "orchestrator": Workflow,
  "tool-user": Wrench,
};

const horizonColors = {
  1: "bg-[#36bf78] text-white",
  2: "bg-[#02a2fd] text-white",
  3: "bg-[#001278] text-white dark:bg-white dark:text-[#001278]",
};

export function UseCaseCard({ useCase, index }: UseCaseCardProps) {
  const PatternIcon = patternIcons[useCase.pattern] || Brain;

  return (
    <Card 
      className="relative overflow-visible"
      data-testid={`usecase-card-${useCase.id}`}
    >
      <div className="absolute -left-3 -top-3 w-10 h-10 bg-[#02a2fd] rounded-full flex items-center justify-center text-white font-bold text-base shadow-md">
        {index + 1}
      </div>
      <CardHeader className="pt-8 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-xl text-[#001278] dark:text-white pr-4">
            {useCase.title}
          </CardTitle>
          <Badge className={`${horizonColors[useCase.horizon]} px-5 py-1.5 text-base text-center`}>
            Horizon {useCase.horizon}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <Badge variant="outline" className="flex items-center gap-2 text-base px-3 py-1">
            <PatternIcon className="h-4 w-4 flex-shrink-0" />
            {useCase.patternName}
          </Badge>
        </div>
        {useCase.estimatedSavings && (
          <div className="mt-4 p-4 bg-muted/50 rounded-md min-w-0">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-[#36bf78] flex-shrink-0 mt-0.5" />
              <p className="text-base text-foreground leading-relaxed whitespace-normal" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {useCase.estimatedSavings}
              </p>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-5 bg-muted/50 rounded-md min-w-0">
            <h4 className="text-base font-bold text-[#001278] dark:text-white mb-4 flex items-center justify-center gap-2">
              <Repeat className="h-5 w-5 flex-shrink-0" />
              Legacy Way
            </h4>
            <p className="text-base text-muted-foreground leading-relaxed whitespace-normal break-words text-center" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              {useCase.oldWay}
            </p>
          </div>
          <div className="p-5 bg-[#02a2fd]/10 rounded-md min-w-0">
            <h4 className="text-base font-bold text-[#02a2fd] mb-4 flex items-center justify-center gap-2">
              <ArrowRight className="h-5 w-5 flex-shrink-0" />
              Agentic Way
            </h4>
            <p className="text-base text-foreground leading-relaxed whitespace-normal break-words text-center" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
              {useCase.agenticWay}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-8 pt-4 text-base">
          <div className="flex flex-col items-center gap-2">
            <span className="text-muted-foreground font-medium">Data Readiness: {useCase.dataReadiness}/10</span>
            <div className="flex gap-1.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i < useCase.dataReadiness
                      ? "bg-[#02a2fd]"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-muted-foreground font-medium">Business Value: {useCase.businessValue}/10</span>
            <div className="flex gap-1.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i < useCase.businessValue
                      ? "bg-[#36bf78]"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
