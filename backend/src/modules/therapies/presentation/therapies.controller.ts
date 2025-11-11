import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TherapiesService } from '../application/therapies.service.js';
import { CreateTherapyDto } from '../application/dto/create-therapy.dto.js';
import { UpdateTherapyDto } from '../application/dto/update-therapy.dto.js';
import { AddDrugToTherapyDto } from '../application/dto/add-drug-to-therapy.dto.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { UserRole } from '../../../common/enums/user-role.enum.js';

@ApiTags('Therapies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('therapies')
export class TherapiesController {
  constructor(private readonly therapiesService: TherapiesService) {}

  @Post()
  @Roles(UserRole.Doctor)
  @ApiOperation({ summary: 'Kreiranje nove terapije za završeni termin (Doctor only)' })
  @ApiResponse({ status: 201, description: 'Terapija uspešno kreirana' })
  @ApiResponse({ status: 400, description: 'Nevažeći podaci' })
  @ApiResponse({ status: 403, description: 'Dozvoljeno samo doktorima' })
  create(@Body() createTherapyDto: CreateTherapyDto, @CurrentUser() user: any) {
    return this.therapiesService.create(createTherapyDto, user.id);
  }

  @Get()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Pregled svih terapija (Admin only)' })
  @ApiResponse({ status: 200, description: 'Lista svih terapija' })
  findAll() {
    return this.therapiesService.findAll();
  }

  @Get('my-therapies')
  @Roles(UserRole.Patient)
  @ApiOperation({ summary: 'Pregled mojih terapija - istorija (Patient only)' })
  @ApiResponse({ status: 200, description: 'Lista terapija pacijenta' })
  findMyTherapies(@CurrentUser() user: any) {
    return this.therapiesService.findByPatient(user.id);
  }

  @Get('my-prescribed-therapies')
  @Roles(UserRole.Doctor)
  @ApiOperation({ summary: 'Pregled terapija koje sam propisao (Doctor only)' })
  @ApiResponse({ status: 200, description: 'Lista propisanih terapija' })
  findMyPrescribedTherapies(@CurrentUser() user: any) {
    return this.therapiesService.findByDoctor(user.id);
  }

  @Get(':id')
  @Roles(UserRole.Doctor, UserRole.Patient, UserRole.Admin)
  @ApiOperation({ summary: 'Pregled detalja terapije' })
  @ApiResponse({ status: 200, description: 'Detalji terapije' })
  @ApiResponse({ status: 404, description: 'Terapija nije pronađena' })
  findOne(@Param('id') id: string) {
    return this.therapiesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.Doctor, UserRole.Admin)
  @ApiOperation({ summary: 'Ažuriranje dijagnoze ili napomene (Doctor/Admin)' })
  @ApiResponse({ status: 200, description: 'Terapija uspešno ažurirana' })
  @ApiResponse({ status: 403, description: 'Možete ažurirati samo svoje terapije' })
  update(
    @Param('id') id: string,
    @Body() updateTherapyDto: UpdateTherapyDto,
    @CurrentUser() user: any,
  ) {
    return this.therapiesService.update(id, updateTherapyDto, user.id, user.role);
  }

  @Post(':id/drugs')
  @Roles(UserRole.Doctor, UserRole.Admin)
  @ApiOperation({ summary: 'Dodavanje leka u postojeću terapiju (Doctor/Admin)' })
  @ApiResponse({ status: 200, description: 'Lek uspešno dodat' })
  @ApiResponse({ status: 400, description: 'Lek već postoji u terapiji' })
  @ApiResponse({ status: 403, description: 'Možete menjati samo svoje terapije' })
  addDrug(
    @Param('id') id: string,
    @Body() addDrugDto: AddDrugToTherapyDto,
    @CurrentUser() user: any,
  ) {
    return this.therapiesService.addDrug(id, addDrugDto, user.id, user.role);
  }

  @Delete(':id/drugs/:drugId')
  @Roles(UserRole.Doctor, UserRole.Admin)
  @ApiOperation({ summary: 'Uklanjanje leka iz terapije (Doctor/Admin)' })
  @ApiResponse({ status: 200, description: 'Lek uspešno uklonjen' })
  @ApiResponse({ status: 404, description: 'Lek nije deo terapije' })
  @ApiResponse({ status: 403, description: 'Možete menjati samo svoje terapije' })
  removeDrug(
    @Param('id') id: string,
    @Param('drugId') drugId: string,
    @CurrentUser() user: any,
  ) {
    return this.therapiesService.removeDrug(id, drugId, user.id, user.role);
  }

  @Delete(':id')
  @Roles(UserRole.Doctor, UserRole.Admin)
  @ApiOperation({ summary: 'Brisanje terapije (Doctor/Admin)' })
  @ApiResponse({ status: 200, description: 'Terapija uspešno obrisana' })
  @ApiResponse({ status: 403, description: 'Možete brisati samo svoje terapije' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.therapiesService.remove(id, user.id, user.role);
  }
}
