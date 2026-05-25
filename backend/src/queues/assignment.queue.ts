import { Queue } from "bullmq";
import { redis } from "../redis/client";

export let assignmentQueue: Queue;

export function initAssignmentQueue(): void {
  assignmentQueue = new Queue("assignment-generation", {
    connection: redis,
  });
}
