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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  ProductDetailResponseDto,
  ProductListResponseDto,
  ProductListItemResponseDto,
  CategoryMetadataDto,
} from './dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================

  @Get()
  @ApiOperation({ summary: 'Get all products with filtering and pagination' })
  @ApiResponse({ status: 200, type: ProductListResponseDto })
  async findAll(
    @Query() query: ProductQueryDto,
  ): Promise<ProductListResponseDto> {
    return this.productsService.findAll(query);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured products for homepage' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: [ProductListItemResponseDto] })
  async getFeatured(
    @Query('limit') limit?: number,
  ): Promise<ProductListItemResponseDto[]> {
    return this.productsService.getFeatured(limit || 8);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories with metadata' })
  @ApiResponse({ status: 200, type: [CategoryMetadataDto] })
  async getAllCategories(): Promise<CategoryMetadataDto[]> {
    return this.productsService.getAllCategories();
  }

  @Get('categories/:slug')
  @ApiOperation({ summary: 'Get category metadata by slug' })
  @ApiParam({ name: 'slug', example: 'sofas' })
  @ApiResponse({ status: 200, type: CategoryMetadataDto })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategoryMetadata(
    @Param('slug') slug: string,
  ): Promise<CategoryMetadataDto> {
    return this.productsService.getCategoryMetadata(slug);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get products by category' })
  @ApiParam({
    name: 'category',
    enum: [
      'TABLES',
      'CHAIRS',
      'SOFAS',
      'BEDS',
      'STORAGE',
      'LIGHTING',
      'OUTDOOR',
      'ACCESSORIES',
    ],
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['featured', 'price_asc', 'price_desc', 'newest'],
  })
  @ApiResponse({ status: 200, type: [ProductListItemResponseDto] })
  async getByCategory(
    @Param('category') category: string,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
  ): Promise<ProductListItemResponseDto[]> {
    return this.productsService.getByCategory(
      category,
      limit || 50,
      sortBy || 'featured',
    );
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get a product by ID or slug (basic info)' })
  @ApiParam({ name: 'idOrSlug', description: 'Product ID (UUID) or slug' })
  @ApiResponse({ status: 200, type: ProductListItemResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(
    @Param('idOrSlug') idOrSlug: string,
  ): Promise<ProductListItemResponseDto> {
    return this.productsService.findOne(idOrSlug);
  }

  @Get(':idOrSlug/detail')
  @ApiOperation({ summary: 'Get full product details by ID or slug' })
  @ApiParam({ name: 'idOrSlug', description: 'Product ID (UUID) or slug' })
  @ApiResponse({ status: 200, type: ProductDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOneDetail(
    @Param('idOrSlug') idOrSlug: string,
  ): Promise<ProductDetailResponseDto> {
    return this.productsService.findOneDetail(idOrSlug);
  }

  // ============================================
  // REVIEWS (PUBLIC)
  // ============================================

  @Post(':id/reviews')
  @ApiOperation({ summary: 'Add a review to a product' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 201, type: ProductDetailResponseDto })
  async addReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      author: string;
      email?: string;
      rating: number;
      title: string;
      content: string;
    },
  ): Promise<ProductDetailResponseDto> {
    return this.productsService.addReview(id, body);
  }

  @Post('reviews/:reviewId/helpful')
  @ApiOperation({ summary: 'Mark a review as helpful' })
  @ApiParam({ name: 'reviewId', type: String })
  @ApiResponse({ status: 200 })
  async markReviewHelpful(
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
  ): Promise<{ helpful: number }> {
    return this.productsService.markReviewHelpful(reviewId);
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product (Admin only)' })
  @ApiResponse({ status: 201, type: ProductDetailResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 409, description: 'SKU or slug already exists' })
  async create(
    @Body() dto: CreateProductDto,
  ): Promise<ProductDetailResponseDto> {
    return this.productsService.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product (Admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: ProductDetailResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductDetailResponseDto> {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product (Admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    return this.productsService.remove(id);
  }

  @Post(':id/related/:relatedId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add related product (Admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'relatedId', type: String })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['SIMILAR', 'COMPLEMENTARY', 'UPSELL', 'CROSS_SELL'],
  })
  @ApiResponse({ status: 201, type: ProductDetailResponseDto })
  async addRelatedProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('relatedId', ParseUUIDPipe) relatedId: string,
    @Query('type') type?: 'SIMILAR' | 'COMPLEMENTARY' | 'UPSELL' | 'CROSS_SELL',
  ): Promise<ProductDetailResponseDto> {
    return this.productsService.addRelatedProduct(
      id,
      relatedId,
      type || 'SIMILAR',
    );
  }
}
