/**
 * Learn module components exports
 */

// Shared components
export * from './shared'

// Question components
export { MultipleChoiceQuestionComponent, type MultipleChoiceQuestionProps } from './questions/MultipleChoiceQuestion'
export { WordMatchingQuestionComponent, type WordMatchingQuestionProps } from './questions/WordMatchingQuestion'
export { ChooseWordsQuestionComponent, type ChooseWordsQuestionProps } from './questions/ChooseWordsQuestion'
export { ErrorCorrectionQuestionComponent, type ErrorCorrectionQuestionProps } from './questions/ErrorCorrectionQuestion'
export { DialogueQuestionComponent, type DialogueQuestionProps } from './questions/DialogueQuestion'

// Material components
export { MaterialView, type MaterialViewProps } from './materials/MaterialView'
