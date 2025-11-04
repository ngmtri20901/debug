'use client'

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/shared/lib/supabase/client";
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
import { Progress } from "@/shared/components/ui/progress";
import { Separator } from "@/shared/components/ui/separator";
import { Badge } from "@/shared/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  BookOpen,
  Target,
  TrendingUp,
  Trophy,
  Mic,
  Shuffle,
  Volume2,
  Lock,
  Crown,
  Play,
  Settings,
  Calendar,
  Zap,
  AlarmClock,
  Check,
  X,
  CircleHelp,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import PageWithLoading from "@/shared/components/ui/PageWithLoading";
import { ProgressiveLoading } from "@/shared/components/ui/progressive-loading";
import { useProgressiveSession } from "@/features/flashcards/hooks/useProgressiveSession";
import { useLoading } from "@/shared/hooks/use-loading";
import { FlashcardComponent } from "@/features/flashcards/components/core/flashcard-component";
import type { FlashcardData } from "@/features/flashcards/types/flashcard.types";
import { flashcardAPI } from "@/features/flashcards/services/flashcardService";
import { useSessionValidation } from "@/features/flashcards/hooks/use-session-validation";
import { useDisplaySettings } from "@/features/settings/hooks/use-display-settings";
import { useFlashcardReview } from "@/features/flashcards/hooks/use-flashcard-review";
import { sessionAPI } from "@/features/flashcards/services/sessions";
import { InsufficientCardsModal } from "@/features/flashcards/components/review/insufficient-cards-modal";
import type { SuggestionOption } from "@/features/flashcards/types/session.types";
import { ReviewSession } from "@/features/flashcards/components/review/ReviewSession";
import { SessionConfig } from "@/features/flashcards/components/review/SessionConfig";
import { saveDailyFlashcards, loadDailyFlashcards } from "@/features/flashcards/utils/daily-cache";
import { createReviewSession, createSessionCardMappings } from "@/features/flashcards/actions/review";

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
  subscription_type: "FREE" | "PLUS" | "UNLIMITED";
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

interface TodaysStats {
  reviewedToday: number;
  dailyGoal: number;
  dueForReview: number;
  accuracy: number;
}

