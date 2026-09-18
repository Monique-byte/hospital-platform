import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { appConfig } from "@config/index";
import { requestLogger } from "@core/middlewares/requestLogger";
import { errorHandler } from "@core/middlewares/errorHandler";
import { PUBLICATION_IMAGES_STORAGE_ROOT } from "@core/storage/PublicationImageStorageProvider";
import routes from "./routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: appConfig.corsOrigin, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(requestLogger);

  // Protecao basica contra brute-force no login. Modulos futuros podem
  // aplicar limitadores especificos por rota da mesma forma.
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });
  app.use("/api/auth/login", authLimiter);

  // Serve as imagens de destaque de Publicacoes sob o mesmo prefixo
  // "/api" usado por todas as chamadas do Axios - garante que o proxy
  // do Vite (ja confirmado funcionando para /api) tambem sirva estas
  // imagens, sem depender de configuracao adicional de proxy. O
  // Cross-Origin-Resource-Policy e sobrescrito para "cross-origin"
  // apenas nesta rota, ja que o Helmet aplica "same-origin" por padrao
  // em toda a aplicacao - o que bloquearia o <img> do frontend de
  // carregar a imagem quando servida de uma porta diferente (produção
  // atras do mesmo dominio nao teria esse problema, mas em
  // desenvolvimento, com backend e frontend em portas distintas, e
  // necessario).
  app.use(
    "/api/uploads/publicacoes",
    (req, res, next) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      next();
    },
    express.static(PUBLICATION_IMAGES_STORAGE_ROOT)
  );

  app.use("/api", routes);

  // Deve ser o ultimo middleware registrado
  app.use(errorHandler);

  return app;
}