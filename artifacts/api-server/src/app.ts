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

// Test semplice per verificare Railway, dominio e porta.
app.get("/health", (_req, res) => {
  res.status(200).send("NextFootball API online");
});

// API backend.
app.use("/api", router);

// Cartella del frontend React compilato.
const frontendDirectory = path.resolve(
  currentDirectory,
  "../../next-football/dist/public",
);

// Serve file statici: index.html, JavaScript, CSS, immagini, ecc.
app.use(express.static(frontendDirectory));

// Fallback per le route gestite da React.
// Con Express 5 non usare app.get("*", ...).
app.get("/*splat", (_req, res) => {
  res.sendFile(path.join(frontendDirectory, "index.html"));
});

export default app;
