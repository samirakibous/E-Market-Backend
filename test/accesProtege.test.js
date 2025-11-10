import { expect } from 'chai';
import request from 'supertest';
import app from '../server.js';
import User from '../models/User.js';
import { userFactory } from '../factories/userFactory.js';
import mongoose from 'mongoose';

let adminToken, userToken, otherUserToken, ownershipToken;
let adminUserId, normalUserId, otherUserId, ownershipUserId;
let adminRoutes;

describe("Tests d'accès protégés", () => {
  before(async function () {
    this.timeout(20000);
    //assurer la connexion Mongoose avant toute opération
    mongoose.set('bufferTimeoutMS', 30000);
    if (mongoose.connection.readyState !== 1) {
      const uri =
        process.env.MONGO_URI || 'mongodb://localhost:27017/emarket-test';
      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }

    await User.deleteMany({
      email: {
        $in: [
          'admin@test.com',
          'user@test.com',
          'other@test.com',
          'ownership@test.com',
          'new@test.com',
        ],
      },
    });

    // --- Créer utilisateurs via la factory ---
    const [adminUser] = await userFactory(1, {
      email: 'admin@test.com',
      password: 'password123',
      fullname: 'Admin User',
      role: 'admin',
    });
    adminUserId = adminUser._id;

    const [normalUser] = await userFactory(1, {
      email: 'user@test.com',
      password: 'password123',
      fullname: 'Normal User',
      role: 'user',
    });
    normalUserId = normalUser._id;

    const [otherUser] = await userFactory(1, {
      email: 'other@test.com',
      password: 'password123',
      fullname: 'Other User',
      role: 'user',
    });
    otherUserId = otherUser._id;

    const [ownershipUser] = await userFactory(1, {
      email: 'ownership@test.com',
      password: 'password123',
      fullname: 'Ownership User',
      role: 'user',
    });
    ownershipUserId = ownershipUser._id;

    // --- Fonction de login ---
    const login = async (email) => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'password123' });
      if (res.status !== 200) throw new Error(`Login failed for ${email}`);
      return res.body.data.token;
    };

    // --- Connexions ---
    adminToken = await login('admin@test.com');
    userToken = await login('user@test.com');
    otherUserToken = await login('other@test.com');
    ownershipToken = await login('ownership@test.com');

    // admin routes
    adminRoutes = [
      { method: 'get', path: '/api/users' },
      { method: 'get', path: '/api/users/deleted' },
      {
        method: 'post',
        path: '/api/users',
        body: {
          email: 'new@test.com',
          password: '123456',
          fullname: 'New User',
        },
      },
      { method: 'get', path: '/api/users/filter?role=user' },
    ];
  });

  after(async function () {
    this.timeout(15000);
    // --- Nettoyer après tests ---
    await User.deleteMany({
      email: {
        $in: [
          'admin@test.com',
          'user@test.com',
          'other@test.com',
          'ownership@test.com',
          'new@test.com',
        ],
      },
    });

    // Fermer la connexion pour que Mocha termine proprement
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  // ---------------- Routes admin ----------------
  describe('Routes nécessitant admin', () => {
    it('should deny access without token', async () => {
      for (const route of adminRoutes) {
        const res = await request(app)
          [route.method](route.path)
          .send(route.body || {});
        expect(res.status).to.equal(401);
      }
    });

    it('should deny access with non-admin token', async () => {
      for (const route of adminRoutes) {
        const res = await request(app)
          [route.method](route.path)
          .set('Authorization', `Bearer ${userToken}`)
          .send(route.body || {});
        console.log(`Route ${route.path} responded with status: ${res.status}`);

        expect(res.status).to.equal(403);
      }
    });

    it('should allow access with admin token', async () => {
      for (const route of adminRoutes) {
        const res = await request(app)
          [route.method](route.path)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(route.body || {});

        if (route.method === 'post') expect(res.status).to.equal(201);
        else expect(res.status).to.equal(200);
      }
    });
  });

  // ---------------- Routes ownership ----------------
  describe('Routes nécessitant ownership', () => {
    it('should deny access without token', async () => {
      let res = await request(app).patch(`/api/users/${ownershipUserId}`);
      expect(res.status).to.equal(401);

      res = await request(app).delete(`/api/users/${ownershipUserId}/avatar`);
      expect(res.status).to.equal(401);
    });

    it("should deny access with another user's token", async () => {
      let res = await request(app)
        .patch(`/api/users/${ownershipUserId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);
      expect(res.status).to.equal(403);

      res = await request(app)
        .delete(`/api/users/${ownershipUserId}/avatar`)
        .set('Authorization', `Bearer ${otherUserToken}`);
      expect(res.status).to.equal(403);
    });

    it('should allow access with owner token', async () => {
      let res = await request(app)
        .patch(`/api/users/${ownershipUserId}`)
        .set('Authorization', `Bearer ${ownershipToken}`)
        .send({ fullname: 'Updated Name' });
      expect(res.status).to.equal(200);

      res = await request(app)
        .delete(`/api/users/${ownershipUserId}/avatar`)
        .set('Authorization', `Bearer ${ownershipToken}`);
      // Si avatar non existant, status 400 ou 200 selon ton code
      expect([200, 400]).to.include(res.status);
    });

    it('admin cannot modify another user (ownership enforced)', async () => {
      const res = await request(app)
        .patch(`/api/users/${ownershipUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fullname: 'Admin Update Attempt' });
      expect(res.status).to.equal(403);
    });
  });

  describe(' get sellers', () => {
    it('GET /api/users/sellers should work with token', (done) => {
      request(app)
        .get('/api/users/sellers')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200, done);
    });
  });
});
