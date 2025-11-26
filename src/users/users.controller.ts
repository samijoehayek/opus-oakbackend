import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  UpdateProfileDto,
  CreateAddressDto,
  UpdateAddressDto,
  UserProfileResponseDto,
  AddressResponseDto,
} from './dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ============================================
  // PROFILE
  // ============================================

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: UserProfileResponseDto })
  async getProfile(@Request() req): Promise<UserProfileResponseDto> {
    return this.usersService.getProfile(req.user.id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, type: UserProfileResponseDto })
  async updateProfile(
    @Request() req,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  // ============================================
  // ADDRESSES
  // ============================================

  @Get('me/addresses')
  @ApiOperation({ summary: 'Get user addresses' })
  @ApiResponse({ status: 200, type: [AddressResponseDto] })
  async getAddresses(@Request() req): Promise<AddressResponseDto[]> {
    return this.usersService.getAddresses(req.user.id);
  }

  @Post('me/addresses')
  @ApiOperation({ summary: 'Create new address' })
  @ApiResponse({ status: 201, type: AddressResponseDto })
  async createAddress(
    @Request() req,
    @Body() dto: CreateAddressDto,
  ): Promise<AddressResponseDto> {
    return this.usersService.createAddress(req.user.id, dto);
  }

  @Put('me/addresses/:addressId')
  @ApiOperation({ summary: 'Update address' })
  @ApiParam({ name: 'addressId', type: String })
  @ApiResponse({ status: 200, type: AddressResponseDto })
  async updateAddress(
    @Request() req,
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @Body() dto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    return this.usersService.updateAddress(req.user.id, addressId, dto);
  }

  @Delete('me/addresses/:addressId')
  @ApiOperation({ summary: 'Delete address' })
  @ApiParam({ name: 'addressId', type: String })
  @ApiResponse({ status: 200, description: 'Address deleted' })
  async deleteAddress(
    @Request() req,
    @Param('addressId', ParseUUIDPipe) addressId: string,
  ): Promise<{ message: string }> {
    return this.usersService.deleteAddress(req.user.id, addressId);
  }

  @Post('me/addresses/:addressId/default')
  @ApiOperation({ summary: 'Set address as default' })
  @ApiParam({ name: 'addressId', type: String })
  @ApiResponse({ status: 200, type: AddressResponseDto })
  async setDefaultAddress(
    @Request() req,
    @Param('addressId', ParseUUIDPipe) addressId: string,
  ): Promise<AddressResponseDto> {
    return this.usersService.setDefaultAddress(req.user.id, addressId);
  }
}
