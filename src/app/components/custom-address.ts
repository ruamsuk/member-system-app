import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, computed, effect, inject, signal } from '@angular/core';
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
      useExisting: CustomAddress,
      multi: true
    }
  ],
  template: `
    <div class="text-gray-900 dark:text-gray-600 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
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
    @reference tailwindcss;
    .form-select {
      @apply block w-full px-3 py-2 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded-md transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none disabled:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600;
    }`
})
export class CustomAddress implements ControlValueAccessor, AfterViewInit {
  private addressService = inject(AddressService);

// --- Signals สำหรับเก็บข้อมูลทั้งหมดจาก JSON ---
  allProvinces = toSignal(this.addressService.getProvinces(), {initialValue: []});
  allDistricts = toSignal(this.addressService.getDistricts(), {initialValue: []});
  allSubdistricts = toSignal(this.addressService.getSubdistricts(), {initialValue: []});


  // --- Signals สำหรับเก็บค่าที่ผู้ใช้เลือก ---
  selectedProvinceId = signal<number | null>(null);
  selectedDistrictId = signal<number | null>(null);
  selectedSubdistrictId = signal<number | null>(null);

  disabled = signal(false);
  private valueFromParent = signal<AddressValue | null>(null);
  private viewReady = signal(false);

  // --- Computed Signals (ทำงานอัตโนมัติ) ---
  availableDistricts = computed(() => {
    const pid = this.selectedProvinceId();
    return pid ? this.allDistricts().filter(d => d.province_id === pid) : [];
  });

  availableSubdistricts = computed(() => {
    const did = this.selectedDistrictId();
    return did ? this.allSubdistricts().filter(s => s.amphure_id === did) : [];
  });

  zipCode = computed(() => {
    const sid = this.selectedSubdistrictId();
    return sid
      ? this.allSubdistricts().find(s => s.id === sid)?.zip_code.toString() ?? ''
      : '';
  });

  constructor() {
    effect(() => {
      if (!this.viewReady()) return;

      const value = this.valueFromParent();
      const provinces = this.allProvinces();
      const districts = this.allDistricts();
      const subdistricts = this.allSubdistricts();

      if (value) {
        const validProvince = provinces.find(p => p.id === value.provinceId);
        const validDistrict = districts.find(d => d.id === value.districtId && d.province_id === value.provinceId);
        const validSubdistrict = subdistricts.find(
          s =>
            s.id === value.subdistrictId &&
            s.amphure_id === value.districtId &&
            validDistrict
        );

        console.log('validProvince', validProvince);
        console.log('validDistrict', validDistrict);
        console.log('validSubdistrict', validSubdistrict);

        this.selectedProvinceId.set(validProvince?.id ?? null);
        if (validProvince && validDistrict) {
          queueMicrotask(() => {
            this.selectedDistrictId.set(validDistrict.id);
          });
        } else {
          this.selectedDistrictId.set(null);
        }
        if (validDistrict && validSubdistrict) {
          queueMicrotask(() => {
            this.selectedSubdistrictId.set(validSubdistrict.id);
          });
        } else {
          this.selectedSubdistrictId.set(null);
        }
      } else {
        this.selectedProvinceId.set(null);
        this.selectedDistrictId.set(null);
        this.selectedSubdistrictId.set(null);
      }
    });

    effect(() => {
      const current = {
        provinceId: this.selectedProvinceId(),
        districtId: this.selectedDistrictId(),
        subdistrictId: this.selectedSubdistrictId(),
        zipCode: this.zipCode() || null,
      };
      this.onChange(current);
    });
  }

  ngAfterViewInit(): void {
    this.viewReady.set(true);
  }

  // --- Implementation ของ ControlValueAccessor ---
  onChange: (_: AddressValue | null) => void = () => {
  };
  onTouched: () => void = () => {
  };

  // จุดที่แก้ไข
  writeValue(value: AddressValue | null): void {
    this.valueFromParent.set(value);

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
    if (value.provinceId && value.districtId && value.subdistrictId) {
      this.onChange(value);
    } else {
      this.onChange(null);
    }
  }
}
