import UserModel from "../models/userModel.js";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from "../utils/validation.js";

const AuthController = {
  async register(req, res, next) {
    try {
      const { error, value } = registerSchema.validate(req.body);
      if (error) throw new Error(error.details[0].message);
      const { email, password, name, role } = value;

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) throw new Error("Email already used");

      const newUser = await UserModel.create({ email, password, name, role });
      const token = UserModel.generateToken(newUser.id);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, //one day
        sameSite: "strict",
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        token: token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { error, value } = loginSchema.validate(req.body);
      if (error) throw new Error(error.details[0].message);

      const { email, password } = value;

      const user = await UserModel.findByEmail(email);
      if (!user) throw new Error("Invalid Credantials");
      if (!user.is_active) throw new Error("Account is deactivated");

      const isMatch = await UserModel.verifyPassword(
        password,
        user.password_hash
      );
      if (!isMatch) throw new Error("Invalid Password");

      const token = UserModel.generateToken(user.id);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: "strict",
      });

      res.status(200).json({
        success: true,
        message: "Login successful",
        token: token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async changePassword(req, res, next) {
    try {
      const { error, value } = changePasswordSchema.validate(req.body);
      if (error) throw new Error(error.details[0].message);

      const { currentPassword, newPassword } = value;

      const user = await UserModel.findByEmail(req.user.email);
      if (!user) throw new Error("Invalid Credantials");

      const isMatch = await UserModel.verifyPassword(
        currentPassword,
        user.password_hash
      );
      if (!isMatch) throw new Error("current Password is incorrect");
      await UserModel.updatePassword(user.id, newPassword);
      res.json({
        success: true,
        message: "password updated successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  async getCurrentLoginInfo(req, res, next) {
    try {
      const user = await UserModel.findById(req.user.id);
      if (!user) throw new Error("User not found");
      res.json({
        success: true,
        user,
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      if (req.session) {
        req.session.destroy((err) => {
          if (err) throw err;
        });
      }
      res.clearCookie("token");
      res.clearCookie("connect.sid");
      res.json({ success: true, message: "logged out success" });
    } catch (error) {}
  },

  async deleteUser(req, res, next) {
    try {
      const userId = parseInt(req.params.id);

      if (userId === req.user.id) {
        const err = new Error("Cannot delete your own account");
        err.statusCode = 400;
        throw err;
      }

      const deletedUser = await UserModel.delete(userId);
      if (!deletedUser) {
        const err = new Error("User not found");
        err.statusCode = 404;
        throw err;
      }

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const { name } = req.body;

      if (!name || name.trim().length < 2) {
        const err = new Error("Name must be at least 2 characters long");
        err.statusCode = 400;
        throw err;
      }

      const updatedUser = await UserModel.update(req.user.id, {
        name: name.trim(),
      });

      res.json({
        success: true,
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllUsers(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const users = await UserModel.findAll(limit, offset);

      res.json({
        success: true,
        users,
        pagination: {
          limit,
          offset,
          count: users.length,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateUserRole(req, res, next) {
        try {
            const userId = parseInt(req.params.id);
            const { role } = req.body;

            if (!['student', 'instructor', 'admin'].includes(role)) {
                const err = new Error("Invalid role");
                err.statusCode = 400;
                throw err;
            }

            if (userId === req.user.id) {
                const err = new Error("Cannot change your own role");
                err.statusCode = 400;
                throw err;
            }

            const updatedUser = await UserModel.update(userId, { role });
            if (!updatedUser) {
                const err = new Error("User not found");
                err.statusCode = 404;
                throw err;
            }

            res.json({
                success: true,
                message: "User role updated successfully",
                user: updatedUser
            });
        } catch (error) {
            next(error);
        }
    }
};

export default AuthController;
