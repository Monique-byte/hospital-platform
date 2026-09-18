import pino from "pino";
import { appConfig } from "@config/index";

export const logger = pino({
  level: appConfig.env === "production" ? "info" : "debug",

  transport:
    appConfig.env !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
          },
        }
      : undefined,
});
