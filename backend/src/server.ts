import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./config/logger";

// Routes
import authRoutes from "./routes/auth.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import assetRoutes from "./routes/asset.routes";
import assetCategoryRoutes from "./routes/assetCategory.routes";
import workOrderRoutes from "./routes/workorder.routes";
import issueRoutes from "./routes/issue.routes";
import userRoutes from "./routes/user.routes";
import departmentRoutes from "./routes/department.routes";
import buildingRoutes from "./routes/building.routes";
import notificationRoutes from "./routes/notification.routes";
import reportRoutes from "./routes/report.routes";
import aiRoutes from "./routes/ai.routes";
import publicRoutes from "./routes/public.routes";

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Public QR/reporting endpoints are anonymous by design, so they get a
// tighter, dedicated limit to prevent abuse of open, unauthenticated routes.
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many requests from this IP, please try again later.",
});

// AI Issue Triage calls an external model and costs money per call, so it
// gets its own stricter limit independent of the general API limiter.
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many AI triage requests, please try again in a few minutes.",
});

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(compression());

// Logging
app.use(morgan("combined", { stream: { write: (message) => logger.info(message.trim()) } }));

// Swagger Documentation
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MaintainIQ API",
      version: "1.0.0",
      description: "Premium Enterprise CMMS API Documentation",
      contact: {
        name: "MaintainIQ Support",
        email: "support@maintainiq.com",
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/${env.API_VERSION}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), version: "1.0.0" });
});

// API Routes
app.use(`/api/${env.API_VERSION}/auth`, authRoutes);
app.use(`/api/${env.API_VERSION}/dashboard`, dashboardRoutes);
app.use(`/api/${env.API_VERSION}/assets`, assetRoutes);
app.use(`/api/${env.API_VERSION}/asset-categories`, assetCategoryRoutes);
app.use(`/api/${env.API_VERSION}/work-orders`, workOrderRoutes);
app.use(`/api/${env.API_VERSION}/issues`, issueRoutes);
app.use(`/api/${env.API_VERSION}/users`, userRoutes);
app.use(`/api/${env.API_VERSION}/departments`, departmentRoutes);
app.use(`/api/${env.API_VERSION}/buildings`, buildingRoutes);
app.use(`/api/${env.API_VERSION}/notifications`, notificationRoutes);
app.use(`/api/${env.API_VERSION}/reports`, reportRoutes);
app.use(`/api/${env.API_VERSION}/public`, publicLimiter, publicRoutes);
app.use(`/api/${env.API_VERSION}/ai`, aiLimiter, aiRoutes);

// Static files
app.use("/uploads", express.static("src/uploads"));

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

const PORT = env.PORT;

app.listen(PORT, () => {
  logger.info(`🚀 MaintainIQ Server running on port ${PORT}`);
  logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  logger.info(`🏥 Health Check: http://localhost:${PORT}/health`);
});

export default app;
