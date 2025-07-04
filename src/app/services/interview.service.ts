import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

export interface Question {
  id: number;
  question: string;
}

export interface InterviewResponse {
  status: string;
  error: any;
  data: {
    messages: string;
    questions: Question[];
  };
}

export enum InterviewState {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  TERMINATED = 'TERMINATED'
}

@Injectable({
  providedIn: 'root'
})
export class InterviewService {
  private questionsData: Question[] = [];
  private usedQuestions: Set<number> = new Set();
  private interviewStateSubject = new BehaviorSubject<InterviewState>(InterviewState.NOT_STARTED);

  public interviewState$ = this.interviewStateSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadInterviewState();
  }

  loadQuestionsData(): Observable<InterviewResponse> {
    return this.http.get<InterviewResponse>('./assets/questions-response.json');
  }

  async initializeQuestions(): Promise<void> {
    try {
      const response = await this.loadQuestionsData().toPromise();
      if (response?.data?.questions) {
        this.questionsData = response.data.questions;
        console.log('Questions loaded successfully:', this.questionsData.length);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      console.error('Failed to load questions from JSON file. Interview cannot proceed.');
      // Show user-friendly error message
      alert('⚠️ Error: Questions could not be loaded!\n\n' +
            'The interview questions file is missing or corrupted.\n' +
            'Please contact the administrator to fix this issue.\n\n' +
            'Interview cannot proceed without questions.');
      // Don't provide fallback questions - force the JSON file to be fixed
      this.questionsData = [];
    }
  }

  getRandomQuestion(): Question | null {
    if (this.questionsData.length === 0) {
      return null;
    }

    const availableQuestions = this.questionsData.filter(q => !this.usedQuestions.has(q.id));

    if (availableQuestions.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const selectedQuestion = availableQuestions[randomIndex];
    this.usedQuestions.add(selectedQuestion.id);

    return selectedQuestion;
  }

  getInterviewState(): InterviewState {
    return this.interviewStateSubject.value;
  }

  setInterviewState(state: InterviewState): void {
    this.interviewStateSubject.next(state);
    localStorage.setItem('interviewState', state);
  }

  private loadInterviewState(): void {
    const savedState = localStorage.getItem('interviewState');
    if (savedState && Object.values(InterviewState).includes(savedState as InterviewState)) {
      this.interviewStateSubject.next(savedState as InterviewState);
    }
  }

  resetInterview(): void {
    this.usedQuestions.clear();
    this.setInterviewState(InterviewState.NOT_STARTED);
    localStorage.removeItem('interviewButtonDisabled');
  }

  isButtonDisabled(): boolean {
    const buttonState = localStorage.getItem('interviewButtonDisabled');
    return buttonState === 'true';
  }
}
