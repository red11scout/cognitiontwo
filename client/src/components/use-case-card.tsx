import {
  GitCompare,
  Repeat,
  Brain,
  Workflow,
  Wrench,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Clock,
  Zap,
  ShieldCheck,
  Shuffle,
  Layers,
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

const automationBadge: Record<string, { label: string; color: string }> = {
  full: { label: "Fully Automated", color: "bg-[#36bf78] text-white" },
  assisted: { label: "AI-Assisted", color: "bg-[#02a2fd] text-white" },
  supervised: { label: "Supervised", color: "bg-amber-500 text-white" },
};

function DotMeter({ value, max = 10, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-full ${i < value ? color : "bg-muted"}`}
        />
      ))}
    </div>
  );
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

// Check if this use case has enriched Legacy Way data
function hasEnrichedLegacy(uc: UseCase): boolean {
  return !!(
    uc.legacyProcessSteps?.length ||
    uc.legacyPainPoints?.length ||
    uc.legacyCognitionNodes ||
    uc.legacyTranslationTax ||
    uc.legacyContextSwitching ||
    uc.legacyTimeConsumed
  );
}

function hasEnrichedAgentic(uc: UseCase): boolean {
  return !!(
    uc.agenticPatternRationale ||
    uc.agenticPrimitives?.length ||
    uc.agenticTransformSteps?.length ||
    uc.agenticHitlCheckpoints?.length
  );
}

export function UseCaseCard({ useCase, index }: UseCaseCardProps) {
  const PatternIcon = patternIcons[useCase.pattern] || Brain;
  const enrichedLegacy = hasEnrichedLegacy(useCase);
  const enrichedAgentic = hasEnrichedAgentic(useCase);

  return (
    <Card
      className="relative overflow-visible"
      data-testid={`usecase-card-${useCase.id}`}
    >
      {/* Number badge */}
      <div className="absolute -left-3 -top-3 w-10 h-10 bg-[#02a2fd] rounded-full flex items-center justify-center text-white font-bold text-base shadow-md z-10">
        {index + 1}
      </div>

      <CardHeader className="pt-8 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-xl text-[#001278] dark:text-white pr-4">
            {useCase.title}
          </CardTitle>
          <Badge className={`${horizonColors[useCase.horizon]} px-4 py-1 text-sm`}>
            H{useCase.horizon} &middot; {useCase.horizonLabel}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1">
            <PatternIcon className="h-3.5 w-3.5 flex-shrink-0" />
            {useCase.patternName}
          </Badge>
          {useCase.estimatedSavings && (
            <Badge className="bg-[#36bf78]/10 text-[#36bf78] border-[#36bf78]/20 flex items-center gap-1.5 px-3 py-1">
              <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />
              {useCase.estimatedSavings}
            </Badge>
          )}
          {useCase.agenticAutomationLevel && automationBadge[useCase.agenticAutomationLevel] && (
            <Badge className={`${automationBadge[useCase.agenticAutomationLevel].color} px-3 py-1`}>
              {automationBadge[useCase.agenticAutomationLevel].label}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Legacy Way / Agentic Way split */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* LEGACY WAY */}
          <div className="p-4 bg-muted/50 rounded-lg border border-border/50 space-y-3">
            <h4 className="text-sm font-bold text-[#001278] dark:text-white flex items-center gap-2 uppercase tracking-wide">
              <Repeat className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              Legacy Way
            </h4>

            {enrichedLegacy ? (
              <>
                {/* Annual Cost */}
                {useCase.legacyAnnualCost && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <span className="text-lg font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(useCase.legacyAnnualCost)}/yr
                    </span>
                  </div>
                )}

                {/* Process Steps */}
                {useCase.legacyProcessSteps && useCase.legacyProcessSteps.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Process</span>
                    <ol className="mt-1 space-y-0.5">
                      {useCase.legacyProcessSteps.map((step, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                          <span className="text-muted-foreground/60 font-mono text-xs mt-0.5">{i + 1}.</span>
                          <span className="break-words" style={{ overflowWrap: 'anywhere' }}>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Pain Points */}
                {useCase.legacyPainPoints && useCase.legacyPainPoints.length > 0 && (
                  <div className="space-y-1">
                    {useCase.legacyPainPoints.map((pain, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-sm text-red-600 dark:text-red-400">
                        <span className="flex-shrink-0 mt-1">&#x2022;</span>
                        <span className="break-words" style={{ overflowWrap: 'anywhere' }}>{pain}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Cognitive metrics row */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {useCase.legacyCognitionNodes != null && (
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      {useCase.legacyCognitionNodes} cognition nodes
                    </span>
                  )}
                  {useCase.legacyTranslationTax && (
                    <span className="flex items-center gap-1">
                      <Shuffle className="h-3 w-3" />
                      {useCase.legacyTranslationTax}
                    </span>
                  )}
                  {useCase.legacyContextSwitching && (
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {useCase.legacyContextSwitching}
                    </span>
                  )}
                  {useCase.legacyTimeConsumed && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {useCase.legacyTimeConsumed}
                    </span>
                  )}
                </div>
              </>
            ) : (
              /* Fallback: plain text for old analyses */
              <p className="text-sm text-muted-foreground leading-relaxed break-words" style={{ overflowWrap: 'anywhere' }}>
                {useCase.oldWay}
              </p>
            )}
          </div>

          {/* AGENTIC WAY */}
          <div className="p-4 bg-[#02a2fd]/5 rounded-lg border border-[#02a2fd]/20 space-y-3">
            <h4 className="text-sm font-bold text-[#02a2fd] flex items-center gap-2 uppercase tracking-wide">
              <ArrowRight className="h-4 w-4 flex-shrink-0" />
              Agentic Way
            </h4>

            {enrichedAgentic ? (
              <>
                {/* Pattern Rationale */}
                {useCase.agenticPatternRationale && (
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Why {useCase.patternName}</span>
                    <p className="mt-1 text-sm text-foreground break-words" style={{ overflowWrap: 'anywhere' }}>
                      {useCase.agenticPatternRationale}
                    </p>
                  </div>
                )}

                {/* Transform Steps */}
                {useCase.agenticTransformSteps && useCase.agenticTransformSteps.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transforms by</span>
                    <ul className="mt-1 space-y-0.5">
                      {useCase.agenticTransformSteps.map((step, i) => (
                        <li key={i} className="text-sm text-foreground flex gap-1.5">
                          <span className="text-[#02a2fd] flex-shrink-0 mt-0.5">&#x2192;</span>
                          <span className="break-words" style={{ overflowWrap: 'anywhere' }}>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* AI Primitives */}
                {useCase.agenticPrimitives && useCase.agenticPrimitives.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {useCase.agenticPrimitives.map((prim, i) => (
                      <Badge key={i} variant="secondary" className="text-xs px-2 py-0.5">
                        {prim}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* HITL Checkpoints */}
                {useCase.agenticHitlCheckpoints && useCase.agenticHitlCheckpoints.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      Human-in-the-loop
                    </span>
                    <ul className="mt-1 space-y-0.5">
                      {useCase.agenticHitlCheckpoints.map((cp, i) => (
                        <li key={i} className="text-xs text-muted-foreground break-words" style={{ overflowWrap: 'anywhere' }}>
                          &bull; {cp}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              /* Fallback: plain text for old analyses */
              <p className="text-sm text-foreground leading-relaxed break-words" style={{ overflowWrap: 'anywhere' }}>
                {useCase.agenticWay}
              </p>
            )}
          </div>
        </div>

        {/* Bottom metrics bar */}
        <div className="flex flex-wrap justify-between gap-4 pt-2 border-t border-border/50">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Data Readiness</span>
            <div className="flex items-center gap-2">
              <DotMeter value={useCase.dataReadiness} color="bg-[#02a2fd]" />
              <span className="text-xs font-medium">{useCase.dataReadiness}/10</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Business Value</span>
            <div className="flex items-center gap-2">
              <DotMeter value={useCase.businessValue} color="bg-[#36bf78]" />
              <span className="text-xs font-medium">{useCase.businessValue}/10</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
