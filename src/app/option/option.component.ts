import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CartService, Product, CartItem } from '../cart.service';
import { UserService } from '../user.service';

@Component({
  selector: 'app-option',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './option.component.html',
  styleUrls: ['./option.component.css']
})
export class OptionComponent implements OnInit {
  product: Product | null = null;
  selectedColor: string = '';
  selectedSize: string = '';
  colors: string[] = ['Red', 'Blue', 'Green', 'Black'];
  sizes: string[] = ['S', 'M', 'L', 'XL'];
  private hasShownLoginPrompt = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    const productData = history.state.product as Product;
    if (productData) {
      this.product = { ...productData };
    } else {
      this.router.navigate(['/home']);
    }
  }

  onImageError(): void {
    if (this.product) {
      this.product.image = '/assets/images/fallback.jpg';
    }
  }

  saveToCart(): void {
    this.userService.getCurrentUser().subscribe(user => {
      if (!user) {
        if (!this.hasShownLoginPrompt) {
          console.log('OptionComponent: No user logged in, prompting for login');
          this.hasShownLoginPrompt = true;
          if (confirm('You need to log in to add items to your cart. Proceed to login?')) {
            this.router.navigate(['/login-register'], {
              queryParams: { returnUrl: this.router.url }
            }).then(() => {
              console.log('OptionComponent: Navigated to login-register');
              this.hasShownLoginPrompt = false; // Reset after navigation
            });
          } else {
            this.hasShownLoginPrompt = false; // Reset after cancel
          }
        }
        return;
      }
      if (this.product && this.selectedColor && this.selectedSize) {
        const cartItem: CartItem = {
          product: { ...this.product },
          quantity: 1,
          selectedColor: this.selectedColor,
          selectedSize: this.selectedSize
        };
        this.cartService.addToCart(cartItem);
        console.log(`OptionComponent: Added to cart for user ${user.username}:`, cartItem);
        this.router.navigate(['/home']).then(() => {
          console.log('OptionComponent: Navigated to /home after adding to cart');
        });
      }
    }, err => {
      console.error('OptionComponent: Error fetching current user:', err);
      if (!this.hasShownLoginPrompt) {
        this.hasShownLoginPrompt = true;
        if (confirm('You need to log in to add items to your cart. Proceed to login?')) {
          this.router.navigate(['/login-register'], {
            queryParams: { returnUrl: this.router.url }
          }).then(() => {
            console.log('OptionComponent: Fallback navigated to login-register');
            this.hasShownLoginPrompt = false;
          });
        } else {
          this.hasShownLoginPrompt = false;
        }
      }
    });
  }
}