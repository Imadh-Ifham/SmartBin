import express, { Application } from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./middleware/errorHandler";
import { metricsMiddleware } from "./middleware/metricsMiddleware";
import policiesRouter from "./modules/policies/policy.routes";
import authRoutes from "./modules/auth/routes/auth.routes";

const app: Application = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
// Allow only the frontend origin in development/local setups to avoid CORS issues
const allowedOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin: (origin, callback) => {
      // allow non-browser requests (curl, server-to-server) with no origin
      if (!origin) return callback(null, true);
      if (origin === allowedOrigin) return callback(null, true);
      return callback(new Error("CORS policy: Origin not allowed"), false);
    },
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(helmet());
app.use(compression());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per window
  })
);

// Metrics middleware - tracks all requests
app.use(metricsMiddleware);

// Development helper: inject a mock user when DEV_AUTH env var is set to 'true'
if (process.env.DEV_AUTH === "true") {
  app.use((req, _res, next) => {
    // Provide a mock admin/authority user for local testing of protected routes
    (req as any).user = { id: "000000000000000000000000", role: "admin" };
    next();
  });
}

// Routes
app.use("/api/policies", policiesRouter);
app.use("/api/auth", authRoutes);

// Error Handler
app.use(errorHandler);

export default app;
