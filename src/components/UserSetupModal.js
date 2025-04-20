import React, { useState } from "react";

const icons = ["😀", "😎", "🤓", "🧐", "🤠", "👨‍💻", "👩‍💻", "🦄", "🐱", "🐶"];

export default function UserSetupModal({ onSubmit, onClose, userData = null }) {
  const [name, setName] = useState(userData?.name || "");
  const [selectedIcon, setSelectedIcon] = useState(userData?.icon || null);
  const [resume, setResume] = useState(userData?.resume || null);
  const [isEditingResume, setIsEditingResume] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && selectedIcon) {
      onSubmit({ name, icon: selectedIcon, resume });
      setIsEditingResume(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="relative p-8 bg-white w-full max-w-md m-auto rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">
          {userData
            ? "Edit your profile"
            : "Welcome! Let's set up your profile"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Your Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Choose an Icon
            </label>
            <div className="grid grid-cols-5 gap-2 mt-1">
              {icons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`text-2xl p-2 rounded-md ${
                    selectedIcon === icon
                      ? "bg-blue-100 border-2 border-blue-500"
                      : "bg-gray-100"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Resume
            </label>
            {userData?.resume && !isEditingResume ? (
              <div className="mt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingResume(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Edit Current Resume
                </button>
              </div>
            ) : (
              <textarea
                id="resume"
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={10}
                placeholder="Paste your resume text here..."
              />
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {userData ? "Update Profile" : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
