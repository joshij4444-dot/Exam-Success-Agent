import { useGetDashboard, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Clock, 
  Flame, 
  Target, 
  TrendingUp,
  AlertTriangle,
  BrainCircuit,
  Quote
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: dashboard, isLoading } = useGetDashboard({
    query: { queryKey: getGetDashboardQueryKey() },
  });

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] lg:col-span-2 rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  // Color coding for selection probability
  const probColor = 
    dashboard.selectionProbability < 40 ? "text-destructive" :
    dashboard.selectionProbability < 70 ? "text-accent" : 
    "text-green-500";
    
  const ProbStroke = 
    dashboard.selectionProbability < 40 ? "stroke-destructive" :
    dashboard.selectionProbability < 70 ? "stroke-accent" : 
    "stroke-green-500";

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header & Motivation */}
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mission Control</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {dashboard.profile.name}. Let's secure that rank.</p>
        </div>
        
        <Card className="bg-primary/5 border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          <CardContent className="p-6 flex items-start gap-4">
            <Quote className="w-8 h-8 text-primary/50 shrink-0" />
            <div>
              <p className="text-lg font-medium text-foreground leading-relaxed">
                "{dashboard.motivationMessage}"
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Selection Probability</p>
                <p className={`text-3xl font-bold ${probColor}`}>{dashboard.selectionProbability}%</p>
              </div>
              <div className={`p-2 rounded-lg bg-card border`}>
                <Target className={`w-5 h-5 ${probColor}`} />
              </div>
            </div>
            <Progress value={dashboard.selectionProbability} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Today's Tasks</p>
                <p className="text-3xl font-bold text-foreground">
                  {dashboard.completedTasksCount} / {dashboard.todayTasksCount}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-card border border-border">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
            </div>
            <Progress 
              value={dashboard.todayTasksCount ? (dashboard.completedTasksCount / dashboard.todayTasksCount) * 100 : 0} 
              className="h-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Study Hours Today</p>
                <p className="text-3xl font-bold text-foreground">{dashboard.studyHoursToday}h</p>
              </div>
              <div className="p-2 rounded-lg bg-card border border-border">
                <Clock className="w-5 h-5 text-accent" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Target: {dashboard.profile.dailyStudyHours}h / day</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Active Streak</p>
                <p className="text-3xl font-bold text-foreground flex items-center gap-2">
                  {dashboard.streakDays} Days
                </p>
              </div>
              <div className={`p-2 rounded-lg bg-card border border-border ${dashboard.streakDays > 0 ? 'animate-pulse' : ''}`}>
                <Flame className={`w-5 h-5 ${dashboard.streakDays > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Keep the momentum going!</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Topics & Milestones */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="h-full border-destructive/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  Critical Weaknesses
                </CardTitle>
                <CardDescription>Topics pulling down your probability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {dashboard.weakTopics.length > 0 ? (
                    dashboard.weakTopics.map(topic => (
                      <Badge key={topic} variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20">
                        {topic}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No critical weaknesses identified yet.</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="h-full border-green-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-green-500" />
                  Secured Strengths
                </CardTitle>
                <CardDescription>Topics where you are exam-ready</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {dashboard.strongTopics.length > 0 ? (
                    dashboard.strongTopics.map(topic => (
                      <Badge key={topic} variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20">
                        {topic}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Master topics to see them here.</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Syllabus Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" className="stroke-muted fill-none" strokeWidth="8" />
                    <circle 
                      cx="50" cy="50" r="40" 
                      className="stroke-primary fill-none transition-all duration-1000 ease-in-out" 
                      strokeWidth="8" 
                      strokeDasharray="251.2" 
                      strokeDashoffset={251.2 - (251.2 * dashboard.syllabusCompletionPercent) / 100}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-bold">{dashboard.syllabusCompletionPercent}%</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className="font-medium text-foreground">Overall Completion</h4>
                  <p className="text-sm text-muted-foreground">
                    You have covered {dashboard.syllabusCompletionPercent}% of the total syllabus weightage.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Milestones */}
        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Upcoming Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard.upcomingMilestones.length > 0 ? (
                <div className="space-y-4">
                  {dashboard.upcomingMilestones.map(milestone => (
                    <div key={milestone.id} className="flex gap-3">
                      <div className="mt-0.5 shrink-0">
                        {milestone.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className={`font-medium ${milestone.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                          {milestone.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Due: {new Date(milestone.dueDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No upcoming milestones.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}