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
  AddProductImageDto,
  CreateMaterialOptionDto,
  CreateColorOptionDto,
  ProductResponseDto,
  ProductListResponseDto,
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
  @ApiResponse({ status: 200, type: [ProductResponseDto] })
  async getFeatured(
    @Query('limit') limit?: number,
  ): Promise<ProductResponseDto[]> {
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
  @ApiResponse({ status: 200, type: [ProductResponseDto] })
  async getByCategory(
    @Param('category') category: string,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
  ): Promise<ProductResponseDto[]> {
    return this.productsService.getByCategory(
      category,
      limit || 50,
      sortBy || 'featured',
    );
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get a product by ID or slug' })
  @ApiParam({ name: 'idOrSlug', description: 'Product ID (UUID) or slug' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(
    @Param('idOrSlug') idOrSlug: string,
  ): Promise<ProductResponseDto> {
    return this.productsService.findOne(idOrSlug);
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product (Admin only)' })
  @ApiResponse({ status: 201, type: ProductResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 409, description: 'SKU or slug already exists' })
  async create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    return this.productsService.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product (Admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
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

  // ============================================
  // PRODUCT OPTIONS (ADMIN)
  // ============================================

  @Post(':id/images')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add image to product (Admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 201, type: ProductResponseDto })
  async addImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddProductImageDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.addImage(id, dto);
  }

  @Delete(':id/images/:imageId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove image from product (Admin only)' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  async removeImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ): Promise<ProductResponseDto> {
    return this.productsService.removeImage(id, imageId);
  }

  @Post(':id/materials')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add material option to product (Admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 201, type: ProductResponseDto })
  async addMaterialOption(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMaterialOptionDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.addMaterialOption(id, dto);
  }

  @Post(':id/colors')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add color option to product (Admin only)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 201, type: ProductResponseDto })
  async addColorOption(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateColorOptionDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.addColorOption(id, dto);
  }
}
