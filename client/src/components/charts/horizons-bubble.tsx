import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bubble } from "react-chartjs-2";
import { type HorizonsBubbleData } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Target } from "lucide-react";

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

interface HorizonsBubbleProps {
  data: HorizonsBubbleData;
}

const horizonColors = {
  1: { bg: "rgba(54, 191, 120, 0.6)", border: "#36bf78" },
  2: { bg: "rgba(2, 162, 253, 0.6)", border: "#02a2fd" },
  3: { bg: "rgba(0, 18, 120, 0.6)", border: "#001278" },
};

export function HorizonsBubble({ data }: HorizonsBubbleProps) {
  const datasets = [1, 2, 3].map((horizon) => {
    const useCasesForHorizon = data.useCases.filter((uc) => uc.horizon === horizon);
    return {
      label: `Horizon ${horizon}`,
      data: useCasesForHorizon.map((uc) => ({
        x: uc.x,
        y: uc.y,
        r: uc.r * 2,
        label: uc.label,
      })),
      backgroundColor: horizonColors[horizon as 1 | 2 | 3].bg,
      borderColor: horizonColors[horizon as 1 | 2 | 3].border,
      borderWidth: 2,
    };
  });

  const chartData = {
    datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 16,
          font: {
            family: "DM Sans",
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: "#001278",
        titleFont: {
          family: "DM Sans",
          size: 14,
        },
        bodyFont: {
          family: "DM Sans",
          size: 12,
        },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => {
            const point = context.raw;
            return [
              point.label,
              `Data Readiness: ${point.x}/10`,
              `Business Value: ${point.y}/10`,
              `Risk Level: ${(point.r / 2).toFixed(0)}/10`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        min: 0,
        max: 10,
        title: {
          display: true,
          text: "Data Readiness",
          font: {
            family: "DM Sans",
            size: 12,
            weight: 500,
          },
        },
        grid: {
          color: "rgba(0, 18, 120, 0.1)",
        },
        ticks: {
          font: {
            family: "DM Sans",
            size: 11,
          },
        },
      },
      y: {
        min: 0,
        max: 20,
        title: {
          display: true,
          text: "Business Value",
          font: {
            family: "DM Sans",
            size: 12,
            weight: 500,
          },
        },
        grid: {
          color: "rgba(0, 18, 120, 0.1)",
        },
        ticks: {
          stepSize: 2,
          font: {
            family: "DM Sans",
            size: 11,
          },
        },
      },
    },
  };

  const h1Count = data.useCases.filter(uc => uc.horizon === 1).length;
  const h2Count = data.useCases.filter(uc => uc.horizon === 2).length;
  const h3Count = data.useCases.filter(uc => uc.horizon === 3).length;

  return (
    <Card data-testid="chart-horizons-bubble">
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
          <Bubble data={chartData} options={options} />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 text-xs text-center">
          <div className="p-3 bg-[#36bf78]/10 rounded-md">
            <div className="font-bold text-[#36bf78] text-lg">{h1Count}</div>
            <div className="font-semibold text-[#36bf78]">Horizon 1</div>
            <div className="text-muted-foreground mt-1">Deflationary Core</div>
            <div className="text-muted-foreground text-[10px]">Quick wins, immediate ROI</div>
          </div>
          <div className="p-3 bg-[#02a2fd]/10 rounded-md">
            <div className="font-bold text-[#02a2fd] text-lg">{h2Count}</div>
            <div className="font-semibold text-[#02a2fd]">Horizon 2</div>
            <div className="text-muted-foreground mt-1">Augmented Workforce</div>
            <div className="text-muted-foreground text-[10px]">6-18 month implementations</div>
          </div>
          <div className="p-3 bg-[#001278]/10 dark:bg-white/10 rounded-md">
            <div className="font-bold text-[#001278] dark:text-white text-lg">{h3Count}</div>
            <div className="font-semibold text-[#001278] dark:text-white">Horizon 3</div>
            <div className="text-muted-foreground mt-1">Strategic Optionality</div>
            <div className="text-muted-foreground text-[10px]">Long-term transformation</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
