import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { InterviewComponent } from './interview/interview.component';
import { SuccessComponent } from './success/success.component';
import { interviewGuard } from './guards/interview.guard';
import { successGuard } from './guards/success.guard';
import { homeGuard } from './guards/home.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    canActivate: [homeGuard]
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [homeGuard]
  },
  {
    path: 'interview',
    component: InterviewComponent,
    canActivate: [interviewGuard]
  },
  {
    path: 'success',
    component: SuccessComponent,
    canActivate: [successGuard]
  },
  { path: '**', redirectTo: '' }
];
