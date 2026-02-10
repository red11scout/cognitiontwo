import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef } from "react";
import { Search, Upload, FileText, X, Loader2, ChevronDown, ChevronUp, Save } from "lucide-react";
import { organizationProfileSchema, type OrganizationProfile } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

interface OrganizationFormProps {
  onSubmit: (data: OrganizationProfile) => void;
  isLoading?: boolean;
  showSaveOption?: boolean;
  saveAnalysis?: boolean;
  onSaveAnalysisChange?: (save: boolean) => void;
}

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
  const [showUpload, setShowUpload] = useState(false);
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

  return (
    <Card className="w-full max-w-2xl mx-auto border-0 shadow-none bg-transparent">
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Main search-style input */}
            <div className="relative">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          placeholder="Enter a company name to analyze..."
                          className="h-14 pl-12 pr-36 text-lg rounded-full border-2 border-[#02a2fd]/30 focus:border-[#02a2fd] shadow-lg"
                          data-testid="input-company-name"
                          autoFocus
                          {...field}
                        />
                        <Button
                          type="submit"
                          disabled={isLoading || !field.value?.trim()}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#02a2fd] hover:bg-[#0291e3] text-white font-bold rounded-full px-6"
                          data-testid="button-begin-analysis"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Analyze"
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage className="pl-4" />
                  </FormItem>
                )}
              />
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Our AI agents will research your company and generate a full Cognitive Zero-Base analysis.
            </p>

            {/* Optional sections */}
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setShowUpload(!showUpload)}
                className="text-sm text-[#02a2fd] hover:text-[#0291e3] flex items-center gap-1 transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                Attach a document
                {showUpload ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>

            {/* PDF Upload (collapsible) */}
            {showUpload && (
              <div className="space-y-3 px-1">
                <p className="text-sm text-muted-foreground">
                  Upload a PDF (up to 2MB) such as a business plan, strategy doc, or org chart for more targeted analysis.
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
            )}

            {showSaveOption && (
              <div className="flex items-center justify-center space-x-2">
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
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
