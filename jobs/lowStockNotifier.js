// jobs/lowStockNotifier.js
import cron from 'node-cron';
import Cart from '../models/Cart.js';
import { notificationEmitter } from '../events/notificationEmitter.js';

cron.schedule('* * * * *', async () => {
  try {
    console.log('Job lowStockNotification démarré...');

    const carts = await Cart.find({}, 'items userId').populate(
      'items.productId',
      'title stock'
    );

    for (const cart of carts) {
      for (const item of cart.items) {
        const product = item.productId;
        if (!product) continue;

        // Stock critique et pas encore notifié
        if (product.stock <= 5 && !item.lowStockNotified) {
          notificationEmitter.emit('lowStock', {
            userId: cart.userId,
            product,
          });
          item.lowStockNotified = true;
        }

        // Réinitialiser si stock > 5
        if (product.stock > 5 && item.lowStockNotified) {
          item.lowStockNotified = false;
        }
      }
      await cart.save();
    }

    console.log('Job lowStockNotification exécuté !');
  } catch (err) {
    console.error('Erreur job lowStockNotification :', err);
  }
});
