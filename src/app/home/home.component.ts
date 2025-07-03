import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

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

  ngOnInit(): void {
    // Check localStorage to see if the button should be disabled
    const buttonState = localStorage.getItem('interviewButtonDisabled');
    if (buttonState === 'true') {
      this.isButtonDisabled = true;
    }
  }

  startInterview(): void {
    // Disable the button
    this.isButtonDisabled = true;
    // Save state to localStorage
    localStorage.setItem('interviewButtonDisabled', 'true');
    // Enter interview mode
    this.isInterviewMode = true;
    // Start countdown
    this.startCountdown();
  }

  startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
        // You can add actions to take when countdown reaches zero
      }
    }, 1000);
  }
}
