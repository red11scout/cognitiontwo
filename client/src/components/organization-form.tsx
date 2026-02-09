import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef } from "react";
import { Building2, Target, AlertTriangle, Database, ArrowRight, Save, Upload, FileText, X, Loader2 } from "lucide-react";
import { organizationProfileSchema, type OrganizationProfile } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AIFormAssistant } from "./ai-form-assistant";

interface OrganizationFormProps {
  onSubmit: (data: OrganizationProfile) => void;
  isLoading?: boolean;
  showSaveOption?: boolean;
  saveAnalysis?: boolean;
  onSaveAnalysisChange?: (save: boolean) => void;
}

const industries = [
  "Healthcare",
  "Financial Services",
  "Manufacturing",
  "Retail & E-commerce",
  "Technology",
  "Logistics & Supply Chain",
  "Professional Services",
  "Government & Public Sector",
  "Education",
  "Energy & Utilities",
  "Real Estate",
  "Media & Entertainment",
  "Other",
];

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export function OrganizationForm({ 
  onSubmit, 
  isLoading,
  showSaveOption = false,
  saveAnalysis = true,
  onSaveAnalysisChange,
}: OrganizationFormProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [pdfContent, setPdfContent] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const form = useForm<OrganizationProfile>({
    resolver: zodResolver(organizationProfileSchema),
    defaultValues: {
      companyName: "",
      industry: "",
      coreBusinessGoal: "",
      currentPainPoints: "",
      dataLandscape: "",
      uploadedDocumentContent: "",
      uploadedDocumentName: "",
    },
  });

  const companyName = form.watch("companyName");
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file",
        variant: "destructive"
      });
      return;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Please upload a PDF under 2MB",
        variant: "destructive"
      });
      return;
    }
    
    setUploadedFile(file);
    setIsParsingPdf(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/parse-pdf", {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        throw new Error("Failed to parse PDF");
      }
      
      const data = await response.json();
      setPdfContent(data.text);
      form.setValue("uploadedDocumentContent", data.text);
      form.setValue("uploadedDocumentName", file.name);
      
      toast({
        title: "Document uploaded",
        description: `Extracted ${data.text.length.toLocaleString()} characters from ${file.name}`
      });
    } catch (err) {
      toast({
        title: "PDF parsing failed",
        description: "Could not extract text from the document",
        variant: "destructive"
      });
      setUploadedFile(null);
    } finally {
      setIsParsingPdf(false);
    }
  };
  
  const handleRemoveFile = () => {
    setUploadedFile(null);
    setPdfContent("");
    form.setValue("uploadedDocumentContent", "");
    form.setValue("uploadedDocumentName", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleApplySuggestions = (suggestions: {
    industry: string;
    coreBusinessGoal: string;
    currentPainPoints: string;
    dataLandscape: string;
  }) => {
    if (industries.includes(suggestions.industry)) {
      form.setValue("industry", suggestions.industry);
    }
    form.setValue("coreBusinessGoal", suggestions.coreBusinessGoal);
    form.setValue("currentPainPoints", suggestions.currentPainPoints);
    form.setValue("dataLandscape", suggestions.dataLandscape);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl text-[#001278] dark:text-white flex items-center gap-3">
          <Building2 className="h-6 w-6 text-[#02a2fd]" />
          Organization Profile
        </CardTitle>
        <CardDescription className="text-base">
          Provide details about your organization to receive a tailored Cognitive Zero-Base analysis.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#02a2fd]" />
                    Company Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Global Logistics Corp"
                      data-testid="input-company-name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <AIFormAssistant
              companyName={companyName}
              onApplySuggestions={handleApplySuggestions}
              disabled={isLoading}
            />

            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry / Vertical</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-industry">
                        <SelectValue placeholder="Select your industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coreBusinessGoal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-[#02a2fd]" />
                    Core Business Goal
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Reduce shipping delays by 20%"
                      data-testid="input-business-goal"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    What is the primary outcome you want to achieve?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currentPainPoints"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-[#02a2fd]" />
                    Current Friction / Pain Points
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Too many emails, data entry takes forever, compliance audits are slow..."
                      className="min-h-[100px] resize-none"
                      data-testid="textarea-pain-points"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe the legacy challenges your organization faces. Be specific.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dataLandscape"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-[#02a2fd]" />
                    Data Landscape
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Messy PDFs and Excel sheets, or structured SQL databases but siloed..."
                      className="min-h-[100px] resize-none"
                      data-testid="textarea-data-landscape"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe your current data infrastructure and readiness.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Upload className="h-4 w-4 text-[#02a2fd]" />
                Supporting Document (Optional)
              </div>
              <p className="text-sm text-muted-foreground">
                Upload a PDF document (up to 2MB) such as a business plan, strategy document, or org chart to provide additional context for a more targeted analysis.
              </p>
              
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                ref={fileInputRef}
                className="hidden"
                data-testid="input-pdf-upload"
              />
              
              {!uploadedFile ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || isParsingPdf}
                  className="w-full border-dashed"
                  data-testid="button-upload-pdf"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload PDF Document
                </Button>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-md">
                  {isParsingPdf ? (
                    <Loader2 className="h-5 w-5 text-[#02a2fd] animate-spin" />
                  ) : (
                    <FileText className="h-5 w-5 text-[#36bf78]" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {isParsingPdf ? (
                        "Extracting text..."
                      ) : (
                        `${(uploadedFile.size / 1024).toFixed(1)} KB - ${pdfContent.length.toLocaleString()} characters extracted`
                      )}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                    disabled={isLoading || isParsingPdf}
                    data-testid="button-remove-pdf"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {showSaveOption && (
              <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-md">
                <Checkbox
                  id="save-analysis"
                  checked={saveAnalysis}
                  onCheckedChange={(checked) => onSaveAnalysisChange?.(checked === true)}
                  data-testid="checkbox-save-analysis"
                />
                <label
                  htmlFor="save-analysis"
                  className="text-sm text-muted-foreground cursor-pointer flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save this analysis to my reports
                </label>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full bg-[#02a2fd] hover:bg-[#0291e3] text-white font-bold"
              disabled={isLoading}
              data-testid="button-begin-analysis"
            >
              {isLoading ? (
                "Analyzing..."
              ) : (
                <>
                  Begin Analysis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
