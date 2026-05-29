import { useState } from "react";
import { 
  useGetSyllabus, 
  useExplainTopic, 
  useGenerateQuestion, 
  useGetMotivationMessage,
  getGetSyllabusQueryKey,
  getGetMotivationMessageQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrainCircuit, BookOpen, Lightbulb, PlayCircle, ShieldAlert, Sparkles, ChevronRight, CheckCircle2, Target } from "lucide-react";
import type { AIExplanation, PracticeQuestion } from "@workspace/api-client-react";

export default function AITeacher() {
  const [selectedTopicId, setSelectedTopicId] = useState<number | "">("");
  const [mode, setMode] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [style, setStyle] = useState<"exam_oriented" | "visual" | "story" | "quick_revision">("exam_oriented");
  const [language, setLanguage] = useState<"english" | "hindi" | "hinglish">("hinglish");
  
  const [explanation, setExplanation] = useState<AIExplanation | null>(null);
  const [question, setQuestion] = useState<PracticeQuestion | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const { data: syllabus, isLoading: loadingSyllabus } = useGetSyllabus({
    query: { queryKey: getGetSyllabusQueryKey() },
  });

  const { data: motivation } = useGetMotivationMessage({
    query: { queryKey: getGetMotivationMessageQueryKey() },
  });

  const explainMutation = useExplainTopic();
  const generateQuestionMutation = useGenerateQuestion();

  const handleExplain = () => {
    if (!selectedTopicId) return;
    setQuestion(null);
    setExplanation(null);
    explainMutation.mutate({
      data: {
        topicId: selectedTopicId as number,
        mode,
        learningStyle: style,
        language
      }
    }, {
      onSuccess: (data) => setExplanation(data)
    });
  };

  const handleGenerateQuestion = () => {
    if (!selectedTopicId) return;
    setShowAnswer(false);
    setSelectedOption(null);
    
    // Map mode to difficulty for question generation
    const difficultyMap = {
      beginner: "easy",
      intermediate: "medium",
      advanced: "hard"
    } as const;

    generateQuestionMutation.mutate({
      data: {
        topicId: selectedTopicId as number,
        difficulty: difficultyMap[mode]
      }
    }, {
      onSuccess: (data) => setQuestion(data)
    });
  };

  const handleOptionSelect = (index: number) => {
    if (showAnswer) return;
    setSelectedOption(index);
  };

  if (loadingSyllabus) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-12 w-48" />
        <div className="flex gap-6">
          <Skeleton className="w-1/3 h-[400px]" />
          <Skeleton className="w-2/3 h-[600px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto flex flex-col h-[calc(100dvh-3.5rem)]">
      
      {motivation && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-start gap-3 shrink-0">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-primary-foreground leading-relaxed">
            "{motivation.message}"
          </p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* Left Control Panel */}
        <Card className="lg:w-[350px] flex flex-col shrink-0">
          <CardHeader className="pb-4 border-b border-border/50 shrink-0">
            <CardTitle className="flex items-center gap-2 text-xl">
              <BrainCircuit className="w-6 h-6 text-primary" />
              AI Teacher
            </CardTitle>
            <CardDescription>Select parameters for targeted learning</CardDescription>
          </CardHeader>
          
          <ScrollArea className="flex-1">
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground">Topic</Label>
                <Select value={selectedTopicId.toString()} onValueChange={(v) => setSelectedTopicId(parseInt(v))}>
                  <SelectTrigger className="bg-card w-full text-left">
                    <SelectValue placeholder="Select topic from syllabus..." />
                  </SelectTrigger>
                  <SelectContent>
                    {syllabus?.map(topic => (
                      <SelectItem key={topic.id} value={topic.id.toString()}>
                        {topic.topicName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground">Depth Level</Label>
                <RadioGroup value={mode} onValueChange={(v: any) => setMode(v)} className="flex flex-col gap-2">
                  <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="beginner" id="r1" />
                    <Label htmlFor="r1" className="cursor-pointer">Beginner (Core concepts)</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="intermediate" id="r2" />
                    <Label htmlFor="r2" className="cursor-pointer">Intermediate (Standard)</Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="advanced" id="r3" />
                    <Label htmlFor="r3" className="cursor-pointer">Advanced (Deep dive)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground">Language</Label>
                <Select value={language} onValueChange={(v: any) => setLanguage(v)}>
                  <SelectTrigger className="bg-card w-full">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hinglish">Hinglish</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="hindi">Hindi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </ScrollArea>
          
          <CardFooter className="pt-4 border-t border-border/50 shrink-0">
            <Button 
              className="w-full bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(139,92,246,0.2)]" 
              onClick={handleExplain}
              disabled={!selectedTopicId || explainMutation.isPending}
            >
              {explainMutation.isPending ? "Generating Lecture..." : "Explain Topic"}
              <BookOpen className="ml-2 w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>

        {/* Right Content Panel */}
        <Card className="flex-1 flex flex-col bg-card/50 min-h-0 overflow-hidden border-border/50">
          {!explanation && !explainMutation.isPending && !question && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <BrainCircuit className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Ready to Teach</h3>
              <p className="max-w-md">Select a topic from the left panel and click 'Explain Topic' to receive a customized lecture.</p>
            </div>
          )}

          {explainMutation.isPending && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
              <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <p className="text-muted-foreground animate-pulse">Compiling knowledge...</p>
            </div>
          )}

          <ScrollArea className="flex-1">
            <div className="p-6">
              {explanation && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-4 pb-2 border-b border-border/50">
                      {explanation.topicName}
                    </h2>
                    <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {explanation.explanation}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                      <h4 className="font-semibold text-primary flex items-center gap-2 mb-3">
                        <Lightbulb className="w-4 h-4" />
                        Key Takeaways
                      </h4>
                      <ul className="space-y-2">
                        {explanation.keyPoints.map((pt: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                            <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-accent/5 border border-accent/20 rounded-xl p-5">
                      <h4 className="font-semibold text-accent flex items-center gap-2 mb-3">
                        <ShieldAlert className="w-4 h-4" />
                        Exam Pro-Tips
                      </h4>
                      <ul className="space-y-2">
                        {explanation.examTips.map((tip: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                            <ChevronRight className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-6 flex justify-center border-t border-border/50">
                    <Button 
                      variant="outline" 
                      onClick={handleGenerateQuestion}
                      disabled={generateQuestionMutation.isPending}
                      className="border-primary/50 text-primary hover:bg-primary/10"
                    >
                      {generateQuestionMutation.isPending ? "Generating..." : "Test My Understanding"}
                      <PlayCircle className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {question && (
                <div className="mt-8 pt-8 border-t border-border/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Target className="w-5 h-5 text-accent" />
                    Practice Question
                  </h3>
                  
                  <div className="bg-card border rounded-xl p-6 shadow-sm">
                    <p className="text-lg font-medium mb-6">{question.question}</p>
                    
                    <div className="space-y-3">
                      {question.options.map((opt: string, i: number) => {
                        let btnClass = "justify-start h-auto py-4 px-6 text-left whitespace-normal border-border/50 bg-background hover:bg-muted";
                        
                        if (showAnswer) {
                          if (i === question.correctAnswer) {
                            btnClass = "justify-start h-auto py-4 px-6 text-left whitespace-normal border-green-500 bg-green-500/10 text-green-500";
                          } else if (i === selectedOption) {
                            btnClass = "justify-start h-auto py-4 px-6 text-left whitespace-normal border-destructive bg-destructive/10 text-destructive";
                          } else {
                            btnClass = "justify-start h-auto py-4 px-6 text-left whitespace-normal border-border/20 bg-background/50 opacity-50";
                          }
                        } else if (i === selectedOption) {
                          btnClass = "justify-start h-auto py-4 px-6 text-left whitespace-normal border-primary bg-primary/10 text-primary";
                        }

                        return (
                          <Button
                            key={i}
                            variant="outline"
                            className={btnClass}
                            onClick={() => handleOptionSelect(i)}
                          >
                            <span className="font-bold mr-4 shrink-0">{String.fromCharCode(65 + i)}.</span>
                            <span>{opt}</span>
                          </Button>
                        );
                      })}
                    </div>

                    {!showAnswer && selectedOption !== null && (
                      <div className="mt-6 flex justify-end animate-in fade-in">
                        <Button onClick={() => setShowAnswer(true)}>Submit Answer</Button>
                      </div>
                    )}

                    {showAnswer && (
                      <div className={`mt-6 p-4 rounded-lg border ${selectedOption === question.correctAnswer ? 'bg-green-500/10 border-green-500/20' : 'bg-destructive/10 border-destructive/20'} animate-in fade-in slide-in-from-top-2`}>
                        <div className="flex items-start gap-3">
                          {selectedOption === question.correctAnswer ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                          ) : (
                            <ShieldAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p className={`font-bold ${selectedOption === question.correctAnswer ? 'text-green-500' : 'text-destructive'}`}>
                              {selectedOption === question.correctAnswer ? 'Correct!' : 'Incorrect.'}
                            </p>
                            <p className="text-sm text-foreground/90 mt-2">{question.explanation}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}