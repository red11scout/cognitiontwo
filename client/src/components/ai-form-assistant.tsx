import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Loader2, Check, X, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Suggestions {
  industry: string;
  coreBusinessGoal: string;
  currentPainPoints: string;
  dataLandscape: string;
}

interface AIFormAssistantProps {
  companyName: string;
  onApplySuggestions: (suggestions: Suggestions) => void;
  disabled?: boolean;
}

export function AIFormAssistant({ companyName, onApplySuggestions, disabled }: AIFormAssistantProps) {
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();

  const suggestionsMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", "/api/suggestions", { companyName: name });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.suggestions) {
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
      } else {
        throw new Error(data.error || "Failed to generate suggestions");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to generate suggestions",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerateSuggestions = useCallback(() => {
    if (companyName.trim().length >= 2) {
      setSuggestions(null);
      suggestionsMutation.mutate(companyName.trim());
    } else {
      toast({
        title: "Company name required",
        description: "Please enter at least 2 characters for the company name.",
        variant: "destructive",
      });
    }
  }, [companyName, suggestionsMutation, toast]);

  const handleApply = () => {
    if (suggestions) {
      onApplySuggestions(suggestions);
      setShowSuggestions(false);
      toast({
        title: "Suggestions applied",
        description: "Form fields have been populated with AI suggestions. Feel free to edit them.",
      });
    }
  };

  const handleDismiss = () => {
    setShowSuggestions(false);
    setSuggestions(null);
  };

  if (disabled) {
    return null;
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleGenerateSuggestions}
        disabled={suggestionsMutation.isPending || companyName.trim().length < 2}
        className="w-full border-[#02a2fd]/30 text-[#02a2fd] hover:bg-[#02a2fd]/10"
        data-testid="button-ai-assist"
      >
        {suggestionsMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating suggestions...
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-4 w-4" />
            AI Assistant - Auto-fill form based on company
          </>
        )}
      </Button>

      {showSuggestions && suggestions && (
        <Card className="border-[#02a2fd]/30 bg-[#02a2fd]/5">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-start gap-2">
              <Sparkles className="h-5 w-5 text-[#02a2fd] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-foreground text-sm mb-1">
                  AI-Generated Suggestions for {companyName}
                </h4>
                <p className="text-xs text-muted-foreground">
                  Review the suggestions below and apply them to pre-fill the form. You can edit any field after applying.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3 bg-background rounded-md border border-border">
                <div className="font-medium text-muted-foreground text-xs mb-1">Industry</div>
                <div className="text-foreground">{suggestions.industry}</div>
              </div>
              <div className="p-3 bg-background rounded-md border border-border">
                <div className="font-medium text-muted-foreground text-xs mb-1">Core Business Goal</div>
                <div className="text-foreground">{suggestions.coreBusinessGoal}</div>
              </div>
              <div className="p-3 bg-background rounded-md border border-border">
                <div className="font-medium text-muted-foreground text-xs mb-1">Pain Points</div>
                <div className="text-foreground">{suggestions.currentPainPoints}</div>
              </div>
              <div className="p-3 bg-background rounded-md border border-border">
                <div className="font-medium text-muted-foreground text-xs mb-1">Data Landscape</div>
                <div className="text-foreground">{suggestions.dataLandscape}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleApply}
                className="flex-1 bg-[#36bf78] hover:bg-[#2ea866] text-white"
                data-testid="button-apply-suggestions"
              >
                <Check className="mr-2 h-4 w-4" />
                Apply Suggestions
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDismiss}
                data-testid="button-dismiss-suggestions"
              >
                <X className="mr-2 h-4 w-4" />
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
