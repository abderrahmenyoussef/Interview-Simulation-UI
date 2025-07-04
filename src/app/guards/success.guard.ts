import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { InterviewService, InterviewState } from '../services/interview.service';

export const successGuard: CanActivateFn = (route, state) => {
  const interviewService = inject(InterviewService);
  const router = inject(Router);

  const interviewState = interviewService.getInterviewState();

  if (interviewState === InterviewState.COMPLETED) {
    return true;
  }

  // Redirect to home if interview is not completed
  router.navigate(['/']);
  return false;
};
