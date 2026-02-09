import { AlertTriangle, Zap, ArrowRightLeft } from "lucide-react";
import { type CognitiveNode } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CognitiveNodesDisplayProps {
  nodes: CognitiveNode[];
}

function CognitiveNodesSummary({ nodes }: CognitiveNodesDisplayProps) {
  const avgHumanLoad = nodes.length > 0 
    ? nodes.reduce((sum, n) => sum + n.humanCognitiveLoad, 0) / nodes.length 
    : 0;
  const avgAiLoad = nodes.length > 0 
    ? nodes.reduce((sum, n) => sum + n.aiCognitiveLoad, 0) / nodes.length 
    : 0;
  const highLoadNodes = nodes.filter(n => n.humanCognitiveLoad >= 7).length;
  const potentialReduction = avgHumanLoad > 0 
    ? ((avgHumanLoad - avgAiLoad) / avgHumanLoad * 100).toFixed(0) 
    : "0";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl text-[#001278] dark:text-white flex items-center gap-3">
          <Zap className="h-5 w-5 text-[#02a2fd]" />
          Cognitive Nodes Identified
        </CardTitle>
        <CardDescription>
          Key decision points where human expertise converts unstructured data into business outcomes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div className="p-3 bg-muted/30 rounded-md" data-testid="stat-nodes-count">
            <div className="text-2xl font-bold text-[#001278] dark:text-white">{nodes.length}</div>
            <div className="text-muted-foreground text-xs">Nodes Identified</div>
          </div>
          <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-md" data-testid="stat-high-load">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{highLoadNodes}</div>
            <div className="text-muted-foreground text-xs">High Load (7+)</div>
          </div>
          <div className="p-3 bg-[#36bf78]/10 rounded-md" data-testid="stat-reduction">
            <div className="text-2xl font-bold text-[#36bf78]">{potentialReduction}%</div>
            <div className="text-muted-foreground text-xs">Potential Reduction</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CognitiveNodeCard({ node, index }: { node: CognitiveNode; index: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <h4 className="font-bold text-foreground text-lg">
            <span className="text-muted-foreground mr-2">#{index + 1}</span>
            {node.name}
          </h4>
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className={`px-4 py-1.5 text-base text-center ${
                    node.humanCognitiveLoad >= 7 
                      ? "border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400" 
                      : node.humanCognitiveLoad >= 4 
                      ? "border-amber-500 text-amber-500 dark:border-amber-400 dark:text-amber-400"
                      : "border-[#36bf78] text-[#36bf78]"
                  }`}
                >
                  Human: {node.humanCognitiveLoad}/10
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold">Current Human Cognitive Load</p>
                <p className="text-xs mt-1">How much mental effort this task requires from employees today. Higher scores indicate more complex decision-making.</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className="bg-[#02a2fd] text-white px-4 py-1.5 text-base text-center">
                  AI: {node.aiCognitiveLoad}/10
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold">Projected AI Cognitive Load</p>
                <p className="text-xs mt-1">Estimated mental effort after AI augmentation. The difference represents automation potential.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <p className="text-base text-muted-foreground mb-4">
          {node.description}
        </p>
        <div className="flex flex-wrap gap-6 text-base">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-amber-500" />
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-muted-foreground cursor-help underline decoration-dashed">
                  Translation Tax:
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold">Translation Tax</p>
                <p className="text-xs mt-1">The hidden cost of moving information between systems, formats, or people. Each "translation" loses context and introduces errors.</p>
              </TooltipContent>
            </Tooltip>
            <span className="text-foreground">{node.translationTax}</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-muted-foreground cursor-help underline decoration-dashed">
                  Context Switching:
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold">Context Switching Cost</p>
                <p className="text-xs mt-1">The mental energy lost when employees switch between tasks, tools, or thought processes. Research shows it can take 23+ minutes to fully refocus.</p>
              </TooltipContent>
            </Tooltip>
            <span className="text-foreground">{node.contextSwitchingCost}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CognitiveNodesDisplay({ nodes }: CognitiveNodesDisplayProps) {
  if (nodes.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-muted-foreground">
          No cognitive nodes identified yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div data-pdf-section="cognitive-nodes-summary">
        <CognitiveNodesSummary nodes={nodes} />
      </div>
      {nodes.map((node, index) => (
        <div key={node.id} data-pdf-section={`cognitive-node-${index}`} data-testid={`cognitive-node-${node.id}`}>
          <CognitiveNodeCard node={node} index={index} />
        </div>
      ))}
    </div>
  );
}
