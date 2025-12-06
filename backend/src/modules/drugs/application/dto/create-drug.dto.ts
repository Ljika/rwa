import { IsString, IsNotEmpty, IsEnum, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DrugType } from '../../../../common/enums/drug-type.enum';

export class CreateDrugDto {
  @ApiProperty({ example: 'Brufen', description: 'Ime leka' })
  @IsString()
  @IsNotEmpty({ message: 'Ime leka je obavezno' })
  name: string;

  @ApiProperty({ enum: DrugType, example: DrugType.Tablet, description: 'Tip leka' })
  @IsEnum(DrugType, { message: 'Tip leka mora biti validan' })
  @IsNotEmpty({ message: 'Tip leka je obavezan' })
  type: DrugType;

  @ApiProperty({ example: '400mg', description: 'Doziranje leka' })
  @IsString()
  @IsNotEmpty({ message: 'Doziranje je obavezno' })
  dosage: string;

  @ApiPropertyOptional({ example: 'Lek za smanjenje bola i temperature', description: 'Opis leka' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'uuid-proizvođača', description: 'ID proizvođača leka' })
  @IsUUID('all', { message: 'ID proizvođača mora biti validan UUID' })
  @IsNotEmpty({ message: 'ID proizvođača je obavezan' })
  manufacturerId: string;
}
