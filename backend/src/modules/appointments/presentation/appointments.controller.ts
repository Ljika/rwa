import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AppointmentsService } from '../application/appointments.service.js';
import { CreateAppointmentDto } from '../application/dto/create-appointment.dto.js';
import { UpdateAppointmentDto } from '../application/dto/update-appointment.dto.js';
import { UpdateAppointmentStatusDto } from '../application/dto/update-appointment-status.dto.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { UserRole } from '../../../common/enums/user-role.enum.js';

@ApiTags('Appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(UserRole.Patient)
  @ApiOperation({ summary: 'Pacijent kreira termin kod dodeljenog doktora' })
  @ApiResponse({ status: 201, description: 'Termin uspešno kreiran' })
  @ApiResponse({ status: 403, description: 'Pacijent nije dodeljen ovom doktoru' })
  create(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @CurrentUser() user: any,
  ) {
    return this.appointmentsService.create(createAppointmentDto, user.id);
  }

  @Get()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Admin vidi sve termine' })
  @ApiResponse({ status: 200, description: 'Lista svih termina' })
  findAll() {
    return this.appointmentsService.findAll();
  }

  @Get('my-appointments')
  @Roles(UserRole.Patient)
  @ApiOperation({ summary: 'Pacijent vidi svoje termine' })
  @ApiResponse({ status: 200, description: 'Lista mojih termina' })
  findMyAppointmentsAsPatient(@CurrentUser() user: any) {
    return this.appointmentsService.findMyAppointmentsAsPatient(user.id);
  }

  @Get('my-patients-appointments')
  @Roles(UserRole.Doctor)
  @ApiOperation({ summary: 'Doktor vidi termine svojih pacijenata' })
  @ApiResponse({ status: 200, description: 'Lista termina mojih pacijenata' })
  findMyAppointmentsAsDoctor(@CurrentUser() user: any) {
    return this.appointmentsService.findMyAppointmentsAsDoctor(user.id);
  }

  @Get('available-slots')
  @Roles(UserRole.Patient, UserRole.Doctor, UserRole.Admin)
  @ApiOperation({ summary: 'Prikaži sve slobodne termine doktora za određeni dan' })
  @ApiQuery({ name: 'doctorId', example: 'uuid-doktora', description: 'ID doktora' })
  @ApiQuery({ name: 'date', example: '2025-11-15', description: 'Datum (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Lista slobodnih termina (TimeSlot[])' })
  getAvailableSlots(
    @Query('doctorId') doctorId: string,
    @Query('date') date: string,
  ) {
    return this.appointmentsService.getAvailableSlots(doctorId, date);
  }

  @Get(':id')
  @Roles(UserRole.Admin, UserRole.Doctor, UserRole.Patient)
  @ApiOperation({ summary: 'Detalji termina' })
  @ApiResponse({ status: 200, description: 'Detalji termina' })
  @ApiResponse({ status: 404, description: 'Termin nije pronađen' })
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.Patient, UserRole.Admin)
  @ApiOperation({ summary: 'Ažuriranje termina (Patient ili Admin)' })
  @ApiResponse({ status: 200, description: 'Termin uspešno ažuriran' })
  @ApiResponse({ status: 403, description: 'Nemate pravo da ažurirate ovaj termin' })
  update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @CurrentUser() user: any,
  ) {
    return this.appointmentsService.update(id, updateAppointmentDto, user.id, user.role);
  }

  @Patch(':id/status')
  @Roles(UserRole.Doctor, UserRole.Patient, UserRole.Admin)
  @ApiOperation({ summary: 'Promena statusa termina' })
  @ApiResponse({ status: 200, description: 'Status uspešno promenjen' })
  @ApiResponse({ status: 403, description: 'Nemate pravo da menjate status' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateAppointmentStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.appointmentsService.updateStatus(id, updateStatusDto, user.id, user.role);
  }

  @Delete(':id')
  @Roles(UserRole.Patient, UserRole.Admin)
  @ApiOperation({ summary: 'Brisanje termina (Patient ili Admin)' })
  @ApiResponse({ status: 200, description: 'Termin uspešno obrisan' })
  @ApiResponse({ status: 403, description: 'Nemate pravo da obrišete ovaj termin' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.appointmentsService.remove(id, user.id, user.role);
  }
}
