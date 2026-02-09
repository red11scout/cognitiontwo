import { Loader2, Brain, Workflow, Calculator, Target, CheckCircle } from "lucide-react";
import { type AnalysisPhase, phaseLabels, phaseDescriptions } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ProcessingOverlayProps {
  currentPhase: AnalysisPhase;
}

const phaseIcons: Record<AnalysisPhase, typeof Brain> = {
  "input": Brain,
  "cognitive-audit": Brain,
  "agentic-design": Workflow,
  "epoch-filter": Target,
  "unit-economics": Calculator,
  "horizons-portfolio": Target,
  "complete": CheckCircle,
};

export function ProcessingOverlay({ currentPhase }: ProcessingOverlayProps) {
  const PhaseIcon = phaseIcons[currentPhase];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-[#02a2fd]/20 rounded-full animate-ping" />
              <div className="relative w-20 h-20 bg-[#02a2fd] rounded-full flex items-center justify-center">
                <PhaseIcon className="h-10 w-10 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#001278] dark:text-white">
                {phaseLabels[currentPhase]}
              </h3>
              <p className="text-muted-foreground">
                {phaseDescriptions[currentPhase]}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-[#02a2fd]" />
              <span>AI is analyzing your organization...</span>
            </div>

            <div className="w-full space-y-3">
              <ProcessingStep
                label="Cognitive Audit"
                isActive={currentPhase === "cognitive-audit"}
                isComplete={["agentic-design", "epoch-filter", "unit-economics", "horizons-portfolio", "complete"].includes(currentPhase)}
              />
              <ProcessingStep
                label="Agentic Design Patterns"
                isActive={currentPhase === "agentic-design"}
                isComplete={["epoch-filter", "unit-economics", "horizons-portfolio", "complete"].includes(currentPhase)}
              />
              <ProcessingStep
                label="EPOCH Filter"
                isActive={currentPhase === "epoch-filter"}
                isComplete={["unit-economics", "horizons-portfolio", "complete"].includes(currentPhase)}
              />
              <ProcessingStep
                label="Unit Economics"
                isActive={currentPhase === "unit-economics"}
                isComplete={["horizons-portfolio", "complete"].includes(currentPhase)}
              />
              <ProcessingStep
                label="Horizons Portfolio"
                isActive={currentPhase === "horizons-portfolio"}
                isComplete={["complete"].includes(currentPhase)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProcessingStep({
  label,
  isActive,
  isComplete,
}: {
  label: string;
  isActive: boolean;
  isComplete: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
          isComplete && "bg-[#36bf78]",
          isActive && "bg-[#02a2fd]",
          !isComplete && !isActive && "bg-muted"
        )}
      >
        {isComplete ? (
          <CheckCircle className="h-4 w-4 text-white" />
        ) : isActive ? (
          <Loader2 className="h-4 w-4 text-white animate-spin" />
        ) : (
          <div className="w-2 h-2 bg-muted-foreground/30 rounded-full" />
        )}
      </div>
      <span
        className={cn(
          "text-sm transition-colors",
          isComplete && "text-[#36bf78] font-medium",
          isActive && "text-foreground font-medium",
          !isComplete && !isActive && "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </div>
  );
}
