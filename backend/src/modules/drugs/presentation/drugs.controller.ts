import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DrugsService } from '../application/drugs.service';
import { CreateDrugDto } from '../application/dto/create-drug.dto';
import { UpdateDrugDto } from '../application/dto/update-drug.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';

@ApiTags('Drugs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('drugs')
export class DrugsController {
  constructor(private readonly drugsService: DrugsService) {}

  @Post()
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Kreiranje novog leka (Admin only)' })
  @ApiResponse({ status: 201, description: 'Lek uspešno kreiran' })
  @ApiResponse({ status: 404, description: 'Proizvođač nije pronađen' })
  @ApiResponse({ status: 409, description: 'Lek sa ovim imenom već postoji' })
  @ApiResponse({ status: 403, description: 'Nemate dozvolu' })
  create(@Body() createDrugDto: CreateDrugDto) {
    return this.drugsService.create(createDrugDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista svih lekova' })
  @ApiQuery({ name: 'manufacturerId', required: false, description: 'Filter po proizvođaču' })
  @ApiResponse({ status: 200, description: 'Lista lekova' })
  findAll(@Query('manufacturerId') manufacturerId?: string) {
    if (manufacturerId) {
      return this.drugsService.findByManufacturer(manufacturerId);
    }
    return this.drugsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalji leka' })
  @ApiResponse({ status: 200, description: 'Detalji leka' })
  @ApiResponse({ status: 404, description: 'Lek nije pronađen' })
  findOne(@Param('id') id: string) {
    return this.drugsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Ažuriranje leka (Admin only)' })
  @ApiResponse({ status: 200, description: 'Lek uspešno ažuriran' })
  @ApiResponse({ status: 404, description: 'Lek ili proizvođač nije pronađen' })
  @ApiResponse({ status: 409, description: 'Lek sa ovim imenom već postoji' })
  @ApiResponse({ status: 403, description: 'Nemate dozvolu' })
  update(@Param('id') id: string, @Body() updateDrugDto: UpdateDrugDto) {
    return this.drugsService.update(id, updateDrugDto);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Brisanje leka (Admin only)' })
  @ApiResponse({ status: 200, description: 'Lek obrisan' })
  @ApiResponse({ status: 404, description: 'Lek nije pronađen' })
  @ApiResponse({ status: 403, description: 'Nemate dozvolu' })
  async remove(@Param('id') id: string) {
    await this.drugsService.remove(id);
    return { message: 'Lek uspešno obrisan' };
  }
}
