import UserModel from "../models/userModel.js";
import jwt from "jsonwebtoken";

export const authenticate = async (req, res, next) => {
    try {
        let token;

        // Check for token in Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        // Check for token in cookies as fallback
        else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            const error = new Error("Access token is required");
            error.statusCode = 401;
            throw error;
        }

        // ✅ Verify token using jsonwebtoken
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await UserModel.findById(decoded.id);
        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 401;
            throw error;
        }

        if (!user.is_active) {
            const error = new Error("Account is deactivated");
            error.statusCode = 401;
            throw error;
        }

        // Set user in request object
        req.user = user;

        // Set session data if session exists
        if (req.session) {
            req.session.userId = user.id;
            req.session.authenticated = true;
        }

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            error.message = "Invalid token";
            error.statusCode = 401;
        } else if (error.name === 'TokenExpiredError') {
            error.message = "Token has expired";
            error.statusCode = 401;
        }
        next(error);
    }
};


export const authorize = (roles=[])=>{
    return (req,res,next)=>{
        if(roles.length && !roles.includes(req.user.role)){
            const error = new Error('Unauthorized access');
            error.statusCode = (403);
            return next(error);
        }
        next();
    }
}

