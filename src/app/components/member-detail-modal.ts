import { Component, computed, EventEmitter, inject, Input, Output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Member } from '../models/member.model';
import { ThaiDatePipe } from '../pipe/thai-date.pipe';
import { AddressService } from '../services/address.service';
import { CountAgeService } from '../services/count-age.service';

@Component({
  selector: 'app-member-detail-modal',
  imports: [
    ThaiDatePipe
  ],
  template: `
    @if (isOpen && member) {
      <div (click)="onClose()" class="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
        <div (click)="$event.stopPropagation()"
             class="bg-white p-6 md:p-8 rounded-xl shadow-2xl z-50 w-full max-w-xl mx-auto dark:bg-gray-800">
          <h2 class="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-6">รายละเอียดสมาชิก</h2>
          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <img class="h-32 w-32 rounded-full object-cover ring-4 ring-blue-200"
                 [src]="member.photoURL || 'https://i.pravatar.cc/150?u=' + member.id" alt="Member Avatar">
            <div class="flex-1 text-center sm:text-left">
              <p
                class="text-xl font-bold text-gray-800 dark:text-gray-200">{{ member.rank || '' }} {{ member.firstname }} {{ member.lastname }}</p>
              <p class="text-md font-semibold mt-1"
                 [class.text-gray-500]="member.alive === 'เสียชีวิตแล้ว'"
                 [class.dark:text-gray-400]="member.alive === 'เสียชีวิตแล้ว'"
                 [class.text-green-600]="member.alive !== 'เสียชีวิตแล้ว'"
                 [class.dark:text-green-400]="member.alive !== 'เสียชีวิตแล้ว'">
                {{ member.alive }}
              </p>
              <div class="mt-4 text-sm space-y-1">
                <p class="text-gray-600 dark:text-gray-300"><strong
                  class="font-semibold text-gray-700 dark:text-gray-200">โทรศัพท์:</strong> {{ member.phone || '-' }}
                </p>
                <p class="text-gray-600 dark:text-gray-300"><strong
                  class="font-semibold text-gray-700 dark:text-gray-200">วันเกิด:</strong> {{ member.birthdate | thaiDate:'fullMonth' }}
                </p>
                <p class="text-gray-600 dark:text-gray-300"><strong
                  class="font-semibold text-gray-700 dark:text-gray-200">อายุ:</strong> {{ countAgeService.getAge(member.birthdate) }}
                </p>
                <p class="text-gray-600 dark:text-gray-300"><strong
                  class="font-semibold text-gray-700 dark:text-gray-200">ที่อยู่:</strong> {{ fullAddress() }}</p>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-end gap-4 mt-8 pt-6 border-t dark:border-gray-700">
            <button type="button" (click)="onClose()" class="btn-secondary">Close</button>
            <button type="button" (click)="onRequestEdit()" class="btn-primary">Edit Details</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: ``
})
export class MemberDetailModal {
  private addressService = inject(AddressService);
  public countAgeService = inject(CountAgeService);

  @Input() isOpen: boolean = false;
  @Input() member: Member | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() editRequest = new EventEmitter<Member>();

  private allProvinces = toSignal(this.addressService.getProvinces());
  private allDistricts = toSignal(this.addressService.getDistricts());
  private allSubdistricts = toSignal(this.addressService.getSubdistricts());

  fullAddress = computed(() => {
    const address = this.member?.address;
    const provinces = this.allProvinces();
    const districts = this.allDistricts();
    const subdistricts = this.allSubdistricts();

    if (!provinces || !districts || !subdistricts || provinces.length === 0) {
      return 'กำลังโหลดข้อมูลที่อยู่...';
    }
    if (!address || !address.addressObject) {
      return address?.line1 || 'ไม่มีข้อมูลที่อยู่';
    }

    const {line1, addressObject} = address;
    const province = provinces.find(p => p.id === addressObject.provinceId)?.name_th || '';
    const district = districts.find(d => d.id === addressObject.districtId)?.name_th || '';
    const subdistrict = subdistricts.find(s => s.id === addressObject.subdistrictId)?.name_th || '';
    return `${line1 || ''} ${subdistrict} ${district} ${province} ${addressObject.zipCode || ''}`.trim();
  });

  onClose(): void {
    this.close.emit();
  }

  onRequestEdit(): void {
    if (this.member) {
      this.editRequest.emit(this.member);
    }
  }

}
