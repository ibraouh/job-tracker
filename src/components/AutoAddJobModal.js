import React, { useState } from "react";
import { X, Loader } from "lucide-react";
import { parseJobPosting } from "../services/jobParser";

export default function AutoAddJobModal({ onClose, onAddJob, apiKey }) {
  const [jobLink, setJobLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const parsedJobData = await parseJobPosting(jobLink, apiKey);
      const jobData = {
        ...parsedJobData,
        jobLink,
        status: "Planned",
        appliedOn: null,
      };
      await onAddJob(jobData);
      onClose();
    } catch (error) {
      console.error("Error parsing job posting:", error);
      setError(
        "Failed to parse job posting. Please try again or add manually."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative p-8 bg-white w-full max-w-md m-auto rounded-lg shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-6 w-6" />
        </button>
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          Auto Add Job Application
        </h3>
        {apiKey ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="jobLink"
                className="block text-sm font-medium text-gray-700"
              >
                Job Posting Link
              </label>
              <input
                type="url"
                id="jobLink"
                name="jobLink"
                value={jobLink}
                onChange={(e) => setJobLink(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end mt-6 space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Processing...
                  </>
                ) : (
                  "Add Job"
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-red-500">
              Please set up your API key in the settings to use the auto-add
              feature.
            </p>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
