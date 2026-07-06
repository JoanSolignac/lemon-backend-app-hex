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
import { ListCustomersQueryDto } from './dtos/request/list-customers.query.dto';
import { CreateCustomerRequestDto } from './dtos/request/create-customer.request.dto';
import { UpdateCustomerRequestDto } from './dtos/request/update-customer.request.dto';
import { CustomerResponseDto } from './dtos/response/customer.response.dto';
import { CustomerPaginatedResponseDto } from './dtos/response/customer-paginated.response.dto';
import { CreateCustomerFeature } from './features/create-customer.feature';
import { FindCustomerByIdFeature } from './features/find-customer-by-id.feature';
import { FindCustomerByNumDocumentFeature } from './features/find-customer-by-num-document.feature';
import { GetAllCustomersPaginatedFeature } from './features/get-all-customers-paginated.feature';
import { UpdateCustomerFeature } from './features/update-customer.feature';
import { ActivateCustomerFeature } from './features/activate-customer.feature';
import { DeactivateCustomerFeature } from './features/deactivate-customer.feature';

@ApiTags('Customers')
@Controller('customers')
export class CustomersController {
  constructor(
    private readonly createCustomer: CreateCustomerFeature,
    private readonly findCustomerById: FindCustomerByIdFeature,
    private readonly findCustomerByNumDocument: FindCustomerByNumDocumentFeature,
    private readonly getAllCustomersPaginated: GetAllCustomersPaginatedFeature,
    private readonly updateCustomer: UpdateCustomerFeature,
    private readonly activateCustomer: ActivateCustomerFeature,
    private readonly deactivateCustomer: DeactivateCustomerFeature,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo cliente' })
  @ApiBody({ type: CreateCustomerRequestDto })
  @ApiResponse({ status: 201, description: 'Cliente creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 409, description: 'El cliente ya existe' })
  @UseAuth(Role.ADMINISTRADOR, Role.SUPERVISOR)
  async create(@Body() dto: CreateCustomerRequestDto): Promise<void> {
    await this.createCustomer.execute({
      name: dto.name,
      typeDocument: dto.typeDocument,
      numDocument: dto.numDocument,
      phone: dto.phone,
      email: dto.email ?? null,
      address: dto.address,
    });
  }

  @Get('/document/:numDocument')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener cliente por numero de documento' })
  @ApiParam({
    name: 'numDocument',
    type: 'string',
    description: 'Numero de documento del cliente',
  })
  @ApiResponse({
    status: 200,
    description: 'Cliente encontrado',
    type: CustomerResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  @UseAuth(Role.ADMINISTRADOR, Role.SUPERVISOR)
  async findByNumDocument(
    @Param('numDocument') numDocument: string,
  ): Promise<CustomerResponseDto> {
    return this.findCustomerByNumDocument.execute(numDocument);
  }

  @Get('/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener cliente por ID' })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'UUID del cliente',
  })
  @ApiResponse({
    status: 200,
    description: 'Cliente encontrado',
    type: CustomerResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  @UseAuth(Role.ADMINISTRADOR, Role.SUPERVISOR)
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CustomerResponseDto> {
    return this.findCustomerById.execute(id);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar clientes paginados' })
  @ApiResponse({ status: 200, type: CustomerPaginatedResponseDto })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @UseAuth(Role.ADMINISTRADOR, Role.SUPERVISOR)
  async getAllPaginated(
    @Query() query: ListCustomersQueryDto,
  ): Promise<CustomerPaginatedResponseDto> {
    return this.getAllCustomersPaginated.execute({
      search: query.search,
      status: query.status,
      page: query.page,
      limit: query.limit,
    });
  }

  @Patch('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar cliente' })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'UUID del cliente',
  })
  @ApiBody({ type: UpdateCustomerRequestDto })
  @ApiResponse({ status: 204, description: 'Cliente actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  @ApiResponse({ status: 409, description: 'El cliente ya existe' })
  @UseAuth(Role.ADMINISTRADOR, Role.SUPERVISOR)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerRequestDto,
  ): Promise<void> {
    await this.updateCustomer.execute(id, {
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
    });
  }

  @Patch('/:id/activate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activar un cliente' })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'UUID del cliente',
  })
  @ApiResponse({ status: 204, description: 'Cliente activado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  @ApiResponse({ status: 409, description: 'El cliente ya esta activo' })
  @UseAuth(Role.ADMINISTRADOR)
  async activate(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.activateCustomer.execute(id);
  }

  @Patch('/:id/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desactivar un cliente' })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'UUID del cliente',
  })
  @ApiResponse({ status: 204, description: 'Cliente desactivado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  @ApiResponse({ status: 409, description: 'El cliente ya esta inactivo' })
  @UseAuth(Role.ADMINISTRADOR)
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.deactivateCustomer.execute(id);
  }
}
