import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AppointmentTypesService } from './appointment-types.service';
import { CreateAppointmentTypeDto } from './dto/create-appointment-type.dto';
import { UpdateAppointmentTypeDto } from './dto/update-appointment-type.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { Specialization } from '../../common/enums/specialization.enum';

@Controller('appointment-types')
export class AppointmentTypesController {
  constructor(private readonly appointmentTypesService: AppointmentTypesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  create(@Body() createDto: CreateAppointmentTypeDto) {
    return this.appointmentTypesService.create(createDto);
  }

  @Get()
  findAll() {
    return this.appointmentTypesService.findAll();
  }

  @Get('by-specialization/:specialization')
  findBySpecialization(@Param('specialization') specialization: Specialization) {
    return this.appointmentTypesService.findBySpecialization(specialization);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentTypesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  update(@Param('id') id: string, @Body() updateDto: UpdateAppointmentTypeDto) {
    return this.appointmentTypesService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Admin)
  remove(@Param('id') id: string) {
    return this.appointmentTypesService.remove(id);
  }
}
