import { useRef, useCallback, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import { type CognitiveLoadHeatmapData } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain, AlertCircle } from "lucide-react";

interface CognitiveHeatmapEChartProps {
  data: CognitiveLoadHeatmapData;
  onReady?: () => void;
}

export function CognitiveHeatmapEChart({ data, onReady }: CognitiveHeatmapEChartProps) {
  const hasData = data && Array.isArray(data.labels) && data.labels.length > 0;
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
      <Card data-testid="chart-cognitive-heatmap-echart">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-[#001278] dark:text-white flex items-center gap-2">
            <Brain className="h-5 w-5 text-[#02a2fd]" />
            Cognitive Load Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Chart data unavailable</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const safeLabels = Array.isArray(data.labels) ? data.labels : [];
  const safeHumanLoad = Array.isArray(data.humanLoad) ? data.humanLoad : [];
  const safeAiLoad = Array.isArray(data.aiLoad) ? data.aiLoad : [];

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "#001278",
      borderColor: "#001278",
      textStyle: { fontFamily: "DM Sans", color: "#fff" },
      formatter: (params: any) => {
        let result = `<strong>${params[0].axisValue}</strong><br/>`;
        params.forEach((p: any) => {
          result += `${p.marker} ${p.seriesName}: ${p.value}/10<br/>`;
        });
        return result;
      }
    },
    legend: {
      top: 0,
      textStyle: { fontFamily: "DM Sans", fontSize: 12 },
      icon: "roundRect"
    },
    grid: { left: 120, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: "value",
      min: 0,
      max: 10,
      name: "Cognitive Load (1-10)",
      nameLocation: "middle",
      nameGap: 25,
      nameTextStyle: { fontFamily: "DM Sans", fontSize: 12, fontWeight: 500 },
      axisLabel: { fontFamily: "DM Sans", fontSize: 11 },
      splitLine: { lineStyle: { color: "rgba(0, 18, 120, 0.1)" } }
    },
    yAxis: {
      type: "category",
      data: safeLabels,
      axisLabel: { fontFamily: "DM Sans", fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    series: [
      {
        name: "Human Load (Today)",
        type: "bar",
        data: safeHumanLoad,
        itemStyle: { color: "#001278", borderRadius: [0, 4, 4, 0] },
        barWidth: 12
      },
      {
        name: "AI Load (Future)",
        type: "bar",
        data: safeAiLoad,
        itemStyle: { color: "#02a2fd", borderRadius: [0, 4, 4, 0] },
        barWidth: 12
      }
    ]
  };

  const avgHumanLoad = safeHumanLoad.length > 0 
    ? safeHumanLoad.reduce((a, b) => a + (typeof b === "number" ? b : 0), 0) / safeHumanLoad.length 
    : 0;
  const avgAiLoad = safeAiLoad.length > 0 
    ? safeAiLoad.reduce((a, b) => a + (typeof b === "number" ? b : 0), 0) / safeAiLoad.length 
    : 0;
  const loadReduction = avgHumanLoad > 0 
    ? ((avgHumanLoad - avgAiLoad) / avgHumanLoad * 100).toFixed(0) 
    : "0";

  return (
    <Card data-testid="chart-cognitive-heatmap-echart">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-[#001278] dark:text-white flex items-center gap-2">
          <Brain className="h-5 w-5 text-[#02a2fd]" />
          Cognitive Load Heatmap
        </CardTitle>
        <CardDescription className="text-xs">
          Compares mental effort required for each process step today vs. with AI assistance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ReactECharts 
            option={option} 
            style={{ height: "100%", width: "100%" }}
            onEvents={onReady ? { finished: handleFinished } : undefined}
          />
        </div>
        <div className="mt-4 p-3 bg-muted/30 rounded-md">
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Avg Human Load: </span>
              <span className="font-semibold text-[#001278] dark:text-white">{avgHumanLoad.toFixed(1)}/10</span>
            </div>
            <div>
              <span className="text-muted-foreground">Avg AI Load: </span>
              <span className="font-semibold text-[#02a2fd]">{avgAiLoad.toFixed(1)}/10</span>
            </div>
            <div>
              <span className="text-muted-foreground">Reduction: </span>
              <span className="font-semibold text-[#36bf78]">{loadReduction}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
