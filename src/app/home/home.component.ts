import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService, Product } from '../cart.service';
import { OrderService } from '../order.service';
import { UserService, User } from '../user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  searchQuery: string = '';
  selectedCategory: string = '';
  cartItemCount: number = 0;
  unreadNotificationCount: number = 0;
  categories: string[] = ['All', 'Men', 'Women', 'Kids'];
  products: Product[] = [
    { id: 1, name: "Men's T-Shirt", price: 129.99, category: 'Men', image: 'assets/images/mens-shirt.jpg' },
    { id: 2, name: "Women's Dress", price: 149.99, category: 'Women', image: 'assets/images/womens-dress.jpg' },
    { id: 3, name: "Kids' Jacket", price: 339.99, category: 'Kids', image: 'assets/images/kids-jacket.jpg' },
    { id: 4, name: "Men's Hoodie", price: 249.99, category: 'Men', image: 'assets/images/mens-hoodie.jpg' },
    { id: 5, name: "Men's Polo Shirt", price: 134.99, category: 'Men', image: 'assets/images/mens-polo.jpg' },
    { id: 6, name: "Men's Jacket", price: 489.99, category: 'Men', image: 'assets/images/mens-jacket.jpg' },
    { id: 7, name: "Women's Blouse", price: 334.99, category: 'Women', image: 'assets/images/womens-blouse.jpg' },
    { id: 8, name: "Women's Skirt", price: 139.99, category: 'Women', image: 'assets/images/womens-skirt.jpg' },
  ];

  private cartSubscription: Subscription | undefined;
  private notificationSubscription: Subscription | undefined;
  private userSubscription: Subscription | undefined;

  constructor(
    private router: Router,
    private cartService: CartService,
    private orderService: OrderService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.userSubscription = this.userService.getCurrentUser().subscribe(user => {
      if (!user) {
        this.cartItemCount = 0; // Reset cart count if no user
        this.router.navigate(['/login-register']);
        return;
      }
      if (this.cartSubscription) {
        this.cartSubscription.unsubscribe();
      }
      this.cartSubscription = this.cartService.getCartItemCount().subscribe(count => {
        this.cartItemCount = count;
        console.log('HomeComponent: Cart item count for user:', user.username, count);
      });
    });

    this.notificationSubscription = this.orderService.getUnreadNotificationCount().subscribe(count => {
      this.unreadNotificationCount = count;
    });
  }

  ngOnDestroy(): void {
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  filteredProducts(): Product[] {
    let filtered = this.products;
    if (this.selectedCategory && this.selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === this.selectedCategory);
    }
    if (this.searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
    console.log('HomeComponent: Filtered products:', filtered);
    return filtered;
  }

  filterCategory(category: string): void {
    this.selectedCategory = category;
  }

  addToCart(product: Product): void {
    this.userService.getCurrentUser().subscribe(user => {
      if (!user) {
        if (confirm('You need to log in to add items to your cart. Proceed to login?')) {
          this.router.navigate(['/login-register'], { queryParams: { returnUrl: this.router.url } });
        }
        return;
      }
      this.router.navigate(['/options'], { state: { product } });
      console.log(`HomeComponent: Navigating to options for ${product.name}`);
    });
  }

  signOut(): void {
    this.userService.clearUser();
    this.router.navigate(['/login-register']).then(() => {
      console.log('HomeComponent: Successfully navigated to login-register');
    }).catch(err => {
      console.error('HomeComponent: Navigation error during sign-out:', err);
    });
    console.log('HomeComponent: User signed out');
  }
}