import { Form, redirect, type ActionFunction, type LoaderFunction } from "react-router";
import { getDB } from "~/db/getDB";
import { useLoaderData } from "react-router-dom";
import { useLocation } from "react-router-dom";


// Action for handling the form submission (create or update)
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  // Extract text fields
  const full_name = formData.get("full_name");
  const email = formData.get("email");
  const phone = formData.get("phone");
  const position = formData.get("position");
  const department = formData.get("department");
  const salary = parseFloat(formData.get("salary") as string);
  const hire_date = formData.get("hire_date");
  const date_of_birth = formData.get("date_of_birth");
  const address = formData.get("address");
  const id = formData.get("id");

  // Extract files
  const photoFile = formData.get("photo") as File | null;
  const documentFile = formData.get("document") as File | null;

  let photoBytes: Buffer | null = null;
  let documentBytes: Buffer | null = null;

  // Convert employee photo to bytes if available
  if (photoFile && photoFile instanceof Blob) {
    const arrayBuffer = await photoFile.arrayBuffer();
    photoBytes = Buffer.from(arrayBuffer);
  }

  // Convert employee document to bytes if available
  if (documentFile && documentFile instanceof Blob) {
    const arrayBuffer = await documentFile.arrayBuffer();
    documentBytes = Buffer.from(arrayBuffer);
  }

  // Validate Age (Must be 18 or older)
  const birthDate = date_of_birth ? new Date(date_of_birth as string) : null;
  if (birthDate) {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    if (age < 18 || (age === 18 && monthDiff < 0) || (age === 18 && monthDiff === 0 && dayDiff < 0)) {
      return redirect(`/employees/new?error_message=Employee must be at least 18 years old.`);
    }
  }

  const db = await getDB();

  try {
    // Insert or update employee in the database
    if (id) {
      await db.run(
        `UPDATE employees SET 
          full_name = ?, email = ?, phone = ?, position = ?, department = ?, salary = ?, hire_date = ?, 
          date_of_birth = ?, address = ?, photo = ?, document = ? WHERE id = ?`,
        [full_name, email, phone, position, department, salary, hire_date, date_of_birth, address, photoBytes, documentBytes, id]
      );
    } else {
      await db.run(
        `INSERT INTO employees 
          (full_name, email, phone, position, department, salary, hire_date, date_of_birth, address, photo, document) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [full_name, email, phone, position, department, salary, hire_date, date_of_birth, address, photoBytes, documentBytes]
      );
    }
  } catch (error) {
    console.error("Error inserting/updating employee:", error);
  }

  return redirect("/employees");
};
// Loader to get employee data for updating
export const loader: LoaderFunction = async ({ params }) => {
  const db = await getDB();

  // If there's an ID in the params, try to fetch the corresponding employee
  if (params.id) {
    const employee = await db.get("SELECT * FROM employees WHERE id = ?", [params.id]);

    if (!employee) {
      throw new Response("Employee not found", { status: 404 });
    }

    return { employee };
  }

  return { employee: null };
};

export default function EmployeeFormPage() {
  const { employee } = useLoaderData();
  const isEdit = Boolean(employee);

  // Get the query parameters from the URL (for error handling)
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const errorMessage = queryParams.get("error_message");

  // Popup for error message
  const errorPopup = errorMessage ? (
    <div className="fixed inset-0 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-red-600 text-white p-6 rounded-lg shadow-lg text-center">
        <p className="text-lg font-semibold">{errorMessage}</p>
        <button
          className="mt-4 bg-white text-red-600 px-4 py-2 rounded-md hover:bg-gray-200"
          onClick={() => window.history.back()} // Go back to the form
        >
          Close
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="max-w-4xl mx-auto p-6">
       <h1 className="text-3xl font-semibold text-gray-900 mb-6 text-center">
        {isEdit ? `Update Employee #${employee.id}` : "Create New Employee"}
      </h1>

      <Form method="post" className="space-y-4" encType="multipart/form-data">
        {/* Full Name */}
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-900">
            Full Name
          </label>
          <input
            type="text"
            name="full_name"
            id="full_name"
            required
            defaultValue={employee?.full_name || ""}
            className="mt-1 block w-full px-3 py-2 bg-gray-100 text-gray-900 border border-gray-300 rounded-md focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-900">
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            required
            defaultValue={employee?.email || ""}
            className="mt-1 block w-full px-3 py-2 bg-gray-100 text-gray-900 border border-gray-300 rounded-md focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          />
        </div>

        {/* Employee Photo */}
        <div>
          <label htmlFor="photo" className="block text-sm font-medium text-gray-900">
            Employee Photo
          </label>
          <input type="file" name="photo" id="photo" accept="image/*" className="mt-1 block w-full px-3 py-2 bg-gray-100 text-gray-900 border border-gray-300 rounded-md focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50" />
        </div>

        {/* Employee Document */}
        <div>
          <label htmlFor="document" className="block text-sm font-medium text-gray-900">
            Employee Document (CV, ID, etc.)
          </label>
          <input type="file" name="document" id="document" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="mt-1 block w-full px-3 py-2 bg-gray-100 text-gray-900 border border-gray-300 rounded-md focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50" />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-900">
            Phone Number
          </label>
          <input
            type="text"
            name="phone"
            id="phone"
            defaultValue={employee?.phone || ""}
            className="mt-1 block w-full px-3 py-2 bg-gray-100 text-gray-900 border border-gray-300 rounded-md focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          />
        </div>

        {/* Date of Birth */}
        <div>
          <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-900">
            Date of Birth
          </label>
          <input
            type="date"
            name="date_of_birth"
            id="date_of_birth"
            required
            defaultValue={employee?.date_of_birth || ""}
            className="mt-1 block w-full px-3 py-2 bg-gray-100 text-gray-900 border border-gray-300 rounded-md focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          />
        </div>

        {/* Position */}
        <div>
          <label htmlFor="position" className="block text-sm font-medium text-gray-900">
            Job Position
          </label>
          <input
            type="text"
            name="position"
            id="position"
            required
            defaultValue={employee?.position || ""}
            className="mt-1 block w-full px-3 py-2 bg-gray-100 text-gray-900 border border-gray-300 rounded-md focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          />
        </div>

        {/* Department */}
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-900">
            Department
          </label>
          <input
            type="text"
            name="department"
            id="department"
            required
            defaultValue={employee?.department || ""}
            className="mt-1 block w-full px-3 py-2 bg-gray-100 text-gray-900 border border-gray-300 rounded-md focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          />
        </div>

        {/* Salary */}
        <div>
          <label htmlFor="salary" className="block text-sm font-medium text-gray-900">
            Salary
          </label>
          <input
            type="number"
            name="salary"
            id="salary"
            required
            min="0"
            defaultValue={employee?.salary || ""}
            className="mt-1 block w-full px-3 py-2 bg-gray-100 text-gray-900 border border-gray-300 rounded-md focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          />
        </div>

        {/* Hire Date */}
        <div>
          <label htmlFor="hire_date" className="block text-sm font-medium text-gray-900">
            Hire Date
          </label>
          <input
            type="date"
            name="hire_date"
            id="hire_date"
            required
            defaultValue={employee?.hire_date || ""}
            className="mt-1 block w-full px-3 py-2 bg-gray-100 text-gray-900 border border-gray-300 rounded-md focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          />
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-900">
            Address
          </label>
          <input
            type="text"
            name="address"
            id="address"
            defaultValue={employee?.address || ""}
            className="mt-1 block w-full px-3 py-2 bg-gray-100 text-gray-900 border border-gray-300 rounded-md focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
          />
        </div>

        <div className="mt-6">
          <button type="submit" className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {isEdit ? "Update Employee" : "Create Employee"}
          </button>
        </div>
      </Form>
      {errorPopup}


      {/* Bottom Navigation Links */}
      <div className="flex justify-center gap-4 mt-8">

      <a
          href="/employees"
          className="px-6 py-2 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 transition">
          Back to Employee List
        </a>
        <a
          href="/timesheets"
          className="px-6 py-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition">
          Timesheets
        </a>
     
      </div>
    </div>
  );
}


















