"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = require("jsonwebtoken");
// Authorises token
function authentication(req, res, next) {
    try {
        const token = req.header("token");
        if (!token) {
            return res.status(401).json("No token");
        }
        const payload = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET);
        res.locals.userId = payload.userId;
        next();
    }
    catch (err) {
        return res.status(403).json("Incorrect or expired token");
    }
}
exports.default = authentication;
//# sourceMappingURL=authentication.js.map