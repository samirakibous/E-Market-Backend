import express from 'express';
import * as couponController from '../controllers/couponController.js';
import validate from '../middlewares/validate.js';
import { couponSchema } from '../validations/couponSchema.js';
import { isAuthenticated } from '../middlewares/auth.js';
import { authorizeRoles } from '../middlewares/roles.js';
import { couponRateLimit } from '../middlewares/rateLimiter.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Coupons Admin & Seller
 *     description: Coupon management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Coupon:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         code:
 *           type: string
 *         type:
 *           type: string
 *           enum: [percentage, fixed]
 *         value:
 *           type: number
 *         minimumPurchase:
 *           type: number
 *         startDate:
 *           type: string
 *           format: date-time
 *         expirationDate:
 *           type: string
 *           format: date-time
 *         maxUsage:
 *           type: number
 *         maxUsagePerUser:
 *           type: number
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *         createdBy:
 *           type: string
 *         usedBy:
 *           type: array
 *           items:
 *             type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 */

// Toutes les routes doivent etre authentifier
router.use(isAuthenticated);

/**
 * @swagger
 * /coupons:
 *   post:
 *     tags: [Coupons Admin & Seller]
 *     summary: Create a new coupon
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - type
 *               - value
 *               - startDate
 *               - expirationDate
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 20
 *               type:
 *                 type: string
 *                 enum: [percentage, fixed]
 *               value:
 *                 type: number
 *                 minimum: 0
 *               minimumPurchase:
 *                 type: number
 *                 minimum: 0
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               expirationDate:
 *                 type: string
 *                 format: date-time
 *               maxUsage:
 *                 type: number
 *                 minimum: 1
 *               maxUsagePerUser:
 *                 type: number
 *                 minimum: 1
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       201:
 *         description: Coupon created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Coupon'
 *       403:
 *         description: Access denied
 */
router.post(
  '/',
  authorizeRoles('admin', 'seller'),
  validate(couponSchema),
  couponController.createCoupon
);

/**
 * @swagger
 * /coupons:
 *   get:
 *     tags: [Coupons Admin & Seller]
 *     summary: Get all coupons
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of coupons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Coupon'
 *       403:
 *         description: Access denied
 */
router.get(
  '/',
  authorizeRoles('admin', 'seller'),
  couponController.getAllCoupons
);

/**
 * @swagger
 * /coupons/{id}:
 *   get:
 *     tags: [Coupons Admin & Seller]
 *     summary: Get coupon by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Coupon details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Coupon'
 *       403:
 *         description: Access denied
 *       404:
 *         description: Coupon not found
 */
router.get(
  '/:id',
  authorizeRoles('admin', 'seller'),
  couponController.getCouponById
);

/**
 * @swagger
 * /coupons/{id}:
 *   put:
 *     tags: [Coupons Admin & Seller]
 *     summary: Update a coupon
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 20
 *               type:
 *                 type: string
 *                 enum: [percentage, fixed]
 *               value:
 *                 type: number
 *                 minimum: 0
 *               minimumPurchase:
 *                 type: number
 *                 minimum: 0
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               expirationDate:
 *                 type: string
 *                 format: date-time
 *               maxUsage:
 *                 type: number
 *                 minimum: 1
 *               maxUsagePerUser:
 *                 type: number
 *                 minimum: 1
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Coupon updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Coupon'
 *       403:
 *         description: Access denied
 *       404:
 *         description: Coupon not found
 */
router.put(
  '/:id',
  authorizeRoles('admin', 'seller'),
  validate(couponSchema),
  couponController.updateCoupon
);

/**
 * @swagger
 * /coupons/{id}:
 *   delete:
 *     tags: [Coupons Admin & Seller]
 *     summary: Delete a coupon
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Coupon deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Coupon not found
 */
router.delete(
  '/:id',
  authorizeRoles('admin', 'seller'),
  couponController.deleteCoupon
);
/**
 * @swagger
 * tags:
 *   - name: Coupons User
 *     description: Coupon management
 */
/**
 * @swagger
 * /coupons/validate:
 *   post:
 *     tags: [Coupons User]
 *     summary: Validate a coupon
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Coupon validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 discount:
 *                   type: number
 *                 finalAmount:
 *                   type: number
 *                 coupon:
 *                   $ref: '#/components/schemas/Coupon'
 *       400:
 *         description: Invalid coupon
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/validate', couponRateLimit, couponController.validateCoupon);

export default router;
