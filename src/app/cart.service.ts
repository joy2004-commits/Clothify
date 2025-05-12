import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserService, User } from './user.service';

export interface Product {
  id: number;
  name: string;
  price: number;
  category?: string;
  image: string;
  colors?: string[];
  sizes?: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItemsMap: { [key: string]: CartItem[] } = {};
  private cartItemsSubjectMap: { [key: string]: BehaviorSubject<CartItem[]> } = {};
  private currentUsername: string | null = null;
  private userService: UserService;

  constructor(private injector: Injector) {
    this.userService = this.injector.get(UserService);
    console.log('CartService: Initialized with UserService');
    this.userService.getCurrentUser().subscribe(user => {
      const newUsername = user ? user.username : null;
      if (newUsername !== this.currentUsername) {
        console.log(`CartService: User changed from ${this.currentUsername} to ${newUsername}`);
        if (this.currentUsername && this.currentUsername !== newUsername) {
          this.clearCartForUser(this.currentUsername);
        } else if (!this.currentUsername && newUsername) {
          this.clearGuestCart();
        }
        this.currentUsername = newUsername;
        this.loadCart();
      } else {
        console.log(`CartService: Same user ${newUsername}, no cart reset needed`);
      }
    });
  }

  private getCartKey(): string {
    return this.currentUsername ? `cart_${this.currentUsername}` : 'cart_guest';
  }

  private getCartSubject(): BehaviorSubject<CartItem[]> {
    const key = this.getCartKey();
    if (!this.cartItemsSubjectMap[key]) {
      this.cartItemsSubjectMap[key] = new BehaviorSubject<CartItem[]>([]);
    }
    return this.cartItemsSubjectMap[key];
  }

  private loadCart(): void {
    const key = this.getCartKey();
    this.cartItemsMap[key] = [];
    const savedCart = localStorage.getItem(key);
    if (savedCart) {
      try {
        this.cartItemsMap[key] = JSON.parse(savedCart);
      } catch (e) {
        console.error(`CartService: Error parsing cart for ${this.currentUsername || 'guest'}:`, e);
      }
    }
    this.getCartSubject().next([...this.cartItemsMap[key]]);
    console.log(`CartService: Cart loaded for ${this.currentUsername || 'guest'}:`, this.cartItemsMap[key]);
  }

  getCartItems(): Observable<CartItem[]> {
    return this.getCartSubject().asObservable();
  }

  getCartItemCount(): Observable<number> {
    return this.getCartItems().pipe(
      map(items => items.reduce((total, item) => total + item.quantity, 0))
    );
  }

  addToCart(item: CartItem): void {
    if (!this.currentUsername) {
      console.warn('CartService: Adding to guest cart');
    }
    const key = this.getCartKey();
    if (!this.cartItemsMap[key]) {
      this.cartItemsMap[key] = [];
    }
    const existingItem = this.cartItemsMap[key].find(
      i => i.product.id === item.product.id && i.selectedColor === item.selectedColor && i.selectedSize === item.selectedSize
    );
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this.cartItemsMap[key].push({ ...item });
    }
    this.getCartSubject().next([...this.cartItemsMap[key]]);
    try {
      localStorage.setItem(key, JSON.stringify(this.cartItemsMap[key]));
      console.log(`CartService: Cart updated for ${this.currentUsername || 'guest'}:`, this.cartItemsMap[key]);
    } catch (e) {
      console.error(`CartService: Error saving cart to localStorage for ${this.currentUsername || 'guest'}:`, e);
    }
  }

  incrementQuantity(productId: number): void {
    const key = this.getCartKey();
    const item = this.cartItemsMap[key]?.find(item => item.product.id === productId);
    if (item) {
      item.quantity += 1;
      this.getCartSubject().next([...this.cartItemsMap[key]]);
      localStorage.setItem(key, JSON.stringify(this.cartItemsMap[key]));
    }
  }

  decrementQuantity(productId: number): void {
    const key = this.getCartKey();
    const item = this.cartItemsMap[key]?.find(item => item.product.id === productId);
    if (item) {
      item.quantity -= 1;
      if (item.quantity <= 0) {
        this.cartItemsMap[key] = this.cartItemsMap[key].filter(i => i.product.id !== productId);
      }
      this.getCartSubject().next([...this.cartItemsMap[key]]);
      localStorage.setItem(key, JSON.stringify(this.cartItemsMap[key]));
    }
  }

  removeFromCart(productId: number): void {
    const key = this.getCartKey();
    if (this.cartItemsMap[key]) {
      this.cartItemsMap[key] = this.cartItemsMap[key].filter(item => item.product.id !== productId);
      this.getCartSubject().next([...this.cartItemsMap[key]]);
      localStorage.setItem(key, JSON.stringify(this.cartItemsMap[key]));
    }
  }

  clearCart(): void {
    if (this.currentUsername) {
      this.clearCartForUser(this.currentUsername);
    } else {
      this.clearGuestCart();
    }
  }

  clearCartForUser(username: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const cartKey = `cart_${username}`;
      this.cartItemsMap[cartKey] = [];
      if (this.cartItemsSubjectMap[cartKey]) {
        this.cartItemsSubjectMap[cartKey].next([]);
      }
      try {
        localStorage.removeItem(cartKey);
        console.log(`CartService: Cart cleared for ${username}`);
        resolve();
      } catch (e) {
        console.error(`CartService: Error clearing cart for ${username}:`, e);
        reject(e);
      }
    });
  }

  clearGuestCart(): void {
    this.cartItemsMap['cart_guest'] = [];
    if (this.cartItemsSubjectMap['cart_guest']) {
      this.cartItemsSubjectMap['cart_guest'].next([]);
    }
    localStorage.removeItem('cart_guest');
    console.log('CartService: Guest cart cleared');
  }

  clearAllCarts(): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith('cart_'))
      .forEach(key => localStorage.removeItem(key));
    Object.keys(this.cartItemsMap).forEach(key => {
      this.cartItemsMap[key] = [];
      if (this.cartItemsSubjectMap[key]) {
        this.cartItemsSubjectMap[key].next([]);
      }
    });
    console.log('CartService: All carts cleared');
  }
}