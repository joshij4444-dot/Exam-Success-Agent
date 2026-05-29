import { useState } from "react";
import { useGetTodayPlan, useGetWeeklyPlan, useCompleteTask, useLogStudySession, getGetTodayPlanQueryKey, getGetWeeklyPlanQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarIcon, Clock, BookOpen, PenTool, CheckCircle2, PlayCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { StudyTask } from "@workspace/api-client-react";
import { format, parseISO, isSameDay } from "date-fns";

const TaskIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'study': return <BookOpen className="w-4 h-4 text-blue-500" />;
    case 'practice': return <PenTool className="w-4 h-4 text-orange-500" />;
    case 'revision': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'mock_test': return <PlayCircle className="w-4 h-4 text-red-500" />;
    default: return <BookOpen className="w-4 h-4 text-muted-foreground" />;
  }
};

export default function Planner() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [logHours, setLogHours] = useState("");
  const [logDate, setLogDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: todayPlan, isLoading: loadingToday } = useGetTodayPlan({
    query: { queryKey: getGetTodayPlanQueryKey() },
  });

  const { data: weeklyPlan, isLoading: loadingWeekly } = useGetWeeklyPlan({
    query: { queryKey: getGetWeeklyPlanQueryKey() },
  });

  const completeTask = useCompleteTask();
  const logSession = useLogStudySession();

  const handleToggleTask = (task: StudyTask) => {
    const newStatus = !task.completed;
    completeTask.mutate({ id: task.id, data: { completed: newStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTodayPlanQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetWeeklyPlanQueryKey() });
      },
      onError: () => {
        toast({
          title: "Update Failed",
          description: "Could not update task status.",
          variant: "destructive"
        });
      }
    });
  };

  const handleLogHours = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = parseFloat(logHours);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid number of hours (0-24).",
        variant: "destructive"
      });
      return;
    }

    logSession.mutate({ data: { hours, date: logDate } }, {
      onSuccess: () => {
        toast({
          title: "Session Logged",
          description: `Successfully logged ${hours} hours of study.`,
        });
        setLogHours("");
        queryClient.invalidateQueries({ queryKey: getGetTodayPlanQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetWeeklyPlanQueryKey() });
      },
      onError: () => {
        toast({
          title: "Logging Failed",
          description: "Could not log study session.",
          variant: "destructive"
        });
      }
    });
  };

  if (loadingToday || loadingWeekly) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-32 w-full" />
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      </div>
    );
  }

  if (!todayPlan || !weeklyPlan) return null;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Daily Planner</h1>
        <p className="text-muted-foreground mt-1">Execute your mission step by step.</p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <form onSubmit={handleLogHours} className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
            <div className="space-y-2 flex-1 w-full">
              <label className="text-sm font-medium">Log Study Hours</label>
              <div className="flex gap-2">
                <Input 
                  type="date" 
                  value={logDate} 
                  onChange={(e) => setLogDate(e.target.value)}
                  className="bg-card w-auto"
                />
                <Input 
                  type="number" 
                  step="0.5" 
                  min="0.5" 
                  max="24"
                  placeholder="e.g. 2.5" 
                  value={logHours}
                  onChange={(e) => setLogHours(e.target.value)}
                  className="bg-card flex-1"
                />
              </div>
            </div>
            <Button type="submit" disabled={logSession.isPending} className="w-full sm:w-auto">
              {logSession.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Clock className="w-4 h-4 mr-2" />}
              Log Session
            </Button>
          </form>
        </CardContent>
      </Card>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="bg-muted border-border p-1">
          <TabsTrigger value="today" className="data-[state=active]:bg-card min-w-[120px]">
            Today's Missions
          </TabsTrigger>
          <TabsTrigger value="weekly" className="data-[state=active]:bg-card min-w-[120px]">
            Weekly Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{format(new Date(), 'EEEE, MMMM d')}</h3>
            <div className="text-sm font-medium text-muted-foreground">
              {todayPlan.completedHours} / {todayPlan.totalHours} hours completed
            </div>
          </div>

          <div className="space-y-3">
            {todayPlan.tasks.length > 0 ? (
              todayPlan.tasks.map(task => (
                <Card key={task.id} className={`transition-all ${task.completed ? 'opacity-60 bg-muted/50' : 'bg-card hover:border-primary/50'}`}>
                  <CardContent className="p-4 flex items-start gap-4">
                    <Checkbox 
                      checked={task.completed} 
                      onCheckedChange={() => handleToggleTask(task)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                        <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.title}
                        </p>
                        <Badge variant="outline" className="shrink-0 w-fit flex items-center gap-1 bg-background">
                          <Clock className="w-3 h-3" />
                          {task.durationMinutes} min
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <TaskIcon type={task.taskType} />
                          <span className="capitalize">{task.taskType.replace('_', ' ')}</span>
                        </span>
                        <span className="opacity-50">|</span>
                        <span>{task.subject}</span>
                        {task.topicName && (
                          <>
                            <span className="opacity-50">|</span>
                            <span className="truncate">{task.topicName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 border rounded-xl border-dashed">
                <p className="text-muted-foreground">No tasks scheduled for today. Take a break or study ahead!</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="weekly" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {weeklyPlan.map((day, idx) => {
              const isToday = isSameDay(parseISO(day.date), new Date());
              return (
                <Card key={idx} className={isToday ? 'border-primary shadow-[0_0_15px_rgba(139,92,246,0.15)]' : ''}>
                  <CardHeader className="p-3 text-center pb-0 border-b border-border/50">
                    <CardTitle className="text-xs uppercase text-muted-foreground tracking-wider font-semibold">
                      {format(parseISO(day.date), 'EEE')}
                    </CardTitle>
                    <div className="text-lg font-bold my-1">{format(parseISO(day.date), 'd')}</div>
                  </CardHeader>
                  <CardContent className="p-3 text-center">
                    <div className="text-xs text-muted-foreground mb-2">
                      {day.tasks.length} Tasks
                    </div>
                    {day.totalHours > 0 ? (
                      <div className="w-full bg-muted rounded-full h-1.5 mb-1 overflow-hidden">
                        <div 
                          className="bg-primary h-full" 
                          style={{ width: `${Math.min(100, (day.completedHours / day.totalHours) * 100)}%` }}
                        />
                      </div>
                    ) : (
                      <div className="w-full bg-muted rounded-full h-1.5 mb-1" />
                    )}
                    <div className="text-[10px] text-muted-foreground">
                      {day.completedHours}h / {day.totalHours}h
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}