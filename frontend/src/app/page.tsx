"use client";

import axios from "axios";
import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AssignmentList } from "@/components/assignment/AssignmentList";
import apiClient from "@/lib/api/axios";
import { useAssignmentStore } from "@/store/assignment.store";
import type { Assignment } from "@/types/assignment";

interface CreateAssignmentForm {
  title: string;
  topic: string;
  dueDate: string;
  instructions: string;
  questionType: string;
  numberOfQuestions: string;
  marksPerQuestion: string;
}

interface CreateAssignmentResponse {
  success: boolean;
  message: string;
  data: Assignment;
}

interface AssignmentsResponse {
  success: boolean;
  data: Assignment[];
}

const initialFormState: CreateAssignmentForm = {
  title: "",
  topic: "",
  dueDate: "",
  instructions: "",
  questionType: "",
  numberOfQuestions: "",
  marksPerQuestion: "",
};

export default function DashboardPage() {
  const [form, setForm] = useState<CreateAssignmentForm>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const assignments = useAssignmentStore((state) => state.assignments);
  const setAssignments = useAssignmentStore((state) => state.setAssignments);
  const loading = useAssignmentStore((state) => state.loading);
  const setLoading = useAssignmentStore((state) => state.setLoading);

  useEffect(() => {
    async function fetchAssignments(): Promise<void> {
      setLoading(true);

      try {
        const response =
          await apiClient.get<AssignmentsResponse>("/assignments");
        setAssignments(response.data.data);
      } catch (error) {
        let message = "Failed to load assignments";

        if (axios.isAxiosError(error)) {
          const responseMessage = error.response?.data as
            | { message?: string }
            | undefined;
          message = responseMessage?.message ?? error.message;
        }

        toast.error(message);
      } finally {
        setLoading(false);
      }
    }

    fetchAssignments();
  }, [setAssignments, setLoading]);

  function handleChange(
    field: keyof CreateAssignmentForm,
    value: string,
  ): void {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await apiClient.post<CreateAssignmentResponse>(
        "/assignments",
        {
          title: form.title,
          topic: form.topic,
          dueDate: form.dueDate,
          instructions: form.instructions,
          questionConfig: {
            questionType: form.questionType,
            numberOfQuestions: Number(form.numberOfQuestions),
            marksPerQuestion: Number(form.marksPerQuestion),
          },
        },
      );

      setAssignments([response.data.data, ...assignments]);
      toast.success(response.data.message || "Assignment created successfully");
      setForm(initialFormState);
    } catch (error) {
      let message = "Failed to create assignment";

      if (axios.isAxiosError(error)) {
        const responseMessage = error.response?.data as
          | { message?: string }
          | undefined;
        message = responseMessage?.message ?? error.message;
      }

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClassName =
    "w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-zinc-600 focus:ring-2 focus:ring-zinc-800";

  return (
    <div className="min-h-full flex-1 bg-zinc-950 px-4 py-10 text-zinc-100">
      <main className="mx-auto w-full max-w-5xl space-y-10">
        <header className="space-y-2">
          <p className="text-sm font-medium text-zinc-500">VedaAI</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Assessment Dashboard
          </h1>
          <p className="max-w-2xl text-sm text-zinc-400">
            Create AI-generated assignments and monitor generation status in one
            place.
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white">
              Create Assignment
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              Configure your assessment and queue AI paper generation.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className={inputClassName}
                  placeholder="DBMS Midterm Assessment"
                />
              </div>

              <div>
                <label htmlFor="topic" className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Topic
                </label>
                <input
                  id="topic"
                  type="text"
                  required
                  value={form.topic}
                  onChange={(e) => handleChange("topic", e.target.value)}
                  className={inputClassName}
                  placeholder="DBMS"
                />
              </div>
            </div>

            <div>
              <label htmlFor="dueDate" className="mb-1.5 block text-sm font-medium text-zinc-300">
                Due Date
              </label>
              <input
                id="dueDate"
                type="date"
                required
                value={form.dueDate}
                onChange={(e) => handleChange("dueDate", e.target.value)}
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="instructions" className="mb-1.5 block text-sm font-medium text-zinc-300">
                Instructions
              </label>
              <textarea
                id="instructions"
                required
                rows={3}
                value={form.instructions}
                onChange={(e) => handleChange("instructions", e.target.value)}
                className={inputClassName}
                placeholder="Answer all questions clearly."
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label htmlFor="questionType" className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Question Type
                </label>
                <input
                  id="questionType"
                  type="text"
                  required
                  value={form.questionType}
                  onChange={(e) => handleChange("questionType", e.target.value)}
                  className={inputClassName}
                  placeholder="short-answer"
                />
              </div>

              <div>
                <label htmlFor="numberOfQuestions" className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Questions
                </label>
                <input
                  id="numberOfQuestions"
                  type="number"
                  min={1}
                  required
                  value={form.numberOfQuestions}
                  onChange={(e) => handleChange("numberOfQuestions", e.target.value)}
                  className={inputClassName}
                  placeholder="6"
                />
              </div>

              <div>
                <label htmlFor="marksPerQuestion" className="mb-1.5 block text-sm font-medium text-zinc-300">
                  Marks Each
                </label>
                <input
                  id="marksPerQuestion"
                  type="number"
                  min={1}
                  required
                  value={form.marksPerQuestion}
                  onChange={(e) => handleChange("marksPerQuestion", e.target.value)}
                  className={inputClassName}
                  placeholder="5"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating assignment..." : "Create Assignment"}
            </button>
          </form>
        </section>

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Recent Assignments
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {assignments.length} assignment{assignments.length === 1 ? "" : "s"} total
              </p>
            </div>
          </div>

          <AssignmentList assignments={assignments} loading={loading} />
        </section>
      </main>
    </div>
  );
}
