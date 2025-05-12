import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CartItem } from './cart.service';
import { UserService } from './user.service';

export interface Order {
  id: number;
  items: CartItem[];
  total: number;
  fullName: string;
  address: string;
  paymentMethod: string;
  date: string;
}

export interface Notification {
  id: number;
  message: string;
  date: string;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private orders: Order[] = [];
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  private notifications: Notification[] = [];
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadNotificationCountSubject = new BehaviorSubject<number>(0);
  private currentUsername: string | null = null;
  private userService: UserService | null = null;

  constructor(private injector: Injector) {
    setTimeout(() => {
      this.userService = this.injector.get(UserService);
      console.log('UserService resolved in OrderService');
      this.userService.getCurrentUser().subscribe(user => {
        this.currentUsername = user ? user.username : null;
        console.log('Current user in OrderService:', this.currentUsername);
        this.loadOrders();
        this.loadNotifications();
      });
    }, 0);
  }

  private getOrdersKey(): string {
    return this.currentUsername ? `orders_${this.currentUsername}` : 'orders_guest';
  }

  private getNotificationsKey(): string {
    return this.currentUsername ? `notifications_${this.currentUsername}` : 'notifications_guest';
  }

  private loadOrders(): void {
    this.orders = [];
    const savedOrders = localStorage.getItem(this.getOrdersKey());
    if (savedOrders) {
      try {
        this.orders = JSON.parse(savedOrders);
      } catch (e) {
        console.error(`Error parsing orders for ${this.currentUsername || 'guest'}:`, e);
      }
    }
    this.ordersSubject.next([...this.orders]);
    console.log(`Orders loaded for ${this.currentUsername || 'guest'}:`, this.orders);
  }

  private loadNotifications(): void {
    this.notifications = [];
    const savedNotifications = localStorage.getItem(this.getNotificationsKey());
    if (savedNotifications) {
      try {
        this.notifications = JSON.parse(savedNotifications);
      } catch (e) {
        console.error(`Error parsing notifications for ${this.currentUsername || 'guest'}:`, e);
      }
    }
    this.notificationsSubject.next([...this.notifications]);
    this.updateUnreadNotificationCount();
    console.log(`Notifications loaded for ${this.currentUsername || 'guest'}:`, this.notifications);
  }

  addOrder(order: Order): void {
    this.orders.push(order);
    this.ordersSubject.next([...this.orders]);
    localStorage.setItem(this.getOrdersKey(), JSON.stringify(this.orders));
    // Add a notification for the new order
    const notification: Notification = {
      id: Date.now(),
      message: `New order placed with total $${order.total.toFixed(2)} on ${order.date}`,
      date: new Date().toISOString(),
      read: false
    };
    this.addNotification(notification);
    console.log(`Order added for ${this.currentUsername || 'guest'}:`, order);
  }

  addNotification(notification: Notification): void {
    this.notifications.push(notification);
    this.notificationsSubject.next([...this.notifications]);
    localStorage.setItem(this.getNotificationsKey(), JSON.stringify(this.notifications));
    this.updateUnreadNotificationCount();
    console.log(`Notification added for ${this.currentUsername || 'guest'}:`, notification);
  }

  getOrders(): Observable<Order[]> {
    return this.ordersSubject.asObservable();
  }

  getNotifications(): Observable<Notification[]> {
    return this.notificationsSubject.asObservable();
  }

  getUnreadNotificationCount(): Observable<number> {
    return this.unreadNotificationCountSubject.asObservable();
  }

  markNotificationAsRead(id: number): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.notificationsSubject.next([...this.notifications]);
      localStorage.setItem(this.getNotificationsKey(), JSON.stringify(this.notifications));
      this.updateUnreadNotificationCount();
      console.log(`Notification ${id} marked as read for ${this.currentUsername || 'guest'}`);
    }
  }

  deleteNotification(id: number): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notificationsSubject.next([...this.notifications]);
    localStorage.setItem(this.getNotificationsKey(), JSON.stringify(this.notifications));
    this.updateUnreadNotificationCount();
    console.log(`Notification ${id} deleted for ${this.currentUsername || 'guest'}`);
  }

  clearDataForUser(username: string): void {
    const ordersKey = `orders_${username}`;
    const notificationsKey = `notifications_${username}`;
    this.orders = [];
    this.notifications = [];
    this.ordersSubject.next([]);
    this.notificationsSubject.next([]);
    localStorage.removeItem(ordersKey);
    localStorage.removeItem(notificationsKey);
    this.updateUnreadNotificationCount();
    console.log(`Orders and notifications cleared for ${username}`);
  }

  private updateUnreadNotificationCount(): void {
    const unreadCount = this.notifications.filter(n => !n.read).length;
    this.unreadNotificationCountSubject.next(unreadCount);
  }
}