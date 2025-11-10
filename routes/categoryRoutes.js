import express from 'express';
import * as CategoryController from '../controllers/CategoryController.js';
import validate from '../middlewares/validate.js';
import { categorySchema } from '../validations/categorySchema.js';
import { authorizeRoles } from '../middlewares/roles.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

router.use(isAuthenticated);

router.post(
  '/',
  validate(categorySchema),
  authorizeRoles('seller', 'admin'),
  CategoryController.createCategory
);
router.get('/', CategoryController.getCategories);
router.get(
  '/deleted',
  authorizeRoles('admin'),
  CategoryController.getDeletedCategories
);

router.patch(
  '/:id',
  validate(categorySchema),
  authorizeRoles('admin'),
  CategoryController.updateCategory
);
router.delete(
  '/:id',
  authorizeRoles('admin'),
  CategoryController.deleteCategory
);
router.get('/:id', CategoryController.getCategoryById);

router.delete(
  '/:id/soft',
  authorizeRoles('admin'),
  CategoryController.softDeleteCategory
);
router.patch(
  '/:id/restore',
  authorizeRoles('admin'),
  CategoryController.restoreCategory
);

export default router;

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: The category name
 *         createdAt:
 *           type: string
 *           format: date-time
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *       example:
 *         name: "Technology"
 *         createdAt: "2025-10-12T07:14:46.501Z"
 *         deletedAt: null
 */

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of all categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */

/**
 * @swagger
 * /categories/deleted:
 *   get:
 *     summary: Get all soft-deleted categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of deleted categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get a category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The category ID
 *     responses:
 *       200:
 *         description: Category found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 */

/**
 * @swagger
 * /categories/{id}:
 *   patch:
 *     summary: Update a category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       404:
 *         description: Category not found
 */

/**
 * @swagger
 * /categories/{id}/soft:
 *   delete:
 *     summary: Soft delete a category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The category ID
 *     responses:
 *       200:
 *         description: Category soft deleted successfully
 *       404:
 *         description: Category not found
 */

/**
 * @swagger
 * /categories/{id}/restore:
 *   patch:
 *     summary: Restore a soft-deleted category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The category ID
 *     responses:
 *       200:
 *         description: Category restored successfully
 *       404:
 *         description: Category not found
 */

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Permanently delete a category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The category ID
 *     responses:
 *       200:
 *         description: Category permanently deleted
 *       404:
 *         description: Category not found
 */
