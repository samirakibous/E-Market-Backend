import * as chai from 'chai';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import User from '../models/User.js';
import { userFactory } from '../factories/userFactory.js';

const { expect } = chai;
//pour regrouper un ensemble des tests
describe('Auth API', function () {
  this.timeout(10000); // augmenter le timeout pour les opérations DB

  // Avant tous les tests : connexion à la DB de test
  before(async () => {
    if (mongoose.connection.readyState) {
      await mongoose.disconnect();
    }
    await mongoose.connect(process.env.DB_URI);
  });

  // Après tous les tests : nettoyer et fermer la connexion
  after(async () => {
    await mongoose.connection.db.dropDatabase(); // supprimer la DB de test
    await mongoose.disconnect();
  });

  // Avant chaque test : supprimer tous les utilisateurs pour recommencer à zéro
  beforeEach(async () => {
    await User.deleteMany({});
  });

  // ------------------- TESTS REGISTER -------------------
  describe('POST /api/auth/register', () => {
    //it : décrit un test individuel
    it('should register a new user successfully', async () => {
      // On envoie une requête POST pour créer un utilisateur
      //request(app): supertest cible serveur Express
      const res = await request(app)
        // On envoie requette POST
        .post('/api/auth/register')
        //envoie les données de nouvel utilisateur
        .send({
          fullname: 'Test User',
          email: 'testuser@test.com',
          password: '123456',
        });

      // Vérification du statut HTTP
      expect(res.status).to.equal(201);

      // Vérification des propriétés de la réponse
      expect(res.body).to.have.property(
        'message',
        'User registered successfully'
      );
      expect(res.body.data).to.have.property('token');
      expect(res.body.data.user).to.have.property('email', 'testuser@test.com');
      expect(res.body.data.user).to.have.property('fullname', 'Test User');
      // expect(res.body.user).to.have.property("role", "user");
      // expect(res.body.user).to.have.property("avatar");
    });

    it('should not register if email already exists', async () => {
      // On crée d'abord un utilisateur avec l'email
      await userFactory(1, { email: 'duplicate@test.com' });

      // Puis on tente de créer un autre utilisateur avec le même email
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullname: 'Dup User',
          email: 'duplicate@test.com',
          password: '123456',
        });

      // Vérification du statut et du message d'erreur
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message', 'Email already in use');
    });
  });

  // ------------------- TESTS LOGIN -------------------
  describe('POST /api/auth/login', () => {
    it('should login an existing user successfully', async () => {
      // Création d'un utilisateur pour le test
      // await userFactory(1, { email: "login@test.com", password: "123456" });
      let user;
      [user] = await userFactory(1, {
        email: 'login@test.com',
        password: '123456',
      });

      // Requête POST pour se connecter
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password: '123456' });

      // Vérification du succès
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message', 'Login successful');
      expect(res.body.data).to.have.property('token');
      expect(res.body.data.user).to.have.property('email', 'login@test.com');
    });

    it('should return 404 if user not found', async () => {
      // Tentative de connexion avec un email inexistant
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'notfound@test.com', password: '123456' });

      // Vérification du message d'erreur
      expect(res.status).to.equal(404);
      expect(res.body).to.have.property('message', 'User not found');
    });

    it('should return 400 if password is incorrect', async () => {
      // Création d'un utilisateur avec un mot de passe connu
      await userFactory(1, { email: 'wrongpass@test.com', password: '123456' });

      // Tentative de connexion avec un mauvais mot de passe
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrongpass@test.com', password: 'wrongpass' });

      // Vérification du message d'erreur
      expect(res.status).to.equal(400);
      expect(res.body).to.have.property('message', 'Invalid credentials');
    });
  });
});
