"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_B = exports.USER_A = void 0;
exports.buildAssignmentFixture = buildAssignmentFixture;
exports.getFixtureAssignmentId = getFixtureAssignmentId;
const mongoose_1 = require("mongoose");
const ASSIGNMENT_ID = new mongoose_1.Types.ObjectId();
exports.USER_A = "user-a";
exports.USER_B = "user-b";
function buildAssignmentFixture(ownerId = exports.USER_A) {
    const assignmentData = {
        _id: ASSIGNMENT_ID,
        userId: ownerId,
        title: "Midterm Review",
        topic: "Biology",
        dueDate: new Date("2026-06-15T00:00:00.000Z"),
        instructions: "Answer all questions.",
        status: "completed",
        questionConfig: {
            questionType: "short-answer",
            numberOfQuestions: 2,
            marksPerQuestion: 2,
        },
        progress: 100,
        isDeleted: false,
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
        updatedAt: new Date("2026-06-01T00:00:00.000Z"),
    };
    return {
        ...assignmentData,
        toObject: () => ({ ...assignmentData }),
        save: jest.fn().mockResolvedValue(undefined),
    };
}
function getFixtureAssignmentId() {
    return ASSIGNMENT_ID.toString();
}
//# sourceMappingURL=assignment-fixtures.js.map