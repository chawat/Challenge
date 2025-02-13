import { useLoaderData, Form, redirect, useActionData } from "react-router-dom";
import { getDB } from "~/db/getDB";

export async function loader() {
  const db = await getDB();
  const employees = await db.all("SELECT id, full_name FROM employees");
  return { employees };
}

import type { ActionFunction } from "react-router";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const employee_id = formData.get("employee_id") as string;
  const start_time = formData.get("start_time") as string;
  const end_time = formData.get("end_time") as string;
  const summary = formData.get("summary") as string;

  if (!employee_id || !start_time || !end_time || !summary) {
    return { error: "All fields are required." };
  }

  if (isNaN(Number(employee_id))) {
    return { error: "Invalid employee selected." };
  }

  const startDate = new Date(start_time);
  const endDate = new Date(end_time);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { error: "Invalid date format. Please select valid start and end times." };
  }

  if (startDate >= endDate) {
    return { error: "Start time must be before end time." };
  }

  const totalHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

  const startTimeUTC = startDate.toISOString();
  const endTimeUTC = endDate.toISOString();

  const db = await getDB();
  await db.run(
    "INSERT INTO timesheets (employee_id, start_time, end_time, total_hours, summary) VALUES (?, ?, ?, ?, ?)",
    [employee_id, startTimeUTC, endTimeUTC, totalHours, summary]
  );

  return redirect("/timesheets");
};

export default function NewTimesheetPage() {
  const { employees } = useLoaderData() as { employees: { id: number; full_name: string }[] };
  const actionData = useActionData() as { error?: string };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-gray-50 text-gray-900">
      <h1 className="text-3xl font-bold text-blue-600 mb-6 text-center">Create New Timesheet</h1>

      <div className="border p-6 rounded-xl shadow-lg bg-white">
        {actionData?.error && (
          <p className="text-red-600 text-sm mb-4 text-center bg-red-100 p-2 rounded-lg">
            {actionData.error}
          </p>
        )}

        <Form method="post" className="space-y-5">
          <div>
            <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700">
              Employee
            </label>
            <select
              name="employee_id"
              id="employee_id"
              className="w-full p-3 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-400"
              required
            >
              <option value="" disabled>
                Select Employee
              </option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
              Start Time
            </label>
            <input
              type="datetime-local"
              name="start_time"
              id="start_time"
              className="w-full p-3 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div>
            <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">
              End Time
            </label>
            <input
              type="datetime-local"
              name="end_time"
              id="end_time"
              className="w-full p-3 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div>
            <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
              Summary
            </label>
            <textarea
              name="summary"
              id="summary"
              className="w-full p-3 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-400"
              rows={3}
              required
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-lg shadow-md hover:bg-blue-700 transition"
          >
            Create Timesheet
          </button>
        </Form>
      </div>

      <div className="flex justify-center gap-4 mt-8">
        <a href="/timesheets" className="px-6 py-2 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 transition">
          View Timesheets
        </a>
        <a href="/employees" className="px-6 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition">
          View Employees
        </a>
      </div>
    </div>
  );
}
