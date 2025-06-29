import { NgClass } from '@angular/common';
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Member } from '../models/member.model';
import { ThaiDatePipe } from '../pipe/thai-date.pipe';
import { AuthService } from '../services/auth.service';
import { CountAgeService } from '../services/count-age.service';
import { LoadingService } from '../services/loading.service';
import { MembersService } from '../services/members.service';
import { DialogService } from '../shared/services/dialog';
import { CustomAddress } from './custom-address';
import { CustomDatepicker } from './custom-datepicker';

@Component({
  selector: 'app-member-list',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CustomAddress,
    CustomDatepicker,
    ThaiDatePipe,
    NgClass
  ],
  template: `
    <main class="container mx-auto p-4 md:p-8">
      <!-- ==================== HEADER และปุ่มเพิ่มสมาชิก ==================== -->
      <div class="flex justify-between items-center mb-10">
        <h1 class="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-200">รายชื่อสมาชิกชมรม</h1>
        <!-- ปุ่มจะใช้งานได้เฉพาะ Admin -->
        @if (authService.currentUser()?.role === 'admin') {
          <button (click)="openAddModal()"
                  class="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 shadow-md">
            + เพิ่มสมาชิกใหม่
          </button>
        }
      </div>

      <!-- ==================== ส่วนค้นหาและจัดเรียง ==================== -->
      <div class="mb-6 p-4 bg-white rounded-xl shadow-md dark:bg-gray-800">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Search Input -->
          <div class="md:col-span-2">
            <label for="search"
                   class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ค้นหาสมาชิก</label>
            <div class="relative">
              <input type="text" id="search" placeholder="ค้นหาจากชื่อ, นามสกุล, สถานะ..."
                     class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                     [(ngModel)]="searchTerm">
              @if (searchTerm()) {
                <button (click)="clearSearch()"
                        class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                        title="Clear search">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                       stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              }
            </div>
          </div>
          <!-- Sort Buttons -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">จัดเรียงตามชื่อ</label>
            <div class="flex gap-2">
              <button (click)="setSort('asc')" class="w-full py-2 px-4 rounded-lg text-sm"
                      [class.bg-blue-600]="sortDirection() === 'asc'" [class.text-white]="sortDirection() === 'asc'"
                      [class.bg-gray-200]="sortDirection() !== 'asc'"
                      [class.dark:bg-gray-700]="sortDirection() !== 'asc'">A-Z ↓
              </button>
              <button (click)="setSort('desc')" class="w-full py-2 px-4 rounded-lg text-sm"
                      [class.bg-blue-600]="sortDirection() === 'desc'" [class.text-white]="sortDirection() === 'desc'"
                      [class.bg-gray-200]="sortDirection() !== 'desc'"
                      [class.dark:bg-gray-700]="sortDirection() !== 'desc'">Z-A ↑
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== ส่วนแสดงผลหลัก (Loading หรือ List) ==================== -->
      <div class="mt-6">
        <!-- เราจะลบ @if (loadingService.isLoading()) ออกไป และแสดงผล list โดยตรง -->
        <!-- Global Spinner ที่อยู่ใน app.ts จะทำงานแทน -->

        <!-- Member List (Card Layout) -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (member of paginatedMembers(); track member.id) {
            <div class="bg-white rounded-xl shadow-lg transition-transform hover:scale-105 dark:bg-gray-800"
                 [class.bg-gray-50]="member.alive === 'เสียชีวิตแล้ว'"
                 [ngClass]="{'dark:bg-gray-800/50': member.alive === 'เสียชีวิตแล้ว'}">
              <!-- Member Card Header -->
              <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start">
                <div class="flex items-center gap-4">
                  <img class="h-14 w-14 rounded-full object-cover ring-2 ring-blue-300 dark:ring-blue-500"
                       [src]="member.photoURL || 'https://i.pravatar.cc/150?u=' + member.id" alt="Member Avatar">
                  <div>
                    <p
                      class="font-bold text-lg text-gray-800 dark:text-gray-200">{{ member.rank }}{{ member.firstname }} {{ member.lastname }}</p>
                    <p
                      class="text-sm font-semibold"
                      [class.text-gray-500]="member.alive === 'เสียชีวิตแล้ว'"
                      [class.dark:text-gray-400]="member.alive === 'เสียชีวิตแล้ว'"
                      [class.text-green-600]="member.alive !== 'เสียชีวิตแล้ว'"
                      [class.dark:text-green-400]="member.alive !== 'เสียชีวิตแล้ว'">
                      {{ member.alive }}
                    </p>
                  </div>
                </div>
              </div>
              <!-- Member Card Body -->
              <div class="p-4 text-sm text-gray-600 dark:text-gray-300">
                <p><strong>วันเกิด:</strong> {{ member.birthdate | thaiDate:'fullMonth' }}</p>
                <p><strong>อายุ:</strong> {{ countAgeService.getAge(member.birthdate) }}</p>
                <!-- อาจจะแสดงที่อยู่โดยย่อที่นี่ -->
              </div>
              <!-- Member Card Actions -->
              <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex justify-end gap-2">
                <button class="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                        title="ดูรายละเอียด">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                    <path fill-rule="evenodd"
                          d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                          clip-rule="evenodd"/>
                  </svg>
                </button>
                @if (authService.currentUser()?.role === 'admin') {
                  <button (click)="openEditModal(member)"
                          class="p-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400"
                          title="แก้ไข">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                      <path
                        d="m2.695 14.762-1.262 3.155a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.886L17.5 5.501a2.121 2.121 0 0 0-3-3L3.58 13.42a4 4 0 0 0-.886 1.343Z"/>
                    </svg>
                  </button>
                  <button (click)="onDelete(member)"
                          class="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                          title="ลบ">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                      <path fill-rule="evenodd"
                            d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.33l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193v-.443A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm3.44 0a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                            clip-rule="evenodd"/>
                    </svg>
                  </button>
                }
              </div>
            </div>
          } @empty {
            <div class="bg-white p-8 rounded-xl shadow-lg text-center dark:bg-gray-800">
              <p class="text-gray-500 dark:text-gray-400">ไม่พบข้อมูลสมาชิก</p>
            </div>
          }
        </div>

        <!-- Paginator UI -->
        @if (totalPages() > 1) {
          <div class="mt-8 flex justify-center items-center gap-4">
            <button (click)="previousPage()" [disabled]="currentPage() === 1"
                    class="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600">
              Previous
            </button>
            <span class="text-sm text-gray-700 dark:text-gray-300">Page {{ currentPage() }} of {{ totalPages() }}</span>
            <button (click)="nextPage()" [disabled]="currentPage() === totalPages()"
                    class="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600">
              Next
            </button>
          </div>
        }
      </div>
    </main>

    <!-- ==================== ADD/EDIT MODAL ==================== -->
    @if (isModalOpen()) {
      <div (click)="closeModal()" class="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
        <div (click)="$event.stopPropagation()"
             class="bg-white p-6 md:p-8 rounded-xl shadow-2xl z-50 w-full max-w-3xl mx-auto max-h-[90vh] overflow-y-auto dark:bg-gray-800">
          <h2 class="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-6">
            {{ isEditing() ? 'แก้ไขข้อมูลสมาชิก' : 'เพิ่มข้อมูลสมาชิกใหม่' }}
          </h2>
          <form [formGroup]="memberForm" (ngSubmit)="onSubmit()">
            <!-- แก้ไข Grid ให้เป็น Responsive -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <!-- Column 1 -->
              <div>
                <div class="mb-4">
                  <label class="form-label">ยศ</label>
                  <!-- แก้ไข Rank Input เป็น Select -->
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
                  <input type="text" formControlName="firstname" class="form-input">
                </div>
                <div class="mb-4">
                  <label class="form-label">นามสกุล</label>
                  <input type="text" formControlName="lastname" class="form-input">
                </div>
                <div class="mb-4">
                  <label class="form-label">วัน/เดือน/ปีเกิด</label>
                  <app-custom-datepicker formControlName="birthdate"></app-custom-datepicker>
                </div>
                <div class="mb-4">
                  <label class="form-label">สถานะ</label>
                  <!-- แก้ไข Alive Select ให้มี Placeholder -->
                  <select formControlName="alive" class="form-input"
                          [class.text-gray-400]="!memberForm.get('alive')?.value">
                    <option value="" disabled>-- เลือกสถานะ --</option>
                    <option value="ยังมีชีวิตอยู่">ยังมีชีวิตอยู่</option>
                    <option value="เสียชีวิตแล้ว">เสียชีวิตแล้ว</option>
                  </select>
                </div>
              </div>
              <!-- Column 2 -->
              <div>
                <div class="mb-4">
                  <label class="form-label">ที่อยู่</label>
                  <app-custom-address formControlName="address"></app-custom-address>
                </div>
                <!-- สามารถเพิ่มฟอร์มอื่นๆ ที่นี่ -->
                <div class="mb-4">
                  <label class="form-label">โทรศีพท์</label>
                  <input type="text" formControlName="phone" class="form-input">

                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center justify-end gap-4 mt-8 pt-6 border-t dark:border-gray-700">
              <button type="button" (click)="closeModal()" class="btn-secondary">Cancel</button>
              <button type="submit" [disabled]="memberForm.invalid" class="btn-primary">
                {{ isEditing() ? 'Update Member' : 'Save Member' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: `
  `
})
export class MemberList implements OnInit {
  // --- Service Injection ---
  private membersService = inject(MembersService);
  public authService = inject(AuthService); // public เพื่อให้ template เรียกใช้ได้
  private dialogService = inject(DialogService);
  private loadingService = inject(LoadingService);
  private fb = inject(FormBuilder);
  public countAgeService = inject(CountAgeService);

  // --- Options ---
  public readonly rankOptions = ['น.อ.ร.', 'ร.ต.อ.', 'พ.ต.ต.', 'พ.ต.ท.', 'พ.ต.อ.'];


  // --- State Signals ---
  private members = toSignal(this.membersService.getMembers(), {initialValue: []});
  searchTerm = signal('');
  sortDirection = signal<'asc' | 'desc' | 'none'>('none');
  currentPage = signal(1);
  itemsPerPage = signal(8); // แสดง 8 card ต่อหน้า

  // --- Modal State ---
  isModalOpen = signal(false);
  selectedMember = signal<Member | null>(null);
  isEditing = computed(() => !!this.selectedMember());
  memberForm!: FormGroup;

  // --- Computed Signals for Display ---
  filteredAndSortedMembers = computed(() => {
    // จุดที่แก้ไข
    // this.loadingService.show(); // <-- ลบออก
    const term = this.searchTerm().toLowerCase();
    const direction = this.sortDirection();
    let membersToShow = [...this.members()];

    if (term) {
      membersToShow = membersToShow.filter(m =>
        (m.firstname || '').toLowerCase().includes(term) ||
        (m.lastname || '').toLowerCase().includes(term) ||
        (m.alive || '').toLowerCase().includes(term)
      );
    }
    if (direction === 'asc') {
      membersToShow.sort((a, b) => (a.firstname || '').localeCompare(b.firstname || ''));
    } else if (direction === 'desc') {
      membersToShow.sort((a, b) => (b.firstname || '').localeCompare(a.firstname || ''));
    }
    // this.loadingService.hide(); // <-- ลบออก
    return membersToShow;
  });

  paginatedMembers = computed(() => {
    const fullList = this.filteredAndSortedMembers();
    const page = this.currentPage();
    const perPage = this.itemsPerPage();
    const startIndex = (page - 1) * perPage;
    return fullList.slice(startIndex, startIndex + perPage);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredAndSortedMembers().length / this.itemsPerPage());
  });

  constructor() {
    this.loadingService.show();
    effect(() => {
      const currentMembers = this.members();
      if (currentMembers !== undefined) {
        this.loadingService.hide();
      }
    });
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(member: Member | null = null): void {
    this.memberForm = this.fb.group({
      rank: [member?.rank || ''],
      firstname: [member?.firstname || '', Validators.required],
      lastname: [member?.lastname || '', Validators.required],
      birthdate: [member?.birthdate || null, Validators.required],
      alive: [member?.alive || 'ยังมีชีวิตอยู่', Validators.required],
      address: [member?.address || null, Validators.required],
      phone: [member?.phone || null],
      photoURL: [member?.photoURL || '']
    });
  }

  // --- UI Action Methods ---
  openAddModal(): void {
    this.selectedMember.set(null);
    this.initializeForm();
    this.isModalOpen.set(true);
  }

  openEditModal(member: Member): void {
    this.selectedMember.set(member);
    this.initializeForm(member);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  async onDelete(member: Member): Promise<void> {
    const confirmed = await this.dialogService.open({
      title: 'ยืนยันการลบข้อมูล',
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลของ <strong>${member.rank}${member.firstname} ${member.lastname}</strong>?`
    });
    if (confirmed && member.id) {
      this.loadingService.show();
      try {
        await this.membersService.deleteMember(member.id);
      } catch (err) {
        console.error('Error deleting member:', err);
      } finally {
        this.loadingService.hide();
      }
    }
  }

  // --- Form Submission ---
  async onSubmit(): Promise<void> {
    if (this.memberForm.invalid) return;
    this.loadingService.show();

    const formValue = this.memberForm.value;
    try {
      if (this.isEditing() && this.selectedMember()) {
        const updatedMember = {...this.selectedMember()!, ...formValue};
        await this.membersService.updateMember(updatedMember);
      } else {
        await this.membersService.addMember(formValue);
      }
      this.closeModal();
    } catch (error) {
      console.error('Error saving member:', error);
    } finally {
      this.loadingService.hide();
    }
  }

  // --- Helper & Utility Methods ---
  private safeToString(value: string | undefined | null): string {
    return value || '';
  }

  calculateAge(birthdate: Date | any): number {
    if (!birthdate) return 0;
    const bday = birthdate.toDate ? birthdate.toDate() : new Date(birthdate);
    const ageDifMs = Date.now() - bday.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  clearSearch(): void {
    this.searchTerm.set('');
  }

  setSort(direction: 'asc' | 'desc'): void {
    this.sortDirection.set(direction);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) this.currentPage.set(page);
  }

  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  previousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }
}
