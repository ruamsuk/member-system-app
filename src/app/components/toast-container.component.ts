import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ToastMessage, ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toast-container',
  imports: [
    NgClass
  ],
  template: `
    <!-- 1. Container หลักสำหรับจัดตำแหน่ง Toast ทั้งหมด -->
    <div class="fixed bottom-5 left-1/2 -translate-x-1/2 z-[10000] w-full max-w-sm">
      <div class="flex flex-col-reverse gap-3">

        <!-- 2. วนลูปแสดง Toast แต่ละอัน -->
        @for (message of toasts(); track message.id) {
          <div
            role="alert"
            class="relative flex w-full items-start gap-4 rounded-lg p-4 shadow-lg"
            [ngClass]="getToastClasses(message.type)">

            <!-- 3. ไอคอนตามประเภทของ Toast -->
            <span [ngClass]="getIconColor(message.type)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-6 h-6">
                <!-- Icon Path จะถูกเลือกโดยเมธอด getIconPath -->
                <path fill-rule="evenodd" [attr.d]="getIconPath(message.type)" clip-rule="evenodd"/>
              </svg>
            </span>

            <!-- 4. ส่วนของข้อความ (Summary และ Text) -->
            <div class="flex-1">
              @if (message.summary) {
                <strong class="block font-medium" [ngClass]="getTextColor(message.type, 'summary')">
                  {{ message.summary }}
                </strong>
              }
              <p class="mt-1 text-md" [ngClass]="getTextColor(message.type, 'text')">
                {{ message.text }}
              </p>
            </div>

            <!-- 5. ปุ่มปิด -->
            <button (click)="removeToast(message.id)" class="opacity-70 transition hover:opacity-100"
                    [ngClass]="getIconColor(message.type)">
              <span class="sr-only">Close</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                   stroke="currentColor" class="h-5 w-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: ``
})
export class ToastContainer {
  private toastService = inject(ToastService);

  // แปลง Observable จาก Service มาเป็น Signal เพื่อให้ Template ใช้งานได้ง่าย
  toasts = toSignal(this.toastService.getMessages(), {initialValue: []});

  removeToast(id: number) {
    this.toastService.remove(id);
  }

  // --- Helper Methods สำหรับจัดการสไตล์ ---

  getToastClasses(type: ToastMessage['type']): string {
    const baseClasses = 'dark:bg-gray-800 border';
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-50 border-green-200 dark:border-green-700`;
      case 'error':
        return `${baseClasses} bg-red-50 border-red-200 dark:border-red-700`;
      case 'warning':
        return `${baseClasses} bg-yellow-50 border-yellow-200 dark:border-yellow-700`;
      case 'info':
        return `${baseClasses} bg-blue-50 border-blue-200 dark:border-blue-700`;
    }
  }

  getIconColor(type: ToastMessage['type']): string {
    switch (type) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-500';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'info':
        return 'text-blue-600 dark:text-blue-400';
    }
  }

  getTextColor(type: ToastMessage['type'], part: 'summary' | 'text'): string {
    if (part === 'summary') {
      switch (type) {
        case 'success':
          return 'text-green-800 dark:text-green-200';
        case 'error':
          return 'text-red-800 dark:text-red-200';
        case 'warning':
          return 'text-yellow-800 dark:text-yellow-200';
        case 'info':
          return 'text-blue-800 dark:text-blue-200';
      }
    } else { // part === 'text'
      switch (type) {
        case 'success':
          return 'text-green-700 dark:text-green-300';
        case 'error':
          return 'text-red-700 dark:text-red-300';
        case 'warning':
          return 'text-yellow-700 dark:text-yellow-300';
        case 'info':
          return 'text-blue-700 dark:text-blue-300';
      }
    }
  }

  getIconPath(type: ToastMessage['type']): string {
    switch (type) {
      case 'success':
        return 'M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.06 0l4.00-5.5Z'; // Checkmark
      case 'error':
        return 'M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z'; // X Mark
      case 'warning':
        return 'M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM9.25 7.25a.75.75 0 0 1 1.5 0v4.5a.75.75 0 0 1-1.5 0v-4.5ZM10 15a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z'; // Exclamation
      case 'info':
        return 'M9.25 7.25a.75.75 0 0 1 1.5 0v4.5a.75.75 0 0 1-1.5 0v-4.5ZM10 15a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z'; // Info (same as warning for now)
    }
  }
}
