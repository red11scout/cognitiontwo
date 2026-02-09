import { useRef, useCallback, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import { type HorizonsBubbleData } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Target, AlertCircle } from "lucide-react";

const horizonColors = {
  1: "#36bf78",
  2: "#02a2fd",
  3: "#001278",
};

interface HorizonsBubbleEChartProps {
  data: HorizonsBubbleData;
  onReady?: () => void;
}

export function HorizonsBubbleEChart({ data, onReady }: HorizonsBubbleEChartProps) {
  const hasData = data && Array.isArray(data.useCases) && data.useCases.length > 0;
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
      <Card data-testid="chart-horizons-bubble-echart">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-[#001278] dark:text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-[#02a2fd]" />
            Strategic Horizons Portfolio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Chart data unavailable</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const safeUseCases = Array.isArray(data.useCases) ? data.useCases : [];

  const seriesData = [1, 2, 3].map((horizon) => {
    const useCasesForHorizon = safeUseCases.filter((uc) => uc.horizon === horizon);
    return {
      name: `Horizon ${horizon}`,
      type: "scatter",
      symbolSize: (val: number[]) => Math.max((val[2] || 1) * 4, 8),
      data: useCasesForHorizon.map((uc) => ({
        value: [uc.x || 0, uc.y || 0, uc.r || 1],
        name: uc.label || "Unknown",
      })),
      itemStyle: { color: horizonColors[horizon as 1 | 2 | 3], opacity: 0.7 },
      emphasis: { itemStyle: { opacity: 1, borderColor: "#000", borderWidth: 1 } }
    };
  });

  const option = {
    tooltip: {
      trigger: "item",
      backgroundColor: "#001278",
      borderColor: "#001278",
      textStyle: { fontFamily: "DM Sans", color: "#fff" },
      formatter: (params: any) => {
        const [x, y, r] = params.value || [0, 0, 0];
        return `<strong>${params.name}</strong><br/>Data Readiness: ${x}/10<br/>Business Value: ${y}/10<br/>Risk Level: ${(r || 0).toFixed(0)}/10`;
      }
    },
    legend: {
      top: 0,
      textStyle: { fontFamily: "DM Sans", fontSize: 12 },
      icon: "circle"
    },
    grid: { left: 50, right: 20, top: 40, bottom: 50 },
    xAxis: {
      type: "value",
      min: 0,
      max: 10,
      name: "Data Readiness",
      nameLocation: "middle",
      nameGap: 30,
      nameTextStyle: { fontFamily: "DM Sans", fontSize: 12, fontWeight: 500 },
      axisLabel: { fontFamily: "DM Sans", fontSize: 11 },
      splitLine: { lineStyle: { color: "rgba(0, 18, 120, 0.1)" } }
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 20,
      name: "Business Value",
      nameLocation: "middle",
      nameGap: 35,
      nameTextStyle: { fontFamily: "DM Sans", fontSize: 12, fontWeight: 500 },
      axisLabel: { fontFamily: "DM Sans", fontSize: 11 },
      splitLine: { lineStyle: { color: "rgba(0, 18, 120, 0.1)" } }
    },
    series: seriesData
  };

  const h1Count = safeUseCases.filter(uc => uc.horizon === 1).length;
  const h2Count = safeUseCases.filter(uc => uc.horizon === 2).length;
  const h3Count = safeUseCases.filter(uc => uc.horizon === 3).length;

  return (
    <Card data-testid="chart-horizons-bubble-echart">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-[#001278] dark:text-white flex items-center gap-2">
          <Target className="h-5 w-5 text-[#02a2fd]" />
          Strategic Horizons Portfolio
        </CardTitle>
        <CardDescription className="text-xs">
          Use cases plotted by implementation readiness. Upper-right = high value + ready data. Bubble size = risk level.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ReactECharts 
            option={option} 
            style={{ height: "100%", width: "100%" }}
            onEvents={onReady ? { finished: handleFinished } : undefined}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 text-xs text-center">
          <div className="p-3 bg-[#36bf78]/10 rounded-md">
            <div className="font-bold text-[#36bf78] text-lg">{h1Count}</div>
            <div className="font-semibold text-[#36bf78]">Horizon 1</div>
            <div className="text-muted-foreground mt-1">Deflationary Core</div>
          </div>
          <div className="p-3 bg-[#02a2fd]/10 rounded-md">
            <div className="font-bold text-[#02a2fd] text-lg">{h2Count}</div>
            <div className="font-semibold text-[#02a2fd]">Horizon 2</div>
            <div className="text-muted-foreground mt-1">Augmented Workforce</div>
          </div>
          <div className="p-3 bg-[#001278]/10 dark:bg-white/10 rounded-md">
            <div className="font-bold text-[#001278] dark:text-white text-lg">{h3Count}</div>
            <div className="font-semibold text-[#001278] dark:text-white">Horizon 3</div>
            <div className="text-muted-foreground mt-1">Strategic Optionality</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
