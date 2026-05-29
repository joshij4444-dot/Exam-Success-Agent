import { useGetProgress, useGetSkillHeatmap, useGetStudyStreak, useGetSelectionProbability, getGetProgressQueryKey, getGetSkillHeatmapQueryKey, getGetStudyStreakQueryKey, getGetSelectionProbabilityQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Flame, Target, BrainCircuit, Activity } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { format, subDays } from "date-fns";

export default function Progress() {
  const { data: progress, isLoading: loadingProgress } = useGetProgress({
    query: { queryKey: getGetProgressQueryKey() },
  });

  const { data: heatmap, isLoading: loadingHeatmap } = useGetSkillHeatmap({
    query: { queryKey: getGetSkillHeatmapQueryKey() },
  });

  const { data: streak, isLoading: loadingStreak } = useGetStudyStreak({
    query: { queryKey: getGetStudyStreakQueryKey() },
  });

  const { data: probability, isLoading: loadingProb } = useGetSelectionProbability({
    query: { queryKey: getGetSelectionProbabilityQueryKey() },
  });

  if (loadingProgress || loadingHeatmap || loadingStreak || loadingProb) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-12 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!progress || !heatmap || !streak || !probability) return null;

  // Prepare data for charts
  const subjectData = progress.subjectBreakdown.map(s => ({
    subject: s.subject.length > 15 ? s.subject.substring(0, 15) + '...' : s.subject,
    fullSubject: s.subject,
    mastery: s.masteryPercent
  }));

  const probTrendIcon = 
    probability.trend === 'improving' ? <TrendingUp className="w-5 h-5 text-green-500" /> :
    probability.trend === 'declining' ? <TrendingUp className="w-5 h-5 text-destructive rotate-180" /> :
    <Activity className="w-5 h-5 text-accent" />;

  const probColor = 
    probability.current < 40 ? "text-destructive" :
    probability.current < 70 ? "text-accent" : 
    "text-green-500";

  // Generate 30 day grid
  const today = new Date();
  const days30 = Array.from({ length: 30 }).map((_, i) => {
    const d = subDays(today, 29 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const record = streak.last30Days.find(r => r.date === dateStr);
    return {
      date: d,
      hours: record?.hours || 0,
      studied: record?.studied || false
    };
  });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics & Progress</h1>
        <p className="text-muted-foreground mt-1">Deep dive into your performance metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Selection Probability</p>
                <div className="flex items-center gap-3">
                  <p className={`text-4xl font-bold ${probColor}`}>{probability.current}%</p>
                  {probTrendIcon}
                </div>
              </div>
              <Target className={`w-8 h-8 ${probColor} opacity-50`} />
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Projected: <span className="font-semibold text-foreground">{probability.projected}%</span> based on current velocity.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Overall Mastery</p>
                <p className="text-4xl font-bold text-foreground">{progress.overallMasteryPercent}%</p>
              </div>
              <BrainCircuit className="w-8 h-8 text-primary opacity-50" />
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Readiness Score: <span className="font-semibold text-foreground">{progress.readinessScore}/100</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Consistency Streak</p>
                <p className="text-4xl font-bold text-foreground">{streak.currentStreak} <span className="text-xl text-muted-foreground font-normal">Days</span></p>
              </div>
              <Flame className={`w-8 h-8 ${streak.currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground opacity-50'}`} />
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Longest: <span className="font-semibold text-foreground">{streak.longestStreak}</span> • Productivity: <span className="font-semibold text-foreground">{streak.productivityScore}/100</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Subject Mastery</CardTitle>
            <CardDescription>Your proficiency across different syllabus subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} width={120} />
                  <RechartsTooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [`${value}%`, 'Mastery']}
                    labelFormatter={(label, payload) => payload[0]?.payload?.fullSubject || label}
                  />
                  <Bar dataKey="mastery" radius={[0, 4, 4, 0]} barSize={20}>
                    {subjectData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={
                        entry.mastery >= 80 ? 'hsl(150, 100%, 45%)' : 
                        entry.mastery >= 50 ? 'hsl(260, 100%, 65%)' : 
                        'hsl(0, 84%, 60%)'
                      } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>30-Day Activity Heatmap</CardTitle>
            <CardDescription>Daily study hours consistency</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center h-[300px]">
            <div className="grid grid-cols-7 gap-2 max-w-sm mx-auto w-full">
              {days30.map((day, i) => {
                let colorClass = "bg-muted";
                if (day.hours > 0 && day.hours <= 2) colorClass = "bg-primary/30";
                else if (day.hours > 2 && day.hours <= 5) colorClass = "bg-primary/60";
                else if (day.hours > 5) colorClass = "bg-primary";
                
                return (
                  <div 
                    key={i} 
                    className={`aspect-square rounded-sm ${colorClass} transition-colors hover:ring-2 hover:ring-offset-2 hover:ring-primary hover:ring-offset-background group relative`}
                    title={`${format(day.date, 'MMM d')}: ${day.hours}h`}
                  >
                    <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs rounded px-2 py-1 -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none z-10 border border-border shadow-md">
                      {format(day.date, 'MMM d')}: {day.hours}h
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-muted" />
                <div className="w-3 h-3 rounded-sm bg-primary/30" />
                <div className="w-3 h-3 rounded-sm bg-primary/60" />
                <div className="w-3 h-3 rounded-sm bg-primary" />
              </div>
              <span>More</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}