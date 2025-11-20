import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAllergyDto {
  @ApiProperty({ description: 'Naziv alergije', example: 'Penicilin' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}
