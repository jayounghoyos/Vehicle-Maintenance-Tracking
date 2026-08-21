import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { hashPassword } from '../auth/password';
import { User, UserRole } from '../entities';
import type { CreateWorkerDto } from './dto';

export type TeamMember = {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: Date;
};

@Injectable()
export class TeamService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async list(organizationId: number): Promise<TeamMember[]> {
    const rows = await this.users.find({
      where: { organizationId },
      order: { createdAt: 'ASC' },
    });
    // password_hash is never in the shape this returns
    return rows.map(({ id, fullName, email, role, createdAt }) => ({
      id,
      fullName,
      email,
      role,
      createdAt,
    }));
  }

  async create(organizationId: number, dto: CreateWorkerDto): Promise<TeamMember> {
    const taken = await this.users.findOne({ where: { email: dto.email } });
    if (taken) throw new ConflictException('That email is already registered');

    const user = await this.users.save(
      this.users.create({
        organizationId,
        fullName: dto.fullName,
        email: dto.email,
        passwordHash: await hashPassword(dto.password),
        role: dto.role,
      }),
    );
    const { id, fullName, email, role, createdAt } = user;
    return { id, fullName, email, role, createdAt };
  }

  async remove(organizationId: number, actingUserId: number, id: number): Promise<void> {
    if (id === actingUserId) {
      throw new BadRequestException('You cannot remove your own account');
    }
    // scoped by organization, so an id from another client matches nothing
    const result = await this.users.delete({ id, organizationId });
    if (!result.affected) throw new ConflictException('No such team member');
  }
}
