import { CommonModule } from '@angular/common';
import { Component, computed, effect, forwardRef, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AddressValue } from '../models/province.model';
import { AddressService } from '../services/address.service';

@Component({
  selector: 'app-custom-address',
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomAddress) ,
      multi: true
    }
  ],
  template: `
    <div class="text-gray-900 dark:text-gray-400 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
      <!-- Province Selector -->
      <select [disabled]="disabled()" (change)="onProvinceChange($event)" class="form-select">
        <option value="" disabled selected>-- จังหวัด --</option>
        @for (province of allProvinces(); track province.id) {
          <option [attr.value]="province.id" [selected]="province.id === selectedProvinceId()">
            {{ province.name_th }}
          </option>
        }
      </select>
      <!-- District Selector -->
      <select [disabled]="disabled() || !selectedProvinceId()" (change)="onDistrictChange($event)" class="form-select">
        <option value="" disabled selected>-- อำเภอ/เขต --</option>
        @for (district of availableDistricts(); track district.id) {
          <option [attr.value]="district.id" [selected]="district.id === selectedDistrictId()">
            {{ district.name_th }}
          </option>
        }
      </select>
      <!-- Subdistrict Selector -->
      <select [disabled]="disabled() || !selectedDistrictId()" (change)="onSubdistrictChange($event)"
              class="form-select">
        <option value="" disabled selected>-- ตำบล/แขวง --</option>
        @for (subdistrict of availableSubdistricts(); track subdistrict.id) {
          <option [attr.value]="subdistrict.id" [selected]="subdistrict.id === selectedSubdistrictId()">
            {{ subdistrict.name_th }}
          </option>
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
    /** ไปกำหนดใน styles/css เอานะ*/
    /*.form-select {
      @apply block w-full px-3 py-2 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded-md transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none disabled:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600;
    }*/`
})
export class CustomAddress implements ControlValueAccessor {
  private addressService = inject(AddressService);

  // --- Signals สำหรับเก็บข้อมูลทั้งหมดจาก JSON ---
  allProvinces = toSignal(this.addressService.getProvinces(), { initialValue: [] });
  private allDistricts = toSignal(this.addressService.getDistricts(), { initialValue: [] });
  private allSubdistricts = toSignal(this.addressService.getSubdistricts(), { initialValue: [] });

  // --- Signals สำหรับเก็บค่าที่ผู้ใช้เลือก ---
  selectedProvinceId = signal<number | null>(null);
  selectedDistrictId = signal<number | null>(null);
  selectedSubdistrictId = signal<number | null>(null);

  // --- Signal สำหรับรับค่าจาก Parent ---
  private valueFromParent = signal<AddressValue | null>(null);

  // --- Computed Signals (ทำงานอัตโนมัติ) ---
  availableDistricts = computed(() => {
    const provinceId = this.selectedProvinceId();
    const districts = this.allDistricts();
    if (!provinceId || !districts) return [];
    return districts.filter(d => d.province_id === provinceId).sort((a,b) => a.name_th.localeCompare(b.name_th));
  });

  availableSubdistricts = computed(() => {
    const districtId = this.selectedDistrictId();
    const subdistricts = this.allSubdistricts();
    if (!districtId || !subdistricts) return [];
    return subdistricts.filter(s => s.amphure_id === districtId).sort((a,b) => a.name_th.localeCompare(b.name_th));
  });

  zipCode = computed(() => {
    const subdistrictId = this.selectedSubdistrictId();
    const subdistricts = this.allSubdistricts();
    if (!subdistrictId || !subdistricts) return '';
    const subdistrict = subdistricts.find(s => s.id === subdistrictId);
    return subdistrict?.zip_code.toString() || '';
  });

  constructor() {
    // Effect นี้จะทำงานเมื่อมีค่าจาก Parent และข้อมูลพร้อม
    effect(() => {
      const value = this.valueFromParent();
      const provinces = this.allProvinces();
      const districts = this.allDistricts();
      const subdistricts = this.allSubdistricts();

      if (value && provinces.length > 0 && districts.length > 0 && subdistricts.length > 0) {
        this.selectedProvinceId.set(value.provinceId);
        this.selectedDistrictId.set(value.districtId);
        this.selectedSubdistrictId.set(value.subdistrictId);
      }
    });
  }

  // --- Implementation ของ ControlValueAccessor ---
  onChange: (value: AddressValue | null) => void = () => {};
  onTouched: () => void = () => {};
  disabled = signal(false);

  writeValue(value: AddressValue | null): void {
    this.valueFromParent.set(value);
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled.set(isDisabled); }

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

  // vvvv จุดที่แก้ไข vvvv
  private emitValue() {
    this.onTouched();
    const value: AddressValue = {
      provinceId: this.selectedProvinceId(),
      districtId: this.selectedDistrictId(),
      subdistrictId: this.selectedSubdistrictId(),
      zipCode: this.zipCode()
    };

    // ใช้ queueMicrotask เพื่อหน่วงการส่งค่ากลับไปให้ Parent
    // ทำให้การอัปเดต UI (เช่น disabled state) ใน Component นี้เสร็จสิ้นก่อน
    queueMicrotask(() => {
      if (value.provinceId && value.districtId && value.subdistrictId) {
        this.onChange(value);
      } else {
        this.onChange(null);
      }
    });
  }
}
