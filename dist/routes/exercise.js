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
const database_1 = __importDefault(require("../database"));
const authentication_1 = __importDefault(require("../middleware/authentication"));
const checkEmptyFields_1 = __importDefault(require("../middleware/checkEmptyFields"));
const exercise = (0, express_1.Router)();
// Add new exercise
exercise.post("/add", checkEmptyFields_1.default, authentication_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { exerciseName, muscleGroupSelection, equipmentSelection } = req.body;
        const userId = res.locals.userId;
        const addExercise = yield database_1.default.query("INSERT INTO exercise_ (exercise_name, muscle_group_id, user_id) VALUES ($1, $2, $3) RETURNING *", [exerciseName, muscleGroupSelection, userId]);
        equipmentSelection.forEach((element) => __awaiter(void 0, void 0, void 0, function* () {
            yield database_1.default.query("INSERT INTO exercise_equipment_link_ (exercise_id, equipment_id) VALUES ($1, $2) RETURNING *", [addExercise.rows[0].exercise_id, element]);
        }));
        return res.json("Exercise" + exerciseName + "added");
    }
    catch (err) {
        return res.status(500).json("Server error");
    }
}));
// Get list of exercises user has added
exercise.get("/view", authentication_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = res.locals.userId;
        // Get list of exercises for user, stores them as arrays
        const exerciseList = yield database_1.default.query("SELECT exercise_id, exercise_name, muscle_group_id FROM exercise_ WHERE user_id = $1 ORDER BY exercise_id", [userId]);
        const response = [];
        exerciseList.rows.forEach((element) => {
            const responseElement = {};
            responseElement.exerciseId = element.exercise_id;
            responseElement.exerciseName = element.exercise_name;
            responseElement.muscleGroupId = element.muscle_group_id;
            response.push(responseElement);
        });
        return res.json(response);
    }
    catch (err) {
        return res.status(500).json("Server error");
    }
}));
// Gets exercise information for a given exercise id
exercise.get("/view/:id", authentication_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = res.locals.userId;
        const exerciseId = Number(req.params.id);
        // Ensure user accessing exercise info matches the user that added the exercise
        const exerciseUserIdRes = yield database_1.default.query("SELECT user_id FROM exercise_ WHERE exercise_id = $1", [exerciseId]);
        if (exerciseUserIdRes.rows.length === 0)
            return res.status(400).json("This exercise no longer exists");
        const exerciseUserId = exerciseUserIdRes.rows[0].user_id;
        if (userId !== exerciseUserId)
            return res
                .status(403)
                .json("You are not permitted to view or edit this exercise");
        // Get info for exercise
        const exerciseInfo = yield database_1.default.query("SELECT exercise_name, muscle_group_id FROM exercise_ WHERE exercise_id = $1", [exerciseId]);
        const exerciseName = exerciseInfo.rows[0].exercise_name;
        const muscleGroupId = exerciseInfo.rows[0].muscle_group_id;
        const equipmentIds = [];
        const equipmentIdsRows = yield database_1.default.query("SELECT equipment_id FROM exercise_equipment_link_ WHERE exercise_id = $1", [exerciseId]);
        equipmentIdsRows.rows.forEach((element) => equipmentIds.push(element.equipment_id));
        const response = {
            exerciseId,
            exerciseName,
            muscleGroupId,
            equipmentIds,
        };
        return res.json(response);
    }
    catch (err) {
        return res.status(500).json("Server error");
    }
}));
// Updates exercise information for a given exercise id
exercise.put("/update/:id", checkEmptyFields_1.default, authentication_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const exerciseId = Number(req.params.id);
        const { exerciseName, muscleGroupSelection, equipmentSelection } = req.body;
        yield database_1.default.query("UPDATE exercise_ SET (exercise_name, muscle_group_id) = ($1, $2) WHERE exercise_id = $3", [exerciseName, muscleGroupSelection, exerciseId]);
        // Gets current equipment selection
        const currEquipmentSelectionRows = yield database_1.default.query("SELECT equipment_id FROM exercise_equipment_link_ WHERE exercise_id = $1", [exerciseId]);
        const currEquipmentSelection = [];
        currEquipmentSelectionRows.rows.forEach((element) => currEquipmentSelection.push(element.equipment_id));
        // Compares current and new equipment selection, inserts and deletes rows based on changes
        const equipmentSelectionAdd = [];
        const equipmentSelectionRemove = [];
        equipmentSelection.filter((element) => currEquipmentSelection.includes(element)
            ? null
            : equipmentSelectionAdd.push(element));
        currEquipmentSelection.filter((element) => equipmentSelection.includes(element)
            ? null
            : equipmentSelectionRemove.push(element));
        equipmentSelectionAdd.forEach((element) => __awaiter(void 0, void 0, void 0, function* () {
            return yield database_1.default.query("INSERT INTO exercise_equipment_link_ (exercise_id, equipment_id) VALUES ($1, $2)", [exerciseId, element]);
        }));
        equipmentSelectionRemove.forEach((element) => __awaiter(void 0, void 0, void 0, function* () {
            return yield database_1.default.query("DELETE FROM exercise_equipment_link_ WHERE exercise_id = $1 AND equipment_id = $2", [exerciseId, element]);
        }));
        return res.json("Exercise" + exerciseName + "updated");
    }
    catch (err) {
        return res.status(500).json("Server error");
    }
}));
// Deletes data about an exercise for a given exercise id
exercise.delete("/delete/:id", authentication_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const exerciseId = Number(req.params.id);
        const exerciseExists = yield database_1.default.query("SELECT exercise_id FROM exercise_ WHERE exercise_id = $1", [exerciseId]);
        if (exerciseExists.rows.length === 0)
            return res.status(400).json("This exercise no longer exists");
        const equipmentLinks = yield database_1.default.query("SELECT exercise_equipment_link_id FROM exercise_equipment_link_ WHERE exercise_id = $1", [exerciseId]);
        const linkIds = [];
        equipmentLinks.rows.forEach((element) => linkIds.push(element.exercise_equipment_link_id));
        for (let i = 0; i < linkIds.length; i++) {
            const workoutContainsExercise = yield database_1.default.query("SELECT * FROM workout_exercise_ WHERE exercise_equipment_link_id = $1", [linkIds[i]]);
            if (workoutContainsExercise.rows.length > 0)
                return res
                    .status(400)
                    .json("This exercise is currently in use in one of your routines");
        }
        yield database_1.default.query("DELETE FROM exercise_equipment_link_ WHERE exercise_id = $1", [exerciseId]);
        const deletedExercise = yield database_1.default.query("DELETE FROM exercise_ WHERE exercise_id = $1 RETURNING *", [exerciseId]);
        return res.json("Exercise" + deletedExercise.rows[0].exercise_name + "deleted");
    }
    catch (err) {
        console.log(err);
        return res.status(500).json("Server error");
    }
}));
exports.default = exercise;
//# sourceMappingURL=exercise.js.map