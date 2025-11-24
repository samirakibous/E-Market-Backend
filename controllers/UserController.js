import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { sendMail } from '../services/mailSender.js'; // <-- ajouté

export const createUser = async (req, res, next) => {
  try {

    let password = Math.random().toString(36).slice(-8); // mot de passe aléatoire 8 caractères

    // Créer l'utilisateur avec le password (généré ou fourni)
    console.log({
      ...req.body,
      password,
    });
    const user = new User({
      ...req.body,
      password, // s'assurer que password est présent
    });
    await user.save();

    // Envoyer un email avec les identifiants (non bloquant)
    try {
      await sendMail({
        to: user.email,
        subject: 'Vos identifiants E-Market',
        text: `Bonjour ${user.fullname},\n\nVotre compte a été créé. Email: ${user.email}\nMot de passe: ${password}\n\nVeuillez changer votre mot de passe après la première connexion.`,
        html: `<p>Bonjour ${user.fullname},</p>
               <p>Votre compte a été créé.</p>
               <ul>
                 <li><strong>Email:</strong> ${user.email}</li>
                 <li><strong>Mot de passe:</strong> ${password}</li>
               </ul>
               <p>Veuillez changer votre mot de passe après la première connexion.</p>`,
      });
    } catch (mailErr) {
      console.warn('Failed to send welcome email:', mailErr);
      // Ne pas échouer la requête si l'email échoue : on renvoie quand même 201
    }

    res.status(201).json({
      message: 'User created successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const updates = { ...req.body };

    // Si un fichier avatar est uploadé
    if (req.file) {
      // Ici tu peux stocker le chemin relatif ou absolu du fichier
      updates.avatar = `/uploads/avatars/${req.file.filename}`;
    }
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    // Mettre à jour l'utilisateur
    const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      message: 'User updated',
      data: {
        updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    // Find the user by ID and delete
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let limit;
    let totalUsers;
    let skip;
    let users;
    if (req.user.role === 'admin') {
      limit = parseInt(req.query.limit) || 10;
      skip = (page - 1) * limit;
      users = await User.find({ deletedAt: null }).skip(skip).limit(limit);
      totalUsers = await User.countDocuments({ deletedAt: null });
    } else {
      limit = 10;
      skip = (page - 1) * limit;
      users = await User.find({ role: 'seller', deletedAt: null })
        .skip(skip)
        .limit(limit);
      totalUsers = await User.countDocuments({
        role: 'seller',
        deletedAt: null,
      });
    }

    res.status(200).json({
      message: 'Users retrieved successfully',
      data: {
        users,
        totalUsers,
        limit,
        page,
        totalPages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      message: 'User retrieved successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// Public: return only minimal user info (fullname / name) for public consumption
export const getPublicUsernameById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('fullname');
    if (!user) return res.status(404).json({ error: 'User not found' });

    // prefer fullname, then name, then username
    const displayName = user.fullname || user.name || user.username || null;

    return res.status(200).json({
      message: 'Public user info retrieved',
      data: { id: user._id, name: displayName },
    });
  } catch (error) {
    next(error);
  }
};

// Soft delete user
export const softDeleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await user.softDelete();
    res.status(200).json({ message: 'User soft deleted' });
  } catch (error) {
    next(error);
  }
};

// Restore user
export const restoreUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await user.restore();
    res.status(200).json({ message: 'User restored' });
  } catch (error) {
    next(error);
  }
};

// Get all soft-deleted users
export const getDeletedUsers = async (req, res, next) => {
  try {
    const users = await User.find().deleted();
    res
      .status(200)
      .json({ message: 'Users retrieved successfully', data: users });
  } catch (error) {
    next(error);
  }
};

export const deleteAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.avatar) {
      return res.status(400).json({ message: 'No avatar found for this user' });
    }

    // Construire le chemin complet vers le fichier sur le serveur
    // Assure-toi que `user.avatar` contient bien le chemin relatif depuis 'public'
    const avatarPath = path.join('public', user.avatar);

    try {
      await fs.unlink(avatarPath);
      console.log('Avatar file deleted:', avatarPath);
    } catch {
      console.warn(
        'Avatar file not found on server, skipping deletion:',
        avatarPath
      );
    }

    // Supprimer la référence dans la base de données
    user.avatar = null;
    await user.save();

    res
      .status(200)
      .json({ message: 'Avatar deleted successfully', data: user });
  } catch (error) {
    next(error);
  }
};

export const changeRole = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.role = req.body.role;
    await user.save();
    res.status(200).json({ message: 'Role changed successfully', data: user });
  } catch (error) {
    next(error);
  }
};

export const searchSellers = async (req, res, next) => {
  try {
    const { search } = req.query;
    let filter = { role: 'seller', deletedAt: null };

    if (search) {
      filter.$or = [
        { fullname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const sellers = await User.find(filter);
    res.status(200).json({ message: 'Sellers found', data: sellers });
  } catch (error) {
    next(error);
  }
};

export const filterUsersByRole = async (req, res, next) => {
  try {
    const { role } = req.query;
    const users = await User.find({ role, deletedAt: null });
    if (users.length === 0)
      return res
        .status(404)
        .json({ message: `no usesr found with role ${role}` });
    res.status(200).json({
      message: 'Users found',
      data: { count: users.length, users }, 
    });
  } catch (error) {
    next(error);
  }
};

export const getSellerStats = async (req, res, next) => {
  try {
    const sellerId = req.user.id;

    const productIds = await Product.find({ seller_id: sellerId, deletedAt: null }).distinct('_id');

    const productsCount = await Product.countDocuments({ seller_id: sellerId, deletedAt: null });
    const lowStockCount = await Product.countDocuments({ seller_id: sellerId, stock: { $lte: 5 }, deletedAt: null });

    const orderAgg = await Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.productId': { $in: productIds.map((id) => id) } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
    ]);

    const totalOrders = orderAgg[0]?.totalOrders || 0;
    const totalRevenue = orderAgg[0]?.totalRevenue.toFixed(2) || 0;

    const reviewAgg = await Review.aggregate([
      { $match: { product: { $in: productIds.map((id) => id) }, status: 'approved' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);
    const averageRating = reviewAgg[0]?.averageRating || 0;
    const totalReviews = reviewAgg[0]?.totalReviews || 0;

    const topProductsAgg = await Order.aggregate([
      { $unwind: '$items' },
      {
        $match: {
          'items.productId': { $in: productIds.map((id) => id) },
          'status': 'delivered'
        }
      },
      {
        $group: {
          _id: '$items.productId',
          quantitySold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          productId: '$_id',
          title: '$product.title',
          primaryImage: '$product.primaryImage',
          quantitySold: 1,
          revenue: 1,
        },
      },
    ]);

    res.status(200).json({
      message: 'Seller stats retrieved',
      data: {
        productsCount,
        totalOrders,
        totalRevenue,
        averageRating: Number(averageRating.toFixed(2)),
        totalReviews,
        lowStockCount,
        topProducts: topProductsAgg,
      },
    });
  } catch (error) {
    next(error);
  }
};
