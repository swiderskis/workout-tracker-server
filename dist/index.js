"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const loginRegister_1 = __importDefault(require("./routes/loginRegister"));
const exercise_1 = __importDefault(require("./routes/exercise"));
const workout_1 = __importDefault(require("./routes/workout"));
const session_1 = __importDefault(require("./routes/session"));
const app = (0, express_1.default)();
const port = 5000;
require("dotenv").config();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(loginRegister_1.default);
app.use("/exercise", exercise_1.default);
app.use("/routine", workout_1.default);
app.use("/session", session_1.default);
app.listen(port, () => {
    console.log("Server started on port", port);
});
//# sourceMappingURL=index.js.map