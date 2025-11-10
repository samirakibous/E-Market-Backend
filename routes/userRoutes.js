import express from 'express';
import * as userController from '../controllers/UserController.js';
import validate from '../middlewares/validate.js';
import { userSchema } from '../validations/userSchema.js';
import { checkOwnership } from '../middlewares/ownershipMiddleware.js';
import { createUpload } from '../config/multerConfig.js';
import { isAuthenticated } from '../middlewares/auth.js';
import { authorizeRoles } from '../middlewares/roles.js';

const router = express.Router();
router.use(isAuthenticated);

router.get(
  '/filter',
  isAuthenticated,
  authorizeRoles('admin'),
  userController.filterUsersByRole
);
router.get('/sellers', userController.searchSellers);
router.post(
  '/',
  validate(userSchema),
  isAuthenticated,
  authorizeRoles('admin'),
  userController.createUser
);
router.get(
  '/',
  isAuthenticated,
  authorizeRoles('admin'),
  userController.getUsers
);
router.get(
  '/deleted',
  isAuthenticated,
  authorizeRoles('admin'),
  userController.getDeletedUsers
);

router.get(
  '/:id',
  isAuthenticated,
  authorizeRoles('admin'),
  userController.getUserById
);
// router.patch("/:id",isAuthenticated,createUpload("avatars", "avatar", 1), validate(userSchema),checkOwnership, userController.updateUser);
router.patch(
  '/:id',
  isAuthenticated,
  createUpload('avatars', 'avatar', 1),
  checkOwnership,
  userController.updateUser
);
router.delete(
  '/:id',
  isAuthenticated,
  authorizeRoles('admin'),
  userController.deleteUser
);

router.delete(
  '/:id/soft',
  isAuthenticated,
  authorizeRoles('admin'),
  userController.softDeleteUser
);
router.patch(
  '/:id/restore',
  isAuthenticated,
  authorizeRoles('admin'),
  userController.restoreUser
);

router.delete(
  '/:id/avatar',
  isAuthenticated,
  checkOwnership,
  userController.deleteAvatar
);
router.put(
  '/:id/role',
  isAuthenticated,
  authorizeRoles('admin'),
  userController.changeRole
);

export default router;

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - fullname
 *         - email
 *         - password
 *       properties:
 *         fullname:
 *           type: string
 *           description: User's fullname
 *           example: John Doe
 *         email:
 *           type: string
 *           description: User's email
 *           example: johndoe@example.com
 *         password:
 *           type: string
 *           description: User's password
 *           example: password123
 *         role:
 *           type: string
 *           enum: [user, admin, seller]
 *           description: User role
 *           example: user
 *         avatar:
 *           type: string
 *           nullable: true
 *           description: URL of the user's avatar
 *           example: /uploads/avatars/avatar1.png
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *           example: 2025-10-12T10:00:00.000Z
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Soft delete timestamp
 *           example: null
 *     UserUpdate:
 *       type: object
 *       properties:
 *         fullname:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *         role:
 *           type: string
 *           enum: [user, admin, seller]
 *         avatar:
 *           type: string
 *           nullable: true
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 *   get:
 *     summary: Get all non-deleted users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *
 * /users/deleted:
 *   get:
 *     summary: Get all soft-deleted users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of soft-deleted users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *
 * /users/filter:
 *   get:
 *     summary: Filter users by role (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin, seller]
 *         required: true
 *         description: Role to filter users by
 *     responses:
 *       200:
 *         description: List of filtered users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *
 * /users/sellers:
 *   get:
 *     summary: Get all sellers
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of sellers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *   patch:
 *     summary: Update a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdate'
 *     responses:
 *       200:
 *         description: User updated
 *       404:
 *         description: User not found
 *   delete:
 *     summary: Delete a user permanently
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *
 * /users/{id}/soft:
 *   delete:
 *     summary: Soft delete a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User soft deleted
 *       404:
 *         description: User not found
 *
 * /users/{id}/restore:
 *   patch:
 *     summary: Restore a soft-deleted user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User restored
 *       404:
 *         description: User not found
 *
 * /users/{id}/avatar:
 *   delete:
 *     summary: Delete a user's avatar
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: Avatar deleted
 *       404:
 *         description: User not found
 *
 * /users/{id}/role:
 *   put:
 *     summary: Change a user's role (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin, seller]
 *                 example: seller
 *     responses:
 *       200:
 *         description: User role updated
 *       404:
 *         description: User not found
 */
