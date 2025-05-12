import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService, CartItem } from '../cart.service';
import { OrderService } from '../order.service';
import { UserService, User } from '../user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  cartItemCount: number = 0;
  unreadNotificationCount: number = 0;
  currentUser: User | null = null;

  private cartSubscription: Subscription | undefined;
  private countSubscription: Subscription | undefined;
  private notificationSubscription: Subscription | undefined;
  private userSubscription: Subscription | undefined;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.userService.getCurrentUser().subscribe({
      next: (user: User | null) => {
        this.currentUser = user;
        console.log('CartComponent: Current user:', user);
        if (!user) {
          console.log('CartComponent: No user logged in, redirecting to login');
          this.router.navigate(['/login-register']);
          return;
        }
        // Re-subscribe to cart items whenever the user changes
        if (this.cartSubscription) {
          this.cartSubscription.unsubscribe();
        }
        this.cartSubscription = this.cartService.getCartItems().subscribe({
          next: (items) => {
            this.cartItems = items;
            console.log('CartComponent: Cart items updated for user:', user.username, items);
          },
          error: (err) => {
            console.error('CartComponent: Error in cart items subscription:', err);
          }
        });
      },
      error: (err) => {
        console.error('CartComponent: Error in user subscription:', err);
      }
    });

    this.countSubscription = this.cartService.getCartItemCount().subscribe({
      next: (count) => {
        this.cartItemCount = count;
        console.log('CartComponent: Cart item count:', count);
      },
      error: (err) => {
        console.error('CartComponent: Error in cart count subscription:', err);
      }
    });

    this.notificationSubscription = this.orderService.getUnreadNotificationCount().subscribe({
      next: (count) => {
        this.unreadNotificationCount = count;
        console.log('CartComponent: Unread notification count:', count);
      },
      error: (err) => {
        console.error('CartComponent: Error in notification count subscription:', err);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) this.cartSubscription.unsubscribe();
    if (this.countSubscription) this.countSubscription.unsubscribe();
    if (this.notificationSubscription) this.notificationSubscription.unsubscribe();
    if (this.userSubscription) this.userSubscription.unsubscribe();
  }

  incrementQuantity(item: CartItem): void {
    this.cartService.incrementQuantity(item.product.id);
  }

  decrementQuantity(item: CartItem): void {
    this.cartService.decrementQuantity(item.product.id);
  }

  removeFromCart(item: CartItem): void {
    this.cartService.removeFromCart(item.product.id);
  }

  getTotalPrice(): number {
    const total = this.cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
    return Number(total.toFixed(2));
  }

  clearCart(): void {
    if (this.currentUser) {
      this.cartService.clearCartForUser(this.currentUser.username);
      console.log('CartComponent: Cart cleared for user:', this.currentUser.username);
    }
  }

  checkout(): void {
    if (this.currentUser && this.cartItems.length > 0) {
      this.router.navigate(['/checkout']).then(() => {
        console.log('CartComponent: Navigated to checkout');
      }).catch(err => {
        console.error('CartComponent: Navigation error to checkout:', err);
      });
    } else {
      alert('Please add items to the cart or log in.');
      console.log('CartComponent: Checkout navigation failed - no items or user not logged in');
    }
  }

  signOut(): void {
    if (this.currentUser) {
      this.cartService.clearCartForUser(this.currentUser.username);
      console.log('CartComponent: Cart cleared during sign-out for user:', this.currentUser.username);
    }
    this.userService.clearUser();
    this.router.navigate(['/login-register']).catch(err => {
      console.error('CartComponent: Navigation error during sign-out:', err);
    });
    console.log('CartComponent: User signed out');
  }
}