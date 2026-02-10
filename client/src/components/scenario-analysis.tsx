import { TrendingUp, TrendingDown, Target, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScenarioAnalysis, ScenarioDetail } from "@shared/schema";

interface ScenarioAnalysisProps {
  scenarios: ScenarioAnalysis;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

const scenarioConfig = {
  conservative: {
    borderColor: "border-slate-300 dark:border-slate-600",
    headerBg: "bg-slate-100 dark:bg-slate-800",
    accentColor: "text-slate-600 dark:text-slate-400",
    icon: TrendingDown,
  },
  baseCase: {
    borderColor: "border-[#02a2fd]",
    headerBg: "bg-[#02a2fd]/10",
    accentColor: "text-[#02a2fd]",
    icon: Target,
  },
  optimistic: {
    borderColor: "border-[#36bf78]",
    headerBg: "bg-[#36bf78]/10",
    accentColor: "text-[#36bf78]",
    icon: TrendingUp,
  },
};

function ScenarioCard({
  scenario,
  variant,
  isHighlighted,
}: {
  scenario: ScenarioDetail;
  variant: keyof typeof scenarioConfig;
  isHighlighted?: boolean;
}) {
  const config = scenarioConfig[variant];
  const Icon = config.icon;

  return (
    <Card className={`${config.borderColor} ${isHighlighted ? "border-2 shadow-lg" : "border"}`}>
      <CardHeader className={`${config.headerBg} pb-3`}>
        <CardTitle className={`text-lg flex items-center gap-2 ${config.accentColor}`}>
          <Icon className="h-5 w-5" />
          {scenario.label}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{scenario.description}</p>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Key metrics */}
        <div className="space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">Annual Benefit</span>
            <span className={`text-xl font-bold ${config.accentColor}`}>
              {formatCurrency(scenario.annualBenefit)}
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">3-Year NPV</span>
            <span className="text-lg font-semibold text-foreground">
              {formatCurrency(scenario.threeYearNPV)}
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Payback
            </span>
            <span className="text-sm font-semibold text-foreground">
              {scenario.paybackMonths} months
            </span>
          </div>
        </div>

        <hr className="border-border" />

        {/* Adoption metrics */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xs text-muted-foreground">Adoption</div>
            <div className="text-sm font-semibold">{scenario.adoptionRate}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Ramp</div>
            <div className="text-sm font-semibold">{scenario.rampTime}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Realization</div>
            <div className="text-sm font-semibold">{scenario.realizationRate}</div>
          </div>
        </div>

        <hr className="border-border" />

        {/* Key Assumptions */}
        {scenario.keyAssumptions && scenario.keyAssumptions.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Key Assumptions</span>
            <ul className="mt-1 space-y-1">
              {scenario.keyAssumptions.map((assumption, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 flex-shrink-0 mt-0.5" />
                  <span>{assumption}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ScenarioAnalysisDisplay({ scenarios }: ScenarioAnalysisProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-[#001278] dark:text-white">
          Financial Sensitivity Analysis
        </h3>
        <p className="text-muted-foreground mt-1">
          Three scenarios showing the range of expected outcomes based on adoption and organizational readiness.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <ScenarioCard scenario={scenarios.conservative} variant="conservative" />
        <ScenarioCard scenario={scenarios.baseCase} variant="baseCase" isHighlighted />
        <ScenarioCard scenario={scenarios.optimistic} variant="optimistic" />
      </div>
    </div>
  );
}
