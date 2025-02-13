import { useLoaderData } from "react-router";
import { useState } from "react";
import { getDB } from "~/db/getDB";

// Loader to fetch employee data
export async function loader() {
  const db = await getDB();
  const employees = await db.all("SELECT * FROM employees");
  return { employees };
}

export default function EmployeesPage() {
  const { employees } = useLoaderData();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filterPosition, setFilterPosition] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Filter and sort employees
  const filteredEmployees = employees
    .filter((employee: { full_name: string }) =>
      employee.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((employee: { position: string }) => (filterPosition ? employee.position === filterPosition : true))
    .sort((a: Record<string, any>, b: Record<string, any>) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-100 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Employee Management</h1>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search by name..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="border rounded-lg p-3 w-full mb-6 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
      />

      <div className="flex justify-between flex-wrap items-center mb-6">
        {/* Sorting */}
        <div className="flex items-center space-x-4">
          <label htmlFor="sortField" className="text-gray-700">Sort By:</label>
          <select
            id="sortField"
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
            className="border rounded-lg p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
          >
            <option value="id">ID</option>
            <option value="full_name">Name</option>
            <option value="position">Position</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            {sortOrder === "asc" ? "⬆️" : "⬇️"}
          </button>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-4">
          <label htmlFor="filterPosition" className="text-gray-700">Filter By Position:</label>
          <select
            id="filterPosition"
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="border rounded-lg p-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
          >
            <option value="">All Positions</option>
            {Array.from(new Set(employees.map((e: { position: string }) => e.position))).map((position) => (              <option key={position as string} value={position as string}>{position as string}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Employees List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paginatedEmployees.map((employee: { id: number; full_name: string; email: string; position: string }) => (
          <div key={employee.id} className="border rounded-lg p-4 bg-white shadow-md hover:shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Employee #{employee.id}</h2>
            <p className="text-gray-700"><strong>Name:</strong> {employee.full_name}</p>
            <p className="text-gray-700"><strong>Email:</strong> {employee.email}</p>
            <p className="text-gray-700"><strong>Position:</strong> {employee.position}</p>
            <div className="mt-3 flex space-x-3">
              <a href={`/employees/${employee.id}`} className="py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Update
              </a>
              <a href={`/employees/view/${employee.id}`} className="py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600">
                View
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
          className="p-2 bg-gray-300 rounded-lg text-gray-600 disabled:bg-gray-200"
        >
          Prev
        </button>
        <span className="text-gray-700">Page {currentPage} of {totalPages}</span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
          className="p-2 bg-gray-300 rounded-lg text-gray-600 disabled:bg-gray-200"
        >
          Next
        </button>
      </div>

      {/* Buttons at the Bottom */}
      <div className="mt-6 flex space-x-4 justify-center">
        <a href="/employees/new" className="py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md">
        ➕ New Employee
        </a>
        <a href="/timesheets/" className="py-3 px-6 bg-gray-700 text-white rounded-lg hover:bg-gray-800 shadow-md">
          Timesheets
        </a>
      </div>
    </div>
  );
}
