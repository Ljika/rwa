import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PatientAllergiesService } from '../application/patient-allergies.service';
import { CreatePatientAllergyDto } from '../application/dto/create-patient-allergy.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';

@ApiTags('Patient Allergies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patient-allergies')
export class PatientAllergiesController {
  constructor(private readonly patientAllergiesService: PatientAllergiesService) {}

  @Get()
  @ApiOperation({ summary: 'Sve alergije svih pacijenata' })
  @ApiResponse({ status: 200, description: 'Lista svih alergija pacijenata' })
  findAll() {
    return this.patientAllergiesService.findAll();
  }

  @Post()
  @Roles(UserRole.Admin, UserRole.Doctor)
  @ApiOperation({ summary: 'Dodavanje alergije pacijentu (Admin/Doctor)' })
  @ApiResponse({ status: 201, description: 'Alergija uspešno dodata pacijentu' })
  @ApiResponse({ status: 400, description: 'Pacijent već ima ovu alergiju' })
  @ApiResponse({ status: 404, description: 'Pacijent ili alergija nije pronađena' })
  create(@Body() createPatientAllergyDto: CreatePatientAllergyDto) {
    return this.patientAllergiesService.create(createPatientAllergyDto);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Sve alergije jednog pacijenta' })
  @ApiResponse({ status: 200, description: 'Lista alergija pacijenta' })
  findByPatient(@Param('patientId') patientId: string) {
    return this.patientAllergiesService.findByPatient(patientId);
  }

  @Delete(':id')
  @Roles(UserRole.Admin, UserRole.Doctor)
  @ApiOperation({ summary: 'Uklanjanje alergije pacijenta (Admin/Doctor)' })
  @ApiResponse({ status: 200, description: 'Alergija uspešno uklonjena' })
  @ApiResponse({ status: 404, description: 'Alergija pacijenta nije pronađena' })
  async remove(@Param('id') id: string) {
    await this.patientAllergiesService.remove(id);
    return { message: 'Alergija pacijenta uspešno uklonjena' };
  }
}
