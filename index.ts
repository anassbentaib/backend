import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import connectDB from "./connection/connect";
import auth from "./routes/auth";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/", async (req: any, res: any) => {
  res.status(200).json({
    message: "Hello from AUTH!",
  });
});

app.use("/auth", auth);
const PORT = process.env.PORT || 8080;
const startServer = async () => {
  try {
    connectDB(process.env.MONGO_DB_URL);
    app.listen(PORT, () =>
      console.log(`Server Running in the 8080  : http://localhost:${PORT}`)
    );
  } catch (error) {
    console.log(error);
  }
};

startServer();
