import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  effect,
  HostListener,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Member } from '../models/member.model';
import { District, Province, Subdistrict } from '../models/province.model';
import { ThaiDatePipe } from '../pipe/thai-date.pipe';
import { AddressService } from '../services/address.service';
import { AuthService } from '../services/auth.service';
import { CountAgeService } from '../services/count-age.service';
import { LoadingService } from '../services/loading.service';
import { MembersService } from '../services/members.service';
import { ToastService } from '../services/toast.service';
import { DialogService } from '../shared/services/dialog';
import { CustomAddress } from './custom-address';
import { CustomDatepicker } from './custom-datepicker';

@Component({
  selector: 'app-member-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ThaiDatePipe,
    CustomAddress,
    CustomDatepicker
  ],
  template: `
    <main class="container mx-auto p-4 md:p-8">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl md:text-4xl font-thasadith font-bold text-gray-800 dark:text-gray-200">
          รายชื่อสมาชิกชมรม</h1>
        @if (authService.currentUser()?.role === 'admin') {
          <button (click)="openAddModal()" class="btn-primary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            <!-- ข้อความนี้จะแสดงเฉพาะจอใหญ่ (sm ขึ้นไป) -->
            <span class="hidden sm:block">เพิ่มสมาชิกใหม่</span>
          </button>
        }
      </div>

      <!-- Search & Sort Controls -->
      <div class="mb-6 p-4 bg-white rounded-xl shadow-md dark:bg-gray-800">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="md:col-span-2">
            <label for="search"
                   class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ค้นหาสมาชิก</label>
            <div class="relative">
              <input type="text"
                     id="search"
                     placeholder="หาชื่อ, นามสกุล, จังหวัด, สถานะ..."
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
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">จัดเรียงตามชื่อ</label>
            <div class="flex gap-2">
              <button (click)="setSort('asc')"
                      class="w-full py-2 px-4 rounded-lg text-sm"
                      [class.bg-blue-600]="sortDirection() === 'asc'"
                      [class.text-white]="sortDirection() === 'asc'"
                      [class.bg-gray-200]="sortDirection() !== 'asc'"
                      [class.dark:text-gray-200]="sortDirection() !== 'asc'"
                      [class.dark:bg-gray-700]="sortDirection() !== 'asc'">
                A-Z ↓
              </button>
              <button (click)="setSort('desc')"
                      class="w-full py-2 px-4 rounded-lg text-sm"
                      [class.bg-blue-600]="sortDirection() === 'desc'"
                      [class.text-white]="sortDirection() === 'desc'"
                      [class.bg-gray-200]="sortDirection() !== 'desc'"
                      [class.dark:text-gray-200]="sortDirection() !== 'desc'"
                      [class.dark:bg-gray-700]="sortDirection() !== 'desc'">
                Z-A ↑
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Member List -->
      <div class="mt-6">
        @if (loadingService.isLoading() && members()?.length === 0) {
          <!--<div class="flex justify-center items-center p-8">
            <div class="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-blue-600"></div>
          </div>-->
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (member of paginatedMembers(); track member.id) {
              <div class="bg-white rounded-xl shadow-lg transition-transform hover:scale-105 dark:bg-gray-800"
                   [class.bg-gray-50]="member.alive === 'เสียชีวิตแล้ว'"
                   [ngClass]="{'dark:bg-gray-800/50': member.alive === 'เสียชีวิตแล้ว'}">
                <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4">
                  <img class="h-14 w-14 rounded-full object-cover ring-2 ring-blue-300 dark:ring-blue-500"
                       [src]="member.photoURL || 'https://i.pravatar.cc/150?u=' + member.id"
                       alt="Member Avatar">
                  <div>
                    <p class="font-bold text-lg text-gray-800 dark:text-gray-200">
                      {{ member.rank || '' }} {{ member.firstname }} {{ member.lastname }}
                    </p>
                    <p class="text-sm font-semibold"
                       [class.text-gray-500]="member.alive === 'เสียชีวิตแล้ว'"
                       [class.dark:text-gray-400]="member.alive === 'เสียชีวิตแล้ว'"
                       [class.text-green-600]="member.alive !== 'เสียชีวิตแล้ว'"
                       [class.dark:text-green-400]="member.alive !== 'เสียชีวิตแล้ว'">
                      {{ member.alive }}
                    </p>
                  </div>
                </div>
                <div class="p-2 bg-gray-50 dark:bg-gray-800/50 dark:text-gray-400 rounded-b-xl flex justify-end gap-1">
                  @if (authService.currentUser()?.role !== 'user') {
                    <button (click)="openDetailModal(member)" class="btn-icon" title="ดูรายละเอียด">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                        <path fill-rule="evenodd"
                              d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
                              clip-rule="evenodd"/>
                      </svg>
                    </button>
                  }
                  @if (authService.currentUser()?.role === 'admin') {
                    <button (click)="openEditModal(member)" class="btn-icon" title="แก้ไข">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                        <path
                          d="m2.695 14.762-1.262 3.155a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.886L17.5 5.501a2.121 2.121 0 0 0-3-3L3.58 13.42a4 4 0 0 0-.886 1.343Z"/>
                      </svg>
                    </button>
                    <button (click)="onDelete(member)" class="btn-icon-danger" title="ลบ">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                        <path fill-rule="evenodd"
                              d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.33l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193v-.443A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm3.44 0a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                              clip-rule="evenodd"/>
                      </svg>
                    </button>
                  }
                  @for (_ of emptySlots(); track _) {
                    <div class="invisible"></div>
                  }
                </div>
              </div>
            } @empty {
              <div class="bg-white p-8 rounded-xl shadow-lg text-center dark:bg-gray-800">
                <p class="w-full text-gray-500 dark:text-gray-400">ไม่พบข้อมูลสมาชิก</p>
              </div>
            }
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <!-- Paginator UI (ฉบับอัปเกรด) -->
            <div class="mt-8 flex justify-center items-center gap-2">
              <!-- First Page Button -->
              <button (click)="firstPage()" [disabled]="currentPage() === 1" class="btn-paginator dark:text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                  <path fill-rule="evenodd"
                        d="M15.79 14.77a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 1 1 1.06 1.06L11.81 10l3.98 3.98a.75.75 0 0 1 0 1.06ZM9.79 14.77a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 1 1 1.06 1.06L5.81 10l3.98 3.98a.75.75 0 0 1 0 1.06Z"
                        clip-rule="evenodd"/>
                </svg>
              </button>
              <!-- Previous Button -->
              <button (click)="previousPage()" [disabled]="currentPage() === 1"
                      class="btn-paginator dark:text-gray-300">Previous
              </button>
              <!-- Page Info -->
              <span class="text-sm text-gray-700 dark:text-gray-300">Page {{ currentPage() }}
                of {{ totalPages() }}</span>
              <!-- Next Button -->
              <button (click)="nextPage()" [disabled]="currentPage() === totalPages()"
                      class="btn-paginator dark:text-gray-300">Next
              </button>
              <!-- Last Page Button -->
              <button (click)="lastPage()" [disabled]="currentPage() === totalPages()"
                      class="btn-paginator dark:text-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                  <path fill-rule="evenodd"
                        d="M4.21 5.23a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06L8.19 10 4.21 6.02a.75.75 0 0 1 0-1.06ZM10.21 5.23a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06L14.19 10l-3.98-3.98a.75.75 0 0 1 0-1.06Z"
                        clip-rule="evenodd"/>
                </svg>
              </button>
            </div>
          }
        }
      </div>
    </main>

    <!-- Modal (View/Add/Edit) -->
    @if (isModalOpen()) {
      <div (click)="closeModal()" class="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
        <div (click)="$event.stopPropagation()"
             class="bg-white p-6 md:p-8 rounded-xl shadow-2xl z-50 w-full max-w-3xl mx-auto max-h-[90vh] overflow-y-auto dark:bg-gray-800">
          @if (modalMode() === 'view' && selectedMember()) {
            <!-- View Mode -->
            <div>
              <h2 class="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-6">รายละเอียดสมาชิก</h2>
              <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <img class="h-32 w-32 rounded-full object-cover ring-4 ring-blue-200"
                     [src]="selectedMember()!.photoURL || 'https://i.pravatar.cc/150?u=' + selectedMember()!.id"
                     alt="Member Avatar">
                <div class="flex-1 text-center sm:text-left">
                  <p class="text-xl font-bold text-gray-800 dark:text-gray-200">
                    {{ selectedMember()!.rank || '' }} {{ selectedMember()!.firstname }} {{ selectedMember()!.lastname }}
                  </p>
                  <p class="text-md font-semibold mt-1"
                     [class.text-gray-500]="selectedMember()!.alive === 'เสียชีวิตแล้ว'"
                     [class.dark:text-gray-400]="selectedMember()!.alive === 'เสียชีวิตแล้ว'"
                     [class.text-green-600]="selectedMember()!.alive !== 'เสียชีวิตแล้ว'"
                     [class.dark:text-green-400]="selectedMember()!.alive !== 'เสียชีวิตแล้ว'">
                    {{ selectedMember()!.alive }}
                  </p>
                  <div class="mt-4 text-md space-y-1">
                    <p class="text-gray-600 dark:text-gray-300">
                      <strong>โทรศัพท์:</strong> {{ selectedMember()!.phone || '-' }}</p>
                    <p class="text-gray-600 dark:text-gray-300">
                      <strong>วันเกิด:</strong> {{ selectedMember()!.birthdate | thaiDate:'fullMonth' }}</p>
                    <p class="text-gray-600 dark:text-gray-300">
                      <strong>อายุ:</strong> {{ countAgeService.getAge(selectedMember()!.birthdate) }}</p>
                    <p class="text-gray-600 dark:text-gray-300">
                      <strong>ที่อยู่:</strong> {{ getFullAddress(selectedMember()?.address!) }}</p>
                  </div>
                </div>
              </div>
              <div class="flex items-center justify-end gap-4 mt-8 pt-6 border-t dark:border-gray-700">
                <button type="button" (click)="closeModal()" class="btn-secondary">Close</button>
                @if (authService.currentUser()?.role === 'admin') {
                  <button type="button" (click)="switchToEditMode()" class="btn-primary">Edit Details</button>
                }
              </div>
            </div>
          } @else {
            <!-- Form Mode -->
            <div>
              <h2 class="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-6">
                {{ isEditing() ? 'แก้ไขข้อมูลสมาชิก' : 'เพิ่มข้อมูลสมาชิกใหม่' }}
              </h2>
              <form [formGroup]="memberForm" (ngSubmit)="onSubmit()">
                <div class="flex flex-col items-center mb-6">
                  <div class="relative">
                    <img class="h-24 w-24 rounded-full object-cover ring-4 ring-blue-200"
                         [src]="imagePreviewUrl() || 'https://i.pravatar.cc/150?u=' + selectedMember()?.id"
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
                         (change)="onMemberImageSelected($event)"
                         accept="image/png, image/jpeg">
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
                      <input type="text" formControlName="firstname" class="form-input">
                    </div>
                    <div class="mb-4">
                      <label class="form-label">นามสกุล</label>
                      <input type="text" formControlName="lastname" class="form-input">
                    </div>
                    <div class="mb-4">
                      <label class="form-label">โทรศัพท์</label>
                      <input type="tel" formControlName="phone" class="form-input">
                    </div>
                  </div>
                  <!-- Column 2 -->
                  <div>
                    <div class="mb-4">
                      <label class="form-label">สถานะ</label>
                      <select formControlName="alive" class="form-input "
                              [class.text-gray-400]="!memberForm.get('alive')?.value">
                        <option value="" disabled>-- เลือกสถานะ --</option>
                        <option value="ยังมีชีวิตอยู่">ยังมีชีวิตอยู่</option>
                        <option value="เสียชีวิตแล้ว">เสียชีวิตแล้ว</option>
                      </select>
                    </div>
                    <div class="mb-4">
                      <label class="form-label">วัน/เดือน/ปีเกิด</label>
                      <app-custom-datepicker formControlName="birthdate"></app-custom-datepicker>
                    </div>
                    <div class="mb-4">
                      <label class="form-label">ที่อยู่ (เลขที่, ถนน)</label>
                      <input type="text" formControlName="addressLine1" class="form-input">
                    </div>
                    <div class="mb-4">
                      <label class="form-label">จังหวัด/อำเภอ/ตำบล</label>
                      <app-custom-address formControlName="addressObject"></app-custom-address>
                    </div>
                  </div>
                </div>
                <div class="flex items-center justify-end gap-4 mt-8 pt-6 border-t dark:border-gray-700">
                  <button type="button" (click)="closeModal()" class="btn-secondary">Cancel</button>
                  <button type="submit" [disabled]="memberForm.invalid" class="btn-primary">
                    {{ isEditing() ? 'Update Member' : 'Save Member' }}
                  </button>
                </div>
              </form>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: ``,
})
export class MemberListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private membersService = inject(MembersService);
  authService = inject(AuthService);
  loadingService = inject(LoadingService);
  countAgeService = inject(CountAgeService);
  private destroyRef = inject(DestroyRef);
  private dialogService = inject(DialogService);
  private addressService = inject(AddressService);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);

  // --- Data Signals ---
  allProvinces = signal<Province[]>([]);
  allDistricts = signal<District[]>([]);
  allSubdistricts = signal<Subdistrict[]>([]);

  // --- State Signals ---
  members = toSignal(this.membersService.getMembers(), {initialValue: undefined});
  searchTerm = signal('');
  sortDirection = signal<'asc' | 'desc' | 'none'>('none');
  currentPage = signal(1);
  itemsPerPage = signal(9);
  isModalOpen = signal(false);
  selectedMember = signal<Member | null>(null);
  modalMode = signal<'view' | 'form'>('form');
  provinceFilterId = signal<number | null>(null); // <-- เพิ่ม Signal สำหรับกรองจังหวัด

  memberForm!: FormGroup;

  selectedFile = signal<File | null>(null);
  imagePreviewUrl = signal<string | null>(null);
  isEditing = computed(() => !!this.selectedMember() && this.modalMode() === 'form');

  // --- Options ---
  readonly rankOptions = ['น.อ.ร.', 'ร.ต.ท.', 'ร.ต.อ.', 'พ.ต.ต.', 'พ.ต.ท.', 'พ.ต.อ.', 'พล.ต.อ.'];

  // --- Computed Signals for Display ---
  filteredAndSortedMembers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const direction = this.sortDirection();
    const provinceId = this.provinceFilterId();
    let membersToShow = [...(this.members() ?? [])];

    // ++ เพิ่ม Logic การกรองตามจังหวัด ++
    if (provinceId) {
      membersToShow = membersToShow.filter(m => m.address?.addressObject?.provinceId === provinceId);
    }

    if (term) {
      const provinces = this.allProvinces(); // <-- ดึงข้อมูลจังหวัดมาใช้
      membersToShow = membersToShow.filter(m => {
        // หาชื่อจังหวัดของสมาชิกคนนั้นๆ
        const provinceName = provinces.find(p => p.id === m.address?.addressObject?.provinceId)?.name_th || '';

        // ค้นหาในชื่อ, นามสกุล, สถานะ, และชื่อจังหวัด
        return (m.firstname || '').toLowerCase().includes(term) ||
          (m.lastname || '').toLowerCase().includes(term) ||
          (m.alive || '').toLowerCase().includes(term) ||
          provinceName.toLowerCase().includes(term);
      });
    }
    // Sort members based on the selected direction
    if (direction === 'asc') {
      membersToShow.sort((a, b) => (a.firstname || '').localeCompare(b.firstname || ''));
    } else if (direction === 'desc') {
      membersToShow.sort((a, b) => (b.firstname || '').localeCompare(a.firstname || ''));
    }

    return membersToShow;
  });

  paginatedMembers = computed(() => {
    const list = this.filteredAndSortedMembers();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    return list.slice(start, start + this.itemsPerPage());
  });

  totalPages = computed(() => Math.ceil(this.filteredAndSortedMembers().length / this.itemsPerPage()));

  readonly emptySlots = computed(() => {
    const count = this.paginatedMembers().length;
    const remainder = count % 3;
    return remainder === 0 ? [] : Array(3 - remainder);
  });


  constructor() {
    this.loadingService.show();
    effect(() => {
      if (this.members() !== undefined) {
        this.loadingService.hide();
      }
    });

    // +++ Effect ใหม่สำหรับรีเซ็ตหน้าเมื่อมีการค้นหา +++
    effect(() => {
      // การเรียก searchTerm() ที่นี่ จะทำให้ effect นี้ทำงานทุกครั้งที่ค่าเปลี่ยน
      this.searchTerm();
      // เมื่อมีการค้นหา, ให้กลับไปที่หน้าแรกเสมอ
      this.currentPage.set(1);
    });

  }

  ngOnInit(): void {
    this.initializeForm();
    this.addressService.getProvinces()
      .subscribe(data => {
        this.allProvinces.set(data);
        this.cdr.detectChanges();
      });
    this.addressService.getDistricts()
      .subscribe(data => {
        this.allDistricts.set(data);
        this.cdr.detectChanges();
      });
    this.addressService.getSubdistricts().subscribe(data => this.allSubdistricts.set(data));
  }

  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth < 768) {
      this.itemsPerPage.set(6); // ลดจำนวนสมาชิกที่แสดงในแต่ละหน้าเมื่อหน้าจอเล็ก
    }
  }

  initializeForm(member: Member | null = null): void {
    const addressObj = member?.address?.addressObject
      ? {
        provinceId: member.address.addressObject.provinceId,
        districtId: member.address.addressObject.districtId,
        subdistrictId: member.address.addressObject.subdistrictId,
        zipCode: member.address.addressObject.zipCode
      }
      : null;

    if (member?.birthdate && 'seconds' in member.birthdate) {
      member.birthdate = new Date(member.birthdate.seconds * 1000);
    }

    this.memberForm = this.fb.group({
      rank: [member?.rank || ''],
      firstname: [member?.firstname || '', Validators.required],
      lastname: [member?.lastname || '', Validators.required],
      phone: [member?.phone || ''],
      birthdate: [member?.birthdate || null],
      alive: [member?.alive || 'ยังมีชีวิตอยู่', Validators.required],
      addressLine1: [member?.address?.line1 || ''],
      addressObject: [addressObj, Validators.required],
      photoURL: [member?.photoURL || '']
    });

    const aliveControl = this.memberForm.get('alive');
    const birthdateControl = this.memberForm.get('birthdate');
    const addressObjectControl = this.memberForm.get('addressObject');

    // Set validators based on alive status
    if (aliveControl && birthdateControl && addressObjectControl) {
      aliveControl.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(status => {
        if (status === 'เสียชีวิตแล้ว') {
          birthdateControl.clearValidators();
          addressObjectControl.clearValidators();
        } else {
          birthdateControl.setValidators(Validators.required);
          addressObjectControl.setValidators(Validators.required);
        }
        birthdateControl.updateValueAndValidity();
        addressObjectControl.updateValueAndValidity();
      });
    }
    // aliveControl?.valueChanges
    //   .pipe(takeUntilDestroyed(this.destroyRef))
    //   .subscribe(status => {
    //     const addressCtrl = this.memberForm.get('addressObject');
    //     if (status === 'เสียชีวิตแล้ว') {
    //       addressCtrl?.clearValidators();
    //     } else {
    //       addressCtrl?.setValidators(Validators.required);
    //     }
    //     addressCtrl?.updateValueAndValidity();
    //   });
  }

  // --- UI Action Methods ---
  openDetailModal(member: Member): void {
    this.selectedMember.set(member);
    this.modalMode.set('view');
    this.isModalOpen.set(true);
  }

  switchToEditMode(): void {
    // console.log('switchToEditMode', JSON.stringify(this.selectedMember(), null, 2));
    if (this.selectedMember()) {
      this.initializeForm(this.selectedMember());
      this.imagePreviewUrl.set(this.selectedMember()!.photoURL || null);
      this.modalMode.set('form');
    }
  }

  openAddModal(): void {
    this.selectedMember.set(null);
    this.initializeForm();
    this.selectedFile.set(null);
    this.imagePreviewUrl.set(null);
    this.modalMode.set('form');
    this.isModalOpen.set(true);
  }

  async onDelete(member: Member): Promise<void> {
    const confirmed = await this.dialogService.open({
      title: 'ยืนยันการลบข้อมูล',
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลของ <strong>${member.rank || ''} ${member.firstname} ${member.lastname}</strong>?`
    });
    if (confirmed && member.id) {
      this.loadingService.show();
      try {
        await this.membersService.deleteMember(member.id);
        this.toastService.show('Success', 'ลบข้อมูลสมาชิกสำเร็จ', 'success');
      } catch (err: any) {
        console.error('Error deleting member:', err);
        this.toastService.show('Error', 'เกิดข้อผิดพลาดในการลบข้อมูลสมาชิก: ' + err.message, 'error');
      } finally {
        this.loadingService.hide();
      }
    }
  }

  openEditModal(member: Member): void {
    this.selectedMember.set(member);
    this.initializeForm(member);
    this.selectedFile.set(null);
    this.imagePreviewUrl.set(member.photoURL || null);
    this.modalMode.set('form');
    this.isModalOpen.set(true);
  }

  // --- Form Submission ---
  async onSubmit(): Promise<void> {
    if (this.memberForm.invalid) {
      this.memberForm.markAllAsTouched();
      return;
    }
    this.loadingService.show();

    const { firstname, lastname } = this.memberForm.value;
    const adminId = this.authService.currentUser()?.uid || '';
    const isDuplicate = await this.membersService.checkDuplicate(firstname, lastname, adminId);

    if (isDuplicate && !this.isEditing()) {
      this.loadingService.hide();
      this.toastService.show('Warning', 'สมาชิกนี้มีอยู่แล้วในระบบ', 'warning');
      return;
    }
    const {addressLine1, addressObject, ...restOfForm} = this.memberForm.value;

    let dataToSave: any = {
      ...restOfForm,
      address: {
        line1: addressLine1,
        addressObject: addressObject
      },
      photoURL: this.selectedMember()?.photoURL || ''
    };

    try {
      const fileToUpload = this.selectedFile();
      if (fileToUpload) {
        const memberId = this.selectedMember()?.id || '';
        dataToSave.photoURL = await this.membersService.uploadMemberImage(fileToUpload, memberId);
      }

      if (this.isEditing() && this.selectedMember()) {
        const updatedMember = {...this.selectedMember()!, ...dataToSave};
        await this.membersService.updateMember(updatedMember);
      } else {
        await this.membersService.addMember(dataToSave);
      }
      this.toastService.show('Success', 'บันทึกข้อมูลสมาชิกสำเร็จ', 'success');
      this.closeModal();
    } catch (error) {
      this.toastService.show('Error', 'เกิดข้อผิดพลาดในการบันทึกข้อมูลสมาชิก', 'error');
      console.error('Error saving member:', error);
    } finally {
      this.loadingService.hide();
    }
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedMember.set(null);
    this.selectedFile.set(null);
  }

  onMemberImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile.set(file);
      this.imagePreviewUrl.set(URL.createObjectURL(file));
    }
  }

  // --- Helper & Utility Methods ---
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

  // ++ เพิ่มเมธอดใหม่สำหรับ Paginator ++
  firstPage(): void {
    this.goToPage(1);
  }

  lastPage(): void {
    this.goToPage(this.totalPages());
  }

  getFullAddress(address: Member['address']): string {
    if (!address || !address.addressObject || this.allProvinces().length === 0) {
      return address?.line1 || 'ไม่มีข้อมูลที่อยู่';
    }
    const {line1, addressObject} = address;
    const province = this.allProvinces().find(p => p.id === addressObject.provinceId)?.name_th || '';
    const district = this.allDistricts().find(d => d.id === addressObject.districtId)?.name_th || '';
    const subdistrict = this.allSubdistricts().find(s => s.id === addressObject.subdistrictId)?.name_th || '';

    if (province != 'กรุงเทพมหานคร') {
      return `${line1 || ''} ต.${subdistrict} อ.${district} จ.${province} ${addressObject.zipCode || ''}`.trim();
    } else {
      return `${line1 || ''} แขวง${subdistrict} ${district} ${province} ${addressObject.zipCode || ''}`.trim();
    }
  }

  // // ++ เพิ่มเมธอดใหม่สำหรับ Tracking ++
  // trackByMember(index: number, member: Member): string | number {
  // 	if (typeof member.id === 'string' && member.id.trim() !== '') {
  // 		return member.id;
  // 	}
  // 	return `temp_${index}`; // ใช้ id ถ้ามี ถ้าไม่มีก็ใช้ index
  // }
}
