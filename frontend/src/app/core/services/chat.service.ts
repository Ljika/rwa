import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject, merge, fromEvent } from 'rxjs';
import { map, tap, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Message {
  id: string;
  senderId: string | number;
  receiverId: string | number;
  content: string;
  timestamp: string;
  read: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private socket: Socket;
  private sentMessagesSubject = new Subject<Message>();

  private newMessages$: Observable<Message>; 
  private sentMessages$ = this.sentMessagesSubject.asObservable(); 

  // MERGE operator - kombinuje sve tokove poruka u jedan
  public allMessages$: Observable<Message>;

  constructor(private http: HttpClient) {
    // Inicijalizuj Socket.io konekciju
    this.socket = io('http://localhost:3000', {
      transports: ['websocket'],
      autoConnect: false,
    });

    // Kreiraj Observable od Socket.io event-a
    this.newMessages$ = fromEvent<Message>(this.socket, 'newMessage');

    this.allMessages$ = merge(
      this.newMessages$, 
      this.sentMessages$, 
    ).pipe(
      tap((message) => console.log('Message received via MERGE:', message)),
      shareReplay(1),
    );
  }

  connect(userId: string | number): void {
    if (!this.socket.connected) {
      this.socket.connect();
      this.socket.emit('register', userId);
      console.log('Socket.io connected, user registered:', userId);
    }
  }

  disconnect(): void {
    if (this.socket.connected) {
      this.socket.disconnect();
      console.log('Socket.io disconnected');
    }
  }

  sendMessage(receiverId: string | number, content: string, senderId: string | number): void {
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      senderId,
      receiverId,
      content,
      timestamp: new Date().toISOString(),
      read: false,
    };

    this.sentMessagesSubject.next(tempMessage);

    // Pošalji preko Socket.io
    this.socket.emit('sendMessage', { senderId, receiverId, content });
  }

  getMessages(otherUserId: string | number): Observable<Message[]> {
    return this.http.get<Message[]>(
      `${environment.apiUrl}/messages/${otherUserId}`,
    );
  }

  markAsRead(otherUserId: string | number): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/messages/${otherUserId}/read`,
      {},
    );
  }

  getContacts(): Observable<number[]> {
    return this.http.get<number[]>(`${environment.apiUrl}/messages/contacts`);
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(
      `${environment.apiUrl}/messages/unread-count`,
    );
  }

  getUnreadCountForUser(otherUserId: string | number): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(
      `${environment.apiUrl}/messages/unread-count/${otherUserId}`,
    );
  }

  // Observable za typing indicator
  onUserTyping(): Observable<{ userId: string | number }> {
    return fromEvent<{ userId: string | number }>(this.socket, 'userTyping');
  }

  onUserStoppedTyping(): Observable<{ userId: string | number }> {
    return fromEvent<{ userId: string | number }>(this.socket, 'userStoppedTyping');
  }

  emitTyping(receiverId: string | number, senderId: string | number): void {
    this.socket.emit('typing', { senderId, receiverId });
  }

  emitStopTyping(receiverId: string | number, senderId: string | number): void {
    this.socket.emit('stopTyping', { senderId, receiverId });
  }
}
