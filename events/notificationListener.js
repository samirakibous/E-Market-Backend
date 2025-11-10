// events/notificationListener.js
import { notificationEmitter } from './notificationEmitter.js';
import Notification from '../models/Notification.js';

// Quand un vendeur crée un produit
notificationEmitter.on(
  'newProduct',
  async ({ sellerId, productName, usersToNotify }) => {
    try {
      const message = `Nouveau produit publié : ${productName}`;

      // Créer une notification pour chaque utilisateur concerné
      const notifications = usersToNotify.map((userId) => ({
        userId,
        message,
      }));

      await Notification.insertMany(notifications);
      console.log('Notifications créées pour le nouveau produit !');
    } catch (error) {
      console.error('Erreur lors de la création des notifications :', error);
    }
  }
);

notificationEmitter.on('lowStock', async ({ userId, product }) => {
  try {
    const message = `Attention ! Le produit "${product.title}" dans votre panier est presque épuisé. Stock restant : ${product.stock}`;

    await Notification.create({ userId, message });

    console.log(
      `Notification low stock créée pour ${userId} - ${product.title}`
    );
  } catch (err) {
    console.error('Erreur création notification low stock :', err);
  }
});
