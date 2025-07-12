import { Component, effect, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ToastContainer } from './components/toast-container.component';
import { AuthService } from './services/auth.service';
import { LoadingService } from './services/loading.service';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog';
import { Loading } from './shared/loading';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainer, ConfirmDialogComponent, Loading, RouterLink],
  template: `
    <app-toast-container/>
    <header class="bg-white shadow-md dark:bg-gray-800 dark:border-b dark:border-gray-700">
      <nav class="container mx-auto px-4 md:px-8 py-3 flex justify-between items-center">
        <div class="flex items-center gap-2">
          <img src="/images/police-shield.png" alt="logo">
          <!--📞 ContactApp -->
          <span class="text-2xl text-gray-700 font-semibold  dark:text-gray-300 font-thasadith">ชมรม นอร.๒๕</span>
        </div>

        <div class="flex items-center gap-2 md:gap-4">
          <button (click)="toggleTheme()"
                  class="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  title="Toggle theme">
            @if (isDarkMode()) {
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                   class="w-6 h-6 text-yellow-400">
                <path fill-rule="evenodd"
                      d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5h2.25a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.894 17.834a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM3 12a.75.75 0 0 1-.75.75H.75a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 3 12ZM6.166 6.106a.75.75 0 0 0-1.06 1.06l1.59 1.591a.75.75 0 1 0 1.06-1.06l-1.59-1.591Z"/>
              </svg>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                   stroke="currentColor" class="w-6 h-6 text-gray-700">
                <path stroke-linecap="round" stroke-linejoin="round"
                      d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"/>
              </svg>

            }
          </button>

          @if (authService.currentUser()) {
            <div class="flex items-center gap-2">
              <a routerLink="/profile"
                 class="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                 title="Go to profile">
                <span>Welcome, {{ authService.currentUser()?.displayName || authService.currentUser()?.email }}</span>
                <img class="h-8 w-8 rounded-full object-cover"
                     [src]="authService.currentUser()?.photoURL || 'https://i.pravatar.cc/150?u=default'"
                     alt="My Profile Picture">
              </a>
              <button (click)="logout()"
                      class="bg-red-500 text-white text-sm font-bold py-2 px-3 rounded-lg hover:bg-red-600 transition">
                Logout
              </button>
            </div>
          }
        </div>
      </nav>
    </header>
    <div class="bg-gray-150 dark:bg-gray-900 min-h-screen">
      <router-outlet/>
    </div>

    <app-confirm-dialog/>
    <app-loading/>
  `,
  styles: [],
})
export class App {
  public authService = inject(AuthService);
  public router = inject(Router);

  // 1. สร้าง signal เพื่อเก็บสถานะ dark mode
  isDarkMode = signal<boolean>(this.getInitialTheme());

  @HostListener('window:mousemove')
  @HostListener('window:keydown')
  resetTimer() {
    this.authService.resetTimer();
  }

  constructor(private loadingService: LoadingService,) {
    // 2. สร้าง effect ที่จะทำงานทุกครั้งที่ isDarkMode เปลี่ยนแปลง
    effect(() => {
      const isDark = this.isDarkMode();
      // 2.1 บันทึกค่าล่าสุดลง localStorage
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      // 2.2 เพิ่ม/ลบ คลาส 'dark' ที่ <html> tag
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
  }

  // 3. เมธอดสำหรับสลับ theme
  toggleTheme(): void {
    this.isDarkMode.update(value => !value);
  }

  // 4. เมธอดสำหรับอ่านค่า theme เริ่มต้นจาก localStorage
  private getInitialTheme(): boolean {
    if (typeof window !== 'undefined') {
      // เช็คค่าที่เคยบันทึกไว้
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      // ถ้าไม่มี, ให้ใช้ค่าเริ่มต้นตาม theme ของ OS
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false; // ค่า default ถ้าทำงานบน server
  }

  logout(): void {
    this.authService.logout().then(() => {
      this.router.navigate(['/login']);
    });
  }

}
