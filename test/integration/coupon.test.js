import * as chai from 'chai';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server.js';
import { userFactory } from '../../factories/userFactory.js';
import { couponFactory } from '../../factories/couponFactory.js';
import Coupon from '../../models/Coupon.js';

const { expect } = chai;

describe('Coupon API', function () {
  let testConnection;
  let adminToken, sellerToken, userToken;
  let adminUser, sellerUser, normalUser;

  before(async () => {
    await mongoose.connect(process.env.DB_URI);
    testConnection = mongoose.connection;

    [adminUser] = await userFactory(1, {
      email: 'admin@test.com',
      password: '123456',
      role: 'admin',
    });
    [sellerUser] = await userFactory(1, {
      email: 'seller@test.com',
      password: '123456',
      role: 'seller',
    });
    [normalUser] = await userFactory(1, {
      email: 'user@test.com',
      password: '123456',
      role: 'user',
    });

    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: '123456' });
    adminToken = adminRes.body.data.token;

    const sellerRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'seller@test.com', password: '123456' });
    sellerToken = sellerRes.body.data.token;

    const userRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: '123456' });
    userToken = userRes.body.data.token;
  });

  after(async () => {
    if (testConnection) {
      await testConnection.dropDatabase();
      await testConnection.close();
    }
  });

  beforeEach(async () => {
    await Coupon.deleteMany({});
  });

  describe('Create coupon (seller/admin)', () => {
    it('should allow admin to create coupon', async () => {
      const couponData = {
        code: 'ADMIN20',
        type: 'percentage',
        value: 20,
        minimumPurchase: 100,
        maxUsagePerUser: 1,
        createdBy: adminUser._id,
        startDate: new Date(),
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      const res = await request(app)
        .post('/api/coupons')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(couponData);
      //console.log("Response status:", res.status);
      //console.log("Response body:", res.body);

      expect(res.status).to.equal(201);
      expect(res.body.message).to.equal('Coupon created successfully');
      expect(res.body.data.code).to.equal('ADMIN20');
    });

    it('should allow seller to create coupon', async () => {
      const couponData = {
        code: 'SELLER15',
        type: 'fixed',
        value: 15,
        minimumPurchase: 50,
        maxUsagePerUser: 1,
        startDate: new Date(),
        createdBy: sellerUser._id,
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      const res = await request(app)
        .post('/api/coupons')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(couponData);

      //console.log("Response status:", res.status);
      //console.log("Response body:", res.body);

      expect(res.status).to.equal(201);
      expect(res.body.message).to.equal('Coupon created successfully');
      expect(res.body.data.code).to.equal('SELLER15');
    });
  });

  describe('Normal user can not create a coupon', () => {
    it('should deny normal user from creating coupon', async () => {
      const couponData = {
        code: 'USER10',
        type: 'percentage',
        value: 10,
        minimumPurchase: 0,
        startDate: new Date(),
        createdBy: normalUser._id,
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };

      const res = await request(app)
        .post('/api/coupons')
        .set('Authorization', `Bearer ${userToken}`)
        .send(couponData);

      //console.log("Response status:", res.status)
      //console.log("Response body:", res.body)

      expect(res.status).to.equal(403);
      expect(res.body.message).to.contain('Access denied');
    });
  });

  describe('List coupons', () => {
    beforeEach(async () => {
      await couponFactory(3, { createdBy: adminUser._id });
      await couponFactory(2, { createdBy: sellerUser._id });
    });

    it('should allow admin to see all coupons', async () => {
      const res = await request(app)
        .get('/api/coupons')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.length(5);
    });

    it('should allow seller to see only their coupons', async () => {
      const res = await request(app)
        .get('/api/coupons')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.length(2);
    });
  });

  describe('Validate a valid coupon', () => {
    let validCoupon;

    beforeEach(async () => {
      [validCoupon] = await couponFactory(1, {
        code: 'VALID20',
        type: 'percentage',
        value: 20,
        minimumPurchase: 50,
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'active',
        createdBy: adminUser._id,
      });
    });

    it('should validate a valid coupon code', async () => {
      const res = await request(app)
        .post('/api/coupons/validate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          code: 'VALID20',
          purchaseAmount: 100,
          userId: normalUser._id,
        });

      expect(res.status).to.equal(200);
      expect(res.body.valid).to.be.true;
      expect(res.body.data.discountAmount).to.equal(20);
    });
  });

  describe('Validate expired coupon', () => {
    let expiredCoupon;

    beforeEach(async () => {
      [expiredCoupon] = await couponFactory(1, {
        code: 'EXPIRED20',
        type: 'percentage',
        value: 20,
        minimumPurchase: 0,
        startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        expirationDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        status: 'active',
        createdBy: adminUser._id,
      });
    });

    it('should reject expired coupon', async () => {
      const res = await request(app)
        .post('/api/coupons/validate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          code: 'EXPIRED20',
          purchaseAmount: 100,
        });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.equal('Coupon has expired or not yet active');
    });
  });

  describe('Validate a code with insufficient amount', () => {
    let minPurchaseCoupon;

    beforeEach(async () => {
      [minPurchaseCoupon] = await couponFactory(1, {
        code: 'MIN100',
        type: 'fixed',
        value: 20,
        minimumPurchase: 100,
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'active',
        createdBy: adminUser._id,
      });
    });

    it('should reject coupon when purchase amount is insufficient', async () => {
      const res = await request(app)
        .post('/api/coupons/validate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          code: 'MIN100',
          purchaseAmount: 50,
        });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.equal('Minimum purchase amount is 100');
    });
  });

  describe('Validate an exhausted coupon (max usage)', () => {
    let exhaustedCoupon;

    beforeEach(async () => {
      [exhaustedCoupon] = await couponFactory(1, {
        code: 'LIMITED2',
        type: 'fixed',
        value: 10,
        minimumPurchase: 0,
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxUsage: 2,
        status: 'active',
        createdBy: adminUser._id,
        usedBy: [
          { user: new mongoose.Types.ObjectId(), usageCount: 1 },
          { user: new mongoose.Types.ObjectId(), usageCount: 1 },
        ],
      });
    });

    it('should reject coupon when usage limit is reached', async () => {
      const res = await request(app)
        .post('/api/coupons/validate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          code: 'LIMITED2',
          purchaseAmount: 100,
        });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.equal('Coupon usage limit reached');
    });
  });

  describe('Apply coupon for order', () => {
    let orderCoupon;

    beforeEach(async () => {
      [orderCoupon] = await couponFactory(1, {
        code: 'ORDER15',
        type: 'percentage',
        value: 15,
        minimumPurchase: 0,
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'active',
        createdBy: adminUser._id,
      });
    });

    it('should successfully apply coupon to order', async () => {
      const res = await request(app)
        .post('/api/coupons/validate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          code: 'ORDER15',
          purchaseAmount: 200,
          userId: normalUser._id,
        });

      expect(res.status).to.equal(200);
      expect(res.body.valid).to.be.true;
      expect(res.body.data.code).to.equal('ORDER15');
      expect(res.body.data.discountAmount).to.equal(30);
    });
  });

  describe('Update a coupon', () => {
    let couponToUpdate;

    beforeEach(async () => {
      [couponToUpdate] = await couponFactory(1, {
        code: 'UPDATE20',
        createdBy: sellerUser._id,
      });
    });

    it('should allow seller to update their own coupon', async () => {
      const startDate = new Date();
      const expirationDate = new Date(
        startDate.getTime() + 7 * 24 * 60 * 60 * 1000
      );

      const updateData = {
        code: 'UPDATED25',
        type: 'percentage',
        value: 25,
        minimumPurchase: 0,
        startDate: startDate,
        expirationDate: expirationDate,
        createdBy: sellerUser._id,
      };

      const res = await request(app)
        .put(`/api/coupons/${couponToUpdate._id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(updateData);

      // console.log("Response status:", res.status)
      // console.log("Response body:", res.body)

      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal('Coupon updated');
      expect(res.body.data.code).to.equal('UPDATED25');
    });

    it('should allow admin to update any coupon', async () => {
      const startDate = new Date();
      const expirationDate = new Date(
        startDate.getTime() + 7 * 24 * 60 * 60 * 1000
      );

      const updateData = {
        code: couponToUpdate.code,
        type: 'fixed',
        value: 30,
        minimumPurchase: 0,
        startDate: startDate,
        expirationDate: expirationDate,
        createdBy: adminUser._id,
      };

      const res = await request(app)
        .put(`/api/coupons/${couponToUpdate._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      //console.log("Response status:", res.status)
      //console.log("Response body:", res.body)

      expect(res.status).to.equal(200);
      expect(res.body.data.value).to.equal(30);
    });
  });

  describe('Delete a coupon', () => {
    let couponToDelete;

    beforeEach(async () => {
      [couponToDelete] = await couponFactory(1, {
        createdBy: sellerUser._id,
      });
    });

    it('should allow seller to delete their own coupon', async () => {
      const res = await request(app)
        .delete(`/api/coupons/${couponToDelete._id}`)
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).to.equal(204);
    });

    it('should allow admin to delete any coupon', async () => {
      const res = await request(app)
        .delete(`/api/coupons/${couponToDelete._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(204);
    });
  });
});
