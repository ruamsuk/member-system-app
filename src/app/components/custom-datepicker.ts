import { CommonModule } from '@angular/common';
import { Component, forwardRef, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-custom-datepicker',
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomDatepicker),
      multi: true
    }
  ],
  template: `
    <div class="flex gap-2">
      <!-- Dropdown สำหรับ "วัน" -->
      <select [disabled]="disabled()" (change)="onDayChange($event)" [value]="selectedDay() || ''" class="form-select">
        <option value="" disabled>-- วัน --</option>
        @for (day of daysInMonth(); track day) {
          <option [value]="day">{{ day }}</option>
        }
      </select>

      <!-- Dropdown สำหรับ "เดือน" -->
      <select [disabled]="disabled()" (change)="onMonthChange($event)" [value]="selectedMonth() ?? ''"
              class="form-select">
        <option value="" disabled>-- เดือน --</option>
        @for (month of months; track month.value) {
          <option [value]="month.value">{{ month.name }}</option>
        }
      </select>

      <!-- Dropdown สำหรับ "ปี พ.ศ." -->
      <select [disabled]="disabled()" (change)="onYearChange($event)" [value]="selectedYear() || ''"
              class="form-select">
        <option value="" disabled>-- ปี พ.ศ. --</option>
        @for (year of yearRange; track year) {
          <option [value]="year">{{ year }}</option>
        }
      </select>
    </div>
  `,
  styles: `
    .form-select {
      @apply block w-full px-3 py-2 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded-md transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none disabled:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600;
    }`
})
export class CustomDatepicker {
// Signals สำหรับเก็บค่าที่ผู้ใช้เลือก
  selectedDay = signal<number | null>(null);
  selectedMonth = signal<number | null>(null);
  selectedYear = signal<number | null>(null);

  // Signals และข้อมูลสำหรับสร้าง Dropdowns
  daysInMonth = signal<number[]>([]);
  readonly months = [
    {value: 0, name: 'มกราคม'}, {value: 1, name: 'กุมภาพันธ์'},
    {value: 2, name: 'มีนาคม'}, {value: 3, name: 'เมษายน'},
    {value: 4, name: 'พฤษภาคม'}, {value: 5, name: 'มิถุนายน'},
    {value: 6, name: 'กรกฎาคม'}, {value: 7, name: 'สิงหาคม'},
    {value: 8, name: 'กันยายน'}, {value: 9, name: 'ตุลาคม'},
    {value: 10, name: 'พฤศจิกายน'}, {value: 11, name: 'ธันวาคม'}
  ];
  readonly yearRange: number[] = [];

  // --- Implementation ของ ControlValueAccessor ---
  onChange: (value: Date | null) => void = () => {
  };
  onTouched: () => void = () => {
  };
  disabled = signal(false);

  constructor() {
    // สร้างช่วงของปี พ.ศ. จากปีปัจจุบันย้อนหลังไป 100 ปี
    const currentYearCE = new Date().getFullYear();
    const currentYearBE = currentYearCE + 543;
    const startYearBE = currentYearBE - 100;
    for (let year = currentYearBE; year >= startYearBE; year--) {
      this.yearRange.push(year);
    }
    this.updateDaysInMonth();
  }

  writeValue(value: Date | null): void {
    if (value && !isNaN(value.getTime())) {
      this.selectedDay.set(value.getDate());
      this.selectedMonth.set(value.getMonth());
      this.selectedYear.set(value.getFullYear() + 543);
      this.updateDaysInMonth();
    } else {
      this.selectedDay.set(null);
      this.selectedMonth.set(null);
      this.selectedYear.set(null);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onDayChange(event: Event) {
    this.selectedDay.set(Number((event.target as HTMLSelectElement).value));
    this.updateValue();
  }

  onMonthChange(event: Event) {
    this.selectedMonth.set(Number((event.target as HTMLSelectElement).value));
    this.updateDaysInMonth();
    this.updateValue();
  }

  onYearChange(event: Event) {
    this.selectedYear.set(Number((event.target as HTMLSelectElement).value));
    this.updateDaysInMonth();
    this.updateValue();
  }

  private updateDaysInMonth() {
    const month = this.selectedMonth();
    const yearBE = this.selectedYear();

    if (month === null || yearBE === null) {
      const days = Array.from({length: 31}, (_, i) => i + 1);
      this.daysInMonth.set(days);
      return;
    }

    const yearCE = yearBE - 543;
    const daysInSelectedMonth = new Date(yearCE, month + 1, 0).getDate();
    const days = Array.from({length: daysInSelectedMonth}, (_, i) => i + 1);
    this.daysInMonth.set(days);

    if (this.selectedDay() && this.selectedDay()! > daysInSelectedMonth) {
      this.selectedDay.set(null);
    }
  }

  private updateValue() {
    this.onTouched();
    const day = this.selectedDay();
    const month = this.selectedMonth();
    const year = this.selectedYear();

    if (day !== null && month !== null && year !== null) {
      const christianYear = year - 543;
      const newDate = new Date(christianYear, month, day);
      this.onChange(newDate);
    } else {
      this.onChange(null);
    }
  }
}
