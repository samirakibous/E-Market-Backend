import { notificationEmitter } from './notificationEmitter.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { sendMail } from '../services/mailSender.js';

// Quand une nouvelle commande est créée
notificationEmitter.on('newOrder', async ({ orderId, buyerId, sellerId }) => {
  try {
    // Notification pour le vendeur
    const messageSeller = `Nouvelle commande reçue : ${orderId}`;
    await Notification.create({ userId: sellerId, message: messageSeller });

    // Notification pour l’acheteur
    const messageBuyer = `Commande passée avec succès : ${orderId}`;
    await Notification.create({ userId: buyerId, message: messageBuyer });

    console.log('Notifications créées pour la nouvelle commande !');

    // Récupérer les emails
    const buyer = await User.findById(buyerId);
    const seller = await User.findById(sellerId);

    if (!buyer || !seller) throw new Error('Acheteur ou vendeur introuvable');

    // Email pour l’acheteur
    await sendMail({
      to: buyer.email,
      subject: `Commande ${orderId} créée`,
      text: `Votre commande ${orderId} a été créée avec succès.`,
      html: `<p>Votre commande <strong>${orderId}</strong> a été créée avec succès.</p>`,
    });

    // Email pour le vendeur
    await sendMail({
      to: seller.email,
      subject: `Nouvelle commande reçue : ${orderId}`,
      text: `Vous avez reçu une nouvelle commande : ${orderId}.`,
      html: `<p>Vous avez reçu une nouvelle commande <strong>${orderId}</strong>.</p>`,
    });
  } catch (error) {
    console.error(
      'Erreur lors de la création des notifications et emails de commande :',
      error
    );
  }
});

// Quand une commande est supprimée
notificationEmitter.on(
  'orderDeleted',
  async ({ orderId, buyerId, sellerId }) => {
    try {
      // Notifications
      await Notification.create({
        userId: sellerId,
        message: `Commande ${orderId} a été supprimée`,
      });
      await Notification.create({
        userId: buyerId,
        message: `Votre commande ${orderId} a été supprimée`,
      });

      // Récupérer les emails
      const buyer = await User.findById(buyerId);
      const seller = await User.findById(sellerId);

      if (!buyer || !seller) throw new Error('Acheteur ou vendeur introuvable');

      // Email pour l’acheteur
      await sendMail({
        to: buyer.email,
        subject: `Commande ${orderId} supprimée`,
        text: `Votre commande ${orderId} a été supprimée.`,
        html: `<p>Votre commande <strong>${orderId}</strong> a été supprimée avec succès.</p>`,
      });

      // Email pour le vendeur
      await sendMail({
        to: seller.email,
        subject: `Commande ${orderId} supprimée`,
        text: `La commande ${orderId} a été supprimée.`,
        html: `<p>La commande <strong>${orderId}</strong> a été supprimée.</p>`,
      });

      console.log(
        'Notifications et emails créées pour la suppression de la commande !'
      );
    } catch (error) {
      console.error(
        'Erreur lors de la création des notifications et des emails de suppression de commande :',
        error
      );
    }
  }
);
