import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { CreateUserFeature } from './features/create-user.feature';
import { FindUserByIdFeature } from './features/find-user-by-id.feature';
import { FindUserByEmailFeature } from './features/find-user-by-email.feature';
import { GetAllUsersPaginatedFeature } from './features/get-all-users-paginated.feature';
import { UpdateUserProfileFeature } from './features/update-user-profile.feature';
import { UpdateUserPasswordFeature } from './features/update-user-password.feature';
import { UpdateUserRoleFeature } from './features/update-user-role.feature';
import { ActivateUserFeature } from './features/activate-user.feature';
import { DeactivateUserFeature } from './features/deactivate-user.feature';
import { ResetUserPasswordFeature } from './features/reset-user-password.feature';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [UsersController],
  providers: [
    CreateUserFeature,
    FindUserByIdFeature,
    FindUserByEmailFeature,
    GetAllUsersPaginatedFeature,
    UpdateUserProfileFeature,
    UpdateUserPasswordFeature,
    UpdateUserRoleFeature,
    ActivateUserFeature,
    DeactivateUserFeature,
    ResetUserPasswordFeature,
  ],
})
export class UsersModule {}
