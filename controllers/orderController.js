import mongoose from 'mongoose';
import Order from '../models/Order.js';
import OrderService from '../services/orderServices.js';
import { notificationEmitter } from '../events/notificationEmitter.js';
import Product from '../models/Product.js';

export const createOrder = async (req, res, next) => {
  let session = null;
  
  try {
    // Only use transactions in production or when explicitly supported
    if (process.env.NODE_ENV === 'production') {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    const userId = req.user.id;
    const couponCodes = req.body.coupons || [];

    const result = await OrderService.createOrder(userId, couponCodes, session);
    
    const productIds = result.order.items.map((i) => i.productId);
    const products = await Product.find(
      { _id: { $in: productIds } },
      'seller_id'
    );
    const sellerIds = [...new Set(products.map((p) => p.seller_id.toString()))];

    sellerIds.forEach((sellerId) => {
      notificationEmitter.emit('newOrder', {
        orderId: result.order._id,
        buyerId: userId,
        sellerId,
      });
    });

    if (session) {
      await session.commitTransaction();
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { ...result },
    });
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    next(error);
  } finally {
    if (session) {
      session.endSession();
    }
  }
};


export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id: orderId } = req.params;
    const { newStatus } = req.body;

    const validStatuses = ['pending', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findById(orderId);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });

    const statusPriority = {
      pending: 1,
      cancelled: 2,
      shipped: 3,
      delivered: 4,
    };

    // Only allow status updates if newStatus is same or higher priority
    if (statusPriority[newStatus] < statusPriority[order.status]) {
      return res.status(400).json({
        success: false,
        message: `Cannot revert order status from ${order.status} to ${newStatus}`,
      });
    }

    order.status = newStatus;
    await order.save();

    if (newStatus === 'cancelled') {
      const productIds = order.items.map((i) => i.productId);
      const products = await Product.find(
        { _id: { $in: productIds } },
        'seller_id'
      );
      const sellerIds = [
        ...new Set(products.map((p) => p.seller_id.toString())),
      ];

      // Notification pour chaque vendeur concerné
      sellerIds.forEach((sellerId) => {
        notificationEmitter.emit('orderDeleted', {
          orderId: order._id,
          buyerId: order.userId,
          sellerId,
          status: 'deleted',
        });
      });
    }

    res.json({
      success: true,
      message: 'Order status updated',
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// get all orders
export const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().notDeleted();
    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// ======================== soft delte functions ================================

// Soft delete
export const softDeleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ success: false, error: 'Order not found' });

    await order.softDelete();
    res.status(200).json({ success: true, message: 'Order soft deleted' });
  } catch (error) {
    next(error);
  }
};

// Restore
export const restoreOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ success: false, error: 'Order not found' });

    await order.restore(); // <-- helper
    res.status(200).json({
      success: true,
      message: 'Order restored',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// Get all soft-deleted Orders
export const getDeletedOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().deleted();
    res.status(200).json({
      success: true,
      message: 'Soft deleted order retrieved successfully',
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// get user not deleted orders
export const getUserOrders = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId }).notDeleted();
    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};
