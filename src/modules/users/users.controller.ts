import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UseAuth } from '../auth/decorators/use-auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthCurrentUser } from '../../common/interfaces/auth-current-user.interface';
import { ListUsersQueryDto } from './dtos/request/list-users.query.dto';
import { CreateUserRequestDto } from './dtos/request/create-user.request.dto';
import { UpdateUserProfileRequestDto } from './dtos/request/update-user-profile.request.dto';
import { UpdateUserPasswordRequestDto } from './dtos/request/update-user-password.request.dto';
import { UpdateUserRoleRequestDto } from './dtos/request/update-user-role.request.dto';
import { UserResponseDto } from './dtos/response/user.response.dto';
import { UserPaginatedResponseDto } from './dtos/response/user-paginated.response.dto';
import { CreateUserFeature } from './features/create-user.feature';
import { FindUserByIdFeature } from './features/find-user-by-id.feature';
import { GetAllUsersPaginatedFeature } from './features/get-all-users-paginated.feature';
import { UpdateUserProfileFeature } from './features/update-user-profile.feature';
import { UpdateUserPasswordFeature } from './features/update-user-password.feature';
import { UpdateUserRoleFeature } from './features/update-user-role.feature';
import { ActivateUserFeature } from './features/activate-user.feature';
import { DeactivateUserFeature } from './features/deactivate-user.feature';
import { ResetUserPasswordFeature } from './features/reset-user-password.feature';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUser: CreateUserFeature,
    private readonly findUserById: FindUserByIdFeature,
    private readonly getAllUsersPaginated: GetAllUsersPaginatedFeature,
    private readonly updateUserProfile: UpdateUserProfileFeature,
    private readonly updateUserPassword: UpdateUserPasswordFeature,
    private readonly updateUserRole: UpdateUserRoleFeature,
    private readonly activateUser: ActivateUserFeature,
    private readonly deactivateUser: DeactivateUserFeature,
    private readonly resetUserPassword: ResetUserPasswordFeature,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiBody({ type: CreateUserRequestDto })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 409, description: 'El email ya existe' })
  @UseAuth(Role.ADMINISTRADOR)
  async create(@Body() dto: CreateUserRequestDto): Promise<void> {
    await this.createUser.execute({
      role: dto.role,
      name: dto.name,
      email: dto.email,
      password: dto.password,
    });
  }

  @Get('/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @UseAuth(Role.ADMINISTRADOR)
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UserResponseDto> {
    return this.findUserById.execute(id);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar usuarios paginados' })
  @ApiResponse({ status: 200, type: UserPaginatedResponseDto })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @UseAuth(Role.ADMINISTRADOR)
  async getAllPaginated(
    @Query() query: ListUsersQueryDto,
  ): Promise<UserPaginatedResponseDto> {
    return this.getAllUsersPaginated.execute({
      search: query.search,
      status: query.status,
      page: query.page,
      limit: query.limit,
    });
  }

  @Patch('/profile')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar perfil del usuario autenticado' })
  @ApiBody({ type: UpdateUserProfileRequestDto })
  @ApiResponse({ status: 204, description: 'Perfil actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @UseAuth(Role.ADMINISTRADOR, Role.SUPERVISOR)
  async updateProfile(
    @CurrentUser() currentUser: AuthCurrentUser,
    @Body() dto: UpdateUserProfileRequestDto,
  ): Promise<void> {
    await this.updateUserProfile.execute(currentUser.id, {
      name: dto.name,
      email: dto.email,
    });
  }

  @Patch('/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar contrasena del usuario autenticado' })
  @ApiBody({ type: UpdateUserPasswordRequestDto })
  @ApiResponse({
    status: 204,
    description: 'Contrasena actualizada exitosamente',
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @UseAuth(Role.ADMINISTRADOR, Role.SUPERVISOR)
  async updatePassword(
    @CurrentUser() currentUser: AuthCurrentUser,
    @Body() dto: UpdateUserPasswordRequestDto,
  ): Promise<void> {
    await this.updateUserPassword.execute(currentUser.id, dto.password);
  }

  @Patch('/:id/role')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar el rol de un usuario' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: UpdateUserRoleRequestDto })
  @ApiResponse({ status: 204, description: 'Rol actualizado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos suficientes o usuario inactivo',
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 409, description: 'El usuario ya tiene ese rol' })
  @UseAuth(Role.ADMINISTRADOR)
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleRequestDto,
  ): Promise<void> {
    await this.updateUserRole.execute(id, dto.role);
  }

  @Patch('/:id/activate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activar un usuario' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Usuario activado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 409, description: 'El usuario ya esta activo' })
  @UseAuth(Role.ADMINISTRADOR)
  async activate(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.activateUser.execute(id);
  }

  @Patch('/:id/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar un usuario' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Usuario desactivado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 409, description: 'El usuario ya esta inactivo' })
  @UseAuth(Role.ADMINISTRADOR)
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deactivateUser.execute(id);
  }

  @Patch('/:id/reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Restablecer la contraseña de un usuario usando su email',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 204,
    description: 'Contraseña restablecida exitosamente',
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Sin permisos suficientes' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @UseAuth(Role.ADMINISTRADOR)
  async resetPassword(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.resetUserPassword.execute(id);
  }
}
