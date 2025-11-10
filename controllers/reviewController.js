import Review from '../models/Review.js';
import * as reviewService from '../services/reviewService.js';

// Créer un avis
export const createReview = async (req, res, next) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id;

    // Vérifier toutes les conditions
    const { canReview, reason } = await reviewService.canUserReview(
      userId,
      productId
    );
    if (!canReview) {
      return res.status(403).json({ error: reason });
    }

    // Créer l'avis
    const review = new Review({
      user: userId,
      product: productId,
      rating,
      comment,
    });

    await review.save();

    // Mettre à jour la note moyenne du produit
    await reviewService.updateProductRating(productId);

    res
      .status(201)
      .json({ message: 'Review created successfully', data: review });
  } catch (error) {
    next(error);
  }
};

// Récupérer tous les avis d'un produit
export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const isAdmin = req.user?.role === 'admin';

    const filter = { product: productId };
    if (!isAdmin) {
      //filter.status = "approved";
    }
    const reviews = await Review.find(filter)
      .populate('user', 'fullname avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(filter);

    res.status(200).json({
      data: reviews,
      averageRating:
        reviews.reduce((acc, review) => acc + review.rating, 0) /
        reviews.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    next(error);
  }
};

// Récupérer tous les avis de l'utilisateur connecté
export const getUserReviews = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const reviews = await Review.find({ user: userId })
      .populate('product', 'title images price')
      .sort({ createdAt: -1 });

    res.status(200).json({ data: reviews });
  } catch (error) {
    next(error);
  }
};

// Mettre à jour un avis
export const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findByIdAndUpdate(
      id,
      {
        ...(rating && { rating }),
        ...(comment && { comment }),
        status: 'pending',
      },
      { new: true }
    );

    // Recalculer la note moyenne du produit
    await reviewService.updateProductRating(review.product);

    res
      .status(200)
      .json({ message: 'Review updated successfully', data: review });
  } catch (error) {
    next(error);
  }
};

// Supprimer un avis
export const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const review = await Review.findByIdAndDelete(id);

    // Recalculer la note moyenne du produit
    await reviewService.updateProductRating(review.product);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Modérer un avis (Admin uniquement)
export const moderateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const review = await Review.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Recalculer la note moyenne si approuvé/rejeté
    await reviewService.updateProductRating(review.product);

    res
      .status(200)
      .json({ message: 'Review moderated successfully', data: review });
  } catch (error) {
    next(error);
  }
};
