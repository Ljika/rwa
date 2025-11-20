import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DrugAllergiesService } from '../application/drug-allergies.service';
import { CreateDrugAllergyDto } from '../application/dto/create-drug-allergy.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';

@ApiTags('Drug Allergies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('drug-allergies')
export class DrugAllergiesController {
  constructor(private readonly drugAllergiesService: DrugAllergiesService) {}

  @Post()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Povezivanje alergije sa lekom (Admin only)' })
  @ApiResponse({ status: 201, description: 'Alergija uspešno povezana sa lekom' })
  @ApiResponse({ status: 400, description: 'Lek već ima povezanu ovu alergiju' })
  @ApiResponse({ status: 404, description: 'Lek ili alergija nije pronađena' })
  create(@Body() createDrugAllergyDto: CreateDrugAllergyDto) {
    return this.drugAllergiesService.create(createDrugAllergyDto);
  }

  @Get('drug/:drugId')
  @ApiOperation({ summary: 'Sve alergije povezane sa lekom' })
  @ApiResponse({ status: 200, description: 'Lista alergija leka' })
  findByDrug(@Param('drugId') drugId: string) {
    return this.drugAllergiesService.findByDrug(drugId);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Uklanjanje alergije sa leka (Admin only)' })
  @ApiResponse({ status: 200, description: 'Alergija uspešno uklonjena sa leka' })
  @ApiResponse({ status: 404, description: 'Alergija leka nije pronađena' })
  async remove(@Param('id') id: string) {
    await this.drugAllergiesService.remove(id);
    return { message: 'Alergija leka uspešno uklonjena' };
  }
}
