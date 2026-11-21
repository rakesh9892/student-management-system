import { useEffect, useState } from "react";
import StudentForm from "./components/StudentForm";
import StudentDetails from "./components/StudentDetails";
import { API_URL, getPhotoUrl } from "./api";

  function App() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_URL}/students`);

      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }

      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchStudents();
  }, []);
  const refreshStudents = async () => {
  try {
  const response = await fetch(`${API_URL}/students`);

  if (!response.ok) {
    throw new Error("Failed to refresh students");
  }

  const data = await response.json();
  setStudents(data);
  setError("");
  } catch (err) {
  setError(err.message);
  }
  };
  const handleDelete = async (student) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete ${student.name}?`
  );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `${API_URL}/students/${student.id}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to delete student");
    }

    await refreshStudents();
    alert("Student deleted successfully");
  } catch (err) {
    alert(err.message);
  }
};
  const filteredStudents = students.filter((student) => {
  const searchText = search.toLowerCase().trim();

  return (
    student.name.toLowerCase().includes(searchText) ||
    student.admission_number.toLowerCase().includes(searchText) ||
    student.course.toLowerCase().includes(searchText) ||
    student.email.toLowerCase().includes(searchText)
  );
});
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <h1 className="text-2xl font-bold text-blue-700">
            Student Management System
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage student records easily
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Student Records
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Total Students: {students.length}
              </p>
            </div>

            <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium cursor-pointer"
              >
                + Add Student
            </button>
          </div>
              <div className="mb-6">
              <input
                type="search"
                placeholder="Search by name, admission number, course or email..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full sm:max-w-md border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          {loading ? (
            <p className="text-gray-500">Loading students...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : filteredStudents.length === 0 ? (
            <p className="text-gray-500 text-center py-10">
              {search.trim()
                ? "No matching students found."
                : "No students found."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm">
                    <th className="p-4">Photo</th>
                    <th className="p-4">Admission No.</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Course</th>
                    <th className="p-4">Year</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="p-4">
                        {student.photo_url ? (
                          <img
                            src={getPhotoUrl(student.photo_url)}
                            alt={student.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                            {student.name?.charAt(0)}
                          </div>
                        )}
                      </td>

                      <td className="p-4 text-sm font-medium text-gray-700">
                        {student.admission_number}
                      </td>

                      <td className="p-4 font-medium text-gray-800">
                        {student.name}
                      </td>

                      <td className="p-4 text-gray-600">
                        {student.course}
                      </td>

                      <td className="p-4 text-gray-600">
                        {student.year}
                      </td>

                      <td className="p-4 text-gray-600">
                        {student.email}
                      </td>

                       <td className="p-4">
                        <div className="flex flex-wrap items-center gap-2 min-w-max">

                          <button
                              type="button"
                              onClick={() => setViewingStudent(student)}
                              className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-200 cursor-pointer"
                            >
                              View
                            </button>
                          <button
                            type="button"
                            onClick={() => setEditingStudent(student)}
                            className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-amber-200 cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(student)}
                            className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-200 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
           {(showAddForm || editingStudent) && (
            <StudentForm
              key={editingStudent?.id ?? "new"}
              student={editingStudent}
              onClose={() => {
                setShowAddForm(false);
                setEditingStudent(null);
              }}
              onStudentAdded={refreshStudents}
            />
          )}

          {viewingStudent && (
            <StudentDetails
              student={viewingStudent}
              onClose={() => setViewingStudent(null)}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;