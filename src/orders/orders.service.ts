import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  OrderQueryDto,
  OrderResponseDto,
  OrderListResponseDto,
} from './dto';
import { CartService } from './cart.service';
import { OrderStatus, Prisma, PaymentPlan } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private cartService: CartService,
  ) {}

  /**
   * Create order from cart
   */
  async createOrder(
    userId: string,
    dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    // Get cart
    const cart = await this.cartService.getCart(userId);

    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Validate shipping address belongs to user
    const shippingAddress = await this.prisma.address.findFirst({
      where: {
        id: dto.shippingAddressId,
        userId,
      },
    });

    if (!shippingAddress) {
      throw new NotFoundException('Shipping address not found');
    }

    // Validate billing address if provided
    if (dto.billingAddressId) {
      const billingAddress = await this.prisma.address.findFirst({
        where: {
          id: dto.billingAddressId,
          userId,
        },
      });

      if (!billingAddress) {
        throw new NotFoundException('Billing address not found');
      }
    }

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Calculate totals
    const subtotal = cart.subtotal;
    const shippingCost = this.calculateShipping(subtotal); // Simple flat rate for now
    const tax = 0; // Lebanon has VAT but let's keep it simple for MVP
    const total = subtotal + shippingCost + tax;

    // Calculate estimated delivery (max lead time + 7 days for shipping)
    const maxLeadTime = await this.getMaxLeadTime(
      cart.items.map((i) => i.productId),
    );
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + maxLeadTime + 7);

    // Create order
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId,
        shippingAddressId: dto.shippingAddressId,
        billingAddressId: dto.billingAddressId || dto.shippingAddressId,
        subtotal: new Prisma.Decimal(subtotal),
        shippingCost: new Prisma.Decimal(shippingCost),
        tax: new Prisma.Decimal(tax),
        total: new Prisma.Decimal(total),
        paymentPlan: dto.paymentPlan,
        estimatedDelivery,
        notes: dto.notes,
        status: OrderStatus.PENDING_PAYMENT,
        statusHistory: [
          {
            status: OrderStatus.PENDING_PAYMENT,
            timestamp: new Date().toISOString(),
            note: 'Order created',
          },
        ],
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            productSku: item.productSku,
            configuration: item.configuration,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            totalPrice: new Prisma.Decimal(item.totalPrice),
          })),
        },
      },
      include: {
        items: true,
        shippingAddress: true,
        billingAddress: true,
        payments: true,
      },
    });

    // Clear cart after order creation
    await this.cartService.clearCart(userId);

    return this.mapOrderToResponse(order);
  }

  /**
   * Get user's orders
   */
  async getUserOrders(
    userId: string,
    query: OrderQueryDto,
  ): Promise<OrderListResponseDto> {
    const { status, page = 1, limit = 20 } = query;

    const where: Prisma.OrderWhereInput = {
      userId,
      ...(status && { status }),
    };

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          shippingAddress: true,
          billingAddress: true,
          payments: true,
        },
      }),
    ]);

    return {
      orders: orders.map((o) => this.mapOrderToResponse(o)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get order by ID (user must own it or be admin)
   */
  async getOrder(
    orderId: string,
    userId: string,
    isAdmin: boolean = false,
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        shippingAddress: true,
        billingAddress: true,
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!isAdmin && order.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.mapOrderToResponse(order);
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(
    orderNumber: string,
    userId: string,
    isAdmin: boolean = false,
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        shippingAddress: true,
        billingAddress: true,
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!isAdmin && order.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.mapOrderToResponse(order);
  }

  /**
   * Update order status (Admin only)
   */
  async updateOrderStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate status transition
    if (!this.isValidStatusTransition(order.status, dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${dto.status}`,
      );
    }

    // Get current history
    const currentHistory = order.statusHistory as any[];

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: dto.status,
        statusHistory: [
          ...currentHistory,
          {
            status: dto.status,
            timestamp: new Date().toISOString(),
            note: dto.note,
          },
        ],
      },
      include: {
        items: true,
        shippingAddress: true,
        billingAddress: true,
        payments: true,
      },
    });

    return this.mapOrderToResponse(updatedOrder);
  }

  /**
   * Get all orders (Admin only)
   */
  async getAllOrders(query: OrderQueryDto): Promise<OrderListResponseDto> {
    const { status, page = 1, limit = 20 } = query;

    const where: Prisma.OrderWhereInput = {
      ...(status && { status }),
    };

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          shippingAddress: true,
          billingAddress: true,
          payments: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    return {
      orders: orders.map((o) => this.mapOrderToResponse(o)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Cancel order
   */
  async cancelOrder(
    orderId: string,
    userId: string,
    isAdmin: boolean = false,
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!isAdmin && order.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Can only cancel if not yet in production
    const cancellableStatuses: OrderStatus[] = [
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.PAYMENT_FAILED,
      OrderStatus.CONFIRMED,
    ];

    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestException(
        'Cannot cancel order that is already in production or shipped',
      );
    }

    return this.updateOrderStatus(orderId, {
      status: OrderStatus.CANCELLED,
      note: isAdmin ? 'Cancelled by admin' : 'Cancelled by customer',
    });
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01`),
        },
      },
    });

    const sequence = String(count + 1).padStart(5, '0');
    return `ORD-${year}-${sequence}`;
  }

  private calculateShipping(subtotal: number): number {
    // Free shipping over $500, otherwise $25 flat rate
    return subtotal >= 500 ? 0 : 25;
  }

  private async getMaxLeadTime(productIds: string[]): Promise<number> {
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { leadTimeDays: true },
    });

    return Math.max(...products.map((p) => p.leadTimeDays));
  }

  private isValidStatusTransition(
    current: OrderStatus,
    next: OrderStatus,
  ): boolean {
    const transitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING_PAYMENT]: [
        OrderStatus.CONFIRMED,
        OrderStatus.PAYMENT_FAILED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.PAYMENT_FAILED]: [
        OrderStatus.PENDING_PAYMENT,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.CONFIRMED]: [
        OrderStatus.IN_PRODUCTION,
        OrderStatus.CANCELLED,
        OrderStatus.REFUNDED,
      ],
      [OrderStatus.IN_PRODUCTION]: [
        OrderStatus.READY_FOR_SHIPPING,
        OrderStatus.REFUNDED,
      ],
      [OrderStatus.READY_FOR_SHIPPING]: [
        OrderStatus.SHIPPED,
        OrderStatus.REFUNDED,
      ],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.REFUNDED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };

    return transitions[current]?.includes(next) ?? false;
  }

  private mapOrderToResponse(order: any): OrderResponseDto {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      status: order.status,
      paymentPlan: order.paymentPlan,
      items: order.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        configuration: item.configuration,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
      shippingAddress: {
        id: order.shippingAddress.id,
        fullName: order.shippingAddress.fullName,
        phone: order.shippingAddress.phone,
        addressLine1: order.shippingAddress.addressLine1,
        addressLine2: order.shippingAddress.addressLine2,
        city: order.shippingAddress.city,
        region: order.shippingAddress.region,
        country: order.shippingAddress.country,
      },
      billingAddress: order.billingAddress
        ? {
            id: order.billingAddress.id,
            fullName: order.billingAddress.fullName,
            phone: order.billingAddress.phone,
            addressLine1: order.billingAddress.addressLine1,
            addressLine2: order.billingAddress.addressLine2,
            city: order.billingAddress.city,
            region: order.billingAddress.region,
            country: order.billingAddress.country,
          }
        : undefined,
      payments: order.payments.map((payment: any) => ({
        id: payment.id,
        amount: Number(payment.amount),
        method: payment.method,
        status: payment.status,
        sequence: payment.sequence,
        processedAt: payment.processedAt,
      })),
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      tax: Number(order.tax),
      total: Number(order.total),
      currency: order.currency,
      estimatedDelivery: order.estimatedDelivery,
      notes: order.notes,
      statusHistory: order.statusHistory as any[],
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
