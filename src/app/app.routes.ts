import { Routes } from '@angular/router';
import { authGuard } from './auth/auth-guard';

export const routes: Routes = [
  // ถ้าเข้ามาที่ path ว่างๆ ให้ redirect ไปที่ /contacts
  {path: '', redirectTo: '/members', pathMatch: 'full'},

  // หน้า Login และ Register (ทุกคนเข้าได้)
  {
    path: 'login',
    loadComponent: () => import('./auth/login').then(m => m.Login)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register').then(m => m.Register)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./auth/forgot-password').then(m => m.ForgotPassword)
  },

  // หน้า Contacts (เฉพาะคนที่ล็อกอินแล้วถึงจะเข้าได้)
  {
    path: 'members',
    loadComponent: () => import('./components/member-list')
      .then(m => m.MemberList),
    canActivate: [authGuard] // ใช้ Guard ป้องกันหน้านี้
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile').then(m => m.Profile),
    canActivate: [authGuard]
  },

  // ถ้าไม่เจอ path ไหนเลย ให้ไปที่ /contacts
  {path: '**', redirectTo: '/members'}
];
