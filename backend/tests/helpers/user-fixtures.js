"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildUserFixture = buildUserFixture;
function buildUserFixture(plan, assignmentsGenerated = 0, firebaseUid = "user-test-1") {
    return {
        firebaseUid,
        email: `${firebaseUid}@test.examforge.internal`,
        plan,
        subscription: {
            status: "inactive",
            provider: null,
        },
        usage: {
            assignmentsGenerated,
        },
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    };
}
//# sourceMappingURL=user-fixtures.js.map