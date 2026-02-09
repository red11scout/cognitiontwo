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
import { type TrustTaxBreakdown } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calculator } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function formatCurrency(value: number, currency: string): string {
  const absValue = Math.abs(value);
  const prefix = value < 0 ? "-" : "";
  
  if (absValue >= 1000000) {
    const millions = absValue / 1000000;
    return `${prefix}${currency}${millions.toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;
  } else if (absValue >= 1000) {
    const thousands = absValue / 1000;
    return `${prefix}${currency}${thousands.toLocaleString(undefined, { maximumFractionDigits: 1 })}k`;
  }
  return `${prefix}${currency}${absValue.toLocaleString()}`;
}

interface TrustTaxWaterfallProps {
  data: TrustTaxBreakdown;
}

export function TrustTaxWaterfall({ data }: TrustTaxWaterfallProps) {
  const chartData = {
    labels: [
      "Human Cost",
      "AI Savings",
      "Trust Tax",
      "Final LCOAI",
    ],
    datasets: [
      {
        label: "Cost Analysis",
        data: [
          data.currentHumanCost,
          -data.aiEfficiencySavings,
          data.trustTaxCost,
          data.finalLCOAI,
        ],
        backgroundColor: [
          "#001278",
          "#36bf78",
          "#f59e0b",
          "#02a2fd",
        ],
        borderColor: [
          "#001278",
          "#36bf78",
          "#f59e0b",
          "#02a2fd",
        ],
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
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
            const value = context.raw;
            return formatCurrency(value, data.currency);
          },
          afterLabel: (context: any) => {
            const labels = [
              "Current fully-loaded cost of human labor",
              "Cost reduction from AI automation",
              "Overhead cost for human review/verification",
              "Levelized Cost of AI (net cost with AI)"
            ];
            return labels[context.dataIndex];
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: `Cost (${data.currency})`,
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
          callback: (value: any) => {
            return formatCurrency(value, data.currency);
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: "DM Sans",
            size: 10,
          },
          maxRotation: 0,
          minRotation: 0,
        },
      },
    },
  };

  const savings = data.currentHumanCost - data.finalLCOAI;
  const savingsPercent = ((savings / data.currentHumanCost) * 100).toFixed(0);
  const trustTaxPercent = ((data.trustTaxCost / data.aiEfficiencySavings) * 100).toFixed(0);

  return (
    <Card data-testid="chart-trust-tax-waterfall">
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
          <Bar data={chartData} options={options} />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
          <div className="p-2 bg-muted/30 rounded-md">
            <div className="text-muted-foreground">Trust Tax Rate</div>
            <div className="font-bold text-amber-500">{trustTaxPercent}% of savings</div>
          </div>
          <div className="p-2 bg-[#36bf78]/10 rounded-md">
            <div className="text-muted-foreground">Net Savings</div>
            <div className="font-bold text-[#36bf78]">{formatCurrency(savings, data.currency)} ({savingsPercent}%)</div>
          </div>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          <strong>LCOAI</strong> = Levelized Cost of AI. This is the true cost after accounting for the "Trust Tax" - the cost of human review and verification that AI outputs require in high-stakes decisions.
        </div>
      </CardContent>
    </Card>
  );
}
