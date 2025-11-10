import User from '../models/User.js';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

export const createUser = async (req, res, next) => {
  try {
    const user = new User(req.body);
    await user.save();

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
