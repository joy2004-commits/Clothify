import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService, User } from '../user.service';
import { CartService } from '../cart.service';
import { OrderService, Order } from '../order.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy, AfterViewInit {
  currentUser: User | null = null;
  cartItemCount: number = 0;
  unreadNotificationCount: number = 0;
  orders: Order[] = [];
  newPassword: string = '';
  confirmPassword: string = '';
  isEditingPassword: boolean = false;
  isLoading: boolean = false;

  @ViewChild('profileForm') profileForm?: NgForm;

  private userSubscription: Subscription | undefined;
  private cartSubscription: Subscription | undefined;
  private notificationSubscription: Subscription | undefined;
  private orderSubscription: Subscription | undefined;

  constructor(
    private router: Router,
    private userService: UserService,
    private cartService: CartService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.userService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
      if (!user) {
        console.log('No user found, redirecting to login');
        this.router.navigate(['/login-register']);
      } else {
        this.currentUser = {
          ...user,
          fullName: user.fullName || '',
          address: user.address || ''
        };
        console.log('Current user initialized:', this.currentUser);
        this.loadOrders();
      }
    });
    this.cartSubscription = this.cartService.getCartItemCount().subscribe(count => {
      this.cartItemCount = count;
    });
    this.notificationSubscription = this.orderService.getUnreadNotificationCount().subscribe(count => {
      this.unreadNotificationCount = count;
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      console.log('Profile form initialized:', {
        form: this.profileForm,
        valid: this.profileForm?.valid,
        controls: this.profileForm?.controls,
        addressValue: this.currentUser?.address
      });
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.userSubscription) this.userSubscription.unsubscribe();
    if (this.cartSubscription) this.cartSubscription.unsubscribe();
    if (this.notificationSubscription) this.notificationSubscription.unsubscribe();
    if (this.orderSubscription) this.orderSubscription.unsubscribe();
  }

  loadOrders(): void {
    if (this.currentUser) {
      this.orderSubscription = this.orderService.getOrders().subscribe(orders => {
        this.orders = orders.filter(order => order.fullName === this.currentUser?.fullName);
      });
    }
  }

  saveProfile(): void {
    try {
      console.log('saveProfile called, form state:', {
        formExists: !!this.profileForm,
        valid: this.profileForm?.valid,
        controls: this.profileForm?.controls,
        currentUser: this.currentUser
      });
      if (this.profileForm && this.profileForm.valid && this.currentUser) {
        this.isLoading = true;
        console.log('Saving profile with data:', {
          username: this.currentUser.username,
          email: this.currentUser.email,
          fullName: this.currentUser.fullName,
          address: this.currentUser.address
        });
        try {
          // Validate currentUser properties
          if (!this.currentUser.email || !this.currentUser.username) {
            throw new Error('Invalid user data: email or username is missing');
          }
          console.log('Calling userService.updateUser');
          this.userService.updateUser(this.currentUser);
          console.log('Calling getUpdatedUsers');
          const updatedUsers = this.getUpdatedUsers();
          console.log('Setting localStorage with users:', updatedUsers);
          localStorage.setItem('users', updatedUsers);
          this.isLoading = false;
          alert('Profile updated successfully!');
          console.log('Profile saved successfully');
        } catch (error) {
          console.error('Error saving profile:', error);
          this.isLoading = false;
          alert('Error saving profile: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
      } else {
        console.warn('Form is invalid, not initialized, or user is not available', {
          formExists: !!this.profileForm,
          formValid: this.profileForm?.valid,
          controls: this.profileForm?.controls,
          currentUser: this.currentUser
        });
        this.isLoading = false;
        alert('Please fill in all required fields correctly or try again later.');
      }
    } catch (error) {
      console.error('Unexpected error in saveProfile:', error);
      this.isLoading = false;
      alert('An unexpected error occurred: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // For direct button click testing
  debugSaveButton(): void {
    console.log('Save button clicked directly');
    this.saveProfile();
  }

  changePassword(): void {
    if (this.newPassword && this.confirmPassword) {
      if (this.newPassword === this.confirmPassword) {
        try {
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          const userIndex = users.findIndex((u: { user: User; password: string }) => u.user.email === (this.currentUser ? this.currentUser.email : ''));
          if (userIndex !== -1) {
            users[userIndex].password = this.newPassword;
            localStorage.setItem('users', JSON.stringify(users));
            this.isEditingPassword = false;
            alert('Password changed successfully!');
          } else {
            alert('User not found in storage.');
          }
        } catch (error) {
          console.error('Error changing password:', error);
          alert('Error changing password. Please try again.');
        }
      } else {
        alert('Passwords do not match!');
      }
    } else {
      alert('Please fill in both password fields!');
    }
  }

  deleteAccount(): void {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const updatedUsers = users.filter((u: { user: User; password: string }) => u.user.email !== (this.currentUser ? this.currentUser.email : ''));
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        this.orderService.clearDataForUser(this.currentUser!.username);
        this.cartService.clearCartForUser(this.currentUser!.username);
        this.userService.clearUser();
        this.router.navigate(['/login-register']);
        alert('Account deleted successfully!');
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('Error deleting account. Please try again.');
      }
    }
  }

  private getUpdatedUsers(): string {
    try {
      console.log('getUpdatedUsers called, currentUser:', this.currentUser);
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      console.log('Parsed users from localStorage:', users);
      if (!this.currentUser || !this.currentUser.email) {
        throw new Error('Current user or email is missing');
      }
      const currentUser = this.currentUser; // Narrow type
      const userIndex = users.findIndex((u: { user: User; password: string }) => u.user.email === currentUser.email);
      console.log('User index:', userIndex);
      if (userIndex === -1) {
        console.warn('User not found in localStorage, adding new user');
        users.push({ user: currentUser, password: '' }); // Assuming password is handled elsewhere
      } else {
        users[userIndex].user = currentUser;
      }
      const result = JSON.stringify(users);
      console.log('Returning updated users:', result);
      return result;
    } catch (error) {
      console.error('Error in getUpdatedUsers:', error);
      throw error; // Rethrow to be caught in saveProfile
    }
  }

  togglePasswordEdit(): void {
    this.isEditingPassword = !this.isEditingPassword;
    this.newPassword = '';
    this.confirmPassword = '';
  }

  signOut(): void {
    this.userService.clearUser();
    this.router.navigate(['/login-register']).then(() => {
      console.log('ProfileComponent: Successfully navigated to login-register');
    }).catch((err: Error) => {
      console.error('ProfileComponent: Navigation error during sign-out:', err);
    });
    console.log('ProfileComponent: User signed out');
  }
}