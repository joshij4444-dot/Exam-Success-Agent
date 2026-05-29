import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, BrainCircuit, Target, TrendingUp, ShieldCheck } from "lucide-react";

export default function Home() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/30">
      <header className="container mx-auto px-4 h-20 flex items-center justify-between border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]">
            EC
          </div>
          <span className="text-xl font-bold tracking-tight">ExamCrack</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`${basePath}/sign-in`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Sign In
          </Link>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(139,92,246,0.3)] border-0">
            <Link href={`${basePath}/sign-up`}>Get Started</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
          
          <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
              <ShieldCheck className="w-4 h-4" />
              <span>Rajasthan Basic Computer Instructor Exam 2025</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
              Don't just study. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Command your selection.</span>
            </h1>
            
            <p className="text-lg lg:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              A high-stakes war room for serious aspirants. AI-driven syllabus tracking, daily missions, and probability forecasting designed to get you selected.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="h-14 px-8 text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_30px_rgba(139,92,246,0.4)] border-0 w-full sm:w-auto">
                <Link href={`${basePath}/sign-up`}>
                  Start Your Mission <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 border-t border-border/40 bg-card/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              
              <div className="bg-card border border-border p-8 rounded-2xl flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <Target className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">Syllabus War Room</h3>
                <p className="text-muted-foreground">Every topic mapped, weighted, and tracked. Know exactly what yields the highest ROI for the exam.</p>
              </div>

              <div className="bg-card border border-border p-8 rounded-2xl flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-6">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">Selection Probability</h3>
                <p className="text-muted-foreground">Real-time forecasting based on your mastery, study hours, and PYQ coverage. Watch your chances rise.</p>
              </div>

              <div className="bg-card border border-border p-8 rounded-2xl flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <BrainCircuit className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">AI Personal Mentor</h3>
                <p className="text-muted-foreground">Stuck on a concept? The AI teacher breaks it down according to your learning style and generates practice questions.</p>
              </div>

            </div>
          </div>
        </section>
      </main>
      
      <footer className="py-8 border-t border-border/40 text-center text-muted-foreground text-sm">
        <p>© 2025 ExamCrack AI Coach. Serious tools for serious aspirants.</p>
      </footer>
    </div>
  );
}