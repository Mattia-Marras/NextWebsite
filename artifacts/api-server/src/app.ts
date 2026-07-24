import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API
app.use("/api", router);

// Frontend React compilato.
// Da dist/index.mjs risale fino alla root del progetto.
const frontendDirectory = path.resolve(
  currentDirectory,
  "../../next-football/dist/public",
);

app.use(express.static(frontendDirectory));

// Fallback per le rotte React, ad esempio /teams o /matches.
app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendDirectory, "index.html"));
});

export default app;
