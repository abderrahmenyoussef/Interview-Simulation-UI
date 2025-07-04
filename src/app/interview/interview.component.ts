import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InterviewService, InterviewState, Question } from '../services/interview.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-interview',
  imports: [CommonModule],
  templateUrl: './interview.component.html',
  styleUrl: './interview.component.css'
})
export class InterviewComponent implements OnInit, OnDestroy {
  currentQuestion: Question | null = null;
  currentQuestionIndex = 0;
  totalQuestions = 4;
  isQuestionPhase = true;
  countdown = 10;
  countdownInterval: any;
  integrityCheckInterval: any;
  private subscription: Subscription = new Subscription();

  constructor(
    private interviewService: InterviewService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Ensure interview state is set to IN_PROGRESS
    if (this.interviewService.getInterviewState() !== InterviewState.IN_PROGRESS) {
      this.interviewService.setInterviewState(InterviewState.IN_PROGRESS);
    }

    this.enterFullScreen();
    this.setupVisibilityChangeListener();
    this.preventBackNavigation();
    this.startIntegrityCheck();
    this.initializeInterview();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    if (this.integrityCheckInterval) {
      clearInterval(this.integrityCheckInterval);
    }
    this.exitFullScreen();
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    event.preventDefault();
    event.returnValue = '⚠️ WARNING: Your interview will be permanently terminated if you leave this page!';
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event: PopStateEvent): void {
    this.terminateInterview('You used browser navigation (back/forward buttons).\n\nThis is not allowed during the interview.');
  }

  @HostListener('window:blur', ['$event'])
  onWindowBlur(event: FocusEvent): void {
    // Add a small delay to avoid false positives from legitimate fullscreen transitions
    setTimeout(() => {
      if (!document.hasFocus()) {
        this.terminateInterview('The interview window lost focus.\n\nThis indicates you may have switched to another application.');
      }
    }, 100);
  }

  @HostListener('document:visibilitychange', ['$event'])
  onVisibilityChange(event: Event): void {
    if (document.hidden) {
      this.terminateInterview('The interview tab became hidden.\n\nThis indicates you may have switched tabs or minimized the browser.');
    }
  }

  @HostListener('window:focus', ['$event'])
  onWindowFocus(event: FocusEvent): void {
    // If the window regains focus but we're not in fullscreen anymore, terminate
    if (!document.fullscreenElement) {
      this.terminateInterview('You exited fullscreen mode while the interview was running.\n\nThis is not allowed during the interview.');
    }
  }

  private async initializeInterview(): Promise<void> {
    await this.interviewService.initializeQuestions();
    this.startQuestionCycle();
  }

  private startQuestionCycle(): void {
    if (this.currentQuestionIndex >= this.totalQuestions) {
      this.completeInterview();
      return;
    }

    this.currentQuestion = this.interviewService.getRandomQuestion();

    if (!this.currentQuestion) {
      // Don't show additional popups - the service already handled the error
      // Use silent termination to avoid multiple popups
      this.terminateInterview('', true);
      return;
    }

    this.isQuestionPhase = true;
    this.countdown = 10;
    this.startCountdown();
  }

