import express from 'express';
import * as OrderController from '../controllers/orderController.js';
import { isAuthenticated, isAdmin } from '../middlewares/auth.js';
import { authorizeRoles } from '../middlewares/roles.js';
import { isAdminOrOwner } from '../middlewares/adminOrOwne.js';
import { getLimiter, modifyLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.use(isAuthenticated);

router.get('/', getLimiter,isAdmin, OrderController.getOrders);
router.get('/deleted', isAdmin, getLimiter, OrderController.getDeletedOrders);
router.get(
  '/:userId',
  isAuthenticated,
  getLimiter,
  isAdminOrOwner,
  OrderController.getUserOrders
);

router.post(
  '/',
  authorizeRoles('user'),
  modifyLimiter,
  OrderController.createOrder
);
router.patch(
  '/:id/status',
  authorizeRoles('user'),
  modifyLimiter,
  OrderController.updateOrderStatus
);

router.delete(
  '/:id/soft',
  isAdmin,
  modifyLimiter,
  OrderController.softDeleteOrder
);
router.patch(
  '/:id/restore',
  isAdmin,
  modifyLimiter,
  OrderController.restoreOrder
);

export default router;

// ======================= swager documentation =================================
/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Manage orders (create, update, view, soft delete, restore)
 *
 * /orders:
 *   post:
 *     summary: Create a new order for the authenticated user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               coupons:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["DISCOUNT10"]
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid input
 *
 *   get:
 *     summary: Get all orders (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all orders
 *       403:
 *         description: Forbidden (Admin only)
 *
 * /orders/deleted:
 *   get:
 *     summary: Get all soft-deleted orders (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of deleted orders
 *
 * /orders/{userId}:
 *   get:
 *     summary: Get all orders for a specific user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user's ID
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       403:
 *         description: Not allowed (only admin or owner)
 *
 * /orders/{id}/status:
 *   patch:
 *     summary: Update order status (user)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newStatus:
 *                 type: string
 *                 enum: [pending, shipped, delivered, cancelled]
 *                 example: shipped
 *     responses:
 *       200:
 *         description: Order status updated
 *       400:
 *         description: Invalid status or transition
 *       404:
 *         description: Order not found
 *
 * /orders/{id}/soft:
 *   delete:
 *     summary: Soft delete an order (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order soft deleted
 *       404:
 *         description: Order not found
 *
 * /orders/{id}/restore:
 *   patch:
 *     summary: Restore a soft-deleted order (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order restored successfully
 *       404:
 *         description: Order not found
 */
