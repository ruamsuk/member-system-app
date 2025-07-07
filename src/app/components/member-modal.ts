import {
  Component,
  computed,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  signal,
  SimpleChanges
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Member } from '../models/member.model';
import { AddressService } from '../services/address.service';
import { CountAgeService } from '../services/count-age.service';
import { CustomDatepicker } from './custom-datepicker';

@Component({
  selector: 'app-member-modal',
  imports: [
    ReactiveFormsModule,
    CustomDatepicker
  ],
  template: `
    @if (isOpen) {
      <div (click)="onClose()" class="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
        <div (click)="$event.stopPropagation()"
             class="bg-white p-6 md:p-8 rounded-xl shadow-2xl z-50 w-full max-w-3xl mx-auto max-h-[90vh] overflow-y-auto dark:bg-gray-800">

          <!-- +++ FORM MODE (Add/Edit) +++ -->
          <div>
            <h2 class="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-6">
              {{ isEditing() ? 'แก้ไขข้อมูลสมาชิก' : 'เพิ่มข้อมูลสมาชิกใหม่' }}
            </h2>
            <form [formGroup]="memberForm" (ngSubmit)="onFormSubmit()">
              <div class="flex flex-col items-center mb-6">
                <div class="relative">
                  <img class="h-24 w-24 rounded-full object-cover ring-4 ring-blue-200"
                       [src]="imagePreviewUrl() || 'https://i.pravatar.cc/150?u=new_contact'"
                       alt="Member Picture Preview">
                  <button type="button" (click)="fileInput.click()"
                          class="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-md hover:bg-gray-100 transition duration-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                          title="Change member picture">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                         class="w-5 h-5 text-gray-700 dark:text-gray-200">
                      <path
                        d="m2.695 14.762-1.262 3.155a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.886L17.5 5.501a2.121 2.121 0 0 0-3-3L3.58 13.42a4 4 0 0 0-.886 1.343Z"/>
                    </svg>
                  </button>
                </div>
                <input #fileInput id="member-image-upload" type="file" class="hidden"
                       (change)="onMemberImageSelected($event)" accept="image/png, image/jpeg">
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <!-- Column 1 -->
                <div>
                  <div class="mb-4">
                    <label class="form-label">ยศ</label>
                    <select formControlName="rank" class="form-input"
                            [class.text-gray-400]="!memberForm.get('rank')?.value">
                      <option value="" disabled>-- ไม่ระบุยศ --</option>
                      @for (rank of rankOptions; track rank) {
                        <option [value]="rank">{{ rank }}</option>
                      }
                    </select>
                  </div>
                  <div class="mb-4">
                    <label class="form-label">ชื่อ</label>
                    <input type="text" formControlName="firstname"
                           class="form-input">
                  </div>

                  <div class="mb-4">
                    <label class="form-label">นามสกุล</label>
                    <input type="text" formControlName="lastname"
                           class="form-input">
                  </div>

                  <div class="mb-4">
                    <label class="form-label">โทรศัพท์</label>
                    <input type="tel" formControlName="phone"
                           class="form-input">
                  </div>

                </div>
                <!-- Column 2 -->
                <div>
                  <div class="mb-4">
                    <label class="form-label">สถานะ</label>
                    <select formControlName="alive" class="form-input"
                            [class.text-gray-400]="!memberForm.get('alive')?.value">
                      <option value="" disabled>-- เลือกสถานะ --</option>
                      <option value="ยังมีชีวิตอยู่">ยังมีชีวิตอยู่</option>
                      <option value="เสียชีวิตแล้ว">เสียชีวิตแล้ว</option>
                    </select>
                  </div>
                  <div class="mb-4"><label class="form-label">วัน/เดือน/ปีเกิด</label>
                    <app-custom-datepicker formControlName="birthdate"></app-custom-datepicker>
                  </div>
                  <div class="mb-4"><label class="form-label">ที่อยู่ (เลขที่, ถนน)</label><input type="text"
                                                                                                  formControlName="addressLine1"
                                                                                                  class="form-input">
                  </div>
                  <div class="mb-4"><label class="form-label">จังหวัด/อำเภอ/ตำบล</label>
                    <app-custom-address formControlName="addressObject"></app-custom-address>
                  </div>
                </div>
              </div>
              <div class="flex items-center justify-end gap-4 mt-8 pt-6 border-t dark:border-gray-700">
                <button type="button" (click)="onClose()" class="btn-secondary">Cancel</button>
                <button type="submit" [disabled]="memberForm.invalid" class="btn-primary">
                  {{ isEditing() ? 'Update Member' : 'Save Member' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `,
  styles: [ /* ... styles ... */]
})
export class MemberModal implements OnChanges {
  private memberToEditSignal = signal<Member | null>(null);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private addressService = inject(AddressService);
  public countAgeService = inject(CountAgeService);

