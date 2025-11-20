import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AllergiesService } from '../application/allergies.service';
import { CreateAllergyDto } from '../application/dto/create-allergy.dto';
import { UpdateAllergyDto } from '../application/dto/update-allergy.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';

@ApiTags('Allergies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('allergies')
export class AllergiesController {
  constructor(private readonly allergiesService: AllergiesService) {}

  @Post()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Kreiranje nove alergije (Admin only)' })
  @ApiResponse({ status: 201, description: 'Alergija uspešno kreirana' })
  @ApiResponse({ status: 409, description: 'Alergija sa ovim imenom već postoji' })
  create(@Body() createAllergyDto: CreateAllergyDto) {
    return this.allergiesService.create(createAllergyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista svih alergija' })
  @ApiResponse({ status: 200, description: 'Lista alergija' })
  findAll() {
    return this.allergiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalji alergije po ID-u' })
  @ApiResponse({ status: 200, description: 'Detalji alergije' })
  @ApiResponse({ status: 404, description: 'Alergija nije pronađena' })
  findOne(@Param('id') id: string) {
    return this.allergiesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Ažuriranje alergije (Admin only)' })
  @ApiResponse({ status: 200, description: 'Alergija uspešno ažurirana' })
  @ApiResponse({ status: 404, description: 'Alergija nije pronađena' })
  update(@Param('id') id: string, @Body() updateAllergyDto: UpdateAllergyDto) {
    return this.allergiesService.update(id, updateAllergyDto);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Brisanje alergije (Admin only)' })
  @ApiResponse({ status: 200, description: 'Alergija uspešno obrisana' })
  @ApiResponse({ status: 404, description: 'Alergija nije pronađena' })
  async remove(@Param('id') id: string) {
    await this.allergiesService.remove(id);
    return { message: 'Alergija uspešno obrisana' };
  }
}
