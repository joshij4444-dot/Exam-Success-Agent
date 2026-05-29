import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSubmitOnboarding } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, ArrowRight, ArrowLeft, Target, BookOpen, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ALL_SUBJECTS = [
  "Computer Architecture", "Operating Systems", "Data Structures", 
  "Programming in C/C++", "Database Management", "Computer Networks",
  "Software Engineering", "Web Technologies", "Mathematics", "Aptitude"
];

const onboardingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  category: z.string().min(1, "Please select a category"),
  qualification: z.string().min(1, "Qualification is required"),
  targetExam: z.string().min(1, "Target exam is required"),
  previousAttempts: z.coerce.number().min(0).max(10),
  dailyStudyHours: z.coerce.number().min(1).max(16),
  learningStyle: z.enum(["visual", "story", "exam_oriented", "quick_revision"]),
  language: z.enum(["english", "hindi", "hinglish"]),
  strengthAreas: z.array(z.string()),
  weakAreas: z.array(z.string())
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const submitOnboarding = useSubmitOnboarding();

  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
      category: "",
      qualification: "",
      targetExam: "Rajasthan Basic Computer Instructor",
      previousAttempts: 0,
      dailyStudyHours: 4,
      learningStyle: "exam_oriented",
      language: "hinglish",
      strengthAreas: [],
      weakAreas: []
    }
  });

  const onSubmit = (data: OnboardingValues) => {
    if (step < 4) {
      setStep(step + 1);
      return;
    }

    submitOnboarding.mutate({ data }, {
      onSuccess: () => {
        toast({
          title: "Profile Configured",
          description: "Welcome to ExamCrack. Your dashboard is ready.",
        });
        setLocation("/dashboard");
      },
      onError: () => {
        toast({
          title: "Setup Failed",
          description: "There was an error saving your profile. Please try again.",
          variant: "destructive"
        });
      }
    });
  };

  const handleAreaToggle = (area: string, type: "strength" | "weak") => {
    const currentStrengths = form.getValues("strengthAreas");
    const currentWeaks = form.getValues("weakAreas");
    
    if (type === "strength") {
      if (currentWeaks.includes(area)) return; // Cannot be both
      if (currentStrengths.includes(area)) {
        form.setValue("strengthAreas", currentStrengths.filter(a => a !== area));
      } else {
        form.setValue("strengthAreas", [...currentStrengths, area]);
      }
    } else {
      if (currentStrengths.includes(area)) return; // Cannot be both
      if (currentWeaks.includes(area)) {
        form.setValue("weakAreas", currentWeaks.filter(a => a !== area));
      } else {
        form.setValue("weakAreas", [...currentWeaks, area]);
      }
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      
      <Card className="w-full max-w-2xl relative z-10 border-border/50 shadow-2xl">
        <CardHeader className="text-center pb-8 border-b border-border/50">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Configure Your War Room</CardTitle>
          <CardDescription className="text-base mt-2">
            Step {step} of 4: {
              step === 1 ? "Personal Identity" :
              step === 2 ? "Mission Parameters" :
              step === 3 ? "Cognitive Profile" :
              "Reconnaissance"
            }
          </CardDescription>
          
          <div className="flex justify-center gap-2 mt-6">
            {[1, 2, 3, 4].map(i => (
              <div 
                key={i} 
                className={`h-1.5 w-16 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="pt-8 min-h-[350px]">
              
              {/* STEP 1: Personal Info */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 mb-6 text-primary">
                    <Target className="w-5 h-5" />
                    <h3 className="font-semibold text-lg text-foreground">Personal Identity</h3>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your name" className="bg-card h-12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reservation Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-card h-12">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="General">General</SelectItem>
                              <SelectItem value="OBC">OBC</SelectItem>
                              <SelectItem value="SC">SC</SelectItem>
                              <SelectItem value="ST">ST</SelectItem>
                              <SelectItem value="EWS">EWS</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="qualification"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Highest Qualification</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-card h-12">
                                <SelectValue placeholder="Select qualification" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="B.Tech">B.Tech / B.E.</SelectItem>
                              <SelectItem value="MCA">MCA</SelectItem>
                              <SelectItem value="BCA">BCA</SelectItem>
                              <SelectItem value="M.Sc. IT">M.Sc. IT / CS</SelectItem>
                              <SelectItem value="PGDCA">PGDCA</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Exam Details */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 mb-6 text-primary">
                    <Activity className="w-5 h-5" />
                    <h3 className="font-semibold text-lg text-foreground">Mission Parameters</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="targetExam"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Examination</FormLabel>
                        <FormControl>
                          <Input readOnly className="bg-muted text-muted-foreground h-12 font-medium" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    <FormField
                      control={form.control}
                      name="previousAttempts"
                      render={({ field }) => (
                        <FormItem className="space-y-4">
                          <div className="flex justify-between items-center">
                            <FormLabel>Previous Attempts</FormLabel>
                            <span className="font-bold text-primary">{field.value}</span>
                          </div>
                          <FormControl>
                            <Slider 
                              min={0} max={5} step={1} 
                              value={[field.value]} 
                              onValueChange={(v) => field.onChange(v[0])}
                              className="py-4"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dailyStudyHours"
                      render={({ field }) => (
                        <FormItem className="space-y-4">
                          <div className="flex justify-between items-center">
                            <FormLabel>Daily Study Commitment</FormLabel>
                            <span className="font-bold text-primary">{field.value} Hours</span>
                          </div>
                          <FormControl>
                            <Slider 
                              min={1} max={16} step={1} 
                              value={[field.value]} 
                              onValueChange={(v) => field.onChange(v[0])}
                              className="py-4"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Study Preferences */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 mb-6 text-primary">
                    <BookOpen className="w-5 h-5" />
                    <h3 className="font-semibold text-lg text-foreground">Cognitive Profile</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="learningStyle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Teaching Style</FormLabel>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                          {[
                            { id: "exam_oriented", label: "Exam Oriented", desc: "Focus strictly on PYQs & syllabus" },
                            { id: "quick_revision", label: "Quick Revision", desc: "Bullet points & summaries" },
                            { id: "visual", label: "Visual & Analogies", desc: "Learn via diagrams & examples" },
                            { id: "story", label: "Story Based", desc: "Narrative driven explanations" }
                          ].map(style => (
                            <div 
                              key={style.id}
                              onClick={() => field.onChange(style.id)}
                              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                                field.value === style.id 
                                  ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(139,92,246,0.1)]' 
                                  : 'border-border/50 bg-card hover:border-primary/50'
                              }`}
                            >
                              <div className="font-semibold">{style.label}</div>
                              <div className="text-xs text-muted-foreground mt-1">{style.desc}</div>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem className="pt-4">
                        <FormLabel>Instruction Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-card h-12">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="english">English Only</SelectItem>
                            <SelectItem value="hindi">Hindi Only</SelectItem>
                            <SelectItem value="hinglish">Hinglish (Recommended)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* STEP 4: Assessment */}
              {step === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-3 mb-6 text-primary">
                    <Target className="w-5 h-5" />
                    <h3 className="font-semibold text-lg text-foreground">Skill Reconnaissance</h3>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-6">
                    Identify your baseline. We'll prioritize the weak areas and optimize revision for strengths.
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-green-500 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"/>
                        Select your STRONGEST subjects
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {ALL_SUBJECTS.map(subject => {
                          const isStrong = form.watch("strengthAreas").includes(subject);
                          const isWeak = form.watch("weakAreas").includes(subject);
                          
                          return (
                            <Badge 
                              key={`strong-${subject}`}
                              variant={isStrong ? "default" : "outline"}
                              className={`cursor-pointer px-3 py-1.5 text-sm transition-colors ${
                                isStrong ? 'bg-green-500 hover:bg-green-600 text-white' : 
                                isWeak ? 'opacity-30 cursor-not-allowed' : 'hover:bg-muted'
                              }`}
                              onClick={() => !isWeak && handleAreaToggle(subject, "strength")}
                            >
                              {subject}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/30">
                      <h4 className="font-medium text-destructive mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-destructive"/>
                        Select your WEAKEST subjects
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {ALL_SUBJECTS.map(subject => {
                          const isStrong = form.watch("strengthAreas").includes(subject);
                          const isWeak = form.watch("weakAreas").includes(subject);
                          
                          return (
                            <Badge 
                              key={`weak-${subject}`}
                              variant={isWeak ? "default" : "outline"}
                              className={`cursor-pointer px-3 py-1.5 text-sm transition-colors ${
                                isWeak ? 'bg-destructive hover:bg-destructive/90 text-white' : 
                                isStrong ? 'opacity-30 cursor-not-allowed' : 'hover:bg-muted'
                              }`}
                              onClick={() => !isStrong && handleAreaToggle(subject, "weak")}
                            >
                              {subject}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </CardContent>
            
            <CardFooter className="flex justify-between pt-6 border-t border-border/50 bg-muted/20">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
                className="h-12 px-6"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              
              <Button 
                type="submit" 
                className="h-12 px-8 bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                disabled={submitOnboarding.isPending}
              >
                {step < 4 ? (
                  <>Next Phase <ArrowRight className="w-4 h-4 ml-2" /></>
                ) : (
                  <>{submitOnboarding.isPending ? "Initializing..." : "Initialize War Room"}</>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}