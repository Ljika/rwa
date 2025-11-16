import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { ChatService, Message } from '../../../core/services/chat.service';
import { UsersService } from '../../../core/services/users.service';
import { DoctorPatientService } from '../../../core/services/doctor-patient.service';
import { selectUser } from '../../../store/auth/auth.selectors';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

interface UserContact {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  unreadCount: number;
  lastMessageTime?: Date;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  currentUser$!: any;
  currentUser: any;
  isOpen = false;
  contacts: UserContact[] = [];
  selectedContact: UserContact | null = null;
  messages: Message[] = [];
  messageInput = '';

  private destroy$ = new Subject<void>();

  constructor(
    private chatService: ChatService,
    private usersService: UsersService,
    private doctorPatientService: DoctorPatientService,
    private store: Store,
  ) {}

  ngOnInit(): void {
    // Inicijalizuj observable
    this.currentUser$ = this.store.select(selectUser);
    
    // Učitaj trenutnog korisnika
    this.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((user: any) => {
      if (user) {
        this.currentUser = user;
        this.chatService.connect(user.id); // ID je string (UUID)
        this.loadContacts();
      }
    });

    // Slušaj nove poruke iz MERGE operatora
    this.chatService.allMessages$
      .pipe(
        takeUntil(this.destroy$),
      )
      .subscribe((message: Message) => {
        const currentUserId = this.currentUser.id;
        
        // Ako je trenutni chat otvoren i poruka je za taj chat
        if (this.selectedContact &&
          ((message.senderId === currentUserId &&
            message.receiverId === this.selectedContact.id) ||
          (message.senderId === this.selectedContact.id &&
            message.receiverId === currentUserId))) {
          
          // Dodaj poruku samo ako već ne postoji (prevent duplicates)
          if (!this.messages.find((m) => m.id === message.id)) {
            this.messages.push(message);
            this.scrollToBottom();

            // Označi kao pročitano ako je primljena
            if (message.receiverId === currentUserId) {
              this.chatService.markAsRead(message.senderId).subscribe();
            }
          }

          // Ažuriraj lastMessageTime za selektovani kontakt
          if (this.selectedContact) {
            this.updateContactLastMessageTime(this.selectedContact.id, new Date(message.timestamp));
          }
        } else if (message.receiverId === currentUserId) {
          // Poruka je stigla od nekog ko nije trenutno selektovan - ažuriraj badge
          const contactIndex = this.contacts.findIndex((c) => c.id === message.senderId.toString());
          if (contactIndex !== -1) {
            this.contacts[contactIndex].unreadCount++;
            this.updateContactLastMessageTime(message.senderId.toString(), new Date(message.timestamp));
          }
        } else if (message.senderId === currentUserId) {
          // Ažuriraj lastMessageTime kada šaljemo poruku
          this.updateContactLastMessageTime(message.receiverId.toString(), new Date(message.timestamp));
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chatService.disconnect();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  async loadContacts(): Promise<void> {
    try {
      // Učitaj kontakte na osnovu role korisnika
      if (this.currentUser.role === 'Doctor') {
        // Za doktora učitaj njegove pacijente
        const patients = await this.doctorPatientService.getMyPatients();
        this.contacts = await Promise.all(
          patients.map(async (p: any) => {
            const unreadData = await this.chatService
              .getUnreadCountForUser(p.id)
              .toPromise();
            const messages = await this.chatService.getMessages(p.id).toPromise();
            const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;
            return {
              id: p.id,
              firstName: p.firstName,
              lastName: p.lastName,
              role: p.role,
              unreadCount: unreadData?.count || 0,
              lastMessageTime: lastMessage ? new Date(lastMessage.timestamp) : undefined,
            };
          })
        );
        this.sortContacts();
      } else if (this.currentUser.role === 'Patient') {
        // Za pacijenta učitaj njegove doktore
        const doctors = await this.doctorPatientService.getMyDoctors();
        this.contacts = await Promise.all(
          doctors.map(async (d: any) => {
            const unreadData = await this.chatService
              .getUnreadCountForUser(d.id)
              .toPromise();
            const messages = await this.chatService.getMessages(d.id).toPromise();
            const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;
            return {
              id: d.id,
              firstName: d.firstName,
              lastName: d.lastName,
              role: d.role,
              unreadCount: unreadData?.count || 0,
              lastMessageTime: lastMessage ? new Date(lastMessage.timestamp) : undefined,
            };
          })
        );
        this.sortContacts();
      } else if (this.currentUser.role === 'Admin') {
        // Admin može da priča sa svima - učitaj sve korisnike
        this.usersService.getAllUsers().subscribe({
          next: async (users: any[]) => {
            this.contacts = await Promise.all(
              users
                .filter((u: any) => u.id !== this.currentUser.id)
                .map(async (u: any) => {
                  const unreadData = await this.chatService
                    .getUnreadCountForUser(u.id)
                    .toPromise();
                  const messages = await this.chatService.getMessages(u.id).toPromise();
                  const lastMessage = messages && messages.length > 0 ? messages[messages.length - 1] : null;
                  return {
                    id: u.id,
                    firstName: u.firstName,
                    lastName: u.lastName,
                    role: u.role,
                    unreadCount: unreadData?.count || 0,
                    lastMessageTime: lastMessage ? new Date(lastMessage.timestamp) : undefined,
                  };
                })
            );
            this.sortContacts();
          },
          error: (err: any) => console.error('Error loading users:', err),
        });
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  }

  selectContact(contact: UserContact): void {
    this.selectedContact = contact;
    this.messages = [];

    // Učitaj istoriju poruka
    this.chatService.getMessages(contact.id).subscribe((messages: Message[]) => {
      this.messages = messages;
      this.scrollToBottom();

      // Označi kao pročitano i resetuj unread count
      this.chatService.markAsRead(contact.id).subscribe(() => {
        // Resetuj badge za ovaj kontakt
        const contactIndex = this.contacts.findIndex((c) => c.id === contact.id);
        if (contactIndex !== -1) {
          this.contacts[contactIndex].unreadCount = 0;
        }
      });
    });
  }

  onTextareaInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage(): void {
    if (!this.messageInput.trim() || !this.selectedContact) return;

    this.chatService.sendMessage(
      this.selectedContact.id,
      this.messageInput,
      this.currentUser.id,
    );

    this.messageInput = '';
    this.resetTextareaHeight();
    this.scrollToBottom();
  }

  private resetTextareaHeight(): void {
    setTimeout(() => {
      const textarea = document.querySelector('.message-input') as HTMLTextAreaElement;
      if (textarea) {
        textarea.style.height = 'auto';
      }
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  private updateContactLastMessageTime(contactId: string, timestamp: Date): void {
    const contact = this.contacts.find(c => c.id === contactId);
    if (contact) {
      contact.lastMessageTime = new Date(timestamp);
      this.sortContacts();
    }
  }

  private sortContacts(): void {
    this.contacts.sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA; // Najnoviji prvi
    });
  }

  getContactInitials(contact: UserContact): string {
    return `${contact.firstName[0]}${contact.lastName[0]}`.toUpperCase();
  }

  isMyMessage(message: Message): boolean {
    return message.senderId === this.currentUser.id;
  }
}
