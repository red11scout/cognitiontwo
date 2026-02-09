import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { type CognitiveLoadHeatmapData } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Brain } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface CognitiveHeatmapProps {
  data: CognitiveLoadHeatmapData;
}

export function CognitiveHeatmap({ data }: CognitiveHeatmapProps) {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: "Human Load (Today)",
        data: data.humanLoad,
        backgroundColor: "#001278",
        borderColor: "#001278",
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: "AI Load (Future)",
        data: data.aiLoad,
        backgroundColor: "#02a2fd",
        borderColor: "#02a2fd",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y" as const,
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
          afterLabel: (context: any) => {
            if (context.datasetIndex === 0) {
              return "Higher = More human mental effort required";
            }
            return "Lower = Less cognitive burden with AI";
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
          text: "Cognitive Load (1-10)",
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
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: "DM Sans",
            size: 11,
          },
        },
      },
    },
  };

  const avgHumanLoad = data.humanLoad.length > 0 
    ? data.humanLoad.reduce((a, b) => a + b, 0) / data.humanLoad.length 
    : 0;
  const avgAiLoad = data.aiLoad.length > 0 
    ? data.aiLoad.reduce((a, b) => a + b, 0) / data.aiLoad.length 
    : 0;
  const loadReduction = avgHumanLoad > 0 
    ? ((avgHumanLoad - avgAiLoad) / avgHumanLoad * 100).toFixed(0) 
    : "0";

  return (
    <Card data-testid="chart-cognitive-heatmap">
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
          <Bar data={chartData} options={options} />
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
