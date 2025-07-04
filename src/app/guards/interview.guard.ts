import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { InterviewService, InterviewState } from '../services/interview.service';

export const interviewGuard: CanActivateFn = (route, state) => {
  const interviewService = inject(InterviewService);
  const router = inject(Router);

  const interviewState = interviewService.getInterviewState();
  console.log('Interview Guard - Current state:', interviewState);

  if (interviewState === InterviewState.COMPLETED) {
    console.log('Interview Guard - Redirecting to success (completed)');
    router.navigate(['/success']);
    return false;
  }

  if (interviewState === InterviewState.TERMINATED) {
    console.log('Interview Guard - Redirecting to home (terminated)');
    router.navigate(['/']);
    return false;
  }

  console.log('Interview Guard - Allowing access');
  // Allow access for IN_PROGRESS or NOT_STARTED (when transitioning to interview)
  return true;
};
