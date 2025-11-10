import express from 'express';
import * as CartController from '../controllers/cartController.js';
import validate from '../middlewares/validate.js';
import { cartSchema } from '../validations/cartSchema.js';
import { getLimiter, modifyLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.get('/', getLimiter, CartController.getCart);
router.post('/', modifyLimiter, validate(cartSchema), CartController.addToCart);
router.put(
  '/',
  modifyLimiter,
  validate(cartSchema),
  CartController.updateCartItemQuantity
);
router.delete('/', modifyLimiter, CartController.removeCartItem);
router.delete('/clear', modifyLimiter, CartController.clearCart);

export default router;

// ========================= swager documentation ==============================

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Authenticated user cart management
 *
 * /cart:
 *   get:
 *     summary: Get authenticated user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *       404:
 *         description: Cart not found
 *   post:
 *     summary: Add a product to the authenticated user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 example: 652fbbf16f8caa4a7c1dfd3d
 *               quantity:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Product added or updated in cart
 *       201:
 *         description: Cart created
 *
 *   put:
 *     summary: Update cart item quantity (authenticated)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       200:
 *         description: Cart updated successfully
 *
 *   delete:
 *     summary: Remove a product from cart (authenticated)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product removed successfully
 *
 * /cart/clear:
 *   delete:
 *     summary: Clear authenticated user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 */

/**
 * @swagger
 * tags:
 *   name: Guest Cart
 *   description: Guest cart management (without authentication)
 *
 * /guest-cart:
 *   get:
 *     summary: Get guest cart by session ID
 *     tags: [Guest Cart]
 *     parameters:
 *       - in: header
 *         name: session-id
 *         schema:
 *           type: string
 *         required: false
 *         description: Session ID to identify the guest's cart
 *     responses:
 *       200:
 *         description: Guest cart retrieved successfully
 *       404:
 *         description: Cart not found
 *
 *   post:
 *     summary: Add product to guest cart
 *     tags: [Guest Cart]
 *     parameters:
 *       - in: header
 *         name: session-id
 *         schema:
 *           type: string
 *         required: false
 *         description: Existing session ID; if missing, one will be created automatically
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 example: 652fbbf16f8caa4a7c1dfd3d
 *               quantity:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Product added or updated
 *       201:
 *         description: New guest cart created
 *
 *   put:
 *     summary: Update quantity in guest cart
 *     tags: [Guest Cart]
 *     parameters:
 *       - in: header
 *         name: session-id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 example: 4
 *     responses:
 *       200:
 *         description: Cart updated successfully
 *
 *   delete:
 *     summary: Remove product from guest cart
 *     tags: [Guest Cart]
 *     parameters:
 *       - in: header
 *         name: session-id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product removed successfully
 *
 * /guest-cart/clear:
 *   delete:
 *     summary: Clear guest cart
 *     tags: [Guest Cart]
 *     parameters:
 *       - in: header
 *         name: session-id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Guest cart cleared successfully
 */
