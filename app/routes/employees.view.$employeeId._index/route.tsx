import { useLoaderData, useParams } from "react-router-dom";
import { getDB } from "~/db/getDB";

// Function to convert BLOB to Base64
const blobToBase64 = (blob: Buffer | null) => {
  return blob ? `data:image/png;base64,${blob.toString("base64")}` : null;
};

// Loader function
export const loader = async ({ params }: { params: { employeeId?: string } }) => {
  const db = await getDB();

  if (params.employeeId) {
    const employee = await db.get("SELECT * FROM employees WHERE id = ?", [params.employeeId]);

    if (!employee) {
      throw new Response("Employee not found", { status: 404 });
    }

    // Convert BLOBs to Base64
    return {
      employee: {
        ...employee,
        photo: blobToBase64(employee.photo), // Convert image to Base64
        document: employee.document ? `data:application/pdf;base64,${employee.document.toString("base64")}` : null,
      }
    };
  }

  return { employee: null };
};

export default function ViewEmployeePage() {
  const { employee } = useLoaderData();
  const { employeeId } = useParams();

  return (
    <div className="max-w-3xl mx-auto p-8 bg-gray-50 text-gray-900">
      {employee ? (
        <div>
          <h2 className="text-3xl font-bold text-blue-600 mb-6 text-center">Employee Details</h2>
          <div className="space-y-6 border p-6 rounded-xl shadow-lg bg-white">
            <div className="grid grid-cols-2 gap-4">
              <p><strong className="text-gray-700">Full Name:</strong> <span className="text-gray-900">{employee.full_name}</span></p>
              <p><strong className="text-gray-700">Email:</strong> <span className="text-gray-900">{employee.email}</span></p>
              <p><strong className="text-gray-700">Phone:</strong> <span className="text-gray-900">{employee.phone}</span></p>
              <p><strong className="text-gray-700">Position:</strong> <span className="text-gray-900">{employee.position}</span></p>
              <p><strong className="text-gray-700">Department:</strong> <span className="text-gray-900">{employee.department}</span></p>
              <p><strong className="text-gray-700">Salary:</strong> <span className="text-green-600">${employee.salary}</span></p>
              <p><strong className="text-gray-700">Hire Date:</strong> <span className="text-gray-900">{employee.hire_date}</span></p>
              <p><strong className="text-gray-700">Date of Birth:</strong> <span className="text-gray-900">{employee.date_of_birth}</span></p>
              <p className="col-span-2"><strong className="text-gray-700">Address:</strong> <span className="text-gray-900">{employee.address}</span></p>
            </div>

            {/* Display Employee Image */}
            {employee.photo ? (
              <div className="text-center">
                <p><strong className="text-gray-700">Photo:</strong></p>
                <img src={employee.photo} alt="Employee Photo" className="w-40 h-40 object-cover border rounded-lg shadow-md mx-auto" />
              </div>
            ) : (
              <p className="text-red-600 text-center">No Photo Available</p>
            )}

            {/* Display Download Link for Document */}
            {employee.document ? (
              <div className="text-center">
                <p><strong className="text-gray-700">Document:</strong></p>
                <a
                  href={employee.document}
                  download={`Employee_${employeeId}.pdf`}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  Download Employee Document
                </a>
              </div>
            ) : (
              <p className="text-red-600 text-center">No Document Available</p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Employee Not Found</h2>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-center gap-4 mt-8">
        <a href="/employees" className="px-6 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition">
          Employees
        </a>
        <a href="/employees/new" className="px-6 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition">
          New Employee
        </a>
        <a href="/timesheets" className="px-6 py-2 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 transition">
          Timesheets
        </a>
      </div>
    </div>
  );
}
