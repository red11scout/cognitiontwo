import { useRef, useCallback, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import { type TrustTaxBreakdown } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calculator, AlertCircle } from "lucide-react";

function formatCurrency(value: number, currency: string): string {
  const safeValue = typeof value === "number" && !isNaN(value) ? value : 0;
  const absValue = Math.abs(safeValue);
  const prefix = safeValue < 0 ? "-" : "";
  
  if (absValue >= 1000000) {
    const millions = absValue / 1000000;
    return `${prefix}${currency}${millions.toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;
  } else if (absValue >= 1000) {
    const thousands = absValue / 1000;
    return `${prefix}${currency}${thousands.toLocaleString(undefined, { maximumFractionDigits: 1 })}k`;
  }
  return `${prefix}${currency}${absValue.toLocaleString()}`;
}

function safeNum(val: any, fallback: number = 0): number {
  return typeof val === "number" && !isNaN(val) ? val : fallback;
}

interface TrustTaxWaterfallEChartProps {
  data: TrustTaxBreakdown;
  onReady?: () => void;
}

export function TrustTaxWaterfallEChart({ data, onReady }: TrustTaxWaterfallEChartProps) {
  const hasData = data && 
    typeof data.currentHumanCost === "number" && 
    typeof data.aiEfficiencySavings === "number" && 
    typeof data.trustTaxCost === "number" && 
    typeof data.finalLCOAI === "number" &&
    data.currentHumanCost > 0;
  const hasCalledOnReady = useRef(false);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  
  useEffect(() => {
    if (!hasData && onReadyRef.current && !hasCalledOnReady.current) {
      hasCalledOnReady.current = true;
      onReadyRef.current();
    }
  }, [hasData]);

  const handleFinished = useCallback(() => {
    if (!hasCalledOnReady.current && onReadyRef.current) {
      hasCalledOnReady.current = true;
      onReadyRef.current();
    }
  }, []);

  if (!hasData) {
    return (
      <Card data-testid="chart-trust-tax-waterfall-echart">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-[#001278] dark:text-white flex items-center gap-2">
            <Calculator className="h-5 w-5 text-[#02a2fd]" />
            Trust Tax Waterfall
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[260px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Chart data unavailable</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currency = data.currency || "$";
  const currentHumanCost = safeNum(data.currentHumanCost);
  const aiEfficiencySavings = safeNum(data.aiEfficiencySavings);
  const trustTaxCost = safeNum(data.trustTaxCost);
  const finalLCOAI = safeNum(data.finalLCOAI);

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "#001278",
      borderColor: "#001278",
      textStyle: { fontFamily: "DM Sans", color: "#fff" },
      formatter: (params: any) => {
        const item = params[0];
        const descriptions = [
          "Current fully-loaded cost of human labor",
          "Cost reduction from AI automation",
          "Overhead cost for human review/verification",
          "Levelized Cost of AI (net cost with AI)"
        ];
        return `<strong>${item.name}</strong><br/>${formatCurrency(item.value, currency)}<br/><span style="font-size:11px">${descriptions[item.dataIndex]}</span>`;
      }
    },
    grid: { left: 60, right: 20, top: 20, bottom: 40 },
    xAxis: {
      type: "category",
      data: ["Human Cost", "AI Savings", "Trust Tax", "Final LCOAI"],
      axisLabel: { fontFamily: "DM Sans", fontSize: 10, rotate: 0 },
      axisLine: { lineStyle: { color: "#ccc" } }
    },
    yAxis: {
      type: "value",
      axisLabel: { 
        fontFamily: "DM Sans", 
        fontSize: 11,
        formatter: (value: number) => formatCurrency(value, currency)
      },
      splitLine: { lineStyle: { color: "rgba(0, 18, 120, 0.1)" } }
    },
    series: [{
      type: "bar",
      data: [
        { value: currentHumanCost, itemStyle: { color: "#001278" } },
        { value: -aiEfficiencySavings, itemStyle: { color: "#36bf78" } },
        { value: trustTaxCost, itemStyle: { color: "#f59e0b" } },
        { value: finalLCOAI, itemStyle: { color: "#02a2fd" } }
      ],
      barWidth: "50%",
      itemStyle: { borderRadius: [4, 4, 0, 0] }
    }]
  };

  const savings = currentHumanCost - finalLCOAI;
  const savingsPercent = currentHumanCost > 0 ? ((savings / currentHumanCost) * 100).toFixed(0) : "0";
  const trustTaxPercent = aiEfficiencySavings > 0 ? ((trustTaxCost / aiEfficiencySavings) * 100).toFixed(0) : "0";

  return (
    <Card data-testid="chart-trust-tax-waterfall-echart">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-[#001278] dark:text-white flex items-center gap-2">
          <Calculator className="h-5 w-5 text-[#02a2fd]" />
          Trust Tax Waterfall
        </CardTitle>
        <CardDescription className="text-xs">
          Financial breakdown showing how AI costs are calculated with human verification overhead
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ReactECharts 
            option={option} 
            style={{ height: "100%", width: "100%" }}
            onEvents={onReady ? { finished: handleFinished } : undefined}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
          <div className="p-2 bg-muted/30 rounded-md">
            <div className="text-muted-foreground">Trust Tax Rate</div>
            <div className="font-bold text-amber-500">{trustTaxPercent}% of savings</div>
          </div>
          <div className="p-2 bg-[#36bf78]/10 rounded-md">
            <div className="text-muted-foreground">Net Savings</div>
            <div className="font-bold text-[#36bf78]">{formatCurrency(savings, currency)} ({savingsPercent}%)</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
