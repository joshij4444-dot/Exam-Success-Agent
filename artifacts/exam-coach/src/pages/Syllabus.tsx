import { useState } from "react";
import { useGetSyllabus, useUpdateTopicMastery, useGetPriorityTopics, getGetSyllabusQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Target, CheckCircle2, Flame, BrainCircuit, Star } from "lucide-react";
import type { SyllabusTopic } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function Syllabus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: syllabus, isLoading: loadingSyllabus } = useGetSyllabus({
    query: { queryKey: getGetSyllabusQueryKey() },
  });

  const { data: priorityTopics, isLoading: loadingPriority } = useGetPriorityTopics();
  
  const updateMastery = useUpdateTopicMastery();

  const handleMasteryChange = (topic: SyllabusTopic, newScore: number) => {
    updateMastery.mutate({ id: topic.id, data: { masteryScore: newScore } }, {
      onSuccess: () => {
        // Optimistic update
        queryClient.setQueryData(getGetSyllabusQueryKey(), (old: SyllabusTopic[] | undefined) => {
          if (!old) return old;
          return old.map(t => t.id === topic.id ? { ...t, masteryScore: newScore } : t);
        });
      },
      onError: () => {
        toast({
          title: "Update Failed",
          description: "Could not update mastery score",
          variant: "destructive"
        });
      }
    });
  };

  if (loadingSyllabus || loadingPriority) {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="space-y-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      </div>
    );
  }

  if (!syllabus || !priorityTopics) return null;

  // Group syllabus by subject
  const subjects = Array.from(new Set(syllabus.map(t => t.subject)));

  const renderTopicCard = (topic: SyllabusTopic) => {
    const priorityColor = 
      topic.priorityScore > 70 ? "text-destructive border-destructive bg-destructive/10" :
      topic.priorityScore > 40 ? "text-accent border-accent bg-accent/10" :
      "text-green-500 border-green-500 bg-green-500/10";
      
    const statusIcon = 
      topic.masteryScore >= 90 ? <CheckCircle2 className="w-5 h-5 text-green-500" /> :
      topic.masteryScore >= 50 ? <Flame className="w-5 h-5 text-accent" /> :
      <Target className="w-5 h-5 text-muted-foreground" />;

    return (
      <Card key={topic.id} className="border-border/50 bg-card/50 hover:bg-card transition-colors">
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                {statusIcon}
                <h4 className="font-semibold text-foreground truncate">{topic.topicName}</h4>
              </div>
              <Badge variant="outline" className={`${priorityColor} shrink-0`}>
                Pri: {topic.priorityScore}
              </Badge>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Weight: {topic.weightage}%
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-accent" />
                PYQs: {topic.pyqFrequency}
              </span>
              <span className="flex items-center gap-1">
                <BrainCircuit className="w-3 h-3" />
                Diff: {topic.difficultyScore}/10
              </span>
              {topic.subject && <span className="opacity-50">| {topic.subject}</span>}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Mastery</span>
                <span className={topic.masteryScore >= 80 ? "text-green-500" : "text-foreground"}>
                  {topic.masteryScore}%
                </span>
              </div>
              <Slider 
                value={[topic.masteryScore]} 
                max={100} step={5}
                onValueChange={(v) => handleMasteryChange(topic, v[0])}
                className="py-2 cursor-pointer"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Syllabus Tracker</h1>
        <p className="text-muted-foreground mt-1">Map your territory. Mark your conquests.</p>
      </div>

      <Tabs defaultValue="priority" className="w-full">
        <TabsList className="bg-muted border-border flex-wrap h-auto p-1 gap-1">
          <TabsTrigger value="priority" className="data-[state=active]:bg-card flex-1 min-w-[120px]">
            AI Priorities
          </TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-card flex-1 min-w-[120px]">
            All Subjects
          </TabsTrigger>
        </TabsList>

        <TabsContent value="priority" className="mt-6 space-y-8">
          {priorityTopics.toStudy.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                High Priority: Must Study Now
              </h3>
              <div className="grid gap-3">
                {priorityTopics.toStudy.map(renderTopicCard)}
              </div>
            </section>
          )}

          {priorityTopics.toRevise.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-accent">
                <Flame className="w-5 h-5" />
                Active Recall: Revision Due
              </h3>
              <div className="grid gap-3">
                {priorityTopics.toRevise.map(renderTopicCard)}
              </div>
            </section>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-6 space-y-10">
          {subjects.map(subject => (
            <section key={subject} className="space-y-4">
              <h3 className="text-xl font-bold border-b border-border/50 pb-2 text-primary">{subject}</h3>
              <div className="grid gap-3">
                {syllabus.filter(t => t.subject === subject).map(renderTopicCard)}
              </div>
            </section>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}