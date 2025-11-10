import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '../application/auth.service';
import { RegisterDto } from '../application/dto/register.dto';
import { LoginDto } from '../application/dto/login.dto';

@ApiTags('Auth') // Grupiše endpointe u Swagger-u
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registracija novog korisnika' })
  @ApiResponse({ status: 201, description: 'Korisnik uspešno registrovan' })
  @ApiResponse({ status: 409, description: 'Email je već registrovan' })
  @ApiResponse({ status: 400, description: 'Validaciona greška' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login korisnika' })
  @ApiResponse({ status: 200, description: 'Uspešan login' })
  @ApiResponse({ status: 401, description: 'Pogrešan email ili password' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
