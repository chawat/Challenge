import { useLoaderData, useNavigate } from "react-router-dom";
import { getDB } from "~/db/getDB";

export async function loader({ params }: { params: { timesheetId: string } }) {
  const db = await getDB();
  const timesheet = await db.get(
    "SELECT timesheets.*, employees.full_name FROM timesheets JOIN employees ON timesheets.employee_id = employees.id WHERE timesheets.id = ?",
    params.timesheetId
  );

  if (!timesheet) {
    throw new Response("Timesheet not found", { status: 404 });
  }

  const toLocalDateTime = (date: Date) =>
    new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

  const startTime = new Date(timesheet.start_time);
  const endTime = new Date(timesheet.end_time);

  let totalHours = 0;
  if (!isNaN(startTime.getTime()) && !isNaN(endTime.getTime()) && endTime > startTime) {
    totalHours = parseFloat(((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)).toFixed(2));
  }

  return {
    timesheet: {
      ...timesheet,
      start_time: toLocalDateTime(startTime),
      end_time: toLocalDateTime(endTime),
      total_hours: totalHours, 
    },
  };
}

export default function TimesheetViewPage() {
  const { timesheet } = useLoaderData() as { timesheet: any };
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto p-8 bg-gray-50 text-gray-900">
      <h2 className="text-3xl font-bold text-blue-600 mb-6 text-center">Timesheet Details</h2>

      <div className="border p-6 rounded-xl shadow-lg bg-white">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="font-medium text-gray-700">Employee:</p>
            <p className="text-gray-900">{timesheet.full_name}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Total Hours:</p>
            <p className="text-green-600">{timesheet.total_hours} hrs</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Start Time:</p>
            <p className="text-gray-900">{timesheet.start_time}</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">End Time:</p>
            <p className="text-gray-900">{timesheet.end_time}</p>
          </div>
          <div className="col-span-2">
            <p className="font-medium text-gray-700">Summary:</p>
            <p className="text-gray-900">{timesheet.summary}</p>
          </div>
        </div>
      </div>


      <div className="flex justify-center gap-4 mt-8">
        <button
          onClick={() => navigate("/timesheets")}
          className="px-6 py-2 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 transition"
        >
          Back to Timesheets
        </button>
        <a href="/employees" className="px-6 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition">
          Employees
        </a>
       
      </div>
    </div>
  );
}
