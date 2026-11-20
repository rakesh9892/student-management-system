import { useState } from "react";

const initialForm = {
  name: "",
  course: "",
  year: "1",
  dob: "",
  email: "",
  mobile_number: "",
  gender: "",
  address: "",
};

  function StudentForm({ onClose, onStudentAdded, student = null }) {
   const [form, setForm] = useState(() =>
   student
     ? {
         name: student.name,
         course: student.course,
         year: String(student.year),
         dob: student.dob?.slice(0, 10) || "",
         email: student.email,
         mobile_number: student.mobile_number,
         gender: student.gender,
         address: student.address,
       }
     : initialForm
 );
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
  event.preventDefault();
  setError("");

  // Validate photo before saving student details
  if (photo) {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(photo.type)) {
      setError("Only JPG, PNG and WEBP images are allowed");
      return;
    }

    if (photo.size > 2 * 1024 * 1024) {
      setError("Photo must not exceed 2 MB");
      return;
    }
  }

  setSaving(true);

  try {
    const isEditing = Boolean(student);

    const url = isEditing
      ? `http://localhost:5000/students/${student.id}`
      : "http://localhost:5000/students";

    const response = await fetch(url, {
      method: isEditing ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        year: Number(form.year),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to save student");
    }

    const studentId = isEditing ? student.id : data.student.id;

    if (photo) {
      const photoData = new FormData();
      photoData.append("photo", photo);

      const photoResponse = await fetch(
        `http://localhost:5000/students/${studentId}/photo`,
        {
          method: "POST",
          body: photoData,
        }
      );

      const photoResult = await photoResponse.json();

      if (!photoResponse.ok) {
        throw new Error(
          `Student details saved, but photo upload failed: ${
            photoResult.message || "Unknown error"
          }`
        );
      }
    }

    await onStudentAdded();
    onClose();
  } catch (err) {
    setError(err.message);
  } finally {
    setSaving(false);
  }
 };
  const inputStyle =
    "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-gray-800">
            {student ? "Edit Student" : "Add New Student"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-gray-500 hover:text-gray-800 text-2xl"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                maxLength={100}
                className={inputStyle}
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Course
              </label>
              <input
                name="course"
                value={form.course}
                onChange={handleChange}
                required
                maxLength={100}
                className={inputStyle}
                placeholder="e.g. Computer Engineering"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Year
              </label>
              <select
                name="year"
                value={form.year}
                onChange={handleChange}
                required
                className={inputStyle}
              >
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                name="dob"
                value={form.dob}
                onChange={handleChange}
                max={new Date().toLocaleDateString("en-CA")}
                required
                className={inputStyle}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                maxLength={150}
                className={inputStyle}
                placeholder="student@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                name="mobile_number"
                value={form.mobile_number}
                onChange={handleChange}
                pattern="[0-9]{10}"
                title="Enter a 10-digit mobile number"
                required
                className={inputStyle}
                placeholder="10-digit mobile number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Gender
              </label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                required
                className={inputStyle}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Student Photo (Optional)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  setPhoto(event.target.files?.[0] || null)
                }
                className="w-full text-sm border border-gray-300 rounded-lg p-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG or WEBP. Maximum 2 MB.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Address
            </label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              required
              rows={3}
              className={inputStyle}
              placeholder="Enter complete address"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : student ? "Update Student" : "Save Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StudentForm;