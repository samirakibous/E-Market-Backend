import CartService from '../services/cartService.js';
import Cart from '../models/Cart.js';

import crypto from 'crypto';

function getCartIdentifier(req) {
  if (req.user) return { userId: req.user.id };
  let sessionId = req.headers['session-id'];

  if (!sessionId) {
    sessionId = crypto.randomBytes(16).toString('hex');
  }
  return { sessionId };
}

export const getCart = async (req, res, next) => {
  try {
    const identifier = getCartIdentifier(req);

    const cart = await Cart.findOne(identifier).populate(
      'items.productId',
      'title price images'
    );

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cart retrieved successfully',
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const identifier = getCartIdentifier(req);

    const { cart, message } = await CartService.addItem(
      identifier,
      productId,
      quantity
    );
    res.status(cart.createdAt === cart.updatedAt ? 201 : 200).json({
      success: true,
      message: message,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCartItemQuantity = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const identifier = getCartIdentifier(req);

    const { cart, message } = await CartService.updateItemQuantity(
      identifier,
      productId,
      quantity
    );
    return res.status(200).json({
      success: true,
      message: message,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const removeCartItem = async (req, res, next) => {
  try {
    const { productId } = req.body;
    const identifier = getCartIdentifier(req);

    const { cart, message } = await CartService.removeItem(
      identifier,
      productId
    );
    return res.status(200).json({
      success: true,
      message: message,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const identifier = getCartIdentifier(req);

    const { cart, message } = await CartService.clearCart(identifier);
    res.status(200).json({
      success: true,
      message: message,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};
