export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export const getPhotoUrl = (photoUrl) => {
  if (!photoUrl) return "";

  if (photoUrl.startsWith("https://")) {
    return photoUrl;
  }

  return `${API_URL}${photoUrl}`;
};
