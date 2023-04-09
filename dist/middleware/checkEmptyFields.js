"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Checks if any fields are empty
function checkEmptyFields(req, res, next) {
    const parameters = req.body;
    const parameterValues = Object.values(parameters);
    function fieldHasContent(value) {
        if (typeof value === "string" && value.length === 0)
            return false;
        if (Array.isArray(value) && value.length === 0)
            return false;
        return true;
    }
    // Returns 400 if any fields of passed parameters are empty
    if (parameterValues.some((value) => !fieldHasContent(value))) {
        return res.status(400).json("Please fill in all fields");
    }
    next();
}
exports.default = checkEmptyFields;
//# sourceMappingURL=checkEmptyFields.js.map