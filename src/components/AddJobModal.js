import React, { useState } from "react";

export default function AddJobModal({ onClose, onAddJob }) {
  const [jobData, setJobData] = useState({
    company: "",
    position: "",
    salary: "",
    lastUpdate: new Date().toISOString().split("T")[0],
    h1bSponsorship: "not found",
    jobLink: "",
    status: "Planned",
    moreInfo: "",
    skills: "",
    userId: "",
    appliedOn: null, // Add this line
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setJobData({ ...jobData, [name]: value });
  };

  const formatSalary = (value) => {
    const numericValue = value.replace(/\D/g, "");
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const handleSalaryChange = (e) => {
    const { value } = e.target;
    const formattedSalary = formatSalary(value);
    setJobData({ ...jobData, salary: formattedSalary });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // If the status is "Applied", set the appliedOn date to today
      if (jobData.status === "Applied") {
        jobData.appliedOn = new Date().toISOString().split("T")[0];
      }
      await onAddJob(jobData);
      onClose();
    } catch (error) {
      console.error("Error adding job:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="relative p-8 bg-white w-full max-w-md m-auto rounded-lg shadow-lg">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          Add New Job Application
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="company"
              className="block text-sm font-medium text-gray-700"
            >
              Company
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={jobData.company}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="position"
              className="block text-sm font-medium text-gray-700"
            >
              Position
            </label>
            <input
              type="text"
              id="position"
              name="position"
              value={jobData.position}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="salary"
              className="block text-sm font-medium text-gray-700"
            >
              Salary
            </label>
            <input
              type="text"
              id="salary"
              name="salary"
              value={jobData.salary}
              onChange={handleSalaryChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="50,000"
            />
          </div>
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
              value={jobData.jobLink}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label
              htmlFor="h1bSponsorship"
              className="block text-sm font-medium text-gray-700"
            >
              H1B Sponsorship
            </label>
            <select
              id="h1bSponsorship"
              name="h1bSponsorship"
              value={jobData.h1bSponsorship}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
              <option value="not found">Not Found</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700"
            >
              Application Status
            </label>
            <select
              id="status"
              name="status"
              value={jobData.status}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Planned">Planned</option>
              <option value="Applied">Applied</option>
              <option value="Interviewed">Interviewed</option>
              <option value="Rejected">Rejected</option>
              <option value="Accepted">Accepted</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="moreInfo"
              className="block text-sm font-medium text-gray-700"
            >
              More Info
            </label>
            <textarea
              id="moreInfo"
              name="moreInfo"
              value={jobData.moreInfo}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows="3"
            />
          </div>
          <div>
            <label
              htmlFor="skills"
              className="block text-sm font-medium text-gray-700"
            >
              Skills
            </label>
            <input
              type="text"
              id="skills"
              name="skills"
              value={jobData.skills}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter skills separated by commas"
            />
          </div>
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
