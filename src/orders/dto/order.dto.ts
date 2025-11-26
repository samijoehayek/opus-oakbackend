import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsUUID,
  IsObject,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { OrderStatus, PaymentPlan } from '@prisma/client';

// ============================================
// CART DTOs
// ============================================

export class AddToCartDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({
    example: { materialId: 'uuid', colorId: 'uuid' },
    description: 'Selected configuration options',
  })
  @IsObject()
  configuration: Record<string, string>;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number = 1;
}

export class UpdateCartItemDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  quantity: number;
}

export class CartItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  productSku: string;

  @ApiProperty()
  productImage: string;

  @ApiProperty()
  configuration: Record<string, any>;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  totalPrice: number;
}

export class CartResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: [CartItemResponseDto] })
  items: CartItemResponseDto[];

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  itemCount: number;
}

// ============================================
// ORDER DTOs
// ============================================

export class CreateOrderDto {
  @ApiProperty()
  @IsUUID()
  shippingAddressId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  billingAddressId?: string;

  @ApiProperty({ enum: PaymentPlan, default: 'FULL' })
  @IsEnum(PaymentPlan)
  paymentPlan: PaymentPlan;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class OrderQueryDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  limit?: number = 20;
}

// ============================================
// ORDER RESPONSE DTOs
// ============================================

export class OrderItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  productSku: string;

  @ApiProperty()
  configuration: Record<string, any>;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  totalPrice: number;
}

export class OrderAddressResponseDto {
  @ApiProperty()
  id: string;

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

  @ApiProperty()
  country: string;
}

export class OrderPaymentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  method: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  sequence: number;

  @ApiPropertyOptional()
  processedAt?: Date;
}

export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderNumber: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: OrderStatus })
  status: OrderStatus;

  @ApiProperty({ enum: PaymentPlan })
  paymentPlan: PaymentPlan;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items: OrderItemResponseDto[];

  @ApiProperty()
  shippingAddress: OrderAddressResponseDto;

  @ApiPropertyOptional()
  billingAddress?: OrderAddressResponseDto;

  @ApiProperty({ type: [OrderPaymentResponseDto] })
  payments: OrderPaymentResponseDto[];

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  shippingCost: number;

  @ApiProperty()
  tax: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  currency: string;

  @ApiPropertyOptional()
  estimatedDelivery?: Date;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  statusHistory: Array<{ status: string; timestamp: Date; note?: string }>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class OrderListResponseDto {
  @ApiProperty({ type: [OrderResponseDto] })
  orders: OrderResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
