import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
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
import { OrdersService } from './orders.service';
import { CartService } from './cart.service';
import {
  AddToCartDto,
  UpdateCartItemDto,
  CartResponseDto,
  CreateOrderDto,
  UpdateOrderStatusDto,
  OrderQueryDto,
  OrderResponseDto,
  OrderListResponseDto,
} from './dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

// ============================================
// CART CONTROLLER
// ============================================

@ApiTags('Cart')
@Controller('cart')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user cart' })
  @ApiResponse({ status: 200, type: CartResponseDto })
  async getCart(@Request() req): Promise<CartResponseDto> {
    return this.cartService.getCart(req.user.id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({ status: 201, type: CartResponseDto })
  async addToCart(
    @Request() req,
    @Body() dto: AddToCartDto,
  ): Promise<CartResponseDto> {
    return this.cartService.addToCart(req.user.id, dto);
  }

  @Put('items/:itemId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiParam({ name: 'itemId', type: String })
  @ApiResponse({ status: 200, type: CartResponseDto })
  async updateCartItem(
    @Request() req,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    return this.cartService.updateCartItem(req.user.id, itemId, dto);
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiParam({ name: 'itemId', type: String })
  @ApiResponse({ status: 200, type: CartResponseDto })
  async removeFromCart(
    @Request() req,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<CartResponseDto> {
    return this.cartService.removeFromCart(req.user.id, itemId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear cart' })
  @ApiResponse({ status: 200, type: CartResponseDto })
  async clearCart(@Request() req): Promise<CartResponseDto> {
    return this.cartService.clearCart(req.user.id);
  }
}

// ============================================
// ORDERS CONTROLLER
// ============================================

@ApiTags('Orders')
@Controller('orders')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create order from cart' })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Cart is empty' })
  async createOrder(
    @Request() req,
    @Body() dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.createOrder(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get current user orders' })
  @ApiResponse({ status: 200, type: OrderListResponseDto })
  async getUserOrders(
    @Request() req,
    @Query() query: OrderQueryDto,
  ): Promise<OrderListResponseDto> {
    return this.ordersService.getUserOrders(req.user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrder(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderResponseDto> {
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
    return this.ordersService.getOrder(id, req.user.id, isAdmin);
  }

  @Get('number/:orderNumber')
  @ApiOperation({ summary: 'Get order by order number' })
  @ApiParam({ name: 'orderNumber', type: String, example: 'ORD-2024-00001' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  async getOrderByNumber(
    @Request() req,
    @Param('orderNumber') orderNumber: string,
  ): Promise<OrderResponseDto> {
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
    return this.ordersService.getOrderByNumber(
      orderNumber,
      req.user.id,
      isAdmin,
    );
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Cannot cancel order in current state',
  })
  async cancelOrder(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderResponseDto> {
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
    return this.ordersService.cancelOrder(id, req.user.id, isAdmin);
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get all orders (Admin only)' })
  @ApiResponse({ status: 200, type: OrderListResponseDto })
  async getAllOrders(
    @Query() query: OrderQueryDto,
  ): Promise<OrderListResponseDto> {
    return this.ordersService.getAllOrders(query);
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update order status (Admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  async updateOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.updateOrderStatus(id, dto);
  }
}
