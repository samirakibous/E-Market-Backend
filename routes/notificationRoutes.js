// routes/notificationRoutes.js
import express from 'express';
import {
  getNotifications,
  markAsRead,
} from '../controllers/notificationController.js';
import { isAuthenticated } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', isAuthenticated, getNotifications);
router.patch('/:id/read', isAuthenticated, markAsRead);

export default router;

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Gestion des notifications utilisateur
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - userId
 *         - message
 *       properties:
 *         userId:
 *           type: string
 *           description: ID de l'utilisateur destinataire
 *         message:
 *           type: string
 *           description: Contenu de la notification
 *         read:
 *           type: boolean
 *           description: Indique si la notification a été lue
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date de création de la notification
 *       example:
 *         userId: "671ff2dca113b4d3c4e8b22a"
 *         message: "Le produit 'T-shirt bleu' est presque épuisé (stock restant : 3)."
 *         read: false
 *         createdAt: "2025-10-27T21:40:00.000Z"
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Récupérer toutes les notifications de l'utilisateur connecté
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Non autorisé — Token manquant ou invalide
 *       500:
 *         description: Erreur interne du serveur
 */

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Marquer une notification comme lue
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la notification à marquer comme lue
 *     responses:
 *       200:
 *         description: Notification marquée comme lue avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       404:
 *         description: Notification introuvable
 *       401:
 *         description: Non autorisé — Token manquant ou invalide
 *       500:
 *         description: Erreur interne du serveur
 */
