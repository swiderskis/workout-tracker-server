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
const routine = (0, express_1.Router)();
// Gets list of exercises user has added
routine.get("/exercise-list", authentication_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = res.locals.userId;
        // Gets exercise and muscle group ids
        const exerciseList = yield database_1.default.query("SELECT exercise_id, exercise_name, muscle_group_id FROM exercise_ WHERE user_id = $1", [userId]);
        const response = [];
        // Gets list of equipment exercise link and equipment ids for each exercise id
        for (let i = 0; i < exerciseList.rows.length; i++) {
            const exerciseId = exerciseList.rows[i].exercise_id;
            const exerciseName = exerciseList.rows[i].exercise_name;
            const muscleGroupId = exerciseList.rows[i].muscle_group_id;
            const exerciseEquipmentLinkIds = [];
            const equipmentIds = [];
            const equipmentList = yield database_1.default.query("SELECT exercise_equipment_link_id, equipment_id FROM exercise_equipment_link_ WHERE exercise_id = $1 ORDER BY equipment_id", [exerciseId]);
            equipmentList.rows.forEach((element) => {
                exerciseEquipmentLinkIds.push(element.exercise_equipment_link_id);
                equipmentIds.push(element.equipment_id);
            });
            // Pushes all exercise info into response element
            const responseElement = {
                exerciseId,
                exerciseName,
                muscleGroupId,
                exerciseEquipmentLinkIds,
                equipmentIds,
            };
            response.push(responseElement);
        }
        return res.json(response);
    }
    catch (err) {
        return res.status(500).json("Server error");
    }
}));
// Adds user created workout routine into database
routine.post("/create", checkEmptyFields_1.default, authentication_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = res.locals.userId;
        const routine = req.body;
        const startDate = new Date(routine.startDate);
        const endDate = new Date(routine.endDate);
        // Check if new routine dates overlap with any current routine dates
        const currRoutineIds = yield database_1.default.query("SELECT workout_routine_id FROM workout_routine_ WHERE user_id = $1", [userId]);
        const routineIds = [];
        currRoutineIds.rows.forEach((element) => {
            routineIds.push(element.workout_routine_id);
        });
        for (let i = 0; i < routineIds.length; i++) {
            const currRoutineDates = yield database_1.default.query("SELECT TO_CHAR(start_date, 'yyyy-mm-dd') AS start_date, TO_CHAR(end_date, 'yyyy-mm-dd') AS end_date FROM workout_routine_ WHERE workout_routine_id = $1", [routineIds[i]]);
            const currStartDate = new Date(currRoutineDates.rows[0].start_date);
            const currEndDate = new Date(currRoutineDates.rows[0].end_date);
            if ((startDate >= currStartDate && startDate <= currEndDate) ||
                (endDate >= currStartDate && endDate <= currEndDate) ||
                (currStartDate >= startDate && currStartDate <= endDate) ||
                (currEndDate >= startDate && currEndDate <= endDate)) {
                return res
                    .status(400)
                    .json("The selected routine dates overlap with one or more current routine's dates");
            }
        }
        // Inserts workout routine details into database
        const addRoutine = yield database_1.default.query("INSERT INTO workout_routine_ (start_date, end_date, user_id) VALUES ($1, $2, $3) RETURNING *", [startDate, endDate, userId]);
        // Inserts workout details for each day into database
        for (let i = 0; i < routine.workoutRoutineDays.length; i++) {
            const { workoutName, day, workoutExercises } = routine.workoutRoutineDays[i];
            const addWorkout = yield database_1.default.query("INSERT INTO workout_ (workout_name, day_id, workout_routine_id) VALUES ($1, $2, $3) RETURNING *", [workoutName, day, addRoutine.rows[0].workout_routine_id]);
            // Inserts exercise details for each workout into database
            for (let j = 0; j < workoutExercises.length; j++) {
                yield database_1.default.query("INSERT INTO workout_exercise_ (exercise_equipment_link_id, sets, reps, workout_id) VALUES ($1, $2, $3, $4)", [
                    workoutExercises[j].exerciseEquipmentLinkId,
                    workoutExercises[j].sets,
                    workoutExercises[j].reps,
                    addWorkout.rows[0].workout_id,
                ]);
            }
        }
        return res.json("Routine added");
    }
    catch (err) {
        return res.status(500).json("Server error");
    }
}));
// Gets a list of routines
routine.get("/list", authentication_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = res.locals.userId;
        const response = [];
        const routineList = yield database_1.default.query("SELECT workout_routine_id, TO_CHAR(start_date, 'yyyy-mm-dd') AS start_date, TO_CHAR(end_date, 'yyyy-mm-dd') AS end_date FROM workout_routine_ WHERE user_id = $1 ORDER BY start_date", [userId]);
        routineList.rows.forEach((element) => {
            const routineId = element.workout_routine_id;
            const startDate = element.start_date;
            const endDate = element.end_date;
            const responseElement = {
                routineId,
                startDate,
                endDate,
            };
            response.push(responseElement);
        });
        return res.json(response);
    }
    catch (err) {
        return res.status(500).json("Server error");
    }
}));
// Gets details for a routine
routine.get("/:id", authentication_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = res.locals.userId;
        const routineId = Number(req.params.id);
        // Get routine start and end dates
        const routineDetails = yield database_1.default.query("SELECT start_date, end_date, user_id FROM workout_routine_ WHERE workout_routine_id = $1", [routineId]);
        const startDate = routineDetails.rows[0].start_date;
        const endDate = routineDetails.rows[0].end_date;
        const exerciseUserId = routineDetails.rows[0].user_id;
        if (userId !== exerciseUserId)
            return res
                .status(403)
                .json("You are not permitted to view or edit this routine");
        // Initialise routine object to be sent in response
        const routine = {
            startDate: startDate,
            endDate: endDate,
            workoutRoutineDays: [],
        };
        // Get details for each workout day in the routine
        const routineWorkouts = yield database_1.default.query("SELECT workout_id, workout_name, day_id FROM workout_ WHERE workout_routine_id = $1 ORDER BY day_id", [routineId]);
        for (let i = 0; i < routineWorkouts.rows.length; i++) {
            const workoutId = routineWorkouts.rows[i].workout_id;
            const day = routineWorkouts.rows[i].day_id;
            const workoutName = routineWorkouts.rows[i].workout_name;
            // Initialise workout object to be pushed to routine object
            const workout = {
                day: day,
                workoutName: workoutName,
                workoutExercises: [],
            };
            // Get details for each exercise in the workout day
            const workoutExercises = yield database_1.default.query("SELECT exercise_equipment_link_id, sets, reps FROM workout_exercise_ WHERE workout_id = $1", [workoutId]);
            for (let j = 0; j < workoutExercises.rows.length; j++) {
                const exerciseEquipmentLinkId = workoutExercises.rows[j].exercise_equipment_link_id;
                const sets = workoutExercises.rows[j].sets;
                const reps = workoutExercises.rows[j].reps;
                const exerciseLink = yield database_1.default.query("SELECT exercise_id, equipment_id FROM exercise_equipment_link_ WHERE exercise_equipment_link_id = $1", [exerciseEquipmentLinkId]);
                const exerciseId = exerciseLink.rows[0].exercise_id;
                const equipmentId = exerciseLink.rows[0].equipment_id;
                const exercise = yield database_1.default.query("SELECT exercise_name, muscle_group_id FROM exercise_ WHERE exercise_id = $1", [exerciseId]);
                const exerciseName = exercise.rows[0].exercise_name;
                const muscleGroupId = exercise.rows[0].muscle_group_id;
                // Create exercise object to be pushed to workout object
                const workoutExercise = {
                    exerciseId,
                    exerciseName,
                    muscleGroupId,
                    sets,
                    reps,
                    exerciseEquipmentLinkId,
                    equipmentId,
                };
                workout.workoutExercises.push(workoutExercise);
            }
            routine.workoutRoutineDays.push(workout);
        }
        return res.json(routine);
    }
    catch (err) {
        return res.status(500).json("Server error");
    }
}));
// Updates routine information
routine.put("/:id", checkEmptyFields_1.default, authentication_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = res.locals.userId;
        const routineId = Number(req.params.id);
        const routine = req.body;
        // Validate user that created the routine is modifying it
        const routineQuery = yield database_1.default.query("SELECT user_id FROM workout_routine_ WHERE workout_routine_id = $1", [routineId]);
        const exerciseUserId = routineQuery.rows[0].user_id;
        if (userId !== exerciseUserId)
            return res
                .status(403)
                .json("You are not permitted to view or edit this routine");
        // Update start and end dates
        const startDate = new Date(routine.startDate);
        const endDate = new Date(routine.endDate);
        // Check if new routine dates overlap with any current routine dates
        const currRoutineIds = yield database_1.default.query("SELECT workout_routine_id FROM workout_routine_ WHERE user_id = $1 AND workout_routine_id != $2", [userId, routineId]);
        const routineIds = [];
        currRoutineIds.rows.forEach((element) => {
            routineIds.push(element.workout_routine_id);
        });
        for (let i = 0; i < routineIds.length; i++) {
            const currRoutineDates = yield database_1.default.query("SELECT TO_CHAR(start_date, 'yyyy-mm-dd') AS start_date, TO_CHAR(end_date, 'yyyy-mm-dd') AS end_date FROM workout_routine_ WHERE workout_routine_id = $1", [routineIds[i]]);
            const currStartDate = new Date(currRoutineDates.rows[0].start_date);
            const currEndDate = new Date(currRoutineDates.rows[0].end_date);
            if ((startDate >= currStartDate && startDate <= currEndDate) ||
                (endDate >= currStartDate && endDate <= currEndDate) ||
                (currStartDate >= startDate && currStartDate <= endDate) ||
                (currEndDate >= startDate && currEndDate <= endDate)) {
                return res
                    .status(400)
                    .json("The selected routine dates overlap with one or more current routine's dates");
            }
        }
        yield database_1.default.query("UPDATE workout_routine_ SET (start_date, end_date) = ($1, $2) WHERE workout_routine_id = $3", [startDate, endDate, routineId]);
        for (let i = 0; i < routine.workoutRoutineDays.length; i++) {
            // Update workout name and day
            const workoutName = routine.workoutRoutineDays[i].workoutName;
            const day = routine.workoutRoutineDays[i].day;
            yield database_1.default.query("UPDATE workout_ SET workout_name = $1 WHERE day_id = $2 AND workout_routine_id = $3", [workoutName, day, routineId]);
            // Update exercises in workout
            const workoutExercises = routine.workoutRoutineDays[i].workoutExercises;
            const workoutIdQuery = yield database_1.default.query("SELECT workout_id FROM workout_ WHERE day_id = $1 AND workout_routine_id = $2", [day, routineId]);
            const workoutId = workoutIdQuery.rows[0].workout_id;
            const exerciseLinksToAdd = [];
            const exerciseLinksToRemove = [];
            const exerciseLinksToUpdate = [];
            // Get current exercise link ids
            const currWorkoutExerciseLinks = yield database_1.default.query("SELECT exercise_equipment_link_id FROM workout_exercise_ WHERE workout_id = $1", [workoutId]);
            const currLinkIds = [];
            currWorkoutExerciseLinks.rows.forEach((element) => {
                currLinkIds.push(element.exercise_equipment_link_id);
            });
            // Get new exercise link ids
            const newLinkIds = [];
            for (let j = 0; j < workoutExercises.length; j++) {
                newLinkIds.push(workoutExercises[j].exerciseEquipmentLinkId);
            }
            // Compare current and new link ids, insert and delete rows based on changes
            currLinkIds.filter((element) => newLinkIds.includes(element)
                ? exerciseLinksToUpdate.push(element)
                : exerciseLinksToRemove.push(element));
            newLinkIds.filter((element) => currLinkIds.includes(element)
                ? null
                : exerciseLinksToAdd.push(element));
            for (let j = 0; j < workoutExercises.length; j++) {
                const exerciseEquipmentLinkId = workoutExercises[j].exerciseEquipmentLinkId;
                const sets = workoutExercises[j].sets;
                const reps = workoutExercises[j].reps;
                // Insert new exercises
                if (exerciseLinksToAdd.includes(workoutExercises[j].exerciseEquipmentLinkId))
                    yield database_1.default.query("INSERT INTO workout_exercise_ (exercise_equipment_link_id, sets, reps, workout_id) VALUES ($1, $2, $3, $4)", [exerciseEquipmentLinkId, sets, reps, workoutId]);
                // Update existing exercises
                if (exerciseLinksToUpdate.includes(workoutExercises[j].exerciseEquipmentLinkId))
                    yield database_1.default.query("UPDATE workout_exercise_ SET sets = $1, reps = $2 WHERE exercise_equipment_link_id = $3 AND workout_id = $4", [sets, reps, exerciseEquipmentLinkId, workoutId]);
            }
            // Delete removed exercises
            exerciseLinksToRemove.forEach((element) => __awaiter(void 0, void 0, void 0, function* () {
                yield database_1.default.query("DELETE FROM workout_exercise_ WHERE exercise_equipment_link_id = $1 AND workout_id = $2", [element, workoutId]);
            }));
        }
        return res.json("Routine updated");
    }
    catch (err) {
        return res.status(500).json("Server error");
    }
}));
exports.default = routine;
//# sourceMappingURL=workout.js.map