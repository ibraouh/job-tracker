import React, { useState } from "react";

const icons = ["😀", "😎", "🤓", "🧐", "🤠", "👨‍💻", "👩‍💻", "🦄", "🐱", "🐶"];

export default function UserSetupModal({ onSubmit, onClose }) {
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && selectedIcon) {
      onSubmit({ name, icon: selectedIcon });
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="relative p-8 bg-white w-full max-w-md m-auto rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">
          Welcome! Let's set up your profile
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
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
