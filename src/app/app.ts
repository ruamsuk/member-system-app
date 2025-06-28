import { Component, effect, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ToastContainer } from './components/toast-container.component';
import { AuthService } from './services/auth.service';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog';
import { Loading } from './shared/loading';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainer, ConfirmDialogComponent, Loading],
  template: `
    <app-toast-container/>

    <div class="bg-gray-50 dark:bg-gray-900 min-h-screen">
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

  constructor() {
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
