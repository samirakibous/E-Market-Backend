import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

class CartService {
  // Get cart by userId or sessionId
  static async getCart(identifier) {
    return await Cart.findOne(identifier);
  }

  // Add item to cart
  static async addItem(identifier, productId, quantity) {
    // Ensure quantity is a number
    quantity = Number(quantity);

    // check if product exists
    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');

    // Find the cart for this user/session
    let cart = await Cart.findOne(identifier);
    console.log(identifier);

    // creat cart if does not exist
    if (!cart) {
      cart = await Cart.create({
        ...identifier, // could be { userId } or { sessionId }
        items: [{ productId, quantity }],
      });
      return { cart, message: 'Cart created and item added' };
    }

    // Check if product is already in the cart
    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex > -1) {
      // if product exist increment quantity
      cart.items[itemIndex].quantity += quantity;
      await cart.save();
      return { cart, message: 'Product quantity updated in cart' };
    } else {
      // add new item if product doesn't exist
      cart.items.push({ productId, quantity });
      await cart.save();
      return { cart, message: 'Product added to cart' };
    }
  }

  // Update cart item quantity
  static async updateItemQuantity(identifier, productId, quantity) {
    const cart = await Cart.findOne(identifier);
    if (!cart) throw new Error('Cart not found');

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) throw new Error('Product not in cart');

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    return { cart, message: 'Cart item quantity updated' };
  }

  // Remove cart item
  static async removeItem(identifier, productId) {
    const cart = await Cart.findOne(identifier);
    if (!cart) throw new Error('Cart not found');

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) throw new Error('Product not in cart');

    // Remove item
    cart.items.splice(itemIndex, 1);
    await cart.save();

    return { cart, message: 'Product removed from cart' };
  }

  // Clear cart
  static async clearCart(identifier) {
    const cart = await Cart.findOne(identifier);
    if (!cart) throw new Error('Cart not found');

    cart.items = []; // remove all items
    await cart.save();

    return { cart, message: 'Cart cleared successfully' };
  }

  // merge cart
  static async mergeCarts(userId, sessionId) {
    if (!userId || !sessionId)
      throw new Error('UserId and sessionId are required');

    const guestCart = await Cart.findOne({ sessionId });
    if (!guestCart) return; // nothing to merge

    let userCart = await Cart.findOne({ userId });

    if (!userCart) {
      // No user cart → assign guest cart to user
      guestCart.userId = userId;
      guestCart.sessionId = null; // clear sessionId
      await guestCart.save();
      return guestCart;
    }

    // Merge items
    for (const guestItem of guestCart.items) {
      const index = userCart.items.findIndex(
        (item) => item.productId.toString() === guestItem.productId.toString()
      );

      if (index > -1) {
        // Product exists → sum quantities
        userCart.items[index].quantity += guestItem.quantity;
      } else {
        // Add new product
        userCart.items.push(guestItem);
      }
    }

    await userCart.save();

    // Delete guest cart
    await guestCart.deleteOne();

    return userCart;
  }
}

export default CartService;
