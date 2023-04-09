"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = require("jsonwebtoken");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function generateToken(userId) {
    const payload = {
        userId: userId,
    };
    return (0, jsonwebtoken_1.sign)(payload, process.env.JWT_SECRET, {
        expiresIn: "1d",
    });
}
exports.default = generateToken;
//# sourceMappingURL=generateToken.js.map