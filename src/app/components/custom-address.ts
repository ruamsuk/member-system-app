import { CommonModule } from '@angular/common';
import { Component, computed, forwardRef, inject, OnInit, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AddressValue, District, Province, Subdistrict } from '../models/province.model';
import { AddressService } from '../services/address.service';

@Component({
  selector: 'app-custom-address',
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomAddress),
      multi: true
    }
  ],
  template: `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
      <!-- Province Selector -->
      <select [disabled]="disabled()" (change)="onProvinceChange($event)" [value]="selectedProvinceId() || ''"
              class="form-select">
        <option value="" disabled>-- จังหวัด --</option>
        @for (province of allProvinces(); track province.id) {
          <option [value]="province.id">{{ province.name_th }}</option>
        }
      </select>

      <!-- District Selector -->
      <select [disabled]="disabled() || !selectedProvinceId()" (change)="onDistrictChange($event)"
              [value]="selectedDistrictId() || ''" class="form-select">
        <option value="" disabled>-- อำเภอ/เขต --</option>
        @for (district of availableDistricts(); track district.id) {
          <option [value]="district.id">{{ district.name_th }}</option>
        }
      </select>

      <!-- Subdistrict Selector -->
      <select [disabled]="disabled() || !selectedDistrictId()" (change)="onSubdistrictChange($event)"
              [value]="selectedSubdistrictId() || ''" class="form-select">
        <option value="" disabled>-- ตำบล/แขวง --</option>
        @for (subdistrict of availableSubdistricts(); track subdistrict.id) {
          <option [value]="subdistrict.id">{{ subdistrict.name_th }}</option>
        }
      </select>

      <!-- Zip Code Display -->
      <input
        type="text"
        [value]="zipCode() || ''"
        placeholder="รหัสไปรษณีย์"
        class="form-select" readonly>
    </div>
  `,
  styles: `
    .form-select {
      @apply block w-full px-3 py-2 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded-md transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none disabled:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600;
    }`
})
export class CustomAddress implements ControlValueAccessor, OnInit {
  private addressService = inject(AddressService);

  // --- Signals สำหรับเก็บข้อมูลทั้งหมดจาก JSON ---
  allProvinces = signal<Province[]>([]);
  private allDistricts = signal<District[]>([]);
  private allSubdistricts = signal<Subdistrict[]>([]);

  // --- Signals สำหรับเก็บค่าที่ผู้ใช้เลือก ---
  selectedProvinceId = signal<number | null>(null);
  selectedDistrictId = signal<number | null>(null);
  selectedSubdistrictId = signal<number | null>(null);

  // --- Computed Signals (ทำงานอัตโนมัติ) ---
  availableDistricts = computed(() => {
    const provinceId = this.selectedProvinceId();
    if (!provinceId) return [];
    return this.allDistricts().filter(d => d.province_id === provinceId).sort((a, b) => a.name_th.localeCompare(b.name_th));
  });

  availableSubdistricts = computed(() => {
    const districtId = this.selectedDistrictId();
    if (!districtId) return [];
    return this.allSubdistricts().filter(s => s.amphure_id === districtId).sort((a, b) => a.name_th.localeCompare(b.name_th));
  });

  zipCode = computed(() => {
    const subdistrictId = this.selectedSubdistrictId();
    if (!subdistrictId) return '';
    const subdistrict = this.allSubdistricts().find(s => s.id === subdistrictId);
    return subdistrict?.zip_code.toString() || '';
  });

  ngOnInit(): void {
    // โหลดข้อมูลทั้งหมดมาเก็บไว้ใน Signal ตอนเริ่มต้น
    this.addressService.getProvinces().subscribe(data => this.allProvinces.set(data.sort((a, b) => a.name_th.localeCompare(b.name_th))));
    this.addressService.getDistricts().subscribe(data => this.allDistricts.set(data));
    this.addressService.getSubdistricts().subscribe(data => this.allSubdistricts.set(data));
  }

  // --- Implementation ของ ControlValueAccessor ---
  onChange: (value: AddressValue | null) => void = () => {
  };
  onTouched: () => void = () => {
  };
  disabled = signal(false);

  writeValue(value: AddressValue | null): void {
    // ใช้ setTimeout เพื่อให้แน่ใจว่า dropdown มีข้อมูลพร้อมแล้วก่อนที่จะตั้งค่า
    setTimeout(() => {
      if (value) {
        this.selectedProvinceId.set(value.provinceId);
        this.selectedDistrictId.set(value.districtId);
        this.selectedSubdistrictId.set(value.subdistrictId);
      } else {
        this.selectedProvinceId.set(null);
        this.selectedDistrictId.set(null);
        this.selectedSubdistrictId.set(null);
      }
    }, 0);
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

  onProvinceChange(event: Event) {
    const provinceId = Number((event.target as HTMLSelectElement).value);
    this.selectedProvinceId.set(provinceId);
    this.selectedDistrictId.set(null);
    this.selectedSubdistrictId.set(null);
    this.emitValue();
  }

  onDistrictChange(event: Event) {
    const districtId = Number((event.target as HTMLSelectElement).value);
    this.selectedDistrictId.set(districtId);
    this.selectedSubdistrictId.set(null);
    this.emitValue();
  }

  onSubdistrictChange(event: Event) {
    const subdistrictId = Number((event.target as HTMLSelectElement).value);
    this.selectedSubdistrictId.set(subdistrictId);
    this.emitValue();
  }

  private emitValue() {
    this.onTouched();
    const value: AddressValue = {
      provinceId: this.selectedProvinceId(),
      districtId: this.selectedDistrictId(),
      subdistrictId: this.selectedSubdistrictId(),
      zipCode: this.zipCode()
    };
    // ส่งค่ากลับไปเมื่อทุก field ที่จำเป็นถูกเลือกแล้ว
    if (value.provinceId && value.districtId && value.subdistrictId) {
      this.onChange(value);
    } else {
      this.onChange(null); // ส่ง null ถ้ายังเลือกไม่ครบ
    }
  }
}
