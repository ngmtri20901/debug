'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/shared/components/ui/toggle-group";
import { Slider } from "@/shared/components/ui/slider";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Separator } from "@/shared/components/ui/separator";
import { Badge } from "@/shared/components/ui/badge";
import {
  Settings,
  Play,
  Lock,
  Crown,
} from "lucide-react";
import Link from "next/link";

interface FlashcardTopic {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface User {
  id: string;
  name: string;
  email?: string;
  subscription_type: "FREE" | "PLUS";
  streak_days: number;
  coins: number;
}

interface ReviewSessionConfig {
  topic?: string;
  complexity: string;
  includeSavedCards: boolean;
  numberOfCards: number;
  onlyCommonWords: boolean;
}

interface SessionConfigProps {
  sessionConfig: ReviewSessionConfig;
  setSessionConfig: (config: ReviewSessionConfig) => void;
  topics: FlashcardTopic[];
  user: User | null;
  onStartCustomSession: () => void;
  isCreatingCustomSession: boolean;
  isValidating: boolean;
}

export function SessionConfig({
  sessionConfig,
  setSessionConfig,
  topics,
  user,
  onStartCustomSession,
  isCreatingCustomSession,
  isValidating,
}: SessionConfigProps) {
  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5" />
            <CardTitle>Create Your Own Review Session</CardTitle>
          </div>
          <CardDescription>
            Customize your review experience with specific filters and
            preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end md:gap-6">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Filter by Topic</label>
              <Select
                value={sessionConfig.topic}
                onValueChange={(value) =>
                  setSessionConfig({ ...sessionConfig, topic: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a Topic" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.name}>
                      <div className="flex items-center gap-2">
                        <span>{topic.icon}</span>
                        <span>{topic.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2 mt-4 md:mt-0">
              <label className="text-sm font-medium">
                Filter by Complexity
              </label>
              <ToggleGroup
                type="single"
                value={sessionConfig.complexity}
                onValueChange={(value) =>
                  value &&
                  setSessionConfig({ ...sessionConfig, complexity: value })
                }
                className="w-full"
              >
                <ToggleGroupItem value="All">All</ToggleGroupItem>
                <ToggleGroupItem value="Simple">Simple</ToggleGroupItem>
                <ToggleGroupItem value="Complex">Complex</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:gap-6">
            <div className="flex-1 flex items-center">
              <Checkbox
                id="onlyCommonWords"
                checked={!!sessionConfig.onlyCommonWords}
                onCheckedChange={(checked) =>
                  setSessionConfig({
                    ...sessionConfig,
                    onlyCommonWords: !!checked,
                  })
                }
              />
              <label
                htmlFor="onlyCommonWords"
                className="ml-2 text-sm font-medium"
              >
                Only show common words
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="savedCards"
                checked={sessionConfig.includeSavedCards}
                onCheckedChange={(checked) =>
                  setSessionConfig({
                    ...sessionConfig,
                    includeSavedCards: !!checked,
                  })
                }
                disabled={user?.subscription_type === "FREE"}
              />
              <label htmlFor="savedCards" className="text-sm font-medium">
                Include My Saved Cards
              </label>
              {user?.subscription_type === "FREE" && (
                <Badge variant="secondary">
                  <Crown className="w-3 h-3 mr-1" />
                  Plus
                </Badge>
              )}
            </div>

            {/* Note about saved cards feature requiring Supabase integration */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                  Saved cards feature requires Supabase integration. Currently showing regular flashcards only.
                </p>
              </div>
            </div>
            {user?.subscription_type === "FREE" && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                    Tired of random words? Upgrade to Plus to unlock unlimited
                    saved flashcards for review!
                  </p>
                </div>
                <Button asChild size="sm" className="mt-2">
                  <Link href="/plans">
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Plus
                  </Link>
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium">
              Number of cards to review: {sessionConfig.numberOfCards}
            </label>
            <Slider
              value={[sessionConfig.numberOfCards]}
              onValueChange={(value) =>
                setSessionConfig({
                  ...sessionConfig,
                  numberOfCards: value[0],
                })
              }
              max={50}
              min={10}
              step={5}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <div className="text-center mb-8 space-y-4">
        <Button
          onClick={onStartCustomSession}
          size="lg"
          className="text-lg px-8 py-6 h-auto"
          disabled={isCreatingCustomSession || isValidating}
        >
          <Play className="w-5 h-5 mr-2" />
          {isCreatingCustomSession || isValidating
            ? "Validating Session..."
            : "Start Custom Review Session"}
        </Button>
      </div>
    </>
  );
}