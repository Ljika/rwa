import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDrugAllergyDto {
  @ApiProperty({ description: 'ID leka' })
  @IsUUID()
  drugId: string;

  @ApiProperty({ description: 'ID alergije' })
  @IsUUID()
  allergyId: string;
}
