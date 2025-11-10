import * as chai from 'chai';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import { userFactory } from '../factories/userFactory.js';
import { cartFactory } from '../factories/cartFactory.js';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';

const { expect } = chai;

describe('Order API', function () {
  let testConnection;
  let token;
  let user, cart;

  before(async () => {
    // Connect to test DB
    await mongoose.connect(process.env.DB_URI);

    testConnection = mongoose.connection;
    // Seed a user
    [user] = await userFactory(1, {
      email: 'testuser@test.com',
      password: '123456',
    });
    // creat a seller
    await userFactory(1, {
      email: 'selleruser@test.com',
      password: '123456',
      role: 'seller',
    });

    // Seed a cart for the user
    [cart] = await cartFactory(1, { userId: user._id });

    // Log in user to get token
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testuser@test.com', password: '123456' });

    token = res.body.data.token;
  });

  after(async () => {
    if (testConnection) {
      await testConnection.dropDatabase();
      await testConnection.close();
    }
  });

  describe('POST /api/orders', () => {
    it('should create a new order successfully', async () => {
      try {
        const cart = await Cart.findOne({ userId: user._id });

        const res = await request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${token}`)
          .send({
            coupons: [], // optional
          });

        // Log the full response body in case of failure
        if (res.status !== 201) {
          console.error('Order creation failed:', res.body);
        }

        expect(res.status).to.equal(201);
        expect(res.body).to.have.property(
          'message',
          'Order created successfully'
        );
        expect(res.body.data).to.have.property('order');
      } catch (err) {
        console.error('Test error:', err);
        throw err;
      }
    });
  });

  // test creation when cart empty
  describe('POST /api/orders - error cases', () => {
    it('should fail if cart is empty', async () => {
      // Create a new user with no cart
      const [emptyUser] = await userFactory(1, {
        email: 'emptycart@test.com',
        password: '123456',
      });

      // Log in the user to get token
      const resLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'emptycart@test.com', password: '123456' });

      const token = resLogin.body.data.token;

      // Call the order creation endpoint
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ coupons: [] });

      expect(res.status).to.equal(500);
      expect(res.body).to.have.property('message', 'Cart is empty');
    });
  });

  // test order creation when coupon invalide
  describe('POST /api/orders - error cases', () => {
    it('should fail if coupon is invalid', async () => {
      // Create a user and a cart
      const [userWithCart] = await userFactory(1, {
        email: 'couponfail@test.com',
        password: '123456',
      });
      await cartFactory(1, { userId: userWithCart._id });

      // Log in the user
      const resLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'couponfail@test.com', password: '123456' });

      const token = resLogin.body.data.token;

      // Use an invalid coupon code
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ coupons: ['INVALIDCODE'] });

      expect(res.status).to.equal(500);
      expect(res.body.message).to.include('Coupon "INVALIDCODE" is invalid');
    });
  });

  // test update order status
  describe('PATCH /api/orders/:id/status', () => {
    let order;

    beforeEach(async () => {
      await Order.deleteMany({}); // clean previous orders
      order = await Order.create({
        userId: user._id,
        items: [
          { productId: new mongoose.Types.ObjectId(), quantity: 1, price: 100 },
        ],
        totalAmount: 100,
        discount: 0,
        finalAmount: 100,
        appliedCoupons: [],
        status: 'pending',
      });
    });

    it('should update order status successfully', async () => {
      try {
        const res = await request(app)
          .patch(`/api/orders/${order._id.toString()}/status`) // <-- ensure string
          .set('Authorization', `Bearer ${token}`)
          .send({ newStatus: 'shipped' });

        expect(res.status).to.equal(200);
        expect(res.body.data.order.status).to.equal('shipped');
      } catch (err) {
        console.error('Error in update order status test:', err);
        throw err;
      }
    });

    it('should return 400 for invalid status', async () => {
      try {
        const res = await request(app)
          .patch(`/api/orders/${order._id}/status`)
          .set('Authorization', `Bearer ${token}`)
          .send({ newStatus: 'invalid_status' });

        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('message', 'Invalid status');
      } catch (err) {
        console.error('Error in invalid status test:', err);
        throw err;
      }
    });

    it('should not allow reverting status', async () => {
      try {
        // First update to shipped
        await request(app)
          .patch(`/api/orders/${order._id}/status`)
          .set('Authorization', `Bearer ${token}`)
          .send({ newStatus: 'shipped' });

        // Now try to revert
        const res = await request(app)
          .patch(`/api/orders/${order._id}/status`)
          .set('Authorization', `Bearer ${token}`)
          .send({ newStatus: 'pending' });

        expect(res.status).to.equal(400);
        expect(res.body.message).to.include('Cannot revert order status');
      } catch (err) {
        console.error('Error in revert status test:', err);
        throw err;
      }
    });

    it('should return 404 for non-existent order', async () => {
      try {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
          .patch(`/api/orders/${fakeId}/status`)
          .set('Authorization', `Bearer ${token}`)
          .send({ newStatus: 'shipped' });

        expect(res.status).to.equal(404);
        expect(res.body).to.have.property('message', 'Order not found');
      } catch (err) {
        console.error('Error in non-existent order test:', err);
        throw err;
      }
    });
  });
});
