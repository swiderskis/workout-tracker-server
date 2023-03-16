import * as dotenv from "dotenv";
import * as express from "express";
import * as cors from "cors";
import router from "./routes";

const app = express();
const port = 5000;

dotenv.config();

app.use(cors());
app.use(express.json());
app.use(router);

app.listen(port, () => {
  console.log("Server started on port", port);
});
