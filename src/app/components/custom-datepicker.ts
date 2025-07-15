import { CommonModule } from '@angular/common';
import { Component, effect, forwardRef, signal, } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-custom-datepicker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomDatepicker),
      multi: true,
    },
  ],
  template: `
    <div class="flex gap-2 text-gray-900 dark:text-gray-400">
      <!-- วัน -->
      <select
        [disabled]="disabled()"
        [(ngModel)]="selectedDayValue"
        (ngModelChange)="onDaySelectChange($event)"
        class="form-select"
      >
        <option value="" disabled>-- วัน --</option>
        @for (day of daysInMonth(); track day) {
          <option [value]="day">{{ day }}</option>
        }
      </select>

      <!-- เดือน -->
      <select
        [disabled]="disabled()"
        [(ngModel)]="selectedMonthValue"
        (ngModelChange)="onMonthSelectChange($event)"
        class="form-select"
      >
        <option value="" disabled>-- เดือน --</option>
        @for (month of months; track month.value) {
          <option [value]="month.value">{{ month.name }}</option>
        }
      </select>

      <!-- ปี -->
      <select
        [disabled]="disabled()"
        [(ngModel)]="selectedYearValue"
        (ngModelChange)="onYearSelectChange($event)"
        class="form-select"
      >
        <option value="" disabled>-- ปี พ.ศ. --</option>
        @for (year of yearRange; track year) {
          <option [value]="year">{{ year }}</option>
        }
      </select>
    </div>
  `,
  styles: `
    /** ไปกำหนดใน styles/css เอานะ*/
    /*.form-select {
      @apply block w-full py-2 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded-md transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none disabled:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600;
    }*/
  `,
})
export class CustomDatepicker implements ControlValueAccessor {
  // Signals สำหรับ logic
  selectedDay = signal<number | null>(null);
  selectedMonth = signal<number | null>(null);
  selectedYear = signal<number | null>(null);

  // ngModel values สำหรับ select
  selectedDayValue = '';
  selectedMonthValue = '';
  selectedYearValue = '';

  daysInMonth = signal<number[]>([]);
  readonly months = [
    {value: 0, name: 'มกราคม'},
    {value: 1, name: 'กุมภาพันธ์'},
    {value: 2, name: 'มีนาคม'},
    {value: 3, name: 'เมษายน'},
    {value: 4, name: 'พฤษภาคม'},
    {value: 5, name: 'มิถุนายน'},
    {value: 6, name: 'กรกฎาคม'},
    {value: 7, name: 'สิงหาคม'},
    {value: 8, name: 'กันยายน'},
    {value: 9, name: 'ตุลาคม'},
    {value: 10, name: 'พฤศจิกายน'},
    {value: 11, name: 'ธันวาคม'},
  ];
  readonly yearRange: number[] = [];

  onChange: (value: Date | null) => void = () => {
  };
  onTouched: () => void = () => {
  };
  disabled = signal(false);
  private isSettingFromWriteValue = false;

  constructor() {
    const currentYearCE = new Date().getFullYear();
    const currentYearBE = currentYearCE + 543;
    for (let year = currentYearBE; year >= currentYearBE - 100; year--) {
      this.yearRange.push(year);
    }

    this.updateDaysInMonth();

    // Effect: auto update days when month/year change
    effect(() => {
      this.updateDaysInMonth();
    });
  }

  writeValue(value: any | null): void {
    console.log('✅ writeValue called with:', value);
    let dateValue: Date | null = null;

    if (value && typeof value.toDate === 'function') {
      dateValue = value.toDate();
    } else if (
      value &&
      typeof value.seconds === 'number' &&
      typeof value.nanoseconds === 'number'
    ) {
      dateValue = new Date(value.seconds * 1000);
    } else if (value instanceof Date) {
      dateValue = value;
    }

    this.isSettingFromWriteValue = true;

    if (dateValue && !isNaN(dateValue.getTime())) {
      this.selectedMonth.set(dateValue.getMonth());
      this.selectedYear.set(dateValue.getFullYear() + 543);
      this.updateDaysInMonth();

      this.selectedDay.set(dateValue.getDate());

      // sync ngModel
      this.selectedMonthValue = String(dateValue.getMonth());
      this.selectedYearValue = String(dateValue.getFullYear() + 543);
      this.selectedDayValue = String(dateValue.getDate());
    } else {
      this.selectedDay.set(null);
      this.selectedMonth.set(null);
      this.selectedYear.set(null);
      this.selectedDayValue = '';
      this.selectedMonthValue = '';
      this.selectedYearValue = '';
    }

    console.log('✅ writeValue FINAL:', {
      day: this.selectedDay(),
      month: this.selectedMonth(),
      year: this.selectedYear(),
    });

    this.isSettingFromWriteValue = false;
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

  onDaySelectChange(value: string) {
    this.selectedDay.set(Number(value));
    this.updateValue();
  }

  onMonthSelectChange(value: string) {
    this.selectedMonth.set(Number(value));
    this.updateDaysInMonth();
    this.updateValue();
  }

  onYearSelectChange(value: string) {
    this.selectedYear.set(Number(value));
    this.updateDaysInMonth();
    this.updateValue();
  }

  private updateDaysInMonth() {
    const month = this.selectedMonth();
    const yearBE = this.selectedYear();

    if (month === null || yearBE === null) {
      this.daysInMonth.set(Array.from({length: 31}, (_, i) => i + 1));
      return;
    }

    const yearCE = yearBE - 543;
    const daysInSelectedMonth = new Date(yearCE, month + 1, 0).getDate();
    const days = Array.from({length: daysInSelectedMonth}, (_, i) => i + 1);
    this.daysInMonth.set(days);

    if (
      !this.isSettingFromWriteValue &&
      this.selectedDay() &&
      this.selectedDay()! > daysInSelectedMonth
    ) {
      this.selectedDay.set(null);
      this.selectedDayValue = '';
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
