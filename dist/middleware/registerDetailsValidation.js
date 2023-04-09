"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const usernameRegex = /^[a-zA-Z0-9]{3,15}$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])[a-zA-Z0-9]{8,30}$/;
// Ensures username and password are valid
function registerDetailsValidation(req, res, next) {
    const { username, password } = req.body;
    if (!usernameRegex.test(username))
        return res
            .status(400)
            .json("Your username may only contain letters & numbers, and must be 3-15 characters in length");
    if (!passwordRegex.test(password))
        return res
            .status(400)
            .json("Your password may only contain letters and numbers, must contain at least one uppercase character and at least one number, and must be 8-30 characters in length");
    next();
}
exports.default = registerDetailsValidation;
//# sourceMappingURL=registerDetailsValidation.js.map