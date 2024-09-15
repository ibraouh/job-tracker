import React, { useState } from "react";

export default function APIKeySetupModal({ onSubmit, onClose }) {
  const [apiKey, setApiKey] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (apiKey) {
      onSubmit(apiKey);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="relative p-8 bg-white w-full max-w-md m-auto rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Set up ChatGPT API Key</h2>
        <p className="mb-4">
          This app works with ChatGPT integration. An API key is needed to
          unlock automatic features such as auto-parsing of information and
          auto-generation of email reminders.
        </p>
        <a
          href="https://platform.openai.com/account/api-keys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline mb-4 block"
        >
          Learn how to get your own API key
        </a>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="apiKey"
              className="block text-sm font-medium text-gray-700"
            >
              API Key
            </label>
            <input
              type="text"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Set up later in settings
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save API Key
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
