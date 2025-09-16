import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();

const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001'],
};

app.use(cors(corsOptions));
app.use(express.json());

export default app;