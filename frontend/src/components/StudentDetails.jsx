import { getPhotoUrl } from "../api";
function StudentDetails({ student, onClose }) {
  const details = [
    ["Admission Number", student.admission_number],
    ["Full Name", student.name],
    ["Course", student.course],
    ["Year", student.year],
    ["Date of Birth", student.dob?.slice(0, 10)],
    ["Email", student.email],
    ["Mobile Number", student.mobile_number],
    ["Gender", student.gender],
    ["Address", student.address],
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Student Details
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close student details"
            className="text-gray-500 hover:text-gray-800 text-2xl cursor-pointer"
          >
            &times;
          </button>
        </div>

        <div className="flex justify-center mb-6">
          {student.photo_url ? (
            <img
              src={getPhotoUrl(student.photo_url)}
              alt={student.name}
              className="w-28 h-28 rounded-full object-cover border-4 border-blue-100"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-4xl font-bold">
              {student.name?.charAt(0)}
            </div>
          )}
        </div>

        <div className="divide-y divide-gray-100">
          {details.map(([label, value]) => (
            <div
              key={label}
              className="grid grid-cols-1 sm:grid-cols-2 gap-1 py-3"
            >
              <span className="text-sm font-medium text-gray-500">
                {label}
              </span>
              <span className="text-sm text-gray-800 break-words whitespace-pre-wrap">
                {value || "N/A"}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentDetails;