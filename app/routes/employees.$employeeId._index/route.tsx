import { useLoaderData, useParams, useNavigate, useActionData } from "react-router-dom";
import { useState, useEffect } from "react";
import { getDB } from "~/db/getDB";
import { Form, redirect, type ActionFunction, type LoaderFunction } from "react-router";

// Function to convert BLOB to Base64 for display
const blobToBase64 = (blob: Buffer | null) => {
  return blob ? `data:image/png;base64,${blob.toString("base64")}` : null;
};

// Loader to fetch employee data
export const loader = async ({ params }: { params: { employeeId?: string } }) => {
  const db = await getDB();

  if (params.employeeId) {
    const employee = await db.get("SELECT * FROM employees WHERE id = ?", [params.employeeId]);
    if (!employee) {
      throw new Response("Employee not found", { status: 404 });
    }

    // Convert photo BLOB to Base64 if present
    return { 
      employee: {
        ...employee,
        photo: blobToBase64(employee.photo) // Convert photo BLOB to Base64
      }
    };
  }

  return { employee: null };
};

// Action function to handle form submissions
export const action: ActionFunction = async ({ request, params }) => {
  const db = await getDB();
  const formData = await request.formData();

  // Extract data from the form
  const updatedEmployee = {
    full_name: formData.get("full_name"),
    position: formData.get("position"),
    hire_date: formData.get("hire_date"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    department: formData.get("department"),
    salary: formData.get("salary"),
    date_of_birth: formData.get("date_of_birth"),
    address: formData.get("address"),
  };

  // Handle file uploads (photo and document)
  const photo = formData.get("photo");
  const document = formData.get("document");

  // Prepare query parameters
  const updateFields: any[] = [
    updatedEmployee.full_name,
    updatedEmployee.email,
    updatedEmployee.phone,
    updatedEmployee.position,
    updatedEmployee.department,
    updatedEmployee.salary,
    updatedEmployee.hire_date,
    updatedEmployee.date_of_birth,
    updatedEmployee.address,
  ];

  // Only add the photo and document if they are provided
  if (photo instanceof Blob) {
    const photoArrayBuffer = await photo.arrayBuffer();
    updateFields.push(Buffer.from(photoArrayBuffer));
  } else {
    updateFields.push(null); // No photo uploaded
  }

  if (document instanceof Blob) {
    const documentArrayBuffer = await document.arrayBuffer();
    updateFields.push(Buffer.from(documentArrayBuffer));
  } else {
    updateFields.push(null); // No document uploaded
  }

  // Ensure we are updating the employee
  if (params.employeeId) {
    try {
      await db.run(
        `UPDATE employees SET full_name = ?, email = ?, phone = ?, position = ?, department = ?, salary = ?, hire_date = ?, date_of_birth = ?, address = ?, photo = ?, document = ? WHERE id = ?`,
        [
          ...updateFields,
          params.employeeId,
        ]
      );
      return { success: true };
    } catch (error) {
      console.error("Database update failed:", error);
      return { error: "Failed to update employee." };
    }
  }

  return { error: "Missing employee ID" };
};

export default function EmployeePage() {
  const { employee } = useLoaderData();
  const actionData = useActionData();
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(employee || {});
  const [showPopup, setShowPopup] = useState(false);
  const [photoName, setPhotoName] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null); // State to hold the preview of the new photo

  useEffect(() => {
    if (employee) {
      setFormData(employee);
      if (employee.photo) {
        setNewPhotoPreview(employee.photo); // Set the current photo if available
      }
    }
  }, [employee]);

  useEffect(() => {
    if (actionData?.success) {
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000); // Hide after 2 seconds
    }
  }, [actionData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      if (field === "photo") {
        setPhotoName(file.name);
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewPhotoPreview(reader.result as string); // Update preview of the new photo
        };
        reader.readAsDataURL(file);
      } else if (field === "document") {
        setDocumentName(file.name);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-md">
    {showPopup && (
      <div className="fixed top-5 right-5 bg-green-500 text-white px-4 py-2 rounded shadow-lg">
        Edit successful!
      </div>
    )}
  
    {employee ? (
      <div>
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Edit Employee</h2>
  
        <Form method="post" encType="multipart/form-data" className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-gray-700 font-semibold">
              Photo:
              <input
                type="file"
                name="photo"
                className="border border-gray-300 rounded-lg p-2 w-full mt-1"
                onChange={(e) => handleFileChange(e, "photo")}
              />
              {photoName && <div className="mt-1 text-gray-700">{photoName}</div>}
            </label>
  
            <label className="block text-gray-700 font-semibold">
              Document:
              <input
                type="file"
                name="document"
                className="border border-gray-300 rounded-lg p-2 w-full mt-1"
                onChange={(e) => handleFileChange(e, "document")}
              />
              {documentName && <div className="mt-1 text-gray-700">{documentName}</div>}
            </label>
          </div>

          <div className="mt-4">
            <p className="text-gray-700 font-semibold"><strong>Current Photo:</strong></p>
            {newPhotoPreview ? (
              <img
                src={newPhotoPreview}
                alt="Employee Photo"
                className="w-40 h-40 object-cover border rounded-md mt-2"
              />
            ) : (
              <div className="text-gray-500">No photo uploaded</div>
            )}
          </div>
  
         
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-gray-700 font-semibold">
              Full Name:
              <input
                type="text"
                name="full_name"
                value={formData.full_name || ""}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg p-2 w-full mt-1"
              />
            </label>
  
            <label className="block text-gray-700 font-semibold">
              Email:
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg p-2 w-full mt-1"
              />
            </label>
  
            <label className="block text-gray-700 font-semibold">
              Phone:
              <input
                type="text"
                name="phone"
                value={formData.phone || ""}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg p-2 w-full mt-1"
              />
            </label>
  
            <label className="block text-gray-700 font-semibold">
              Position:
              <input
                type="text"
                name="position"
                value={formData.position || ""}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg p-2 w-full mt-1"
              />
            </label>
  
            <label className="block text-gray-700 font-semibold">
              Department:
              <input
                type="text"
                name="department"
                value={formData.department || ""}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg p-2 w-full mt-1"
              />
            </label>
  
            <label className="block text-gray-700 font-semibold">
              Salary:
              <input
                type="number"
                name="salary"
                value={formData.salary || ""}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg p-2 w-full mt-1"
              />
            </label>
  
            <label className="block text-gray-700 font-semibold">
              Hire Date:
              <input
                type="date"
                name="hire_date"
                value={formData.hire_date || ""}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg p-2 w-full mt-1"
              />
            </label>
  
            <label className="block text-gray-700 font-semibold">
              Date of Birth:
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth || ""}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg p-2 w-full mt-1"
              />
            </label>
  
            <label className="block text-gray-700 font-semibold col-span-2">
              Address:
              <input
                type="text"
                name="address"
                value={formData.address || ""}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg p-2 w-full mt-1"
              />
            </label>
          </div>
  
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Save
          </button>
        </Form>
      </div>
    ) : (
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Employee Not Found</h2>
      </div>
    )}
  
    <div className="mt-8 flex justify-center space-x-6">
      <a href="/employees" className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition">
        Employees
      </a>
      <a href="/employees/new" className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
        New Employee
      </a>
      <a href="/timesheets" className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">
        Timesheets
      </a>
    </div>
  </div>
  
  );
}
