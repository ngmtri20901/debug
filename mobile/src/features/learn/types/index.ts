/**
 * Learn module types exports
 */

// Exercise types
export type {
  Lesson,
  Chapter,
  Topic,
  Zone,
  UserProgress,
  TopicProgress,
  LessonProgress,
  MaterialType,
  Material,
  DialogueLine,
  VocabularyItem,
  GrammarRule,
  ExampleSentence,
} from './exercises'

// Practice types
export type {
  QuestionType,
  MCQType,
  ChooseWordsType,
  ChooseWordsSubtype,
  ChooseWordsQuestionData,
  Choice,
  WordPair,
  SynonymPair,
  BaseQuestion,
  MultipleChoiceQuestion,
  WordMatchingQuestion,
  SynonymMatchingQuestion,
  ChooseWordsQuestion,
  DialogueChoice,
  RoleplayStep,
  ErrorCorrectionQuestion,
  DialogueCompletionQuestion,
  RolePlayQuestion,
  GrammarStructureQuestion,
  Question,
  Exercise,
  ExerciseProgress,
  ExerciseSession,
  QuestionAnswer,
  SessionResults,
  CompletionResponse,
} from './practice'

// API types
export type {
  ZoneRow,
  TopicRow,
  LessonRow,
  MaterialRow,
  PracticeSetRow,
  QuestionRow,
  PracticeSetQuestionRow,
  PracticeResultRow,
  UserLessonProgressRow,
  ZoneWithTopicsResponse,
  TopicWithLessonsResponse,
  LessonWithMaterialsResponse,
  ExerciseWithQuestionsResponse,
  SubmitExerciseParams,
  SubmitExerciseResponse,
  ZoneCompletionStats,
  TopicProgressSummary,
  ZoneProgressSummary,
} from './api'
