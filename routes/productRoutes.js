import express from 'express';
import * as productController from '../controllers/ProductController.js';
import validate from '../middlewares/validate.js';
import { productSchema } from '../validations/productSchema.js';
import { authorizeRoles } from '../middlewares/roles.js';
import { createUploadFields } from '../config/multerConfig.js';
import { isAuthenticated } from '../middlewares/auth.js';
import { checkProductOwnership } from '../middlewares/ownershipMiddleware.js';
import { cacheMiddleware } from '../middlewares/cache.js';
import { optimizeImages } from '../middlewares/optimizeImages.js';
import { productRateLimit } from '../middlewares/rateLimiter.js';

const router = express.Router();

const productImageUpload = createUploadFields('products', [
  { name: 'primaryImage', maxCount: 1 },
  { name: 'secondaryImages', maxCount: 5 },
]);

router.post(
  '/',
  productRateLimit,
  isAuthenticated,
  productImageUpload,
  optimizeImages(),
  validate(productSchema),
  authorizeRoles('seller'),
  productController.createProduct
);
router.get(
  '/',
  productRateLimit,
  productController.getProducts
);
//router.get("/", productController.getProducts);
router.get(
  '/published',
  cacheMiddleware('published', 600),
  productController.getPublishedProducts
);
router.get('/deleted', productController.getDeletedProducts);
router.get(
  '/search',
  productRateLimit,
  cacheMiddleware('search', 300),
  productController.searchProducts
);

// Get a single product by ID
router.get('/:id', productController.getProductById);

// Get seller's products
router.get(
  '/seller/:sellerId',
  isAuthenticated,
  productController.getProductsBySeller
);


// Update a product
router.put(
  '/:id',
  isAuthenticated,
  authorizeRoles('seller'),
  checkProductOwnership,
  productImageUpload,
  validate(productSchema),
  productController.updateProduct
);

// Permanent delete a product
router.delete('/:id', authorizeRoles('admin'), productController.deleteProduct);

// soft delete a product
router.delete(
  '/:id/soft',
  authorizeRoles('seller'),
  checkProductOwnership,
  productController.softDeleteProduct
);

// restore a soft-deleted product
router.patch(
  '/:id/restore',
  authorizeRoles('seller'),
  checkProductOwnership,
  productController.restoreProduct
);

// Publish a product
router.patch(
  '/:id/publish',
  isAuthenticated,
  authorizeRoles('seller'),
  checkProductOwnership,
  productController.publishProduct
);

export default router;

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - price
 *         - stock
 *         - categories
 *         - seller_id
 *       properties:
 *         title:
 *           type: string
 *           description: The product title
 *         description:
 *           type: string
 *           description: The product description
 *         price:
 *           type: number
 *           description: The price of the product
 *           minimum: 0
 *         ex_price:
 *           type: number
 *           description: The ex price of the product
 *           minimum: 0
 *         stock:
 *           type: number
 *           description: The number of items in stock
 *           minimum: 0
 *         categories:
 *           type: array
 *           description: IDs of categories this product belongs to
 *           items:
 *             type: string
 *         primaryImage:
 *           type: string
 *           description: URL or path to product image
 *         secondaryImages:
 *           type: array
 *           items:
 *             type: string
 *             description: URL or path to secondary product images
 *         published:
 *           type: boolean
 *           description: the publishing status of the product
 *         seller_id:
 *           type: string
 *           description: Id of seller that created the product
 *         createdAt:
 *           type: string
 *           format: date-time
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *       example:
 *         title: "Wireless Mouse"
 *         description: "Ergonomic wireless mouse with USB receiver"
 *         price: 29.99
 *         ex_price: 39.99
 *         stock: 150
 *         categories: ["60d21b4567d0d8992e610c80"]
 *         primaryImage: "uploads/mouse1.jpg"
 *         secondaryImages: ["uploads/mouse2.jpg", "uploads/mouse3.jpg"]
 *         published: true
 *         createdAt: "2025-10-12T07:14:46.501Z"
 *         deletedAt: null
 */

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of all products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */

/**
 * @swagger
 * /products/deleted:
 *   get:
 *     summary: Get all soft-deleted products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of deleted products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The product ID
 *     responses:
 *       200:
 *         description: Product found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     summary: Update a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /products/{id}/soft:
 *   delete:
 *     summary: Soft delete a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The product ID
 *     responses:
 *       200:
 *         description: Product soft deleted successfully
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /products/{id}/restore:
 *   patch:
 *     summary: Restore a soft-deleted product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The product ID
 *     responses:
 *       200:
 *         description: Product restored successfully
 *       404:
 *         description: Product not found
 */

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Permanently delete a product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The product ID
 *     responses:
 *       200:
 *         description: Product permanently deleted
 *       404:
 *         description: Product not found
 */
