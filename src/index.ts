import express from "express";
import cors from "cors";
import loginRegister from "./routes/loginRegister";
import exercise from "./routes/exercise";
import routine from "./routes/workout";
import session from "./routes/session";

const app = express();
const port = 5000;

require("dotenv").config();

app.use(cors());
app.use(express.json());
app.use(loginRegister);
app.use("/exercise", exercise);
app.use("/routine", routine);
app.use("/session", session);

app.listen(port, () => {
  console.log("Server started on port", port);
});
