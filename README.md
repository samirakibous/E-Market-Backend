# E-Market API 🛒

Une API REST complète pour une plateforme e-commerce construite avec Node.js, Express.js et MongoDB.

## 📋 Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Technologies utilisées](#technologies-utilisées)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [API Documentation](#api-documentation)
- [Tests](#tests)
- [Déploiement](#déploiement)
- [Structure du projet](#structure-du-projet)
- [Contribution](#contribution)

## ✨ Fonctionnalités

- 🔐 **Authentification & Autorisation** (JWT)
- 👥 **Gestion des utilisateurs** (CRUD, rôles)
- 📦 **Gestion des produits** (CRUD, upload d'images)
- 🏷️ **Gestion des catégories**
- 🛒 **Panier d'achat** (authentifié et invité)
- 📝 **Système de commandes**
- ⭐ **Système d'avis et notes**
- 🎫 **Système de coupons de réduction**
- 🚀 **Cache Redis** pour les performances
- 📊 **Logging avancé** avec Winston
- 🔒 **Rate limiting** et sécurité
- 📚 **Documentation Swagger**
- ✅ **Tests unitaires et d'intégration**

## 🛠️ Technologies utilisées

### Backend

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** - Base de données NoSQL
- **Mongoose** - ODM pour MongoDB
- **Redis** - Cache en mémoire

### Authentification & Sécurité

- **JWT** - JSON Web Tokens
- **bcryptjs** - Hachage des mots de passe
- **Rate limiting** - Protection contre les attaques

### Outils de développement

- **Nodemon** - Rechargement automatique
- **Swagger** - Documentation API
- **Winston** - Logging
- **Multer** - Upload de fichiers
- **Yup** - Validation des données

### Tests

- **Mocha** - Framework de test
- **Chai** - Assertions
- **Supertest** - Tests HTTP
- **C8** - Couverture de code

## 📋 Prérequis

- Node.js (v16 ou supérieur)
- MongoDB (v4.4 ou supérieur)
- Redis (v6 ou supérieur)
- npm ou yarn

## 🚀 Installation

### 1. Cloner le repository

```
git clone https://github.com/ElFirdaous28/E-Market-API-2.git
cd E-Market-API-2
npm install
cp .env.example .env
```

## ⚙️ Configuration

### Éditer le fichier .env avec vos paramètres :

```
# Server
PORT=3000

# Database (MongoDB)
DB_URI=mongodb://127.0.0.1:27017/emarket_db
DB_URI=mongodb://127.0.0.1:27017/emarket_test_db

# JWT
JWT_SECRET=votre_jwt_secret_super_securise

# Redis
REDIS_URL=redis://localhost:6379

```

### Services requis

MongoDB

```
# Installation sur Ubuntu/Debian
sudo apt-get install mongodb

# Démarrer MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

Redis

```
# Installation sur Ubuntu/Debian
sudo apt-get install redis-server

# Démarrer Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

## 🎯 Utilisation

```
# Démarrer en mode développement
npm run devStart

# Initialiser la base de données avec des données de test
npm run seed

# Réinitialiser la base de données
npm run reset-db
```

## 📚 API Documentation

La documentation Swagger est disponible à l'adresse :

```
http://localhost:3000/api/docs
```

## 🧪 Tests

Exécuter tous les tests

```
# Tests unitaires
npm test

# Tests d'intégration
npm run test:integration

# Tous les tests
npm run test:all

# Tests avec couverture de code
npm run coverage
```

## 👥 Auteurs

- **ElFirdaous28**
- **Ayoub-fetti**
- **samirakibous**
- **wassim205**
