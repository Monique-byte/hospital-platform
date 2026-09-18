import pinoHttp from "pino-http";
import { logger } from "@core/logger/logger";

/**
 * Log estruturado de todas as requisicoes HTTP.
 */
export const requestLogger = pinoHttp({
  logger,
  autoLogging: true,
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
  ],
});
