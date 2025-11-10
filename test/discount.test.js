import { expect } from 'chai';
import request from 'supertest';
import app from '../server.js';
import mongoose from 'mongoose';
import Coupon from '../models/Coupon.js';

describe('Coupon API', function () {
  this.timeout(10000);

  let adminToken;
  let userToken;
  let adminUserId;

  before(async () => {
    await mongoose.connect(process.env.DB_URI);

    const adminRes = await request(app).post('/api/auth/register').send({
      fullname: 'Admin User',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin',
    });
    const userRes = await request(app).post('/api/auth/register').send({
      fullname: 'Normal User',
      email: 'user@test.com',
      password: 'user123',
    });
    adminToken = adminRes.body.data.token;
    userToken = userRes.body.data.token;
    adminUserId = adminRes.body.data.user.id;
  });

  after(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  describe('Coupon Calculations', () => {
    let coupon;
    before(async () => {
      coupon = await Coupon.create({
        code: 'TEST10',
        type: 'percentage',
        value: 10,
        minimumPurchase: 50,
        startDate: new Date(),
        expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
        createdBy: adminUserId,
      });
    });

    it('Should calculate correct percentage discount', async () => {
      const res = await request(app)
        .post('/api/coupons/validate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          code: 'TEST10',
          purchaseAmount: 100,
        });
      expect(res.status).to.equal(200);
      expect(res.body.data.discountAmount).to.equal(10);
    });

    it('Should calculate correct fixed discount', async () => {
      coupon.type = 'fixed';
      coupon.value = 20;
      await coupon.save();
      const res = await request(app)
        .post('/api/coupons/validate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          code: 'TEST10',
          purchaseAmount: 100,
        });
      expect(res.status).to.equal(200);
      expect(res.body.data.discountAmount).to.equal(20);
    });

    it('Should validate minimum purchase condition', async () => {
      const res = await request(app)
        .post('/api/coupons/validate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          code: 'TEST10',
          purchaseAmount: 30,
        });
      expect(res.status).to.equal(400);
      expect(res.body.error).to.equal('Minimum purchase amount is 50');
    });

    it('Should handle expired coupon', async () => {
      coupon.startDate = new Date(Date.now() - 1000 * 60 * 60 * 24); // 1 day in the past
      coupon.expirationDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour in the past
      await coupon.save();

      const res = await request(app)
        .post('/api/coupons/validate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          code: 'TEST10',
          purchaseAmount: 100,
        });

      expect(res.status).to.equal(400);
      expect(res.body.error).to.equal('Coupon has expired or not yet active');
    });
  });
});
