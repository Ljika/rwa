import { IsOptional, IsString, IsEnum, IsDateString, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../../common/enums/user-role.enum';
import { Gender } from '../../../../common/enums/gender.enum';
import { Specialization } from '../../../../common/enums/specialization.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Ana', description: 'Ime korisnika' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Petrović', description: 'Prezime korisnika' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: 'newpassword123', description: 'Novi password (minimum 6 karaktera)' })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ example: '0601234567', description: 'Broj telefona' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: '1995-05-15', description: 'Datum rođenja (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: Gender, example: Gender.Female, description: 'Pol korisnika' })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ enum: Specialization, example: Specialization.CARDIOLOGY, description: 'Specijalizacija (samo za doktore)' })
  @IsEnum(Specialization)
  @IsOptional()
  specialization?: Specialization;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.Doctor, description: 'Uloga korisnika (samo Admin može menjati)' })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
