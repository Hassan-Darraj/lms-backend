import { Router } from "express";
import AuthController from "../controllers/userController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import passport from '../config/passport.js';
import UserModel from '../models/userModel.js';

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/logout", authenticate, AuthController.logout);
router.get("/profile", authenticate, AuthController.getCurrentLoginInfo);
router.post("/change-password", authenticate, AuthController.changePassword);
// Admin routes
router.get("/", authenticate, authorize(["admin"]), AuthController.getAllUsers);
router.delete(
  "/:id",
  authenticate,
  authorize(["admin"]),
  AuthController.deleteUser
);
router.put(
  "/:id/role",
  authenticate,
  authorize(["admin"]),
  AuthController.updateUserRole
);
//google
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

// Google OAuth callback
router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: 'http://localhost:3000/auth/google/callback?error=oauth_failed' 
  }),
  (req, res) => {
    try {
      // Generate JWT token for the authenticated user
      const token = UserModel.generateToken(req.user.id);
      
      // Set the httpOnly cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: "strict",
      });

      // Redirect to FRONTEND callback handler with success parameter
      res.redirect('http://localhost:3000/auth/google/callback?success=true');
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect('http://localhost:3000/auth/google/callback?error=processing_error');
    }
  }
);



export default router;
