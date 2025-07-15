import { NgClass, TitleCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AppUser, AuthService } from '../services/auth.service';
import { LoadingService } from '../services/loading.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-user-management',
  imports: [
    TitleCasePipe,
    NgClass
  ],
  template: `
    <main class="container mx-auto p-4 md:p-8">
      <div class="flex justify-between items-center px-1.5">
        <h1 class="text-3xl md:text-4xl font-bold font-leera text-gray-800 dark:text-gray-200 mb-6">User Role Management</h1>
        <button (click)="router.navigate(['/'])"
                class="bg-sky-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-sky-800 transition duration-300 ml-2">
          Go Back to Home
        </button>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="text-gray-800 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 leading-10 ">
            <tr>
              <th scope="col" class="table-header">User</th>
              <th scope="col" class="table-header">Email</th>
              <th scope="col" class="table-header">Current Role</th>
              <th scope="col" class="table-header">Change Role</th>
            </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              @for (user of users(); track user.uid) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td class="p-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <img class="h-10 w-10 rounded-full" [src]="user.photoURL || 'https://i.pravatar.cc/150?u=' + user.uid" alt="">
                      </div>
                      <div class="ml-4">
                        <div class="text-md font-medium text-gray-900 dark:text-gray-200">{{ user.displayName }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="p-4 whitespace-nowrap text-md text-gray-500 dark:text-gray-400">{{ user.email }}</td>
                  <td class="p-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-sm leading-6 font-semibold rounded-full"
                          [ngClass]="getRoleBadgeClass(user.role)">
                      {{ user.role | titlecase }}
                    </span>
                  </td>
                  <td class="p-4 whitespace-nowrap text-md text-gray-800 dark:text-gray-300 font-medium">
                    <select #roleSelect [value]="user.role" (change)="changeRole(user, roleSelect.value)" class="form-select text-gray-800 dark:text-gray-300">
                      <option class="text-gray-700" value="user">User</option>
                      <option class="text-gray-700" value="member">Member</option>
                      <option class="text-gray-700" value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </main>
  `,
  styles: `

    `
})
export class UserManagement {
  private authService = inject(AuthService);
  private loadingService = inject(LoadingService);
  private toastService = inject(ToastService);
  public router = inject(Router);

  users = toSignal(this.authService.getAllUsers(), {initialValue: []});

  async changeRole(user: AppUser, newRole: string) {
    if (!user.uid) return;
    const role = newRole as 'admin' | 'member' | 'user';

    this.loadingService.show();
    try {
      await this.authService.updateUserRole(user.uid, role);
      this.toastService.show('Success', `Updated ${user.displayName}'s role to ${role}`, 'success');
      // To refresh the list, we might need a more reactive way in the service,
      // but for now, the change will be reflected on the next page load.
    } catch (error) {
      this.toastService.show('Error', 'Failed to update role.', 'error');
      console.error(error);
    } finally {
      this.loadingService.hide();
    }
  }

  getRoleBadgeClass(role: AppUser['role']): string {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      case 'member': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200';
    }
  }
}
