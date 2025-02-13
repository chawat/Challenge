import { Form, useLoaderData, useNavigate } from "react-router-dom";
import { getDB } from "~/db/getDB";
import { useState, useEffect } from "react";

export async function loader({ params }: { params: { timesheetId: string } }) {
  const db = await getDB();
  const timesheet = await db.get("SELECT * FROM timesheets WHERE id = ?", params.timesheetId);

  if (!timesheet) {
    throw new Response("Timesheet not found", { status: 404 });
  }

  const toLocalDateTime = (date: Date) =>
    new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

  return {
    timesheet: {
      ...timesheet,
      start_time: toLocalDateTime(new Date(timesheet.start_time)),
      end_time: toLocalDateTime(new Date(timesheet.end_time)),
    },
  };
}

export async function action({ request, params }: { request: Request; params: { timesheetId: string } }) {
  const formData = await request.formData();
  const start_time = formData.get("start_time");
  const end_time = formData.get("end_time");
  const summary = formData.get("summary");

  const db = await getDB();
  await db.run(
    "UPDATE timesheets SET start_time = ?, end_time = ?, summary = ? WHERE id = ?",
    start_time,
    end_time,
    summary,
    params.timesheetId
  );

  return new Response(null, { status: 302, headers: { Location: "/timesheets" } });
}

export default function TimesheetPage() {
  const { timesheet } = useLoaderData() as { timesheet: any };
  const navigate = useNavigate();

  const [startTime, setStartTime] = useState(timesheet.start_time);
  const [endTime, setEndTime] = useState(timesheet.end_time);
  const [totalHours, setTotalHours] = useState<number>(0);

  useEffect(() => {
    const calculateTotalHours = () => {
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start) {
        setTotalHours(parseFloat(((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(2)));
      } else {
        setTotalHours(0);
      }
    };
    calculateTotalHours();
  }, [startTime, endTime]);

  return (
    <div className="max-w-2xl mx-auto p-8 bg-gray-50 text-gray-900">
      <h2 className="text-3xl font-bold text-blue-600 mb-6 text-center">Edit Timesheet #{timesheet.id}</h2>

      <div className="border p-6 rounded-xl shadow-lg bg-white">
        <Form method="post" className="space-y-5">
          <div>
            <label className="block font-medium text-gray-700">Start Time</label>
            <input
              type="datetime-local"
              name="start_time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full p-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700">End Time</label>
            <input
              type="datetime-local"
              name="end_time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full p-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700">Total Hours</label>
            <input
              type="text"
              value={totalHours}
              readOnly
              className="w-full p-2 border rounded-lg text-gray-900 bg-gray-200"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700">Summary</label>
            <textarea
              name="summary"
              defaultValue={timesheet.summary}
              className="w-full p-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-400"
              rows={3}
              required
            ></textarea>
          </div>

          <div className="flex justify-center gap-4 mt-6">
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition">
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => navigate("/timesheets")}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 transition"
            >
              Cancel
            </button>
          </div>
        </Form>
      </div>

      <div className="flex justify-center gap-4 mt-8">
        <a href="/timesheets" className="px-6 py-2 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 transition">
          Timesheets
        </a>
        <a href="/timesheets/new" className="px-6 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition">
          New Timesheet
        </a>
        <a href="/employees" className="px-6 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition">
          Employees
        </a>
      </div>
    </div>
  );
}
