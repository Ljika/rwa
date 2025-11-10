import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ManufacturersService } from '../application/manufacturers.service';
import { CreateManufacturerDto } from '../application/dto/create-manufacturer.dto';
import { UpdateManufacturerDto } from '../application/dto/update-manufacturer.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';

@ApiTags('Manufacturers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('manufacturers')
export class ManufacturersController {
  constructor(private readonly manufacturersService: ManufacturersService) {}

  @Post()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Kreiranje novog proizvođača (Admin only)' })
  @ApiResponse({ status: 201, description: 'Proizvođač uspešno kreiran' })
  @ApiResponse({ status: 409, description: 'Proizvođač sa ovim imenom već postoji' })
  @ApiResponse({ status: 403, description: 'Nemate dozvolu' })
  create(@Body() createManufacturerDto: CreateManufacturerDto) {
    return this.manufacturersService.create(createManufacturerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista svih aktivnih proizvođača' })
  @ApiResponse({ status: 200, description: 'Lista proizvođača' })
  findAll() {
    return this.manufacturersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalji proizvođača sa svim lekovima' })
  @ApiResponse({ status: 200, description: 'Detalji proizvođača' })
  @ApiResponse({ status: 404, description: 'Proizvođač nije pronađen' })
  findOne(@Param('id') id: string) {
    return this.manufacturersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Ažuriranje proizvođača (Admin only)' })
  @ApiResponse({ status: 200, description: 'Proizvođač uspešno ažuriran' })
  @ApiResponse({ status: 404, description: 'Proizvođač nije pronađen' })
  @ApiResponse({ status: 409, description: 'Proizvođač sa ovim imenom već postoji' })
  @ApiResponse({ status: 403, description: 'Nemate dozvolu' })
  update(@Param('id') id: string, @Body() updateManufacturerDto: UpdateManufacturerDto) {
    return this.manufacturersService.update(id, updateManufacturerDto);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Soft delete proizvođača (Admin only)' })
  @ApiResponse({ status: 200, description: 'Proizvođač deaktiviran' })
  @ApiResponse({ status: 404, description: 'Proizvođač nije pronađen' })
  @ApiResponse({ status: 403, description: 'Nemate dozvolu' })
  async remove(@Param('id') id: string) {
    await this.manufacturersService.remove(id);
    return { message: 'Proizvođač uspešno deaktiviran' };
  }
}
