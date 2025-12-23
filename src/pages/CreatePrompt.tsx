import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Copy, Loader2, Settings, CheckCircle, Sparkles, Send, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { generatePrompts, type PromptInputs } from "@/lib/promptutils";

const formatUrl = (url: string) => {
  let formatted = url.trim().replace(/\s+/g, '');
  if (formatted && !formatted.match(/^https?:\/\//i)) {
    formatted = `https://${formatted}`;
  }
  return formatted;
};

const formSchema = z.object({
  category: z.string().min(1, "Please select a post category"),
  topic: z.string().min(1, "Please enter a topic"),
  topicType: z.enum(["text", "url", "askai"]),
  tone: z.string().min(1, "Please select a post tone")
}).refine(data => {
  if (data.topicType === "url") {
    const formattedUrl = formatUrl(data.topic);
    try {
      new URL(formattedUrl);
      return true;
    } catch {
      return false;
    }
  }
  return true;
}, {
  message: "Please enter a valid URL",
  path: ["topic"]
});

type FormData = z.infer<typeof formSchema>;

const categories = ['Storytelling/Thought Leadership/Authority', 'Lead Magnets & YT Video-based content', 'Case studies/Testimonials/Results', 'Skool Community/Educational'];
const tones = ['Authoritative', 'Descriptive', 'Casual', 'Narrative', 'Humorous'];

export default function CreatePrompt() {
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [askAiInput, setAskAiInput] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<Array<{title: string, topic: string, tone: string}>>([]);
  const [isLoadingAiSuggestions, setIsLoadingAiSuggestions] = useState(false);
  const [showSuggestionDropdown, setShowSuggestionDropdown] = useState(false);

  const askAiWebhookUrl = import.meta.env.VITE_ASK_AI_WEBHOOK_URL;

  console.log("🔍 Debug Info:");
  console.log("Ask AI Webhook URL:", askAiWebhookUrl);

  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "",
      topic: "",
      topicType: "text",
      tone: ""
    }
  });

  const isValidUrl = (string: string) => {
    const formatted = formatUrl(string);
    try {
      new URL(formatted);
      return true;
    } catch {
      return false;
    }
  };

  const validateUrlRealTime = (url: string) => {
    if (!url.trim()) return {
      isValid: true,
      message: ""
    };
    const formatted = formatUrl(url);
    try {
      new URL(formatted);
      return {
        isValid: true,
        message: ""
      };
    } catch {
      return {
        isValid: false,
        message: "Please enter a valid URL"
      };
    }
  };

  const onSubmit = async (data: FormData) => {
    console.log("🚀 Form submission started");
    console.log("Form data:", data);

    let processedTopic = data.topic;
    let finalTopicType: "text" | "url" = data.topicType as "text" | "url";

    if (data.topicType === "url") {
      processedTopic = formatUrl(data.topic);
      if (!isValidUrl(data.topic)) {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid URL",
          variant: "destructive"
        });
        return;
      }
    } else if (data.topicType === "askai") {
      finalTopicType = "text";
    }

    setIsGenerating(true);
    try {
      const promptInputs: PromptInputs = {
        category: data.category,
        topic: processedTopic,
        topicType: finalTopicType,
        tone: data.tone
      };

      console.log("📝 Generating prompts with inputs:", promptInputs);

      const generatedPrompts = generatePrompts(promptInputs);
      console.log("✅ Prompts generated:", generatedPrompts);

      setSystemPrompt(generatedPrompts.systemPrompt);
      setUserPrompt(generatedPrompts.userPrompt);

      toast({
        title: "Prompts Generated Successfully!",
        description: `System and user prompts are ready to review (Model: ${generatedPrompts.model})`
      });
    } catch (error) {
      console.error("❌ Error generating prompts:", error);

      toast({
        title: "Generation Failed",
        description: "Failed to generate prompts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard!",
        description: `${label} is ready to use`
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleAskAI = async () => {
    console.log("🤖 Ask AI started");

    if (!askAiInput.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter your AI query",
        variant: "destructive"
      });
      return;
    }

    const category = form.getValues("category");
    if (!category) {
      toast({
        title: "Category Required",
        description: "Please select a post category first",
        variant: "destructive"
      });
      return;
    }

    if (!askAiWebhookUrl) {
      console.error("❌ Ask AI Webhook URL is not defined!");
      toast({
        title: "Configuration Error",
        description: "Ask AI Webhook URL is not configured. Please check your environment variables.",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingAiSuggestions(true);
    try {
      const response = await fetch(askAiWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "suggest_topics",
          category: category,
          description: askAiInput
        })
      });

      if (!response.ok) {
        console.error("❌ Ask AI response not OK:", {
          status: response.status,
          statusText: response.statusText
        });
        throw new Error("Failed to get AI suggestions");
      }

      const result = await response.json();
      console.log("AI webhook response:", result);
      const suggestions = result?.ideas || [];
      console.log("Extracted suggestions:", suggestions);
      setAiSuggestions(suggestions);
      setShowSuggestionDropdown(true);

      toast({
        title: "AI Suggestions Ready!",
        description: "Select a suggestion to auto-fill your form"
      });
    } catch (error) {
      console.error("❌ Error getting AI suggestions:", error);
      toast({
        title: "AI Request Failed",
        description: "Failed to get AI suggestions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAiSuggestions(false);
    }
  };

  const handleSuggestionSelect = (suggestion: {title: string, topic: string, tone: string}) => {
    form.setValue("topic", suggestion.topic);
    form.setValue("tone", suggestion.tone);

    toast({
      title: "Fields Auto-filled!",
      description: "Topic and tone have been set from AI suggestion"
    });
    setShowSuggestionDropdown(false);
  };

  const topicType = form.watch("topicType");

  useEffect(() => {
    if (topicType !== "askai") {
      form.setValue("topic", "");
      form.setValue("tone", "");
      setAskAiInput("");
      setAiSuggestions([]);
      setShowSuggestionDropdown(false);
    }

    setSystemPrompt("");
    setUserPrompt("");
  }, [topicType, form]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-green-500/5 data-grid bg-noise p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium animate-data-pulse">
            <Sparkles className="h-4 w-4" />
            AI Prompt Generation
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent animate-pulse-glow">
            Create Prompt
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Generate system and user prompts for AI-powered content creation without generating the actual content
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="futuristic-border glow-hover backdrop-blur-sm shadow-xl border-0 bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 drop-shadow-glow" />
                  Prompt Configuration
                </CardTitle>
                <CardDescription>
                  Define your prompt parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Post Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 futuristic-border">
                                <SelectValue placeholder="Choose your content type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-popover backdrop-blur-md border shadow-lg futuristic-border">
                              {categories.map(category => (
                                <SelectItem key={category} value={category} className="py-3">
                                  <div className="text-sm">
                                    {category}
                                  </div>
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
                      name="topicType"
                      render={({ field }) => (
                        <FormItem className="space-y-4">
                          <FormLabel className="text-base font-medium">Input Method</FormLabel>
                          <ToggleGroup
                            type="single"
                            value={field.value}
                            onValueChange={field.onChange}
                            className="grid grid-cols-3 w-full"
                          >
                            <ToggleGroupItem
                              value="text"
                              className="text-xs p-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                            >
                              <div className="text-center">
                                <div className="font-medium">Text Input</div>
                              </div>
                            </ToggleGroupItem>
                            <ToggleGroupItem
                              value="askai"
                              className="text-xs p-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                            >
                              <div className="text-center">
                                <div className="font-medium">Ask AI</div>
                              </div>
                            </ToggleGroupItem>
                            <ToggleGroupItem
                              value="url"
                              className="text-xs p-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                            >
                              <div className="text-center">
                                <div className="font-medium">URL Input</div>
                              </div>
                            </ToggleGroupItem>
                          </ToggleGroup>
                        </FormItem>
                      )}
                    />

                    {topicType === "askai" && (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <Label className="text-base font-medium">AI Query</Label>
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Ask AI for topic suggestions (e.g., 'Give me post ideas about leadership challenges for new managers')"
                              value={askAiInput}
                              onChange={(e) => setAskAiInput(e.target.value)}
                              className="min-h-[80px] resize-none futuristic-border"
                              disabled={isLoadingAiSuggestions}
                            />
                            <Button
                              type="button"
                              onClick={handleAskAI}
                              disabled={isLoadingAiSuggestions || !askAiInput.trim() || !form.getValues("category")}
                              className="w-full h-10 gap-2 futuristic-border glow-hover"
                              variant="outline"
                            >
                              {isLoadingAiSuggestions ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Getting AI Suggestions...
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4" />
                                  Send
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {showSuggestionDropdown && aiSuggestions.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-muted-foreground">Select a suggestion:</Label>
                            <Select onValueChange={(value) => {
                              const suggestion = aiSuggestions.find(s => s.title === value);
                              if (suggestion) {
                                handleSuggestionSelect(suggestion);
                              }
                            }}>
                              <SelectTrigger className="h-12 futuristic-border">
                                <SelectValue placeholder="Choose from AI suggestions..." />
                              </SelectTrigger>
                              <SelectContent className="bg-popover backdrop-blur-md border shadow-lg futuristic-border">
                                {aiSuggestions.map((suggestion, index) => (
                                  <SelectItem key={index} value={suggestion.title} className="py-3">
                                    <div className="text-sm">
                                      {suggestion.title}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="topic"
                      render={({ field }) => {
                        const urlValidation = topicType === "url" ? validateUrlRealTime(field.value) : {
                          isValid: true,
                          message: ""
                        };
                        return (
                          <FormItem>
                            <FormLabel className="text-base font-medium">
                              {topicType === "url" ? "Content URL" : "Topic or Idea"}
                            </FormLabel>
                            <FormControl>
                              {topicType === "url" ? (
                                <div className="space-y-2">
                                  <div className="relative">
                                    <Input
                                      placeholder="https://www.youtube.com/watch?v=example"
                                      className={cn(
                                        "h-12 text-base futuristic-border",
                                        !urlValidation.isValid && field.value.trim() && "border-destructive focus-visible:ring-destructive"
                                      )}
                                      value={field.value}
                                      onChange={field.onChange}
                                      onBlur={(e) => {
                                        if (e.target.value.trim()) {
                                          const formatted = formatUrl(e.target.value);
                                          field.onChange(formatted);
                                        }
                                      }}
                                    />
                                    {field.value.trim() && (
                                      <div className={cn(
                                        "absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full",
                                        urlValidation.isValid ? "bg-green-500" : "bg-destructive"
                                      )} />
                                    )}
                                  </div>
                                  {!urlValidation.isValid && field.value.trim() && (
                                    <p className="text-sm text-destructive">{urlValidation.message}</p>
                                  )}
                                </div>
                              ) : (
                                <Textarea
                                  placeholder="Describe your topic, key points, or the message you want to convey..."
                                  className="min-h-[100px] resize-none futuristic-border"
                                  {...field}
                                />
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="tone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Writing Tone</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 futuristic-border">
                                <SelectValue placeholder="Select your preferred tone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-popover backdrop-blur-md border shadow-lg futuristic-border">
                              {tones.map(tone => (
                                <SelectItem key={tone} value={tone} className="py-3">
                                  {tone}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-medium shadow-lg border-2 futuristic-border glow-hover"
                      disabled={isGenerating || (topicType === "askai" && (!form.getValues("topic") || !form.getValues("tone")))}
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Generating Prompts...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          Generate Prompts
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="futuristic-border glow-hover backdrop-blur-sm shadow-xl border-0 bg-card/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg animate-data-pulse">
                      <BookOpen className="h-5 w-5 text-primary drop-shadow-glow" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Prompts</CardTitle>
                      <CardDescription>
                        System and user prompts for AI content generation
                      </CardDescription>
                    </div>
                  </div>
                  {systemPrompt && userPrompt && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        const combinedPrompts = `System Prompt:\n${systemPrompt}\n\nUser Prompt:\n${userPrompt}`;
                        copyToClipboard(combinedPrompts, "Prompts");
                      }} 
                      className="gap-2 shadow-sm futuristic-border glow-hover"
                    >
                      <Copy className="h-4 w-4" />
                      Copy All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {systemPrompt && userPrompt ? (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold text-primary">System Prompt & User Prompt</Label>
                    <Textarea
                      value={`System Prompt:\n${systemPrompt}\n\nUser Prompt:\n${userPrompt}`}
                      readOnly
                      className="min-h-[500px] resize-none futuristic-border bg-muted/30 font-mono text-sm"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-6">
                    <div className="p-4 bg-muted/50 rounded-full animate-float">
                      <BookOpen className="h-12 w-12 text-muted-foreground animate-pulse-glow" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-muted-foreground">Prompts Ready?</h3>
                      <p className="text-muted-foreground max-w-md">
                        Fill out the form on the left and click "Generate Prompts" to create your system and user prompts
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 animate-pulse" />
                        AI-Powered
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                        Professional
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
                        Ready
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
