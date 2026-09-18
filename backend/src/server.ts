import { createApp } from "./app";
import { appConfig } from "@config/index";
import { logger } from "@core/logger/logger";

const app = createApp();

app.listen(appConfig.port, () => {
  logger.info(`Servidor da fundacao (Fase 1) rodando na porta ${appConfig.port} [${appConfig.env}]`);
});
