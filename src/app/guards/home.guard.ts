import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { InterviewService, InterviewState } from '../services/interview.service';

export const homeGuard: CanActivateFn = (route, state) => {
  const interviewService = inject(InterviewService);
  const router = inject(Router);

  const interviewState = interviewService.getInterviewState();

  if (interviewState === InterviewState.COMPLETED) {
    router.navigate(['/success']);
    return false;
  }

  return true;
};
