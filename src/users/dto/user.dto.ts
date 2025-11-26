import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  MaxLength,
  MinLength,
  IsUUID,
} from 'class-validator';

// ============================================
// PROFILE DTOs
// ============================================

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ example: '+96170123456' })
  @IsOptional()
  @IsString()
  phone?: string;
}

// ============================================
// ADDRESS DTOs
// ============================================

export class CreateAddressDto {
  @ApiPropertyOptional({ example: 'Home' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  label?: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MaxLength(100)
  fullName: string;

  @ApiProperty({ example: '+96170123456' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Clemenceau Street, Building 123' })
  @IsString()
  @MaxLength(200)
  addressLine1: string;

  @ApiPropertyOptional({ example: 'Floor 4, Apt 12' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine2?: string;

  @ApiProperty({ example: 'Beirut' })
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiProperty({
    example: 'Beirut',
    description: 'Lebanese region/governorate',
  })
  @IsString()
  @MaxLength(100)
  region: string;

  @ApiPropertyOptional({ example: '1100' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto extends PartialType(CreateAddressDto) {}

// ============================================
// RESPONSE DTOs
// ============================================

export class AddressResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  label?: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  addressLine1: string;

  @ApiPropertyOptional()
  addressLine2?: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  region: string;

  @ApiPropertyOptional()
  postalCode?: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty()
  createdAt: Date;
}

export class UserProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiProperty()
  role: string;

  @ApiProperty({ type: [AddressResponseDto] })
  addresses: AddressResponseDto[];

  @ApiProperty()
  createdAt: Date;
}
