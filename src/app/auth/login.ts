import { NgClass } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoadingService } from '../services/loading.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NgClass
  ],
  template: `
    <div class="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <!-- Logo and Title -->
        <div class="text-center mb-8">
          <img src="/images/police-shield.png" alt="App Logo" class="w-16 h-16 mx-auto mb-4">
          <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-200">Member System</h1>
          <p class="text-gray-500 dark:text-gray-400">Welcome back! Please login to your account.</p>
        </div>

        <!-- Main Card -->
        <div class="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
          <!-- Google Sign-In Button -->
          <button (click)="googleSignIn()" type="button" class="w-full inline-flex justify-center items-center px-4 py-2 mb-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">
            <svg class="w-5 h-5 mr-3" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.978,36.218,44,30.608,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
            </svg>
            Sign in with Google
          </button>

          <!-- OR Divider -->
          <div class="relative flex py-2 items-center">
            <div class="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            <span class="flex-shrink mx-4 text-xs text-gray-400 dark:text-gray-500 uppercase">Or</span>
            <div class="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
          </div>

          <!-- Email/Password Form -->
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <!-- Email Input -->
            <div class="mb-4">
              <label for="email" class="form-label">Email</label>
              <input type="email" id="email" formControlName="email" class="form-input" autocomplete="email">
              @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
                <small class="form-error">Please enter a valid email.</small>
              }
            </div>

            <!-- Password Input -->
            <div class="mb-2">
              <label for="password" class="form-label">Password</label>
              <div class="relative">
                <input [type]="passwordVisible() ? 'text' : 'password'" id="password" formControlName="password" class="form-input pr-10" autocomplete="current-password">
                <button type="button" (click)="togglePasswordVisibility()" class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600">
                  @if(passwordVisible()) {
                    <!-- Eye Slash Icon (to hide) -->
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 dark:text-gray-300">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L6.228 6.228" />
                    </svg>
                  } @else {
                    <!-- Eye Icon (to show) -->
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                         viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
                         class="w-6 h-6 dark:text-gray-300">
                      <path stroke-linecap="round" stroke-linejoin="round"
                            d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12s-3.75 6.75-9.75 6.75S2.25 12 2.25 12z" />
                      <path stroke-linecap="round" stroke-linejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                </button>
              </div>
              @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
                <small class="form-error">Password is required.</small>
              }
            </div>
            <div class="text-right mb-6">
              <a routerLink="/forgot-password" class="text-sm text-blue-600 hover:underline dark:text-blue-400">Forgot Password?</a>
            </div>

            <!-- Submit Button -->
            <div class="mt-2">
              @if (loading()) {
                <button type="button"
                        class="w-full inline-flex justify-center items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500 hover:bg-indigo-400 transition ease-in-out duration-150 cursor-not-allowed"
                >
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg"
                       fill="none"
                       viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </button>
              } @else {
                <button type="submit" [disabled]="loginForm.invalid" [ngClass]="{'btn-disabled': loginForm.invalid}"
                        class="w-full inline-flex justify-center items-center px-4 py-2 font-semibold leading-6 text-lg shadow rounded-md text-white bg-indigo-500 hover:bg-indigo-400 transition ease-in-out duration-150">
                  Login
                </button>
              }
              <!--@if (loadingService.isLoading()) {
                <button type="button" class="btn-primary w-full" disabled>
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Processing...
                </button>
              } @else {
                <button type="submit" [disabled]="loginForm.invalid" class="btn-primary w-full">
                  Login
                </button>
              }-->
            </div>
          </form>

          <!-- Register Link -->
          <div class="text-center mt-6 text-sm">
            <span class="text-gray-500 dark:text-gray-400">Not a member?</span>
            <a routerLink="/register" class="font-medium text-blue-600 hover:underline dark:text-blue-400 ml-1">Register now</a>
          </div>
        </div>
      </div>
    </div>
    <!--<div class="min-h-screen bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
      <div class="bg-white dark:bg-gray-900  p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 class="text-3xl font-bold text-center text-gray-800 dark:text-gray-200 mb-8">Login</h2>

        @if (successMessage) {
          <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span class="block sm:inline">{{ successMessage }}</span>
          </div>
        }

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="mb-4">
            <label for="email" class="block text-gray-600 dark:text-gray-400 font-medium mb-2">Email</label>
            <input type="email" id="email" formControlName="email"
                   class="w-full px-4 py-2 border border-gray-300 dark:border-gray-400 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:bg-gray-950">
          </div>
          <div class="mb-6">
            <label for="password" class="block text-gray-600 dark:text-gray-400 font-medium mb-2">Password</label>
            <input type="password" id="password" formControlName="password"
                   class="w-full px-4 py-2 border border-gray-300 dark:border-gray-400 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:bg-gray-950">
          </div>

          <div class="text-right mb-6">
            <a routerLink="/forgot-password" class="text-sm text-blue-600 hover:underline">
              Forgot Password?
            </a>
          </div>

          @if (errorMessage) {
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span class="block sm:inline">{{ errorMessage }}</span>
            </div>
          }

          <div class="flex items-start justify-center">
            @if (loading()) {
              <button type="button"
                      class="w-full inline-flex justify-center items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500 hover:bg-indigo-400 transition ease-in-out duration-150 cursor-not-allowed"
              >
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg"
                     fill="none"
                     viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </button>
            } @else {
              <button type="submit" [disabled]="loginForm.invalid" [ngClass]="{'btn-disabled': loginForm.invalid}"
                      class="w-full inline-flex justify-center items-center px-4 py-2 font-semibold leading-6 text-lg shadow rounded-md text-white bg-indigo-500 hover:bg-indigo-400 transition ease-in-out duration-150">
                Login
              </button>
            }
          </div>
        </form>
        <p class="text-center mt-6 text-gray-600">
          Don't have an account?
          <a routerLink="/register" class="text-blue-600 hover:underline">Sign up here</a>
        </p>
      </div>
    </div>
  -->`,
  styles: ``
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private activatedRoute = inject(ActivatedRoute);
  public loadingService = inject(LoadingService);
  private router = inject(Router);

  loginForm: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  loading = signal(false);
  passwordVisible = signal(false)

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    // ++ ตรวจสอบ query param ตอนที่หน้าถูกโหลด ++
    this.activatedRoute.queryParams.subscribe(params => {
      if (params['verification'] === 'sent') {
        this.successMessage = 'Registration successful! A verification link has been sent to your email. Please verify before logging in.';
      }
    });
  }

  togglePasswordVisibility() {
    this.passwordVisible.update(value => !value);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }
    this.errorMessage = null;
    this.successMessage = null;

    const credentials = {
      email: this.loginForm.value.email,
      pass: this.loginForm.value.password
    };
    this.loading.set(true);

    this.authService.login(credentials)
      .then(() => {
        this.loading.set(false);
        this.toastService.show('Success', 'Login successful!', 'success');
        this.router.navigate(['/members']);
      })
      .catch(error => {
        // ++ จัดการ error ที่เราโยนมาจาก service ++
        if (error.code === 'auth/email-not-verified') {
          this.errorMessage = 'Your email is not verified. Please check your inbox for the verification link.';
        } else {
          this.errorMessage = 'Invalid email or password. Please try again.';
        }
        this.toastService.show('Error', `${this.errorMessage}`, 'error');
        console.error('Login error:', error);
        this.loading.set(false);
      });
  }

  // ในคลาสของ login.ts
  async googleSignIn(): Promise<void> {
    this.loading.set(true);

    try {
      await this.authService.signInWithGoogle()
        .then(() =>this.router.navigate(['/members'])); // เปลี่ยนเส้นทางไปยังหน้า members หลังจากล็อกอินสำเร็จ
    } catch (error) {
      console.error('Google Sign-In error:', error);
      this.toastService.show('Error', `${error}`, 'error' );
    } finally {
      this.loading.set(false);
    }
  }
}
