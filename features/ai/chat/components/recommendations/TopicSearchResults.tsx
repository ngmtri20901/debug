"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { BookOpen, GraduationCap, Sparkles, TrendingUp, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/shared/lib/supabase/client";
import type { TopicResults, TopicResult } from "@/features/ai/chat/types";

interface TopicSearchResultsProps {
  data: TopicResults;
}

export function TopicSearchResults({ data }: TopicSearchResultsProps) {
  const [topics, setTopics] = useState<TopicResult[]>(data.topics || []);
  const [loading, setLoading] = useState(false); // Always false now since data comes directly
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Topics are now provided directly from the tool (like Tavily pattern)
    if (data.topics && data.topics.length > 0) {
      setTopics(data.topics);
      setLoading(false);
      return;
    }

    // Fallback: If topicIds are provided (old pattern), fetch them
    // This is for backward compatibility only
    if (data.topicIds && data.topicIds.length > 0) {
      fetchTopics(data.topicIds);
    }
  }, [data.topicIds, data.topics]);

  const fetchTopics = async (topicIds: number[]) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[TopicSearchResults] Fetching topics:', topicIds);
      
      const supabase = createClient();
      
      // Query topics by IDs using client-side Supabase
      const { data: topicsData, error: topicsError } = await supabase
        .from('topics')
        .select(`
          topic_id,
          vietnamese_title,
          english_title,
          topic_description,
          slug,
          zone_id,
          sort_order,
          zones!inner (
            name,
            level
          ),
          lessons (
            id
          )
        `)
        .in('topic_id', topicIds)
        .eq('status', 'published')
        .order('sort_order', { ascending: true });

      if (topicsError) {
        console.error('[TopicSearchResults] Database error:', topicsError);
        setError(topicsError.message);
        return;
      }

      if (!topicsData || topicsData.length === 0) {
        console.warn('[TopicSearchResults] No topics found');
        setError('No topics found');
        return;
      }

      const formattedTopics = topicsData.map((t: any) => ({
        topic_id: t.topic_id,
        vietnamese_title: t.vietnamese_title,
        english_title: t.english_title,
        topic_description: t.topic_description,
        slug: t.slug,
        zone_name: t.zones.name,
        zone_level: t.zones.level,
        lesson_count: Array.isArray(t.lessons) ? t.lessons.length : 0,
        sort_order: t.sort_order,
      }));

      console.log('[TopicSearchResults] Fetched topics:', formattedTopics.length);
      setTopics(formattedTopics);
    } catch (err) {
      console.error('[TopicSearchResults] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  const getLevelBadgeStyle = (level: number) => {
    const styles = {
      1: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800" },
      2: { bg: "bg-sky-50 dark:bg-sky-950/30", text: "text-sky-700 dark:text-sky-400", border: "border-sky-200 dark:border-sky-800" },
      3: { bg: "bg-violet-50 dark:bg-violet-950/30", text: "text-violet-700 dark:text-violet-400", border: "border-violet-200 dark:border-violet-800" },
      4: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800" },
      5: { bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-700 dark:text-rose-400", border: "border-rose-200 dark:border-rose-800" },
    };
    return styles[level as keyof typeof styles] || styles[1];
  };

  const getLevelIcon = (level: number) => {
    if (level <= 2) return <Sparkles className="w-3.5 h-3.5" />;
    if (level <= 3) return <TrendingUp className="w-3.5 h-3.5" />;
    return <GraduationCap className="w-3.5 h-3.5" />;
  };

  // Show loading state
  if (loading) {
    return (
      <div className="w-full space-y-4 my-6">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p>Loading topics...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="w-full space-y-4 my-6">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">Error loading topics: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show empty state
  if (!topics || topics.length === 0) {
    return (
      <div className="w-full space-y-4 my-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">No topics found matching your query.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 my-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Vietnamese Topics</h3>
        </div>
        <Badge variant="secondary" className="gap-1">
          <span className="font-semibold">{topics.length}</span>
          <span className="text-muted-foreground">found</span>
        </Badge>
      </motion.div>

      {/* Topics Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {topics.map((topic, index) => {
          const levelStyle = getLevelBadgeStyle(topic.zone_level);
          
          return (
            <motion.div
              key={topic.topic_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="group relative overflow-hidden border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                {/* Decorative gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl -z-10 group-hover:scale-150 transition-transform duration-500" />
                
                <CardHeader className="space-y-3">
                  {/* Level Badge */}
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="outline" 
                      className={`gap-1.5 ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border} font-medium`}
                    >
                      {getLevelIcon(topic.zone_level)}
                      {topic.zone_name}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <BookOpen className="w-4 h-4" />
                      <span>{topic.lesson_count} lessons</span>
                    </div>
                  </div>

                  {/* Topic Title */}
                  <div className="space-y-1">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {topic.vietnamese_title}
                    </CardTitle>
                    <CardDescription className="text-base font-medium">
                      {topic.english_title}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {topic.topic_description}
                  </p>

                  {/* Action Button */}
                  <Button 
                    asChild 
                    className="w-full group/button"
                    size="lg"
                  >
                    <Link href={`/learn/${topic.slug}`}>
                      <span>Explore Topic</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover/button:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: topics.length * 0.1 + 0.2 }}
        className="flex items-center justify-between pt-2 text-sm text-muted-foreground"
      >
        <p>
          Showing <span className="font-medium text-foreground">{topics.length}</span> topic{topics.length !== 1 ? 's' : ''} 
          {data.query && (
            <>
              {' '}for <span className="font-medium text-foreground">"{data.query}"</span>
            </>
          )}
        </p>
        {data.responseTime && (
          <p className="text-xs">
            Loaded in <span className="font-medium">{data.responseTime}ms</span>
          </p>
        )}
      </motion.div>
    </div>
  );
}
