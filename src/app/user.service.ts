import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  username: string;
  email: string;
  fullName?: string;
  address?: string;
  profileImage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  constructor() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser && parsedUser.username && parsedUser.email) {
          this.currentUserSubject.next(parsedUser);
          console.log('UserService: Current user loaded from localStorage:', parsedUser);
        } else {
          console.warn('UserService: Invalid user data in localStorage, clearing:', savedUser);
          this.clearUser();
        }
      } catch (e) {
        console.error('UserService: Error parsing currentUser from localStorage:', e);
        this.clearUser();
      }
    }
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  updateUser(user: User): void {
    try {
      this.currentUserSubject.next(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      console.log('UserService: Updated current user:', user);
    } catch (e) {
      console.error('UserService: Error updating user:', e);
    }
  }

  clearUser(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
    console.log('UserService: Cleared current user');
  }
}