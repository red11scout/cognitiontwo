import { Check, Loader2 } from "lucide-react";
import { type AnalysisPhase, phaseLabels } from "@shared/schema";
import { cn } from "@/lib/utils";

interface PhaseStepperProps {
  currentPhase: AnalysisPhase;
  isProcessing: boolean;
}

const phases: AnalysisPhase[] = [
  "input",
  "cognitive-audit",
  "agentic-design",
  "epoch-filter",
  "unit-economics",
  "horizons-portfolio",
  "complete",
];

export function PhaseStepper({ currentPhase, isProcessing }: PhaseStepperProps) {
  const currentIndex = phases.indexOf(currentPhase);

  return (
    <div className="hidden lg:flex flex-col gap-1 w-64 p-4">
      {phases.map((phase, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;

        return (
          <div
            key={phase}
            className="flex items-center gap-3"
            data-testid={`stepper-phase-${phase}`}
          >
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                isComplete && "bg-[#36bf78] text-white",
                isCurrent && !isProcessing && "bg-[#02a2fd] text-white",
                isCurrent && isProcessing && "bg-[#02a2fd] text-white",
                isPending && "bg-muted text-muted-foreground"
              )}
            >
              {isComplete ? (
                <Check className="h-4 w-4" />
              ) : isCurrent && isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                index + 1
              )}
            </div>
            <span
              className={cn(
                "text-sm transition-colors",
                isComplete && "text-[#36bf78] font-medium",
                isCurrent && "text-foreground font-bold",
                isPending && "text-muted-foreground"
              )}
            >
              {phaseLabels[phase]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function MobilePhaseProgress({ currentPhase, isProcessing }: PhaseStepperProps) {
  const currentIndex = phases.indexOf(currentPhase);
  const progress = ((currentIndex) / (phases.length - 1)) * 100;

  return (
    <div className="lg:hidden p-4 border-b border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">
          {phaseLabels[currentPhase]}
        </span>
        <span className="text-xs text-muted-foreground">
          {currentIndex + 1} of {phases.length}
        </span>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-[#02a2fd] rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
        {isProcessing && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
        )}
      </div>
    </div>
  );
}
