import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../../prisma/prisma.service';
import { ensureUserById } from '../utils/user.util';

@Injectable()
export class ResetUserPasswordFeature {
  constructor(private readonly prisma: PrismaService) {}

  async execute(id: string): Promise<void> {
    const user = await ensureUserById(this.prisma, id);

    const hashedPassword = await argon2.hash(user.email);

    await this.prisma.user.update({
      where: { id },
      data: {
        hashedPassword,
        updatedAt: new Date(),
      },
    });
  }
}