  // --- Inputs & Outputs ---
  @Input() isOpen: boolean = false;
  @Input() memberToEdit: Member | null = null;
  @Input() initialMode: 'view' | 'form' = 'form';
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ memberData: any, file: File | null }>();

  // --- Component State ---
  mode = signal<'view' | 'form'>('form');
  isEditing = computed(() => !!this.memberToEdit);
  memberForm!: FormGroup;
  selectedFile = signal<File | null>(null);
  imagePreviewUrl = signal<string | null>(null);
  public readonly rankOptions = ['น.อ.ร.', 'ร.ต.อ.', 'พ.ต.ต.', 'พ.ต.ท.', 'พ.ต.อ.'];

  // --- Data for Address ---
  private allProvinces = toSignal(this.addressService.getProvinces());
  private allDistricts = toSignal(this.addressService.getDistricts());
  private allSubdistricts = toSignal(this.addressService.getSubdistricts());

  // +++ Computed Signal ใหม่สำหรับแสดงที่อยู่ +++
  fullAddress = computed(() => {
    // const address = this.memberToEdit?.address;
    const member = this.memberToEditSignal();
    const provinces = this.allProvinces();
    const districts = this.allDistricts();
    const subdistricts = this.allSubdistricts();
    console.log(JSON.stringify(member, null, 2));
    console.log(JSON.stringify(member?.address?.addressObject, null, 2));

    // 1. ตรวจสอบว่า "พจนานุกรม" ที่อยู่พร้อมใช้งานหรือยัง
    if (!provinces || !districts || !subdistricts || provinces.length === 0) {
      return 'กำลังโหลดข้อมูลที่อยู่...'; // แสดงสถานะ Loading
    }
    if (!member || !member.address?.addressObject) {
      return member?.address?.line1 || 'ไม่มีข้อมูลที่อยู่';
    }

    // 3. ถ้าทุกอย่างพร้อม ก็ทำการค้นหาและต่อข้อความ
    const line1 = member.address?.line1;
    const addressObject = member.address?.addressObject;
    // แปลง ID เป็นตัวเลขก่อนเปรียบเทียบ เพื่อให้แน่ใจว่าชนิดข้อมูลตรงกัน
    const province = provinces.find(p => p.id === Number(addressObject.provinceId))?.name_th || '';
    const district = districts.find(d => d.id === Number(addressObject.districtId))?.name_th || '';
    const subdistrict = subdistricts.find(s => s.id === Number(addressObject.subdistrictId))?.name_th || '';
    return `${line1 || ''} ${subdistrict} ${district} ${province} ${addressObject.zipCode || ''}`.trim();
  });

  constructor() {
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['memberToEdit']) {
      this.memberToEditSignal.set(this.memberToEdit);
      console.log('Member to edit changed:', JSON.stringify(this.memberToEdit, null, 2));
    }
    if (changes['isOpen'] && this.isOpen) {
      this.mode.set(this.initialMode);
      this.isEditing() ? this.initializeForm(this.memberToEdit) : this.initializeForm();
      this.imagePreviewUrl.set(this.memberToEdit?.photoURL || null);
      this.selectedFile.set(null);
    }
    // Wait for address data, then patch addressObject again
    setTimeout(() => {
      if (this.memberToEdit?.address?.addressObject) {
        this.memberForm.get('addressObject')?.setValue(this.memberToEdit.address.addressObject, {emitEvent: false});
      }
    }, 10);
  }

  private initializeForm(member: Member | null = null): void {
    this.memberForm = this.fb.group({
      rank: [member?.rank || ''],
      firstname: [member?.firstname || '', Validators.required],
      lastname: [member?.lastname || '', Validators.required],
      phone: [member?.phone || ''],
      birthdate: [member?.birthdate || null],
      alive: [member?.alive || 'ยังมีชีวิตอยู่', Validators.required],
      addressLine1: [member?.address?.line1 || ''],
      addressObject: [member?.address?.addressObject || null],
      photoURL: [member?.photoURL || '']
    });

    const aliveControl = this.memberForm.get('alive');
    const birthdateControl = this.memberForm.get('birthdate');
    const addressObjectControl = this.memberForm.get('addressObject');

    if (aliveControl && birthdateControl && addressObjectControl) {
      aliveControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(status => {
        const controlsToValidate = [birthdateControl, addressObjectControl];
        if (status === 'เสียชีวิตแล้ว') {
          controlsToValidate.forEach(control => control.clearValidators());
        } else {
          controlsToValidate.forEach(control => control.setValidators(Validators.required));
        }
        controlsToValidate.forEach(control => control.updateValueAndValidity());
      });
      if (member) {
        aliveControl.patchValue(member.alive, {emitEvent: true});
      } else {
        aliveControl.patchValue('ยังมีชีวิตอยู่', {emitEvent: true});
      }
    }
  }

  onMemberImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile.set(file);
      this.imagePreviewUrl.set(URL.createObjectURL(file));
    }
  }

  switchToEditMode(): void {
    this.mode.set('form');
    this.initializeForm(this.memberToEdit);

    // Patch addressObject after form initialization
    setTimeout(() => {
      if (this.memberToEdit?.address?.addressObject) {
        this.memberForm.get('addressObject')?.setValue(this.memberToEdit.address.addressObject, {emitEvent: false});
      }
    }, 10);
  }

  onClose(): void {
    this.memberForm.reset();
    this.close.emit();
  }

  onFormSubmit(): void {
    if (this.memberForm.invalid) {
      this.memberForm.markAllAsTouched();
      return;
    }
    const {addressLine1, addressObject, ...restOfForm} = this.memberForm.value;
    const memberData = {
      ...restOfForm,
      address: {
        line1: addressLine1,
        addressObject: addressObject
      }
    };
    this.save.emit({memberData, file: this.selectedFile()});
  }
}
