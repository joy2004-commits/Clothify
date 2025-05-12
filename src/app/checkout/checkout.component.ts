import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService, CartItem } from '../cart.service';
import { OrderService } from '../order.service';
import { UserService, User } from '../user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit, OnDestroy {
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
    this.userSubscription = this.userService.getCurrentUser().subscribe((user: User | null) => {
      this.currentUser = user;
      if (!user) {
        this.router.navigate(['/login-register']);
      }
    });
    this.cartSubscription = this.cartService.getCartItems().subscribe(items => {
      this.cartItems = items;
    });
    this.countSubscription = this.cartService.getCartItemCount().subscribe(count => {
      this.cartItemCount = count;
    });
    this.notificationSubscription = this.orderService.getUnreadNotificationCount().subscribe(count => {
      this.unreadNotificationCount = count;
    });
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
    if (this.countSubscription) {
      this.countSubscription.unsubscribe();
    }
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  getTotalPrice(): number {
    return this.cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
  }

  confirmOrder(): void {
    if (this.currentUser && this.cartItems.length > 0) {
      const order = {
        id: Date.now(),
        items: [...this.cartItems],
        total: this.getTotalPrice(),
        fullName: this.currentUser.fullName || '',
        address: this.currentUser.address || '',
        paymentMethod: 'Cash on Delivery',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      };
      this.orderService.addOrder(order);
      this.cartService.clearCart();
      this.router.navigate(['/notifications']);
    } else {
      alert('Please add items to the cart or log in.');
    }
  }

  signOut(): void {
    this.userService.clearUser();
    this.router.navigate(['/login-register']);
  }
}