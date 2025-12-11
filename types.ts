export enum QuestionCategory {
  LITERAL = 'Littérale',
  INFERENTIAL = 'Inférentielle',
  EVALUATIVE = 'Évaluative',
}

export interface Question {
  id: number;
  text: string;
  category: QuestionCategory;
  correctAnswer: string; // The model answer
  hintSubtle: string; // For partial answers
  hintSpecific: string; // For wrong answers (location in text)
}

export interface User {
  firstName: string;
  lastName: string;
}

export type AnswerStatus = 'correct' | 'partial' | 'wrong' | 'unanswered';

export interface UserAttempt {
  questionId: number;
  attempts: number; // 1 or 2
  status: AnswerStatus;
  userResponse: string;
}

export interface RemediationContent {
  definition: string;
  examples: string;
  category: QuestionCategory;
}
