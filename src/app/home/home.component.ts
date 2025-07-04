import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InterviewService, InterviewState } from '../services/interview.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  isButtonDisabled = false;
  countdown = 60; // 60 seconds countdown
  isInterviewMode = false;
  countdownInterval: any;

  constructor(
    private interviewService: InterviewService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if interview is completed - redirect to success
    const interviewState = this.interviewService.getInterviewState();
    if (interviewState === InterviewState.COMPLETED) {
      this.router.navigate(['/success']);
      return;
    }

    // Check localStorage to see if the button should be disabled
    this.isButtonDisabled = this.interviewService.isButtonDisabled();
  }  startInterview(): void {
    console.log('Starting interview...');

    // Disable the button and save state
    this.isButtonDisabled = true;
    localStorage.setItem('interviewButtonDisabled', 'true');

    // Set interview state to in progress
    this.interviewService.setInterviewState(InterviewState.IN_PROGRESS);
    console.log('Interview state set to:', this.interviewService.getInterviewState());

    // Navigate to interview mode
    this.router.navigate(['/interview']).then((success) => {
      console.log('Navigation success:', success);
    }).catch((error) => {
      console.error('Navigation error:', error);
    });
  }
}
