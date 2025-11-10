import { expect } from 'chai';
import request from 'supertest';
import app from '../server.js';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { userFactory } from '../factories/userFactory.js';

describe('Review API', function () {
  this.timeout(10000);

  let userToken;
  let userId;
  let productId;
  let productId2;

  before(async () => {
    await mongoose.connect(process.env.DB_URI);

    // create user
    const user = await userFactory(1, {
      email: 'testuser@test.com',
      password: 'test123',
    });
    userId = user[0]._id;

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'testuser@test.com', password: 'test123' });
    userToken = loginRes.body.data.token;

    // create product
    const product = await Product.create({
      title: 'test Product',
      description: 'test description',
      price: 100,
      stock: 10,
      category: [],
      seller_id: userId,
    });
    productId = product._id;
    const product2 = await Product.create({
      title: 'test Product 2',
      description: 'test description 2',
      price: 200,
      stock: 5,
      category: [],
      seller_id: userId,
    });
    productId2 = product2._id;

    // create order
    await Order.create({
      userId,
      items: [{ productId, quantity: 1, price: 100 }],
      totalAmount: 100,
      finalAmount: 100,
      status: 'delivered',
    });
  });
  after(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });
  describe('Verification achat produit', () => {
    it('Should allow review if the user has purchased the product', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId,
          rating: 5,
          comment: 'Great product',
        });
      expect(res.status).to.equal(201);
      expect(res.body.message).to.equal('Review created successfully');
    });
    it('Should not allow review if the user has not purchased the product', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: productId2,
          rating: 4,
          comment: 'Cannot review',
        });
      expect(res.status).to.equal(403);
      expect(res.body.error).to.equal(
        'You must purchase this product before reviewing'
      );
    });
  });
  describe('Calcul note moyenne', () => {
    it('Should calculate correct average rating for the product', async () => {
      // create second user and third user
      const user2 = await userFactory(1, {
        email: 'testuser2@test.com',
        password: 'test123',
      });
      const userId2 = user2[0]._id;

      await Review.create({
        user: userId2,
        product: productId,
        rating: 4,
        comment: 'Good product',
      });

      const user3 = await userFactory(1, {
        email: 'testuser3@test.com',
        password: 'test123',
      });
      const userId3 = user3[0]._id;

      await Review.create({
        user: userId3,
        product: productId,
        rating: 3,
        comment: 'Average product',
      });

      const res = await request(app)
        .get(`/api/reviews/product/${productId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.averageRating).to.equal(4); // (5+4+3) / 3 = 4
    });
  });
  describe('Verification conditions review', () => {
    it('Should require authentification (1-5)', async () => {
      const res = await request(app).post('/api/reviews').send({
        productId,
        rating: 5,
        comment: 'Test',
      });
      expect(res.status).to.equal(401);
    });
    it('Should validate rating range (1-5)', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId,
          rating: 6,
          comment: 'Invalid rating',
        });
      expect(res.status).to.equal(400);
    });
    it('Should require comment', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId,
          rating: 5,
        });
      expect(res.status).to.equal(429);
    });
  });
});