  private startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.countdown--;

      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);

        if (this.isQuestionPhase) {
          // Switch to thinking phase
          this.isQuestionPhase = false;
          this.countdown = 10;
          this.startCountdown();
        } else {
          // Move to next question
          this.currentQuestionIndex++;
          this.startQuestionCycle();
        }
      }
    }, 1000);
  }

  private completeInterview(): void {
    this.interviewService.setInterviewState(InterviewState.COMPLETED);
    this.router.navigate(['/success']);
  }

  private terminateInterview(reason?: string, silent?: boolean): void {
    // Only show popup if not silent and there's a reason
    if (!silent) {
      const message = reason ?
        `🚫 Interview Terminated!\n\n${reason}\n\nYour interview has been permanently terminated.\nYou will not be able to retake this interview.` :
        '🚫 Interview Terminated!\n\nSecurity violation detected.\nYour interview has been permanently terminated.\nYou will not be able to retake this interview.';

      alert(message);
    }

    this.interviewService.setInterviewState(InterviewState.TERMINATED);
    this.router.navigate(['/']);
  }

  private preventBackNavigation(): void {
    // Push a new state to prevent back navigation
    history.pushState(null, '', window.location.href);
  }

  private enterFullScreen(): void {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('Error entering fullscreen:', err);
      });
    }
  }

  private exitFullScreen(): void {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(err => {
        console.log('Error exiting fullscreen:', err);
      });
    }
  }

  private setupVisibilityChangeListener(): void {
    // Track if interview is already terminated to prevent multiple calls
    let isTerminated = false;

    const terminateOnce = (reason: string) => {
      if (!isTerminated) {
        isTerminated = true;
        this.terminateInterview(reason);
      }
    };

    // 1. Tab visibility change (switching tabs, minimizing browser)
    const visibilityChange = () => {
      if (document.hidden) {
        terminateOnce('You switched to another tab or minimized the browser window.\n\nThis is not allowed during the interview.');
      }
    };

    // 2. Window focus/blur events (Alt+Tab, clicking on other applications)
    const windowBlur = () => {
      terminateOnce('You switched to another application (Alt+Tab detected).\n\nThis is not allowed during the interview.');
    };

    // 3. Before unload (trying to close tab, refresh, navigate away)
    const beforeUnload = (event: BeforeUnloadEvent) => {
      terminateOnce('You attempted to close the browser tab or navigate away.\n\nThis is not allowed during the interview.');
      // Prevent the default behavior and show confirmation dialog
      event.preventDefault();
      event.returnValue = '⚠️ WARNING: Your interview will be permanently terminated if you leave this page!';
      return '⚠️ WARNING: Your interview will be permanently terminated if you leave this page!';
    };

    // 4. Page unload (when actually leaving the page)
    const pageUnload = () => {
      terminateOnce('You closed the browser tab or navigated away from the interview.');
    };

    // 5. Browser window resize (could indicate minimizing)
    let lastWidth = window.innerWidth;
    let lastHeight = window.innerHeight;
    const windowResize = () => {
      // If window becomes very small, it might be minimized
      if (window.innerWidth < 100 || window.innerHeight < 100) {
        terminateOnce('Browser window was minimized or resized too small.\n\nThis is not allowed during the interview.');
      }
      lastWidth = window.innerWidth;
      lastHeight = window.innerHeight;
    };

    // 6. Context menu (right-click) - could be trying to inspect element
    const contextMenu = (event: MouseEvent) => {
      event.preventDefault();
      terminateOnce('You right-clicked during the interview.\n\nThis is not allowed during the interview.');
    };

    // 7. Key combinations that could be used to cheat or leave
    const keyDown = (event: KeyboardEvent) => {
      // Prevent F12 (dev tools), Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        event.key === 'F12' ||
        (event.ctrlKey && event.shiftKey && (event.key === 'I' || event.key === 'J')) ||
        (event.ctrlKey && event.key === 'u') ||
        (event.altKey && event.key === 'Tab') // Alt+Tab
      ) {
        event.preventDefault();
        if (event.key === 'F12') {
          terminateOnce('You pressed F12 to open developer tools.\n\nThis is not allowed during the interview.');
        } else if (event.ctrlKey && event.shiftKey && (event.key === 'I' || event.key === 'J')) {
          terminateOnce('You tried to open developer tools.\n\nThis is not allowed during the interview.');
        } else if (event.ctrlKey && event.key === 'u') {
          terminateOnce('You tried to view page source.\n\nThis is not allowed during the interview.');
        } else if (event.altKey && event.key === 'Tab') {
          terminateOnce('You pressed Alt+Tab to switch applications.\n\nThis is not allowed during the interview.');
        }
      }
    };

    // Add all event listeners
    document.addEventListener('visibilitychange', visibilityChange);
    window.addEventListener('blur', windowBlur);
    window.addEventListener('beforeunload', beforeUnload);
    window.addEventListener('unload', pageUnload);
    window.addEventListener('resize', windowResize);
    document.addEventListener('contextmenu', contextMenu);
    document.addEventListener('keydown', keyDown);

    // Cleanup all listeners on component destroy
    this.subscription.add(() => {
      document.removeEventListener('visibilitychange', visibilityChange);
      window.removeEventListener('blur', windowBlur);
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('unload', pageUnload);
      window.removeEventListener('resize', windowResize);
      document.removeEventListener('contextmenu', contextMenu);
      document.removeEventListener('keydown', keyDown);
    });
  }

  private startIntegrityCheck(): void {
    // Check every 500ms if the interview environment is still secure
    this.integrityCheckInterval = setInterval(() => {
      // Check if still in fullscreen
      if (!document.fullscreenElement) {
        console.log('Fullscreen exited, terminating interview');
        this.terminateInterview('You exited fullscreen mode (ESC key pressed).\n\nThis is not allowed during the interview.');
        return;
      }

      // Check if window has focus
      if (!document.hasFocus()) {
        console.log('Window lost focus, terminating interview');
        this.terminateInterview('The interview window lost focus.\n\nThis indicates you may have switched applications.');
        return;
      }

      // Check if document is hidden
      if (document.hidden) {
        console.log('Document hidden, terminating interview');
        this.terminateInterview('The interview tab became hidden.\n\nThis indicates you may have switched tabs or minimized the window.');
        return;
      }

      // Check window size (might indicate minimizing)
      if (window.innerWidth < 200 || window.innerHeight < 200) {
        console.log('Window too small, terminating interview');
        this.terminateInterview('The interview window became too small.\n\nThis indicates the window may have been minimized.');
        return;
      }
    }, 500);
  }
}
