import * as dotenv from "dotenv";
import * as express from "express";
import * as cors from "cors";
import loginRegister from "./routes/loginRegister";
import exercise from "./routes/exercise";

const app = express();
const port = 5000;

dotenv.config();

app.use(cors());
app.use(express.json());
app.use(loginRegister);
app.use("/exercise", exercise);

app.listen(port, () => {
  console.log("Server started on port", port);
});
