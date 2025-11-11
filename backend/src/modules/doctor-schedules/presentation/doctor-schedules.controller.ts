import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DoctorSchedulesService } from '../application/doctor-schedules.service';
import { CreateDoctorScheduleDto } from '../application/dto/create-doctor-schedule.dto';
import { UpdateDoctorScheduleDto } from '../application/dto/update-doctor-schedule.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';

@ApiTags('Doctor Schedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('doctor-schedules')
export class DoctorSchedulesController {
  constructor(private readonly schedulesService: DoctorSchedulesService) {}

  @Post()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Admin dodeljuje smenu doktoru' })
  @ApiResponse({ status: 201, description: 'Smena uspešno kreirana' })
  @ApiResponse({ status: 409, description: 'Doktor već ima smenu za taj dan' })
  create(@Body() createScheduleDto: CreateDoctorScheduleDto) {
    return this.schedulesService.create(createScheduleDto);
  }

  @Get()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Admin vidi sve smene' })
  @ApiResponse({ status: 200, description: 'Lista svih smena' })
  findAll() {
    return this.schedulesService.findAll();
  }

  @Get('doctor/:doctorId')
  @Roles(UserRole.Admin, UserRole.Doctor, UserRole.Patient)
  @ApiOperation({ summary: 'Prikaži sve smene određenog doktora' })
  @ApiResponse({ status: 200, description: 'Lista smena doktora' })
  findByDoctor(@Param('doctorId') doctorId: string) {
    return this.schedulesService.findByDoctor(doctorId);
  }

  @Get('doctor/:doctorId/date')
  @Roles(UserRole.Admin, UserRole.Doctor, UserRole.Patient)
  @ApiOperation({ summary: 'Proveri da li doktor radi određenog dana' })
  @ApiQuery({ name: 'date', example: '2025-11-15', description: 'Datum (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Smena za taj dan' })
  @ApiResponse({ status: 404, description: 'Doktor ne radi tog dana' })
  findByDoctorAndDate(
    @Param('doctorId') doctorId: string,
    @Query('date') date: string,
  ) {
    return this.schedulesService.findByDoctorAndDate(doctorId, date);
  }

  @Get(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Detalji smene' })
  @ApiResponse({ status: 200, description: 'Detalji smene' })
  @ApiResponse({ status: 404, description: 'Smena nije pronađena' })
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Ažuriranje smene' })
  @ApiResponse({ status: 200, description: 'Smena uspešno ažurirana' })
  update(
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateDoctorScheduleDto,
  ) {
    return this.schedulesService.update(id, updateScheduleDto);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Brisanje smene' })
  @ApiResponse({ status: 200, description: 'Smena uspešno obrisana' })
  remove(@Param('id') id: string) {
    return this.schedulesService.remove(id);
  }
}
