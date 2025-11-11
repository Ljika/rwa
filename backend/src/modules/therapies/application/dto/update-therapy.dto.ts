import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTherapyDto {
  @ApiPropertyOptional({ example: 'Upala grla, faringitis - revizija', description: 'Ažurirana dijagnoza' })
  @IsString()
  @IsOptional()
  diagnosis?: string;

  @ApiPropertyOptional({ example: 'Potrebna dodatna kontrola', description: 'Ažurirane napomene' })
  @IsString()
  @IsOptional()
  notes?: string;
}
