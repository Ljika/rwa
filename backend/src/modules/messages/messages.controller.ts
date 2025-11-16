import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('contacts')
  async getContacts(@CurrentUser() user: any) {
    return this.messagesService.getUserContacts(user.id);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.messagesService.getUnreadCount(user.id);
    return { count };
  }

  @Get('unread-count/:userId')
  async getUnreadCountForUser(
    @CurrentUser() user: any,
    @Param('userId') otherUserId: string,
  ) {
    const count = await this.messagesService.getUnreadCountForUser(
      user.id,
      otherUserId,
    );
    return { count };
  }

  @Get(':userId')
  async getMessages(
    @CurrentUser() user: any,
    @Param('userId') otherUserId: string,
  ) {
    return this.messagesService.getMessages(user.id, otherUserId);
  }

  @Post(':userId/read')
  async markAsRead(
    @CurrentUser() user: any,
    @Param('userId') otherUserId: string,
  ) {
    await this.messagesService.markAsRead(user.id, otherUserId, user.id);
    return { success: true };
  }
}
