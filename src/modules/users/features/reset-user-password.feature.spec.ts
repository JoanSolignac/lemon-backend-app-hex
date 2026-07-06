import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { ResetUserPasswordFeature } from './reset-user-password.feature';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserStatus, Role } from '@prisma/client';
import { UserNotFoundException } from '../exceptions/user-not-found.exception';

jest.mock('argon2');

describe('ResetUserPasswordFeature', () => {
  let feature: ResetUserPasswordFeature;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResetUserPasswordFeature,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    feature = module.get<ResetUserPasswordFeature>(ResetUserPasswordFeature);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(feature).toBeDefined();
  });

  it('should reset user password to email and hash it', async () => {
    const mockUser = {
      id: 'user-id',
      email: 'test@lemon.com',
      status: UserStatus.ACTIVE,
      role: Role.SUPERVISOR,
    };

    mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
    (argon2.hash as jest.Mock).mockResolvedValue('hashed-email-password');
    mockPrismaService.user.update.mockResolvedValue({
      ...mockUser,
      hashedPassword: 'hashed-email-password',
    });

    await feature.execute('user-id');

    expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-id' },
    });
    expect(argon2.hash).toHaveBeenCalledWith('test@lemon.com');
    expect(mockPrismaService.user.update).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: expect.objectContaining({
        hashedPassword: 'hashed-email-password',
      }),
    });
  });

  it('should throw UserNotFoundException if user does not exist', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(null);

    await expect(feature.execute('non-existent-id')).rejects.toThrow(
      UserNotFoundException,
    );
  });
});
