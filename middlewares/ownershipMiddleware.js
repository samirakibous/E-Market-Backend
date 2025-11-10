// middlewares/ownershipMiddleware.js
import Product from '../models/Product.js';
import User from '../models/User.js';
import Review from '../models/Review.js';

export const checkOwnership = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }
    const userIdFromToken = req.user.id; // ID contenu dans le JWT
    const userIdFromParams = req.params.id; // ID dans l'URL

    // Vérifie si l'utilisateur existe et n'est pas supprimé
    const targetUser = await User.findById(userIdFromParams);

    if (!targetUser || targetUser.deletedAt) {
      return res
        .status(404)
        .json({ message: 'Utilisateur introuvable ou supprimé' });
    }

    // Vérifie la propriété de l'utilisateur
    if (userIdFromToken === userIdFromParams) {
      return next(); // autorisé
    }
    return res.status(403).json({
      message:
        'Accès refusé : vous ne pouvez pas accéder aux données d’un autre utilisateur.',
    });
  } catch (error) {
    console.error('Erreur ownershipMiddleware:', error);
    return res
      .status(500)
      .json({ message: 'Erreur serveur dans ownershipMiddleware' });
  }
};

export const checkProductOwnership = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }
    const userIdFromToken = req.user.id;
    const productIdFromParams = req.params.id;
    const targetProduct = await Product.findById(productIdFromParams);

    if (!targetProduct || !targetProduct.seller_id) {
      return res
        .status(404)
        .json({ message: 'Product introuvable ou supprimé' });
    }

    if (userIdFromToken === targetProduct.seller_id.toString()) {
      return next();
    }
    return res.status(403).json({
      message:
        'Accès refusé : vous ne pouvez pas accéder aux données d’un autre vendeur.',
    });
  } catch (error) {
    console.error('Erreur ownershipMiddleware:', error);
    return res
      .status(500)
      .json({ message: 'Erreur serveur dans ownershipMiddleware' });
  }
};

// for check if the user have the Access of the user
export const checkReviewOwnership = async (req, res, next) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.user.toString() !== userId && !isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};
