import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import session from "express-session";
import dotenv from "dotenv";
import { errorHandler, notFound } from "./middleware/error.js";

import userRoutes from "./routers/userRoute.js";
import passport from "./config/passport.js";
import categoryRoutes from "./routers/categoryRoute.js";
import courseRoutes from "./routers/courseRoute.js";
import enrollmentRoutes from "./routers/enrollmentRoute.js";
import moduleRoutes from "./routers/moduleRoute.js";
import lessonRoutes from "./routers/lessonRoute.js";
import quizRoutes from "./routers/quizRoute.js";
import assignmentRoutes from "./routers/assignmentRoute.js";
import submissionRoutes from "./routers/submissionRoute.js";
import reportRoutes from "./routers/reportRoute.js";
import searchRoutes from "./routers/searchRoute.js";
import cookieParser from "cookie-parser";


const app = express();
dotenv.config();
app.use(helmet());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: "Too many requests from this IP, please try again later.",
// });
// app.use(limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);


app.use(passport.initialize());
app.use(passport.session());


app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/search", searchRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.use(notFound);
app.use(errorHandler);

export default app;
