import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../../common/enums/user-role.enum';
import { Gender } from '../../../../common/enums/gender.enum';

export class RegisterDto {
  @ApiProperty({ example: 'ana@example.com', description: 'Email adresa korisnika' })
  @IsEmail({}, { message: 'Email mora biti validan' })
  @IsNotEmpty({ message: 'Email je obavezan' })
  email: string;

  @ApiProperty({ example: 'test123', description: 'Password (minimum 6 karaktera)' })
  @IsString()
  @MinLength(6, { message: 'Password mora imati minimum 6 karaktera' })
  @IsNotEmpty({ message: 'Password je obavezan' })
  password: string;

  @ApiProperty({ example: 'Ana', description: 'Ime korisnika' })
  @IsString()
  @IsNotEmpty({ message: 'Ime je obavezno' })
  firstName: string;

  @ApiProperty({ example: 'Petrović', description: 'Prezime korisnika' })
  @IsString()
  @IsNotEmpty({ message: 'Prezime je obavezno' })
  lastName: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.Patient, description: 'Uloga korisnika' })
  @IsEnum(UserRole, { message: 'Uloga mora biti Patient, Doctor ili Admin' })
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ example: '0601234567', description: 'Broj telefona' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: '1995-05-15', description: 'Datum rođenja (YYYY-MM-DD)' })
  @IsDateString({}, { message: 'Datum mora biti u formatu YYYY-MM-DD' })
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: Gender, example: Gender.Female, description: 'Pol korisnika' })
  @IsEnum(Gender, { message: 'Pol mora biti Male, Female ili Other' })
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ example: 'Kardiolog', description: 'Specijalizacija (samo za doktore)' })
  @IsString()
  @IsOptional()
  specialization?: string;
}
