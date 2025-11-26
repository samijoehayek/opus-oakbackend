import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { AddToCartDto, UpdateCartItemDto, CartResponseDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get user's cart
   */
  async getCart(userId: string): Promise<CartResponseDto> {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
                materialOptions: true,
                colorOptions: true,
              },
            },
          },
        },
      },
    });

    // Create cart if doesn't exist
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    where: { isPrimary: true },
                    take: 1,
                  },
                  materialOptions: true,
                  colorOptions: true,
                },
              },
            },
          },
        },
      });
    }

    return this.mapCartToResponse(cart);
  }

  /**
   * Add item to cart
   */
  async addToCart(userId: string, dto: AddToCartDto): Promise<CartResponseDto> {
    const cart = await this.ensureCart(userId);

    // Get product and validate
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: {
        materialOptions: true,
        colorOptions: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isActive) {
      throw new BadRequestException('Product is not available');
    }

    // Calculate price based on configuration
    const unitPrice = this.calculatePrice(product, dto.configuration);

    // Check if item with same config exists
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: dto.productId,
        configuration: {
          equals: dto.configuration,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + (dto.quantity || 1),
          unitPrice: new Prisma.Decimal(unitPrice),
        },
      });
    } else {
      // Create new item
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          configuration: dto.configuration,
          quantity: dto.quantity || 1,
          unitPrice: new Prisma.Decimal(unitPrice),
        },
      });
    }

    return this.getCart(userId);
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const cart = await this.ensureCart(userId);

    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    if (dto.quantity === 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await this.prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity: dto.quantity },
      });
    }

    return this.getCart(userId);
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(
    userId: string,
    itemId: string,
  ): Promise<CartResponseDto> {
    const cart = await this.ensureCart(userId);

    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({ where: { id: itemId } });

    return this.getCart(userId);
  }

  /**
   * Clear cart
   */
  async clearCart(userId: string): Promise<CartResponseDto> {
    const cart = await this.ensureCart(userId);

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return this.getCart(userId);
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private async ensureCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
      });
    }

    return cart;
  }

  private calculatePrice(
    product: any,
    configuration: Record<string, string>,
  ): number {
    let price = Number(product.basePrice);

    // Add material price modifier
    if (configuration.materialId) {
      const material = product.materialOptions.find(
        (m: any) => m.id === configuration.materialId,
      );
      if (material) {
        price += Number(material.priceModifier);
      }
    }

    // Add color price modifier
    if (configuration.colorId) {
      const color = product.colorOptions.find(
        (c: any) => c.id === configuration.colorId,
      );
      if (color) {
        price += Number(color.priceModifier);
      }
    }

    return price;
  }

  private mapCartToResponse(cart: any): CartResponseDto {
    const items = cart.items.map((item: any) => {
      // Get configuration names
      const materialName = item.configuration.materialId
        ? item.product.materialOptions.find(
            (m: any) => m.id === item.configuration.materialId,
          )?.name
        : null;
      const colorName = item.configuration.colorId
        ? item.product.colorOptions.find(
            (c: any) => c.id === item.configuration.colorId,
          )?.name
        : null;

      return {
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productSku: item.product.sku,
        productImage: item.product.images[0]?.url || null,
        configuration: {
          ...item.configuration,
          materialName,
          colorName,
        },
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.unitPrice) * item.quantity,
      };
    });

    const subtotal = items.reduce(
      (sum: number, item: any) => sum + item.totalPrice,
      0,
    );
    const itemCount = items.reduce(
      (sum: number, item: any) => sum + item.quantity,
      0,
    );

    return {
      id: cart.id,
      items,
      subtotal,
      itemCount,
    };
  }
}
