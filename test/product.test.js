import * as chai from 'chai';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import { userFactory } from '../factories/userFactory.js';
import { categoryFactory } from '../factories/categoryFactory.js';

const { expect } = chai;

describe('Product API', function () {
  this.timeout(10000);

  let testConnection;
  let token;
  let user, category;

  before(async () => {
    // Create test DB connection
    if (mongoose.connection.readyState) {
      await mongoose.disconnect();
    }

    // Connect to test DB
    await mongoose.connect(process.env.DB_URI);
    testConnection = mongoose.connection;
    // Seed a user
    [user] = await userFactory(1, {
      email: 'testuser@test.com',
      password: '123456',
      role: 'seller',
    });
    [category] = await categoryFactory(1);

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

  describe('POST /api/products', () => {
    it('should create a new product successfully', async () => {
      try {
        const res = await request(app)
          .post('/api/products')
          .set('Authorization', `Bearer ${token}`)
          .send({
            title: 'product 1',
            description: 'some text',
            price: 20,
            stock: 10,
            categories: [category._id],
            seller_id: user._id,
          });

        // Log the full response body in case of failure
        if (res.status !== 201) {
          console.error('Product creation failed:', res.body);
        }

        expect(res.status).to.equal(201);
        expect(res.body).to.have.property(
          'message',
          'Product created successfully'
        );
        expect(res.body).to.have.property('data');
      } catch (err) {
        console.error('Test error:', err);
        throw err;
      }
    });
  });

  describe('GET /api/products', () => {
    it('should get all products successfully', async () => {
      try {
        const res = await request(app).get('/api/products');

        if (res.status !== 200) {
          console.error('Getting products failed:', res.body);
        }

        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('data');
      } catch (err) {
        console.error('Test error:', err);
        throw err;
      }
    });
  });

   describe('POST /api/products', () => {
    it('shouldnt create a new product without valid token ', async () => {
      try {
        const res = await request(app)
          .post('/api/products')
          .set('Authorization',`Bearer hdhdhdfijfjf`)
          .send({
            title: 'product 1',
            description: 'some text',
            price: 20,
            stock: 10,
            categories: [category._id],
            seller_id: user._id,
          });

        // // Log the full response body in case of failure
        // if (res.status !== 201) {
        //   console.error('Product creation failed:', res.body);
        // }

        expect(res.status).to.equal(401);
        expect(res.body).to.have.property(
          'message',
          'Invalid or expired token'
        );
        // expect(res.body).to.have.property('data');
      } catch (err) {
        console.error('Test error:', err);
        throw err;
      }
    });
  });
});
