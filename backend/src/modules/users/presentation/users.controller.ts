import { Controller, Get, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from '../application/users.service';
import { UpdateUserDto } from '../application/dto/update-user.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Lista svih korisnika (Admin only)' })
  @ApiResponse({ status: 200, description: 'Lista korisnika' })
  @ApiResponse({ status: 403, description: 'Nemate dozvolu' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: 'Profil trenutno ulogovanog korisnika' })
  @ApiResponse({ status: 200, description: 'Profil korisnika' })
  getProfile(@CurrentUser() user: any) {
    return this.usersService.findOne(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalji korisnika po ID-u' })
  @ApiResponse({ status: 200, description: 'Detalji korisnika' })
  @ApiResponse({ status: 404, description: 'Korisnik nije pronađen' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update korisnika (Admin ili sam korisnik)' })
  @ApiResponse({ status: 200, description: 'Korisnik uspešno ažuriran' })
  @ApiResponse({ status: 403, description: 'Nemate dozvolu' })
  @ApiResponse({ status: 404, description: 'Korisnik nije pronađen' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.update(id, updateUserDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Soft delete korisnika (Admin only)' })
  @ApiResponse({ status: 200, description: 'Korisnik deaktiviran' })
  @ApiResponse({ status: 404, description: 'Korisnik nije pronađen' })
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: 'Korisnik uspešno deaktiviran' };
  }
}
