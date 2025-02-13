import { getDB } from "~/db/getDB";
import { useLoaderData } from "react-router-dom";
import { useState, type JSXElementConstructor, type Key, type ReactElement, type ReactNode, type ReactPortal } from "react";
import { ScheduleXCalendar } from "@schedule-x/react";
import {
  createCalendar,
  viewDay,
  viewWeek,
  viewMonthGrid,
} from "@schedule-x/calendar";
import { createEventsServicePlugin } from "@schedule-x/events-service";
import "@schedule-x/theme-default/dist/calendar.css";

export async function loader() {
  const db = await getDB();
  const timesheetsAndEmployees = await db.all(
    "SELECT timesheets.*, employees.full_name, employees.id AS employee_id FROM timesheets JOIN employees ON timesheets.employee_id = employees.id"
  );
  return { timesheetsAndEmployees };
}

export default function TimesheetsPage() {
  const { timesheetsAndEmployees } = useLoaderData();
  const [view, setView] = useState("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null); // Store clicked event data

  
  const eventsServicePlugin = createEventsServicePlugin();
  const calendar = createCalendar(
    { 
      views: [viewMonthGrid, viewWeek, viewDay],
      callbacks: {
        onEventClick: (event: { id: string | number; }) => {
          const clickedEvent = eventsServicePlugin.get(event.id);
          if (clickedEvent) {
            const summary = clickedEvent.extendedProps?.summary || "No summary available";
            alert(`Employee: ${clickedEvent.title}\nSummary: ${summary}\nStart Time: ${clickedEvent.start}\nEnd Time: ${clickedEvent.end}`);
          }
        }
      },

      eventStyle: {
        fontSize: "0.65rem",
        padding: "0px"
      }
    },
    [eventsServicePlugin]
  );
  
  

  const filteredTimesheets = timesheetsAndEmployees.filter((timesheet: { full_name: string; employee_id: any; }) => {
    const matchesSearchQuery =
      timesheet.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEmployee = selectedEmployee ? timesheet.employee_id === selectedEmployee : true;
    return matchesSearchQuery && matchesEmployee;
  });

  timesheetsAndEmployees.forEach((timesheet: { start_time: string | number | Date; end_time: string | number | Date; full_name: any; id: any; summary: any; }) => {
    const startDate = new Date(timesheet.start_time);
    const endDate = new Date(timesheet.end_time);
    const formatDate = (date: Date) => date.toISOString().slice(0, 16).replace("T", " ");
    
    eventsServicePlugin.add({
      title: timesheet.full_name,
      start: formatDate(startDate),
      end: formatDate(endDate),
      id: timesheet.id,
      extendedProps: {
        summary: timesheet.summary, // Store summary in extendedProps
      }
    });
  });
  

  return (
    <div className="max-w-6xl mx-auto bg-gray-100 p-6 rounded-lg shadow-lg text-gray-900 h-auto">
      <div className="flex justify-center space-x-4 mb-6">
        <button
          className={`px-6 py-2 rounded-lg text-lg font-semibold transition-all ${view === "table" ? "bg-blue-600 text-white shadow-md" : "bg-gray-300 text-gray-900 hover:bg-gray-400"}`}
          onClick={() => setView("table")}
        >
          Table View
        </button>
        <button
          className={`px-6 py-2 rounded-lg text-lg font-semibold transition-all ${view === "calendar" ? "bg-blue-600 text-white shadow-md" : "bg-gray-300 text-gray-900 hover:bg-gray-400"}`}
          onClick={() => setView("calendar")}
        >
          Calendar View
        </button>
      </div>
      {view === "table" ? (
        <div className=" rounded-lg p-6  text-gray-900 ">
          <input
            type="text"
            placeholder="Search by Employee Name..."
            className="p-2 border rounded w-full mb-4"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="p-2 border rounded w-full mb-4"
            value={selectedEmployee ?? ""}
            onChange={(e) => setSelectedEmployee(e.target.value ? Number(e.target.value) : null) as React.SetStateAction<null>}
          >
            <option value="">All Employees</option>
            {Array.from(new Set(timesheetsAndEmployees.map((ts: { employee_id: any; }) => ts.employee_id))).map(id => {
              const employee = timesheetsAndEmployees.find((ts: { employee_id: unknown; }) => ts.employee_id === id);
              return <option key={id} value={id.toString()}>{employee?.full_name}</option>;
            })}
          </select>
          <div className="w-full   overflow-hidden  border border-t-black">

  <div className="max-h-[500px] bg-gray-400  border border-t-black overflow-y-auto">
    <table className="w-full bg-gray-400">
      {/* Header Stays Fixed */}
      <thead className="bg-gray-400 border border-black text-white sticky top-0">
        <tr>
          <th className="p-4 border border-black">Timesheet ID</th>
          <th className="p-4 border border-black">Employee</th>
          <th className="p-4 border border-black">Start Time</th>
          <th className="p-4 border border-black">End Time</th>
          <th className="p-4 border border-black">Summary</th>
          <th className="p-4 border border-black">Edit</th>
          <th className="p-4 border border-black">View</th>
        </tr>
      </thead>
      {/* Scrollable Table Body */}
      <tbody className="divide-y divide-gray-200 bg-white">
        {filteredTimesheets.map((timesheet: { id: number; full_name: string; employee_id: number; start_time: string; end_time: string; summary: string; }) => (
          <tr key={timesheet.id.toString()} className="text-center hover:bg-gray-100">
            <td className="p-4 border">{timesheet.id}</td>
            <td className="p-4 border">{timesheet.full_name} (ID: {timesheet.employee_id})</td>
            <td className="p-4 border">{timesheet.start_time}</td>
            <td className="p-4 border">{timesheet.end_time}</td>
            <td className="p-4 border">{timesheet.summary}</td>
            <td className="p-4 border">
              <a href={`/timesheets/${timesheet.id}`} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition">
                Edit
              </a>
            </td>
            <td className="p-4 border">
              <a href={`/timesheets/view/${timesheet.id}`} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition">
                View
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>


        </div>
      ) : (
        <div id="calendar" className="sx-react-calendar-wrapper rounded-lg  h-[750px] overflow-y-auto">
          <ScheduleXCalendar calendarApp={calendar} />
        </div>
      )}
<div className="flex justify-center space-x-4 mt-6">
  <a
    href="/timesheets/new"
    className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-300"
  >
    ➕ New Timesheet
  </a>
  <a
    href="/employees"
    className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition-all duration-300"
  >
    👥 Employees
  </a>
</div>

    </div>
  );
}