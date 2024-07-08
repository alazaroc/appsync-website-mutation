import { Component, OnInit, OnDestroy } from '@angular/core';
import { Apollo } from 'apollo-angular';
import {
  GET_NOTIFICATIONS,
  DELETE_NOTIFICATION,
  ADD_NOTIFICATION,
  UPDATE_NOTIFICATION,
  SUBSCRIBE_TO_NEW_NOTIFICATIONS,
} from './graphql.queries';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApolloModule } from 'apollo-angular';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ApolloModule],
})
export class AppComponent implements OnInit, OnDestroy {
  notifications: any[] = [];
  newNotification: any = { userId: '', message: '' };
  isEditing: boolean = false;
  private websocket: WebSocket | null = null;

  constructor(private apollo: Apollo) {}

  ngOnInit() {
    this.fetchNotifications();
    this.initializeWebSocket();
  }

  ngOnDestroy() {
    if (this.websocket) {
      this.websocket.close();
    }
    if (this.websocket) {
      this.websocket.close();
    }
  }

  fetchNotifications() {
    this.apollo
      .watchQuery({
        query: GET_NOTIFICATIONS,
      })
      .valueChanges.subscribe((result: any) => {
        this.notifications = result?.data?.listNotifications?.items || [];
      });
  }

  deleteNotification(notificationId: string, userId: string) {
    this.apollo
      .mutate({
        mutation: DELETE_NOTIFICATION,
        variables: { input: { notificationId, userId } },
        refetchQueries: [{ query: GET_NOTIFICATIONS }],
      })
      .subscribe(
        (result) => {
          console.log('Mutation result:', result);
          this.fetchNotifications();
        },
        (error) => {
          console.error('Error deleting notification:', error.message);
        }
      );
  }

  addNotification() {
    const notificationId = this.generateUUID();
    const timestamp = new Date().getTime(); // Generate Unix timestamp with milliseconds

    const input = {
      notificationId,
      userId: this.newNotification.userId,
      message: this.newNotification.message,
      timestamp,
    };

    this.apollo
      .mutate({
        mutation: ADD_NOTIFICATION,
        variables: { input },
        refetchQueries: [{ query: GET_NOTIFICATIONS }],
      })
      .subscribe(
        (result) => {
          console.log('Mutation result:', result);
          this.fetchNotifications();
          this.resetForm();
        },
        (error) => {
          console.error('Error adding notification:', error.message);
        }
      );
  }

  updateNotification() {
    const input = {
      notificationId: this.newNotification.notificationId,
      userId: this.newNotification.userId,
      message: this.newNotification.message,
      timestamp: new Date().getTime(),
    };

    this.apollo
      .mutate({
        mutation: UPDATE_NOTIFICATION,
        variables: { input },
        refetchQueries: [{ query: GET_NOTIFICATIONS }],
      })
      .subscribe(
        (result) => {
          console.log('Update result:', result);
          this.fetchNotifications();
          this.resetForm();
        },
        (error) => {
          console.error('Error updating notification:', error.message);
        }
      );
  }

  editNotification(notification: any) {
    this.isEditing = true;
    // Only allow editing message, userId should be read-only
    this.newNotification = {
      ...notification,
      // timestamp: this.formatTimestamp(notification.timestamp),
    };
  }

  resetForm() {
    this.isEditing = false;
    this.newNotification = { userId: '', message: '' };
  }

  initializeWebSocket() {
    const header = this.encodeAppSyncCredentials();
    const payload = window.btoa(JSON.stringify({}));
    const url = `wss://${environment.APPSYNC_REALTIME_HOST}/graphql?header=${header}&payload=${payload}`;

    this.websocket = new WebSocket(url, ['graphql-ws']);

    this.websocket.addEventListener('open', () => {
      this.websocket?.send(
        JSON.stringify({
          type: 'connection_init',
        })
      );
    });

    this.websocket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      console.log(message);

      switch (message.type) {
        case 'connection_ack':
          this.startSubscription();
          break;
        case 'start_ack':
          console.log('start_ack');
          break;
        case 'error':
          console.error(message);
          break;
        case 'data':
          this.handleElement(message.payload.data.onCreateNotifications);
          break;
      }
    });
  }

  encodeAppSyncCredentials() {
    const creds = {
      host: environment.APPSYNC_HOST,
      'x-api-key': environment.APPSYNC_API_KEY,
    };
    return window.btoa(JSON.stringify(creds));
  }

  startSubscription() {
    const subscribeMessage = {
      id: window.crypto.randomUUID(),
      type: 'start',
      payload: {
        data: JSON.stringify({
          query: SUBSCRIBE_TO_NEW_NOTIFICATIONS.loc?.source.body,
        }),
        extensions: {
          authorization: {
            'x-api-key': environment.APPSYNC_API_KEY,
            host: environment.APPSYNC_HOST,
          },
        },
      },
    };
    this.websocket?.send(JSON.stringify(subscribeMessage));
  }

  handleElement(element: any) {
    // Create a new array with the new element to avoid modifying the existing notifications array
    this.notifications = [...this.notifications, element];
    console.log(`New notification added: ${element.message}`);
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0,
          v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  formatTimestamp(timestamp: number) {
    const timestampNumber = Number(timestamp);
    const date = new Date(timestampNumber);
    // Manually format the date in YYYY-MM-DD HH:MM:SS
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    return formattedDate;
  }
}
