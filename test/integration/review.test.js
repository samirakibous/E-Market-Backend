import * as chai from 'chai';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server.js';
import { userFactory } from '../../factories/userFactory.js';
import Review from '../../models/Review.js';
import Product from '../../models/Product.js';
import Order from '../../models/Order.js';

const { expect } = chai;

describe('Review API', function () {
  let testConnection;
  let adminToken;
  let userToken;
  let user2Token;
  let adminUser;
  let normalUser;
  let user2;
  let testProduct;
  let testOrder;

  before(async () => {
    await mongoose.connect(process.env.DB_URI);
    testConnection = mongoose.connection;

    [adminUser] = await userFactory(1, {
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin',
    });
    [normalUser] = await userFactory(1, {
      email: 'user@test.com',
      password: 'user123',
    });
    [user2] = await userFactory(1, {
      email: 'user2@test.com',
      password: 'user123',
    });

    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'admin123' });
    adminToken = adminRes.body.data.token;
    const userRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'user123' });
    userToken = userRes.body.data.token;
    const user2Res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user2@test.com', password: 'user123' });
    user2Token = user2Res.body.data.token;

    testProduct = new Product({
      title: 'Test Product',
      description: 'Test description',
      price: 100,
      seller_id: adminUser._id,
      category: new mongoose.Types.ObjectId(),
      stock: 10,
    });
    await testProduct.save();
  });

  after(async () => {
    if (testConnection) {
      await testConnection.dropDatabase();
      await testConnection.close();
    }
  });

  beforeEach(async () => {
    await Review.deleteMany({});
    await Order.deleteMany({});
  });

  describe('Create review after purchase', () => {
    beforeEach(async () => {
      testOrder = new Order({
        userId: normalUser._id,
        items: [{ productId: testProduct._id, quantity: 1, price: 100 }],
        status: 'delivered',
        totalAmount: 100,
        finalAmount: 100,
      });
      await testOrder.save();
    });

    it('Should create review after purchase', async () => {
      const reviewData = {
        productId: testProduct._id,
        rating: 5,
        comment: 'Excellent product !',
      };
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send(reviewData);

      expect(res.status).to.equal(201);
      expect(res.body.message).to.equal('Review created successfully');
      expect(res.body.data.rating).to.equal(5);
    });
  });

  describe('Create a review without purchase', () => {
    it('Should reject review without purchase', async () => {
      const reviewData = {
        productId: testProduct._id,
        rating: 4,
        comment: 'good product !',
      };
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send(reviewData);

      expect(res.status).to.equal(403);
      expect(res.body.error).to.equal(
        'You must purchase this product before reviewing'
      );
    });
  });

  describe('Create a duplicate review', () => {
    beforeEach(async () => {
      testOrder = new Order({
        userId: normalUser._id,
        items: [{ productId: testProduct._id, quantity: 1, price: 100 }],
        status: 'delivered',
        totalAmount: 100,
        finalAmount: 100,
      });
      await testOrder.save();

      await new Review({
        user: normalUser._id,
        product: testProduct._id,
        rating: 4,
        comment: 'First review',
      }).save();
    });

    it('Should reject duplicate review', async () => {
      const reviewData = {
        productId: testProduct._id,
        rating: 5,
        comment: 'Second review',
      };
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send(reviewData);

      expect(res.status).to.equal(403);
      expect(res.body.error).to.equal('You have already reviewed this product');
    });
  });

  describe('List reviews for one product', () => {
    beforeEach(async () => {
      await Review.create([
        {
          user: normalUser._id,
          product: testProduct._id,
          rating: 4,
          comment: 'Good product',
        },
        {
          user: user2._id,
          product: testProduct._id,
          rating: 5,
          comment: 'Excellent',
        },
        {
          user: adminUser._id,
          product: testProduct._id,
          rating: 3,
          comment: 'Average',
        },
      ]);
    });

    it('Should list product reviews', async () => {
      const res = await request(app)
        .get(`/api/reviews/product/${testProduct._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.length(3);
      expect(res.body.averageRating).to.be.a('number');
    });
  });

  describe('Update own review', () => {
    let userReview;

    beforeEach(async () => {
      userReview = new Review({
        user: normalUser._id,
        product: testProduct._id,
        rating: 3,
        comment: 'Original Comment',
      });
      await userReview.save();
    });

    it('Should update own review', async () => {
      const updateData = {
        rating: 5,
        comment: 'Updated comment',
      };
      const res = await request(app)
        .put(`/api/reviews/${userReview._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal('Review updated successfully');
      expect(res.body.data.rating).to.equal(5);
    });
  });

  describe("Update another user's review", () => {
    let otherUserReview;

    beforeEach(async () => {
      otherUserReview = new Review({
        user: user2._id,
        product: testProduct._id,
        rating: 3,
        comment: "Other user's review",
      });
      await otherUserReview.save();
    });

    it("Should reject updating another user's review", async () => {
      const updateData = {
        rating: 1,
        comment: 'Malicious update',
      };
      const res = await request(app)
        .put(`/api/reviews/${otherUserReview._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(res.status).to.equal(403);
      expect(res.body.error).to.equal('Access denied');
    });
  });

  describe('Delete my review', () => {
    let userReview;

    beforeEach(async () => {
      userReview = new Review({
        user: normalUser._id,
        product: testProduct._id,
        rating: 3,
        comment: 'Original Comment',
      });
      await userReview.save();
    });

    it('Should delete own review', async () => {
      const res = await request(app)
        .delete(`/api/reviews/${userReview._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).to.equal(204);
    });
  });

  describe('Admin moderate a review', () => {
    let reviewToModerate;

    beforeEach(async () => {
      reviewToModerate = new Review({
        user: normalUser._id,
        product: testProduct._id,
        rating: 2,
        comment: 'Needs moderation',
        status: 'pending',
      });
      await reviewToModerate.save();
    });

    it('should allow admin to moderate review', async () => {
      const moderationData = {
        status: 'approved',
      };

      const res = await request(app)
        .patch(`/api/reviews/${reviewToModerate._id}/moderate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(moderationData);

      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal('Review moderated successfully');
      expect(res.body.data.status).to.equal('approved');
    });
  });

  describe('Updated average rating', () => {
    beforeEach(async () => {
      await Review.create([
        {
          user: normalUser._id,
          product: testProduct._id,
          rating: 4,
          comment: 'Good',
          status: 'approved',
        },
        {
          user: user2._id,
          product: testProduct._id,
          rating: 5,
          comment: 'Excellent',
          status: 'approved',
        },
      ]);
    });

    it('should calculate correct average rating', async () => {
      const { averageRating, totalReviews } =
        await Review.calculateAverageRating(testProduct._id);
      expect(averageRating).to.equal(4.5);
      expect(totalReviews).to.equal(2);
    });
  });
});