export default function ReviewClient() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [topics, setTopics] = useState<FlashcardTopic[]>([]);
  const [todaysStats, setTodaysStats] = useState<TodaysStats>({
    reviewedToday: 0,
    dailyGoal: 20,
    dueForReview: 0,
    accuracy: 0,
  });

  // Session configuration
  const [sessionConfig, setSessionConfig] = useState<ReviewSessionConfig>({
    complexity: "All",
    includeSavedCards: false,
    numberOfCards: 10,
    onlyCommonWords: false,
  });

  // Practice cards and review hook
  const [practiceCards, setPracticeCards] = useState<FlashcardData[]>([]);

  // Modal state for restart confirmation
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [dontShowRestartModal, setDontShowRestartModal] = useState(false);

  // Custom session state
  const [showInsufficientCardsModal, setShowInsufficientCardsModal] = useState(false);
  const [isCreatingCustomSession, setIsCreatingCustomSession] = useState(false);

  const { isLoading, withLoading, stopLoading } = useLoading();
  const {
    isValidating,
    validationResult,
    validateSession,
    clearValidation
  } = useSessionValidation();
  
  // Progressive session creation
  const { steps, updateStep, resetSteps, hasError } = useProgressiveSession();

  // Display settings for animation control
  const { getAnimationDuration } = useDisplaySettings();

  // Use the flashcard review hook
  const {
    currentCard,
    currentCardIndex,
    isFlipped,
    timer,
    isTimerActive,
    cardResults,
    handleCardResult,
    handleSaveCard,
    handleFlipCard,
    resetSession,
    getProgressStats,
    savedCards,
  } = useFlashcardReview({
    cards: practiceCards,
    onSessionComplete: handleSessionComplete,
    enableTimer: true,
  });

  function handleSessionComplete() {
    toast.success("Practice session completed! Starting a new session...");
    handleRestartSession();
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  // Safety net to prevent the loading overlay from getting stuck due to any hanging async task
  useEffect(() => {
    if (!isLoading) return;
    const timeoutId = setTimeout(() => {
      try {
        stopLoading();
      } catch (e) {
        // no-op: best-effort safety stop
      }
    }, 33000); // 3s max overlay
    return () => clearTimeout(timeoutId);
  }, [isLoading, stopLoading]);

  useEffect(() => {
    const fetchData = async () => {
      if (!mounted) return;

      await withLoading(async () => {
        try {
          // Get current user
          const {
            data: { user: authUser },
            error: authError,
          } = await supabase.auth.getUser();
          if (authError || !authUser) {
            toast.error("Please log in to continue");
            router.push("/auth/login");
            return;
          }

          // Get user profile
          const { data: userProfile, error: profileError } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", authUser.id)
            .maybeSingle();

          if (profileError || !userProfile) {
            console.error("Profile error:", profileError);
            // Create a new user profile if it doesn't exist
            const newUserProfile: User = {
              id: authUser.id,
              name: authUser.email?.split('@')[0] || "User",
              email: authUser.email || "",
              subscription_type: "FREE" as const,
              streak_days: 0,
              coins: 0,
            };

            try {
              const { data: createdProfile, error: createError } = await supabase
                .from("user_profiles")
                .insert(newUserProfile)
                .select()
                .single();

              if (!createError && createdProfile) {
                setUser(createdProfile);
              } else {
                setUser(newUserProfile);
              }
            } catch (createError) {
              console.error("Error creating profile:", createError);
              setUser(newUserProfile);
            }
          } else {
            setUser(userProfile);
          }

          // Get flashcard topics from backend API
          try {
            const topicsData = await flashcardAPI.getAllTopics();
            setTopics(
              topicsData.map((topic) => ({
                id: topic.id,
                name: topic.title,
                description: topic.description,
                icon: "📚",
              }))
            );
          } catch (error) {
            console.error("Error fetching topics:", error);
            setTopics([]);
          }

          // Get today's statistics
          await fetchTodaysStats(authUser.id);

          // Load sample practice cards
          await loadPracticeCards(authUser.id);
        } catch (error) {
          console.error("Error fetching data:", error);
          toast.error("Failed to load review data");
        }
      });
    };

    fetchData();
  }, [mounted, router, withLoading]);

  useEffect(() => {
    // Check sessionStorage for restart modal preference
    setDontShowRestartModal(
      sessionStorage.getItem("hideRestartSessionModal") === "true"
    );
  }, []);

  const fetchTodaysStats = async (userId: string) => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const { data: statsData, error: statsError } = await supabase
        .from("flashcard_statistics")
        .select("*")
        .eq("user_id", userId)
        .eq("date", today)
        .maybeSingle();

      const { data: dueCards, count: dueCount } = await supabase
        .from("flashcard_srs_records")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .lte("due_date", today);

      setTodaysStats({
        reviewedToday: statsData?.flashcards_reviewed || 0,
        dailyGoal: 20,
        dueForReview: dueCount || 0,
        accuracy: statsData?.accuracy_rate || 0,
      });
    } catch (error) {
      console.error("Error fetching today's stats:", error);
    }
  };

  const loadPracticeCards = async (userId: string, forceRefresh = false) => {
    try {
      console.log(
        "Loading practice cards for user:",
        userId,
        forceRefresh ? "(force refresh)" : ""
      );

      let cards: FlashcardData[] | null = null;

      if (!forceRefresh) {
        cards = loadDailyFlashcards();
      }

      if (!cards) {
        console.log("📡 Fetching fresh flashcards from backend API...");
        cards = await flashcardAPI.getRandomFlashcards({ count: 15 });
        console.log("Fetched cards from backend:", cards.length);

        if (cards && cards.length > 0) {
          saveDailyFlashcards(cards);
          toast.success(`Loaded ${cards.length} fresh flashcards for today!`);
        } else {
          console.log("No cards returned from backend");
          toast.error("No flashcards available for review");
          setPracticeCards([]);
          router.push('/404'); // Redirect to 404 page when no practice cards available
          return;
        }
      } else {
        toast.success(
          `Using today's cached flashcards (${cards.length} cards)`
        );
      }

      console.log("Successfully loaded cards:", cards.length);
      setPracticeCards(cards);
    } catch (error) {
      console.error("Error loading practice cards:", error);
      toast.error("Failed to load flashcards. Please try again.");
      setPracticeCards([]);
    }
  };

  const handleRestartSessionConfirmed = useCallback(async () => {
    if (!user) return;

    resetSession();
    await loadPracticeCards(user.id, false);
  }, [user, resetSession]);

  const handleRestartSession = useCallback(() => {
    if (dontShowRestartModal) {
      handleRestartSessionConfirmed();
    } else {
      setShowRestartModal(true);
    }
  }, [dontShowRestartModal, handleRestartSessionConfirmed]);

  const handleRefreshCards = useCallback(async () => {
    if (!user) return;

    resetSession();
    await loadPracticeCards(user.id, false);
    toast.success("Session restarted!");
  }, [user, resetSession]);

  const handleGetFreshCards = useCallback(async () => {
    if (!user) return;

    await withLoading(async () => {
      resetSession();
      await loadPracticeCards(user.id, true);
      toast.success("Loaded fresh flashcards!");
    });
  }, [user, withLoading, resetSession]);

  // Custom session handlers with progressive loading
  const handleStartCustomSession = async () => {
    if (!user) return;

    setIsCreatingCustomSession(true);
    clearValidation();
    resetSteps();

    try {
      // Step 1: Validate session
      updateStep('validate', 'loading');
      const filters = sessionAPI.buildFiltersFromForm(sessionConfig);
      console.log("🎯 Starting custom session validation:", filters);

      // Include user_id for saved cards validation
      const validation = await validateSession(filters, user.id);

      // Log validation result for debugging
      console.log("Session validation result:", validation);

      if (!validation) {
        updateStep('validate', 'error', 'Validation failed');
        toast.error("Failed to validate session filters");
        return;
      }

      updateStep('validate', 'completed');

      if (validation.insufficient) {
        console.log("⚠️ Insufficient cards - showing modal");
        setShowInsufficientCardsModal(true);
        setIsCreatingCustomSession(false);
      } else {
        console.log("✅ Sufficient cards - creating session directly");
        await createCustomSessionWithProgress(filters);
        // Note: createCustomSessionWithProgress handles closing the modal after navigation
      }
    } catch (error) {
      console.error("Error starting custom session:", error);
      updateStep('validate', 'error', 'Failed to start session');
      toast.error("Failed to start custom session");
      setIsCreatingCustomSession(false);
    }
  };

  const createCustomSessionWithProgress = async (filters: any, suggestionId?: string) => {
    if (!user) {
      throw new Error("User not found");
    }

    try {
      // Step 2: Generate cards
      updateStep('generate', 'loading');
      const sessionGenerationRequest = {
        user_id: user.id,
        filters: {
          ...filters,
          include_saved_cards: sessionConfig.includeSavedCards,
        },
        suggestion_id: suggestionId,
        include_saved_cards: sessionConfig.includeSavedCards,
        session_metadata: {
          created_from: suggestionId ? 'suggestion' : 'form',
          original_filters: sessionConfig,
        },
      };

      console.log("🏗️ Generating custom session:", sessionGenerationRequest);
      
      // Add timeout for card generation - increased to 30s
      const generateWithTimeout = new Promise<any>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Timeout generating session cards - backend took too long'));
        }, 30000); // 30 seconds

        sessionAPI.generateSessionCards(sessionGenerationRequest)
          .then((result) => {
            clearTimeout(timeoutId);
            resolve(result);
          })
          .catch((error) => {
            clearTimeout(timeoutId);
            reject(error);
          });
      });

      const sessionResult = await generateWithTimeout;
      console.log("✅ Session generated:", sessionResult);
      
      if (!sessionResult || !sessionResult.flashcards || sessionResult.flashcards.length === 0) {
        throw new Error("No flashcards generated for session");
      }
      
      updateStep('generate', 'completed');

      // Step 3: Save session using Server Action
      updateStep('save', 'loading');

      console.log("💾 [STEP 3] Starting session save process (Server Action)");
      console.log("📋 Session config:", sessionConfig);
      console.log("📋 Flashcards count:", sessionResult.actual_count);

      // Call Server Action to create session
      const sessionCreateResult = await createReviewSession({
        session_type: "custom",
        total_cards: sessionResult.actual_count || 0,
        session_config: {
          created_from: suggestionId ? 'suggestion' : 'form',
          original_filters: sessionConfig,
        },
        filters_applied: filters
      });

      if (!sessionCreateResult.success || !sessionCreateResult.data) {
        console.error("❌ [STEP 3] Failed to create session:", sessionCreateResult.error);
        throw new Error(sessionCreateResult.error || 'Failed to save session');
      }

      const session = sessionCreateResult.data;
      console.log("✅ [STEP 3] Session created successfully:", session.id);

      updateStep('save', 'completed');

      // Step 3.5: Persist session cards mapping using Server Action
      console.log("📝 [STEP 3.5] Persisting session cards mapping (Server Action)");

      const flashcardsArray = Array.isArray(sessionResult.flashcards)
        ? sessionResult.flashcards
        : [];

      console.log(`📊 [STEP 3.5] Processing ${flashcardsArray.length} flashcards`);

      if (flashcardsArray.length > 0) {
        const mappingResult = await createSessionCardMappings({
          session_id: session.id,
          flashcards: flashcardsArray
        });

        if (!mappingResult.success) {
          console.error('❌ [STEP 3.5] Failed to persist session cards mapping:', mappingResult.error);
          // Do not block navigation; the session page will handle empty mapping gracefully
        } else {
          console.log(`✅ [STEP 3.5] Cards mapped: ${mappingResult.data?.inserted_count}/${flashcardsArray.length}`);
        }
      }

      // Step 4: Navigate
      console.log("🚀 [STEP 4] Navigating to session page");
      updateStep('redirect', 'loading');
      toast.success(`Custom session created with ${sessionResult.actual_count} cards!`);
      
      // Complete the step immediately and navigate
      updateStep('redirect', 'completed');
      
      // Small delay before navigation for better UX
      setTimeout(() => {
        console.log(`✅ [STEP 4] Redirecting to /flashcards/review/session?id=${session.id}`);
        setIsCreatingCustomSession(false); // Close the modal
        router.push(`/flashcards/review/session?id=${session.id}`);
      }, 800);

      } catch (error: any) {
      // Improve error visibility
      console.error("Error creating custom session:", error?.message || error);
      const currentLoadingStep = steps.find(step => step.status === 'loading');
      if (currentLoadingStep) {
        updateStep(currentLoadingStep.id, 'error', error?.message || 'Failed to complete step');
      }
      
      // Provide more specific error messages
      if (error?.message?.includes('Timeout')) {
        toast.error("Session creation timed out. Please try again or use Quick Review instead.");
      } else if (error?.message?.includes('Database error')) {
        toast.error("Database error. Please check your connection and try again.");
      } else if (error?.message?.includes('Network')) {
        toast.error("Network error. Please check your internet connection.");
      } else if (error?.message?.includes('generating session cards')) {
        toast.error("Unable to generate cards. Try adjusting your filters or use Quick Review.");
      } else {
        toast.error(`Failed to create custom session: ${error?.message || 'Unknown error'}`);
      }
      
      // Fallback suggestion
      console.log("💡 Suggesting fallback to Quick Review");
      }
  };

  // Legacy method for suggestion acceptance
  const createCustomSession = async (filters: any, suggestionId?: string) => {
    await createCustomSessionWithProgress(filters, suggestionId);
  };

  const handleAcceptSuggestion = async (suggestion: SuggestionOption) => {
    setShowInsufficientCardsModal(false);
    console.log("✅ Accepting suggestion:", suggestion);
    await createCustomSession(suggestion.filters, suggestion.id);
  };

  const handleAdjustFilters = () => {
    setShowInsufficientCardsModal(false);
    clearValidation();
    console.log("🔧 User chose to adjust filters manually");
  };

  if (!mounted) {
    return null;
  }

  const progressStats = getProgressStats();

  return (
    <PageWithLoading isLoading={isLoading}>
      <div className="container mx-auto py-10 px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Flashcard Quick Review</h1>
          <p className="text-muted-foreground">
            Practice Vietnamese vocabulary with intelligent spaced repetition
          </p>
        </div>

        <ReviewSession
          practiceCards={practiceCards}
          currentCard={currentCard}
          currentCardIndex={currentCardIndex}
          isFlipped={isFlipped}
          timer={timer}
          isTimerActive={isTimerActive}
          cardResults={cardResults}
          progressStats={progressStats}
          savedCards={savedCards}
          onCardResult={handleCardResult}
          onSaveCard={handleSaveCard}
          onFlipCard={handleFlipCard}
          onRefreshCards={handleRefreshCards}
          onGetFreshCards={handleGetFreshCards}
          getAnimationDuration={getAnimationDuration}
          isLoading={isLoading}
        />

        <div className="flex justify-center gap-4">
          <Button
            onClick={handleGetFreshCards}
            variant="outline"
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Get Fresh Cards for Today
          </Button>
        </div>

        <Separator className="my-8" />

        <SessionConfig
          sessionConfig={sessionConfig}
          setSessionConfig={setSessionConfig}
          topics={topics}
          user={user}
          onStartCustomSession={handleStartCustomSession}
          isCreatingCustomSession={isCreatingCustomSession}
          isValidating={isValidating}
        />

        {/* Insufficient Cards Modal */}
        <InsufficientCardsModal
          isOpen={showInsufficientCardsModal}
          onClose={() => setShowInsufficientCardsModal(false)}
          availableCount={validationResult?.available_count || 0}
          requestedCount={sessionConfig.numberOfCards}
          suggestions={validationResult?.suggestions || []}
          onAcceptSuggestion={handleAcceptSuggestion}
          onAdjustFilters={handleAdjustFilters}
          isLoading={isCreatingCustomSession}
        />

        {/* Restart Session Confirmation Modal */}
        <Dialog open={showRestartModal} onOpenChange={setShowRestartModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Do you want to restart this session?</DialogTitle>
              <DialogDescription>
                This will reset your progress for the current session. Are you
                sure you want to continue?
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2 mt-4">
              <Checkbox
                id="dontShowRestartAgain"
                checked={dontShowRestartModal}
                onCheckedChange={(checked) => {
                  setDontShowRestartModal(!!checked);
                  sessionStorage.setItem(
                    "hideRestartSessionModal",
                    checked ? "true" : "false"
                  );
                }}
              />
              <label
                htmlFor="dontShowRestartAgain"
                className="text-sm font-medium"
              >
                Do not show this again
              </label>
            </div>
            <DialogFooter className="flex gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowRestartModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setShowRestartModal(false);
                  handleRestartSessionConfirmed();
                }}
                className="flex-1"
              >
                Yes, Restart
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Progressive Loading Modal */}
        {isCreatingCustomSession && (
          <ProgressiveLoading
            title="Creating Your Review Session"
            steps={steps}
            onCancel={() => {
              setIsCreatingCustomSession(false);
              resetSteps();
            }}
          />
        )}
      </div>
    </PageWithLoading>
  );
}
