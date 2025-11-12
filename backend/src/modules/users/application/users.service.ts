import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../../database/entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'phoneNumber', 'dateOfBirth', 'gender', 'specialization', 'isActive', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }


  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'phoneNumber', 'dateOfBirth', 'gender', 'specialization', 'isActive', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw new NotFoundException('Korisnik nije pronađen');
    }

    return user;
  }


  async update(id: string, updateUserDto: UpdateUserDto, currentUser: any): Promise<User> {
    const user = await this.findOne(id);

    // Provera dozvola: Admin može sve, ostali samo sebe
    if (currentUser.role !== 'Admin' && currentUser.id !== id) {
      throw new ForbiddenException('Nemate dozvolu za izmenu ovog korisnika');
    }

    // Samo Admin može menjati role
    if (updateUserDto.role && currentUser.role !== 'Admin') {
      throw new ForbiddenException('Samo Admin može menjati ulogu korisnika');
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }


  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.isActive = false;
    await this.userRepository.save(user);
  }
}
