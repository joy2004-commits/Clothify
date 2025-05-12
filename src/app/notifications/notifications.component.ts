// src/app/notifications/notifications.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { OrderService, Notification } from '../order.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private notificationsSubscription!: Subscription;

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.notificationsSubscription = this.orderService.getNotifications().subscribe((notifications) => {
      this.notifications = notifications;
      console.log('Notifications updated:', notifications);
    });
  }

  ngOnDestroy(): void {
    this.notificationsSubscription?.unsubscribe();
  }

  markAsRead(id: number): void {
    this.orderService.markNotificationAsRead(id);
  }

  deleteNotification(id: number): void {
    this.orderService.deleteNotification(id);
  }
}