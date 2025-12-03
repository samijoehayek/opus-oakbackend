import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  ProductDetailResponseDto,
  ProductListResponseDto,
  ProductListItemResponseDto,
  CategoryMetadataDto,
} from './dto';
import { Prisma, FurnitureCategory } from '@prisma/client';

// Category metadata configuration
const CATEGORY_METADATA: Record<
  string,
  Omit<CategoryMetadataDto, 'productCount'>
> = {
  SOFAS: {
    slug: 'sofas',
    name: 'Sofas',
    title: 'Sofas',
    description: 'Handcrafted sofas designed for comfort and elegance',
    heroImage:
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1920&h=1080&fit=crop',
    introTitle: 'The Art of Comfort',
    introText:
      'Our sofas are crafted with meticulous attention to detail, combining traditional craftsmanship with contemporary design. Each piece is made to order, ensuring the perfect fit for your space.',
  },
  BEDS: {
    slug: 'beds',
    name: 'Beds',
    title: 'Beds',
    description: "Luxurious beds for the perfect night's sleep",
    heroImage:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1920&h=1080&fit=crop',
    introTitle: 'Rest in Luxury',
    introText:
      'Experience the pinnacle of bedroom luxury with our handcrafted beds. Each frame is built to last generations, with customizable options to match your unique style.',
  },
  TABLES: {
    slug: 'tables',
    name: 'Tables',
    title: 'Tables',
    description: 'Statement tables for dining and living spaces',
    heroImage:
      'https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=1920&h=1080&fit=crop',
    introTitle: 'Gather in Style',
    introText:
      'From intimate dining tables to grand conference pieces, our tables are designed to be the centerpiece of your space.',
  },
  CHAIRS: {
    slug: 'armchairs',
    name: 'Armchairs',
    title: 'Armchairs',
    description: 'Designer armchairs and accent seating',
    heroImage:
      'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1920&h=1080&fit=crop',
    introTitle: 'Sculptural Comfort',
    introText:
      'Our armchairs blend artistic expression with ergonomic design. Each piece is a statement of style.',
  },
  ACCESSORIES: {
    slug: 'accessories',
    name: 'Accessories',
    title: 'Accessories',
    description: 'Curated home accessories and decor',
    heroImage:
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1920&h=1080&fit=crop',
    introTitle: 'The Finishing Touch',
    introText:
      'Complete your space with our carefully curated collection of home accessories.',
  },
  STORAGE: {
    slug: 'storage',
    name: 'Storage',
    title: 'Storage',
    description: 'Elegant storage solutions for modern living',
    heroImage:
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=1920&h=1080&fit=crop',
    introTitle: 'Organized Elegance',
    introText: 'Our storage pieces combine functionality with beauty.',
  },
  LIGHTING: {
    slug: 'lighting',
    name: 'Lighting',
    title: 'Lighting',
    description: 'Designer lighting for every room',
    heroImage:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&h=1080&fit=crop',
    introTitle: 'Illuminate Your Space',
    introText: 'Transform any room with our collection of designer lighting.',
  },
  OUTDOOR: {
    slug: 'outdoor',
    name: 'Outdoor',
    title: 'Outdoor',
    description: 'Premium outdoor furniture collection',
    heroImage:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&h=1080&fit=crop',
    introTitle: 'Outdoor Living',
    introText:
      'Extend your living space outdoors with our weather-resistant collection.',
  },
};

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // CREATE PRODUCT
  // ============================================

  async create(dto: CreateProductDto): Promise<ProductDetailResponseDto> {
    // Check SKU uniqueness
    const existingSku = await this.prisma.product.findUnique({
      where: { sku: dto.sku },
    });
    if (existingSku) {
      throw new ConflictException('Product SKU already exists');
    }

    // Generate slug
    const slug = this.generateSlug(dto.name);
    const existingSlug = await this.prisma.product.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException('Product slug already exists');
    }

    const {
      images,
      sizes,
      fabricCategories,
      features,
      specifications,
      ...productData
    } = dto;

    // Create product with all relations
    const product = await this.prisma.product.create({
      data: {
        ...productData,
        slug,
        basePrice: new Prisma.Decimal(dto.basePrice),
        originalPrice: dto.originalPrice
          ? new Prisma.Decimal(dto.originalPrice)
          : null,
        deliveryPrice: dto.deliveryPrice
          ? new Prisma.Decimal(dto.deliveryPrice)
          : new Prisma.Decimal(0),
        width: dto.width ? new Prisma.Decimal(dto.width) : null,
        height: dto.height ? new Prisma.Decimal(dto.height) : null,
        depth: dto.depth ? new Prisma.Decimal(dto.depth) : null,
        weight: dto.weight ? new Prisma.Decimal(dto.weight) : null,
        // Images
        images: images?.length
          ? {
              create: images.map((img, idx) => ({
                url: img.url,
                altText: img.altText,
                type: img.type || 'PHOTO',
                sortOrder: img.sortOrder ?? idx,
                isPrimary: img.isPrimary ?? idx === 0,
              })),
            }
          : undefined,
        // Sizes
        sizes: sizes?.length
          ? {
              create: sizes.map((size, idx) => ({
                label: size.label,
                sku: size.sku,
                price: new Prisma.Decimal(size.price),
                originalPrice: size.originalPrice
                  ? new Prisma.Decimal(size.originalPrice)
                  : null,
                width: new Prisma.Decimal(size.width),
                height: new Prisma.Decimal(size.height),
                depth: new Prisma.Decimal(size.depth),
                seatHeight: size.seatHeight
                  ? new Prisma.Decimal(size.seatHeight)
                  : null,
                bedWidth: size.bedWidth
                  ? new Prisma.Decimal(size.bedWidth)
                  : null,
                bedLength: size.bedLength
                  ? new Prisma.Decimal(size.bedLength)
                  : null,
                inStock: size.inStock ?? true,
                leadTime: size.leadTime,
                sortOrder: size.sortOrder ?? idx,
                isDefault: size.isDefault ?? idx === 0,
              })),
            }
          : undefined,
        // Features
        features: features?.length
          ? {
              create: features.map((f, idx) => ({
                icon: f.icon,
                title: f.title,
                description: f.description,
                sortOrder: f.sortOrder ?? idx,
              })),
            }
          : undefined,
        // Specifications
        specifications: specifications?.length
          ? {
              create: specifications.map((s, idx) => ({
                label: s.label,
                value: s.value,
                sortOrder: s.sortOrder ?? idx,
              })),
            }
          : undefined,
      },
      include: this.getFullProductInclude(),
    });

    // Create fabric categories and fabrics separately (nested create with relation)
    if (fabricCategories?.length) {
      for (const category of fabricCategories) {
        const createdCategory = await this.prisma.fabricCategory.create({
          data: {
            productId: product.id,
            name: category.name,
            sortOrder: category.sortOrder ?? 0,
          },
        });

        if (category.fabrics?.length) {
          await this.prisma.fabric.createMany({
            data: category.fabrics.map((fabric, idx) => ({
              productId: product.id,
              fabricCategoryId: createdCategory.id,
              name: fabric.name,
              hexColor: fabric.hexColor,
              textureUrl: fabric.textureUrl,
              price: new Prisma.Decimal(fabric.price || 0),
              inStock: fabric.inStock ?? true,
              sortOrder: fabric.sortOrder ?? idx,
              isDefault: fabric.isDefault ?? false,
            })),
          });
        }
      }
    }

    // Fetch and return the complete product
    return this.findOneDetail(product.slug);
  }

  // ============================================
  // GET PRODUCT LIST (for category pages)
  // ============================================

  async findAll(query: ProductQueryDto): Promise<ProductListResponseDto> {
    const {
      category,
      isFeatured,
      isActive,
      search,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
      sortBy = 'featured',
    } = query;

    const where: Prisma.ProductWhereInput = {
      ...(category && { category }),
      ...(typeof isFeatured === 'boolean' && { isFeatured }),
      ...(typeof isActive === 'boolean' && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(minPrice !== undefined && { basePrice: { gte: minPrice } }),
      ...(maxPrice !== undefined && {
        basePrice: {
          ...(minPrice !== undefined ? { gte: minPrice } : {}),
          lte: maxPrice,
        },
      }),
    };

    const orderBy = this.getOrderBy(sortBy);
    const total = await this.prisma.product.count({ where });

    const products = await this.prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        sizes: { where: { inStock: true } },
        fabrics: { where: { inStock: true } },
        fabricCategories: true,
      },
    });

    return {
      products: products.map((p) => this.mapToListItem(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================
  // GET PRODUCTS BY CATEGORY
  // ============================================

  async getByCategory(
    category: string,
    limit: number = 50,
    sortBy: string = 'featured',
  ): Promise<ProductListItemResponseDto[]> {
    const orderBy = this.getOrderBy(sortBy);

    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        category: category.toUpperCase() as FurnitureCategory,
      },
      take: limit,
      orderBy,
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        sizes: { where: { inStock: true } },
        fabrics: { where: { inStock: true } },
        fabricCategories: true,
      },
    });

    return products.map((p) => this.mapToListItem(p));
  }

  // ============================================
  // GET FEATURED PRODUCTS
  // ============================================

  async getFeatured(limit: number = 8): Promise<ProductListItemResponseDto[]> {
    const products = await this.prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        sizes: { where: { inStock: true } },
        fabrics: { where: { inStock: true } },
        fabricCategories: true,
      },
    });

    return products.map((p) => this.mapToListItem(p));
  }

  // ============================================
  // GET SINGLE PRODUCT (BASIC - for backward compat)
  // ============================================

  async findOne(idOrSlug: string): Promise<ProductListItemResponseDto> {
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        sizes: true,
        fabrics: true,
        fabricCategories: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.mapToListItem(product);
  }

  // ============================================
  // GET SINGLE PRODUCT (FULL DETAIL)
  // ============================================

  async findOneDetail(idOrSlug: string): Promise<ProductDetailResponseDto> {
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: this.getFullProductInclude(),
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.mapToDetailResponse(product);
  }

  // ============================================
  // UPDATE PRODUCT
  // ============================================

  async update(
    id: string,
    dto: UpdateProductDto,
  ): Promise<ProductDetailResponseDto> {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    // Check SKU uniqueness if changed
    if (dto.sku && dto.sku !== existingProduct.sku) {
      const existingSku = await this.prisma.product.findUnique({
        where: { sku: dto.sku },
      });
      if (existingSku) {
        throw new ConflictException('Product SKU already exists');
      }
    }

    // Handle slug update if name changed
    let slug = existingProduct.slug;
    if (dto.name && dto.name !== existingProduct.name) {
      slug = this.generateSlug(dto.name);
      const existingSlug = await this.prisma.product.findFirst({
        where: { slug, NOT: { id } },
      });
      if (existingSlug) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    const {
      images,
      sizes,
      fabricCategories,
      features,
      specifications,
      ...productData
    } = dto;

    // Update base product data
    await this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        slug,
        ...(dto.basePrice !== undefined && {
          basePrice: new Prisma.Decimal(dto.basePrice),
        }),
        ...(dto.originalPrice !== undefined && {
          originalPrice: dto.originalPrice
            ? new Prisma.Decimal(dto.originalPrice)
            : null,
        }),
        ...(dto.deliveryPrice !== undefined && {
          deliveryPrice: new Prisma.Decimal(dto.deliveryPrice),
        }),
        ...(dto.width !== undefined && {
          width: dto.width ? new Prisma.Decimal(dto.width) : null,
        }),
        ...(dto.height !== undefined && {
          height: dto.height ? new Prisma.Decimal(dto.height) : null,
        }),
        ...(dto.depth !== undefined && {
          depth: dto.depth ? new Prisma.Decimal(dto.depth) : null,
        }),
        ...(dto.weight !== undefined && {
          weight: dto.weight ? new Prisma.Decimal(dto.weight) : null,
        }),
      },
    });

    // Update images if provided (replace all)
    if (images !== undefined) {
      await this.prisma.productImage.deleteMany({ where: { productId: id } });
      if (images.length) {
        await this.prisma.productImage.createMany({
          data: images.map((img, idx) => ({
            productId: id,
            url: img.url,
            altText: img.altText,
            type: img.type || 'PHOTO',
            sortOrder: img.sortOrder ?? idx,
            isPrimary: img.isPrimary ?? idx === 0,
          })),
        });
      }
    }

    // Update sizes if provided (replace all)
    if (sizes !== undefined) {
      await this.prisma.productSize.deleteMany({ where: { productId: id } });
      if (sizes.length) {
        await this.prisma.productSize.createMany({
          data: sizes.map((size, idx) => ({
            productId: id,
            label: size.label,
            sku: size.sku,
            price: new Prisma.Decimal(size.price),
            originalPrice: size.originalPrice
              ? new Prisma.Decimal(size.originalPrice)
              : null,
            width: new Prisma.Decimal(size.width),
            height: new Prisma.Decimal(size.height),
            depth: new Prisma.Decimal(size.depth),
            seatHeight: size.seatHeight
              ? new Prisma.Decimal(size.seatHeight)
              : null,
            bedWidth: size.bedWidth ? new Prisma.Decimal(size.bedWidth) : null,
            bedLength: size.bedLength
              ? new Prisma.Decimal(size.bedLength)
              : null,
            inStock: size.inStock ?? true,
            leadTime: size.leadTime,
            sortOrder: size.sortOrder ?? idx,
            isDefault: size.isDefault ?? idx === 0,
          })),
        });
      }
    }

    // Update features if provided (replace all)
    if (features !== undefined) {
      await this.prisma.productFeature.deleteMany({ where: { productId: id } });
      if (features.length) {
        await this.prisma.productFeature.createMany({
          data: features.map((f, idx) => ({
            productId: id,
            icon: f.icon,
            title: f.title,
            description: f.description,
            sortOrder: f.sortOrder ?? idx,
          })),
        });
      }
    }

    // Update specifications if provided (replace all)
    if (specifications !== undefined) {
      await this.prisma.productSpecification.deleteMany({
        where: { productId: id },
      });
      if (specifications.length) {
        await this.prisma.productSpecification.createMany({
          data: specifications.map((s, idx) => ({
            productId: id,
            label: s.label,
            value: s.value,
            sortOrder: s.sortOrder ?? idx,
          })),
        });
      }
    }

    // Update fabric categories if provided (replace all)
    if (fabricCategories !== undefined) {
      // Delete existing fabrics and categories
      await this.prisma.fabric.deleteMany({ where: { productId: id } });
      await this.prisma.fabricCategory.deleteMany({ where: { productId: id } });

      // Create new ones
      for (const category of fabricCategories) {
        const createdCategory = await this.prisma.fabricCategory.create({
          data: {
            productId: id,
            name: category.name,
            sortOrder: category.sortOrder ?? 0,
          },
        });

        if (category.fabrics?.length) {
          await this.prisma.fabric.createMany({
            data: category.fabrics.map((fabric, idx) => ({
              productId: id,
              fabricCategoryId: createdCategory.id,
              name: fabric.name,
              hexColor: fabric.hexColor,
              textureUrl: fabric.textureUrl,
              price: new Prisma.Decimal(fabric.price || 0),
              inStock: fabric.inStock ?? true,
              sortOrder: fabric.sortOrder ?? idx,
              isDefault: fabric.isDefault ?? false,
            })),
          });
        }
      }
    }

    return this.findOneDetail(id);
  }

  // ============================================
  // DELETE PRODUCT
  // ============================================

  async remove(id: string): Promise<{ message: string }> {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.delete({ where: { id } });

    return { message: 'Product deleted successfully' };
  }

  // ============================================
  // CATEGORY METADATA
  // ============================================

  async getCategoryMetadata(
    categorySlug: string,
  ): Promise<CategoryMetadataDto> {
    const slugToEnum: Record<string, string> = {
      sofas: 'SOFAS',
      beds: 'BEDS',
      tables: 'TABLES',
      armchairs: 'CHAIRS',
      chairs: 'CHAIRS',
      accessories: 'ACCESSORIES',
      storage: 'STORAGE',
      lighting: 'LIGHTING',
      outdoor: 'OUTDOOR',
    };

    const categoryEnum = slugToEnum[categorySlug.toLowerCase()];

    if (!categoryEnum || !CATEGORY_METADATA[categoryEnum]) {
      throw new NotFoundException('Category not found');
    }

    const productCount = await this.prisma.product.count({
      where: { isActive: true, category: categoryEnum as FurnitureCategory },
    });

    return {
      ...CATEGORY_METADATA[categoryEnum],
      productCount,
    };
  }

  async getAllCategories(): Promise<CategoryMetadataDto[]> {
    const categories = Object.keys(CATEGORY_METADATA);

    return Promise.all(
      categories.map(async (cat) => {
        const productCount = await this.prisma.product.count({
          where: { isActive: true, category: cat as FurnitureCategory },
        });
        return { ...CATEGORY_METADATA[cat], productCount };
      }),
    );
  }

  // ============================================
  // REVIEWS
  // ============================================

  async addReview(
    productId: string,
    data: {
      author: string;
      email?: string;
      rating: number;
      title: string;
      content: string;
      userId?: string;
    },
  ): Promise<ProductDetailResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.productReview.create({
      data: {
        productId,
        author: data.author,
        email: data.email,
        rating: new Prisma.Decimal(data.rating),
        title: data.title,
        content: data.content,
        userId: data.userId,
        verified: !!data.userId,
        status: 'PENDING',
      },
    });

    return this.findOneDetail(productId);
  }

  async markReviewHelpful(reviewId: string): Promise<{ helpful: number }> {
    const review = await this.prisma.productReview.update({
      where: { id: reviewId },
      data: { helpful: { increment: 1 } },
    });

    return { helpful: review.helpful };
  }

  // ============================================
  // RELATED PRODUCTS
  // ============================================

  async addRelatedProduct(
    productId: string,
    relatedProductId: string,
    relationType:
      | 'SIMILAR'
      | 'COMPLEMENTARY'
      | 'UPSELL'
      | 'CROSS_SELL' = 'SIMILAR',
  ): Promise<ProductDetailResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    const relatedProduct = await this.prisma.product.findUnique({
      where: { id: relatedProductId },
    });

    if (!product || !relatedProduct) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.productRelation.upsert({
      where: {
        productId_relatedProductId: { productId, relatedProductId },
      },
      create: { productId, relatedProductId, relationType },
      update: { relationType },
    });

    return this.findOneDetail(productId);
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private getOrderBy(
    sortBy: string,
  ):
    | Prisma.ProductOrderByWithRelationInput
    | Prisma.ProductOrderByWithRelationInput[] {
    switch (sortBy) {
      case 'price_asc':
      case 'price-asc':
        return { basePrice: 'asc' };
      case 'price_desc':
      case 'price-desc':
        return { basePrice: 'desc' };
      case 'name_asc':
        return { name: 'asc' };
      case 'newest':
        return { createdAt: 'desc' };
      case 'featured':
      default:
        return [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
    }
  }

  private getFullProductInclude() {
    return {
      images: { orderBy: { sortOrder: 'asc' } },
      sizes: { orderBy: { sortOrder: 'asc' } },
      fabricCategories: { orderBy: { sortOrder: 'asc' } },
      fabrics: { orderBy: { sortOrder: 'asc' } },
      features: { orderBy: { sortOrder: 'asc' } },
      specifications: { orderBy: { sortOrder: 'asc' } },
      reviews: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      relatedTo: {
        include: {
          relatedProduct: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
        take: 8,
      },
    } as const;
  }

  private mapToListItem(product: any): ProductListItemResponseDto {
    const optionCount =
      (product.sizes?.length || 0) + (product.fabrics?.length || 0);

    return {
      id: product.id,
      sku: product.sku,
      slug: product.slug,
      name: product.name,
      tagline: product.tagline,
      description: product.description,
      badge: product.badge,
      category: product.category,
      basePrice: Number(product.basePrice),
      originalPrice: product.originalPrice
        ? Number(product.originalPrice)
        : undefined,
      images:
        product.images?.map((img: any) => ({
          id: img.id,
          url: img.url,
          altText: img.altText,
          type: img.type,
          sortOrder: img.sortOrder,
          isPrimary: img.isPrimary,
        })) || [],
      optionCount,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      createdAt: product.createdAt,
    };
  }

  private mapToDetailResponse(product: any): ProductDetailResponseDto {
    // Calculate average rating
    const reviews = product.reviews || [];
    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum: number, r: any) => sum + Number(r.rating), 0) /
          totalReviews
        : 0;

    // Build badges array
    const badges: string[] = [];
    if (product.badge) badges.push(product.badge);
    if (product.isFeatured) badges.push('Featured');

    // Map fabric categories for lookup
    const fabricCategoryMap = new Map(
      product.fabricCategories?.map((fc: any) => [fc.id, fc.name]) || [],
    );

    return {
      id: product.id,
      sku: product.sku,
      slug: product.slug,
      name: product.name,
      tagline: product.tagline,
      description: product.description,
      longDescription: product.longDescription,
      story: product.story,
      badge: product.badge,
      category: product.category,
      subcategory: product.subcategory,
      basePrice: Number(product.basePrice),
      originalPrice: product.originalPrice
        ? Number(product.originalPrice)
        : undefined,

      // Images
      images:
        product.images?.map((img: any) => ({
          id: img.id,
          url: img.url,
          altText: img.altText,
          type: img.type,
          sortOrder: img.sortOrder,
          isPrimary: img.isPrimary,
        })) || [],

      // Sizes
      sizes:
        product.sizes?.map((size: any) => ({
          id: size.id,
          label: size.label,
          sku: size.sku,
          price: Number(size.price),
          originalPrice: size.originalPrice
            ? Number(size.originalPrice)
            : undefined,
          dimensions: {
            width: Number(size.width),
            height: Number(size.height),
            depth: Number(size.depth),
            seatHeight: size.seatHeight ? Number(size.seatHeight) : undefined,
          },
          bedDimensions:
            size.bedWidth && size.bedLength
              ? { width: Number(size.bedWidth), length: Number(size.bedLength) }
              : undefined,
          inStock: size.inStock,
          leadTime: size.leadTime,
          sortOrder: size.sortOrder,
          isDefault: size.isDefault,
        })) || [],

      // Fabric categories
      fabricCategories:
        product.fabricCategories?.map((fc: any) => ({
          id: fc.id,
          name: fc.name,
          sortOrder: fc.sortOrder,
        })) || [],

      // Fabrics
      fabrics:
        product.fabrics?.map((fabric: any) => ({
          id: fabric.id,
          name: fabric.name,
          hexColor: fabric.hexColor,
          textureUrl: fabric.textureUrl,
          price: Number(fabric.price),
          inStock: fabric.inStock,
          category: fabricCategoryMap.get(fabric.fabricCategoryId) || '',
          sortOrder: fabric.sortOrder,
          isDefault: fabric.isDefault,
        })) || [],

      // Features
      features:
        product.features?.map((f: any) => ({
          id: f.id,
          icon: f.icon,
          title: f.title,
          description: f.description,
        })) || [],

      // Specifications
      specifications:
        product.specifications?.map((s: any) => ({
          label: s.label,
          value: s.value,
        })) || [],

      // Delivery & Returns
      deliveryInfo: {
        price: Number(product.deliveryPrice || 0),
        description: product.deliveryInfo,
      },
      returns: {
        days: product.returnDays || 14,
        description: product.returnInfo,
      },
      warranty: {
        years: product.warrantyYears || 2,
        description: product.warrantyInfo,
      },

      // Additional
      assembly: product.assembly,
      madeIn: product.madeIn,
      careInstructions: product.careInstructions || [],

      // Reviews
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      reviews: reviews.map((r: any) => ({
        id: r.id,
        author: r.author,
        rating: Number(r.rating),
        title: r.title,
        content: r.content,
        verified: r.verified,
        helpful: r.helpful,
        date: r.createdAt.toISOString(),
      })),

      // Related products
      relatedProducts:
        product.relatedTo?.map((rel: any) => ({
          id: rel.relatedProduct.id,
          slug: rel.relatedProduct.slug,
          name: rel.relatedProduct.name,
          category: rel.relatedProduct.category,
          price: Number(rel.relatedProduct.basePrice),
          originalPrice: rel.relatedProduct.originalPrice
            ? Number(rel.relatedProduct.originalPrice)
            : undefined,
          imageUrl: rel.relatedProduct.images?.[0]?.url || '',
        })) || [],

      // Badges
      badges,

      // Status
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      leadTimeDays: product.leadTimeDays,

      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
