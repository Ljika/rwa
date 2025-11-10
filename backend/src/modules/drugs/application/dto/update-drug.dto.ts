import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DrugType } from '../../../../common/enums/drug-type.enum';

export class UpdateDrugDto {
  @ApiPropertyOptional({ example: 'Brufen 400', description: 'Ime leka' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: DrugType, example: DrugType.Capsule, description: 'Tip leka' })
  @IsEnum(DrugType)
  @IsOptional()
  type?: DrugType;

  @ApiPropertyOptional({ example: '600mg', description: 'Doziranje leka' })
  @IsString()
  @IsOptional()
  dosage?: string;

  @ApiPropertyOptional({ example: 'Ažuriran opis leka', description: 'Opis leka' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'uuid-proizvođača', description: 'ID proizvođača leka' })
  @IsUUID('4')
  @IsOptional()
  manufacturerId?: string;
}
