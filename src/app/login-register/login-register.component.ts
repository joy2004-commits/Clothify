import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../user.service';
import { CartService } from '../cart.service';

interface User {
  name: string;
  email: string;
  password: string;
}

@Component({
  selector: 'app-login-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-register.component.html',
  styleUrls: ['./login-register.component.css']
})
export class LoginRegisterComponent {
  isSignUpMode = false;
  signUpForm: FormGroup;
  signInForm: FormGroup;
  errorMessage: string = '';
  returnUrl: string = '/home';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private cartService: CartService
  ) {
    this.signUpForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.signInForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || '/home';
    });
  }

  toggleSignUp(value: boolean) {
    this.isSignUpMode = value;
    this.errorMessage = '';
  }

  onSignUp() {
    if (this.signUpForm.valid) {
      const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
      const userExists = users.some(user => user.email === this.signUpForm.value.email);

      if (userExists) {
        this.errorMessage = 'Email already registered';
        return;
      }

      users.push(this.signUpForm.value);
      localStorage.setItem('users', JSON.stringify(users));
      this.cartService.clearGuestCart();
      console.log('LoginRegisterComponent: User registered:', this.signUpForm.value.name);
      this.errorMessage = 'Registration successful! Please sign in.';
      this.signUpForm.reset();
      this.toggleSignUp(false); // Switch back to sign-in mode
    }
  }

  onSignIn() {
    if (this.signInForm.valid) {
      const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(
        user => user.email === this.signInForm.value.email &&
                user.password === this.signInForm.value.password
      );

      if (user) {
        const userData = {
          username: user.name,
          email: user.email,
          fullName: user.name,
          address: ''
        };
        this.cartService.clearGuestCart();
        this.userService.updateUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        console.log('LoginRegisterComponent: User logged in:', userData.username);
        this.router.navigate([this.returnUrl]).then(() => {
          console.log('LoginRegisterComponent: Navigated to', this.returnUrl);
        });
      } else {
        this.errorMessage = 'Invalid email or password';
        console.log('LoginRegisterComponent: Login failed');
      }
    }
  }
}