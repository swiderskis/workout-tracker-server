"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = require("bcrypt");
const database_1 = __importDefault(require("../database"));
const generateToken_1 = __importDefault(require("../utils/generateToken"));
const authentication_1 = __importDefault(require("../middleware/authentication"));
const checkEmptyFields_1 = __importDefault(require("../middleware/checkEmptyFields"));
const registerDetailsValidation_1 = __importDefault(require("../middleware/registerDetailsValidation"));
const loginRegister = (0, express_1.Router)();
// Registers a new user
loginRegister.post("/register", checkEmptyFields_1.default, registerDetailsValidation_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        const costFactor = 10;
        const hashedPassword = yield (0, bcrypt_1.hash)(password, costFactor);
        // Checks if username in use
        const usernameExists = yield database_1.default.query("SELECT username FROM user_ WHERE username = $1", [username]);
        if (usernameExists.rowCount !== 0)
            return res
                .status(409)
                .json("An account with this username already exists, please try again");
        // Inserts new user into table
        const registerUser = yield database_1.default.query("INSERT INTO user_ (username, hashed_password) VALUES ($1, $2) RETURNING *", [username, hashedPassword]);
        return res.json("User " + registerUser.rows[0].username + " registered");
    }
    catch (err) {
        return res.status(500).json("Server error");
    }
}));
// Gets login details
loginRegister.post("/login", checkEmptyFields_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        const userDetails = yield database_1.default.query("SELECT * FROM user_ WHERE username = $1", [username]);
        // Check if username exists
        if (userDetails.rowCount === 0)
            return res
                .status(401)
                .json("A user with this username does not exist, please try again");
        const passwordMatch = yield (0, bcrypt_1.compare)(password, userDetails.rows[0].hashed_password);
        if (!passwordMatch)
            return res.status(401).json("Incorrect password, please try again");
        const token = (0, generateToken_1.default)(userDetails.rows[0].user_id);
        return res.json(token);
    }
    catch (err) {
        console.log(err);
        return res.status(500).json("Server error");
    }
}));
// Authenticates user token
loginRegister.get("/authenticate", authentication_1.default, (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return res.json("User authenticated");
    }
    catch (err) {
        console.log(err);
        return res.status(500).json("Server error");
    }
}));
exports.default = loginRegister;
//# sourceMappingURL=loginRegister.js.map