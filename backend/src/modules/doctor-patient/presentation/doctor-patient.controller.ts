import { Controller, Get, Post, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DoctorPatientService } from '../application/doctor-patient.service';
import { AssignPatientDto } from '../application/dto/assign-patient.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';

@ApiTags('Doctor-Patient Links')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('doctor-patient')
export class DoctorPatientController {
  constructor(private readonly doctorPatientService: DoctorPatientService) {}

  @Post('assign')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Dodela pacijenta doktoru (Admin only)' })
  @ApiResponse({ status: 201, description: 'Pacijent uspešno dodeljen doktoru' })
  @ApiResponse({ status: 404, description: 'Doktor ili pacijent nije pronađen' })
  @ApiResponse({ status: 400, description: 'Korisnik nema odgovarajuću ulogu' })
  @ApiResponse({ status: 409, description: 'Pacijent je već dodeljen ovom doktoru' })
  @ApiResponse({ status: 403, description: 'Nemate dozvolu' })
  async assignPatient(@Body() assignPatientDto: AssignPatientDto) {
    const link = await this.doctorPatientService.assignPatientToDoctor(assignPatientDto);
    return {
      message: 'Pacijent uspešno dodeljen doktoru',
      link,
    };
  }

  @Get('links')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Lista svih veza doktor-pacijent (Admin only)' })
  @ApiResponse({ status: 200, description: 'Lista svih veza' })
  @ApiResponse({ status: 403, description: 'Nemate dozvolu' })
  findAllLinks() {
    return this.doctorPatientService.getAllLinks();
  }

  @Get('my-patients')
  @Roles(UserRole.Doctor)
  @ApiOperation({ summary: 'Lista pacijenata trenutnog doktora (Doctor only)' })
  @ApiResponse({ status: 200, description: 'Lista pacijenata' })
  @ApiResponse({ status: 404, description: 'Doktor nije pronađen' })
  getMyPatients(@CurrentUser() user: any) {
    return this.doctorPatientService.getDoctorPatients(user.id);
  }

  @Get('my-doctors')
  @Roles(UserRole.Patient)
  @ApiOperation({ summary: 'Lista doktora trenutnog pacijenta (Patient only)' })
  @ApiResponse({ status: 200, description: 'Lista doktora' })
  @ApiResponse({ status: 404, description: 'Pacijent nije pronađen' })
  getMyDoctors(@CurrentUser() user: any) {
    return this.doctorPatientService.getPatientDoctors(user.id);
  }

  @Get('doctor/:doctorId/patients')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Lista pacijenata određenog doktora (Admin only)' })
  @ApiResponse({ status: 200, description: 'Lista pacijenata' })
  @ApiResponse({ status: 404, description: 'Doktor nije pronađen' })
  getDoctorPatients(@Param('doctorId') doctorId: string) {
    return this.doctorPatientService.getDoctorPatients(doctorId);
  }

  @Get('patient/:patientId/doctors')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Lista doktora određenog pacijenta (Admin only)' })
  @ApiResponse({ status: 200, description: 'Lista doktora' })
  @ApiResponse({ status: 404, description: 'Pacijent nije pronađen' })
  getPatientDoctors(@Param('patientId') patientId: string) {
    return this.doctorPatientService.getPatientDoctors(patientId);
  }

  @Delete('remove')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Uklanjanje veze doktor-pacijent (Admin only)' })
  @ApiQuery({ name: 'doctorId', required: true, description: 'ID doktora' })
  @ApiQuery({ name: 'patientId', required: true, description: 'ID pacijenta' })
  @ApiResponse({ status: 200, description: 'Veza uspešno uklonjena' })
  @ApiResponse({ status: 404, description: 'Veza nije pronađena' })
  @ApiResponse({ status: 403, description: 'Nemate dozvolu' })
  async removeLink(
    @Query('doctorId') doctorId: string,
    @Query('patientId') patientId: string,
  ) {
    await this.doctorPatientService.removeLink(doctorId, patientId);
    return { message: 'Veza uspešno uklonjena' };
  }
}
