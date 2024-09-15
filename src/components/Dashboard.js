import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import AddJobModal from "./AddJobModal";
import AutoAddJobModal from "./AutoAddJobModal";
import UserSetupModal from "./UserSetupModal";
import APIKeySetupModal from "./APIKeySetupModal";
import {
  Trash2,
  ExternalLink,
  Check,
  X,
  HelpCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Settings,
} from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAutoAddModal, setShowAutoAddModal] = useState(false);
  const [showUserSetupModal, setShowUserSetupModal] = useState(false);
  const [showAPIKeySetupModal, setShowAPIKeySetupModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    planned: true,
    active: true,
    completed: true,
  });
  const [userProfile, setUserProfile] = useState(null);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const navigate = useNavigate();

  const columnWidths = {
    company: "w-36",
    position: "w-64",
    salary: "w-24",
    h1b: "w-16",
    updated: "w-24",
    applied: "w-24",
    status: "w-40 min-w-[165px]",
    actions: "w-24",
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.optionKey || e.metaKey) && e.key === "") {
        e.preventDefault();
        setShowAutoAddModal(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log("User authenticated:", user.uid);
        setUser(user);
        const userProfileDoc = await getDoc(doc(db, "users", user.uid));
        if (userProfileDoc.exists()) {
          console.log("User profile exists");
          setUserProfile(userProfileDoc.data());
        } else {
          console.log("User profile does not exist");
          setShowUserSetupModal(true);
        }
        fetchJobs(user.uid);
      } else {
        console.log("User not authenticated");
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleUserSetup = async (userData) => {
    await setDoc(doc(db, "users", user.uid), userData);
    setUserProfile(userData);
    setShowUserSetupModal(false);
    setShowAPIKeySetupModal(true);
  };

  const handleAPIKeySetup = async (apiKey) => {
    await updateDoc(doc(db, "users", user.uid), { apiKey });
    setUserProfile((prev) => ({ ...prev, apiKey }));
    setShowAPIKeySetupModal(false);
  };

  const fetchJobs = async (userId) => {
    try {
      console.log("Fetching jobs for user:", userId);
      const q = query(collection(db, "jobs"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const jobsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Fetched jobs:", jobsData);
      setJobs(jobsData);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleAddJob = async (jobData) => {
    if (!user || !user.uid) {
      console.error("User not authenticated");
      return;
    }
    try {
      console.log("Current user:", user);
      console.log("Job data to be added:", jobData);

      const jobDataWithUser = {
        ...jobData,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        lastUpdate: new Date().toISOString(),
        appliedOn: null,
      };

      const docRef = await addDoc(collection(db, "jobs"), jobDataWithUser);

      console.log("Document written with ID: ", docRef.id);

      setJobs([...jobs, { id: docRef.id, ...jobDataWithUser }]);
      setShowAddModal(false);
      setShowAutoAddModal(false);
    } catch (error) {
      console.error("Error adding job:", error);
      console.error("Error details:", error.code, error.message);
    }
  };

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      const jobDoc = doc(db, "jobs", jobId);
      const updateData = {
        status: newStatus,
        lastUpdate: new Date().toISOString(),
      };

      // If the new status is "Applied" and the current appliedOn is null, set it to today's date
      const currentJob = jobs.find((job) => job.id === jobId);
      if (newStatus === "Applied" && !currentJob.appliedOn) {
        updateData.appliedOn = new Date().toISOString().split("T")[0];
      }

      await updateDoc(jobDoc, updateData);
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === jobId
            ? {
                ...job,
                ...updateData,
              }
            : job
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const toggleH1bSponsorship = async (jobId, currentStatus) => {
    try {
      let newStatus;
      if (currentStatus === "true") {
        newStatus = "false";
      } else if (currentStatus === "false") {
        newStatus = "not found";
      } else {
        newStatus = "true";
      }
      const jobDoc = doc(db, "jobs", jobId);
      await updateDoc(jobDoc, {
        h1bSponsorship: newStatus,
        lastUpdate: new Date().toISOString(),
      });
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === jobId
            ? {
                ...job,
                h1bSponsorship: newStatus,
                lastUpdate: new Date().toISOString(),
              }
            : job
        )
      );
    } catch (error) {
      console.error("Error updating H1B sponsorship:", error);
    }
  };

  const handleDeleteJob = async (jobId) => {
    try {
      await deleteDoc(doc(db, "jobs", jobId));
      setJobs(jobs.filter((job) => job.id !== jobId));
    } catch (error) {
      console.error("Error deleting job:", error);
    }
  };

  const handleEditField = (jobId, field, value) => {
    setEditingField({ jobId, field });
    setEditingValue(value);
  };

  const handleSaveEdit = async (jobId) => {
    try {
      const jobDoc = doc(db, "jobs", jobId);
      await updateDoc(jobDoc, {
        [editingField.field]: editingValue,
        lastUpdate: new Date().toISOString(),
      });
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === jobId
            ? {
                ...job,
                [editingField.field]: editingValue,
                lastUpdate: new Date().toISOString(),
              }
            : job
        )
      );
      setEditingField(null);
      setEditingValue("");
    } catch (error) {
      console.error("Error updating job field:", error);
    }
  };

  const getUpdatedDate = (dateString) => {
    if (!dateString) return "New";
    const date = new Date(dateString);
    if (isNaN(date)) return "Invalid date";
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    console.log(dateString);

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  const getAppliedDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date)) return "Invalid date";
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderJobTable = (title, jobsToRender, section) => (
    <div className="mb-8">
      <h3 className="text-xl font-semibold mb-4 cursor-pointer flex items-center">
        {title}
        {expandedSections[section] ? (
          <ChevronUp className="ml-2" onClick={() => toggleSection(section)} />
        ) : (
          <ChevronDown
            className="ml-2"
            onClick={() => toggleSection(section)}
          />
        )}
      </h3>
      {expandedSections[section] && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${columnWidths.company}`}
                >
                  Company
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${columnWidths.position}`}
                >
                  Position
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${columnWidths.salary}`}
                >
                  Salary
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${columnWidths.h1b}`}
                >
                  H1B?
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${columnWidths.updated}`}
                >
                  Updated
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${columnWidths.applied}`}
                >
                  Applied
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${columnWidths.status}`}
                >
                  Status
                </th>
                <th
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${columnWidths.actions}`}
                ></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobsToRender.map((job) => (
                <tr key={job.id}>
                  <td
                    className={`px-6 py-4 text-sm text-gray-900 ${columnWidths.company}`}
                  >
                    {editingField?.jobId === job.id &&
                    editingField?.field === "company" ? (
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={() => handleSaveEdit(job.id)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSaveEdit(job.id)
                        }
                        className="w-full px-2 py-1 border rounded"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center">
                        <button
                          className="w-full flex justify-start"
                          onClick={() =>
                            handleEditField(job.id, "company", job.company)
                          }
                        >
                          <span className="mr-2 text-left">{job.company}</span>
                        </button>
                      </div>
                    )}
                  </td>
                  <td
                    className={`px-6 py-4 text-sm text-gray-900 ${columnWidths.position}`}
                  >
                    {editingField?.jobId === job.id &&
                    editingField?.field === "position" ? (
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={() => handleSaveEdit(job.id)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSaveEdit(job.id)
                        }
                        className="w-full px-2 py-1 border rounded"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center">
                        <button
                          className="w-full flex justify-start"
                          onClick={() =>
                            handleEditField(job.id, "position", job.position)
                          }
                        >
                          <span className="mr-2 text-left">{job.position}</span>
                        </button>
                      </div>
                    )}
                  </td>
                  <td
                    className={`px-6 py-4 text-sm text-gray-900 ${columnWidths.salary}`}
                  >
                    {editingField?.jobId === job.id &&
                    editingField?.field === "salary" ? (
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={() => handleSaveEdit(job.id)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSaveEdit(job.id)
                        }
                        className="w-full px-2 py-1 border rounded"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center">
                        <button
                          onClick={() =>
                            handleEditField(job.id, "salary", job.salary)
                          }
                        >
                          <span className="mr-2">
                            {job.salary !== null && job.salary !== "-"
                              ? `$${job.salary}`
                              : "-"}
                          </span>
                        </button>
                      </div>
                    )}
                  </td>
                  <td
                    className={`px-6 py-4 text-sm text-gray-900 ${columnWidths.h1b}`}
                    onClick={() =>
                      toggleH1bSponsorship(job.id, job.h1bSponsorship)
                    }
                  >
                    {job.h1bSponsorship === "true" ? (
                      <Check className="text-green-500 hover:text-green-700 h-6 w-6 transition duration-150 ease-in-out" />
                    ) : job.h1bSponsorship === "false" ? (
                      <X className="text-red-500 hover:text-red-700 h-6 w-6 transition duration-150 ease-in-out" />
                    ) : (
                      <HelpCircle className="text-yellow-500 hover:text-yellow-700 h-6 w-6 transition duration-150 ease-in-out" />
                    )}
                  </td>
                  <td
                    className={`px-6 py-4 text-sm text-gray-900 ${columnWidths.updated}`}
                  >
                    {getUpdatedDate(job.lastUpdate)}
                  </td>
                  <td
                    className={`px-6 py-4 text-sm text-gray-900 ${columnWidths.applied}`}
                  >
                    {job.appliedOn ? getAppliedDate(job.appliedOn) : "-"}
                  </td>
                  <td
                    className={`px-6 py-4 text-sm text-gray-900 ${columnWidths.status}`}
                  >
                    <select
                      value={job.status}
                      onChange={(e) =>
                        handleStatusChange(job.id, e.target.value)
                      }
                      className={`block w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                        job.status === "Accepted"
                          ? "bg-green-100 text-green-700"
                          : job.status === "Rejected"
                          ? "bg-red-100 text-red-700"
                          : job.status === "Interviewed"
                          ? "bg-blue-100 text-blue-700"
                          : job.status === "Applied"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      <option value="Planned">Planned</option>
                      <option value="Applied">Applied</option>
                      <option value="Interviewed">Interviewed</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Accepted">Accepted</option>
                    </select>
                  </td>
                  <td
                    className={`px-6 py-4 text-sm text-gray-900 ${columnWidths.actions}`}
                  >
                    <div className="flex items-center space-x-2">
                      <a
                        href={job.jobLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </a>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="text-red-500 hover:text-red-600 focus:outline-none transition duration-150 ease-in-out"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                      <div className="relative group">
                        <div className="relative group">
                          <Info className="h-5 w-5 text-gray-500 hover:text-gray-700 cursor-pointer" />
                          <div className="fixed z-50 hidden w-48 p-3 mt-0 rounded-md group-hover:block">
                            <div className="absolute z-50 hidden group-hover:block bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64 right-full mt-0 mr-2">
                              <h3 className="font-bold mb-2">More Info:</h3>
                              <p className="break-words whitespace-normal">
                                {job.moreInfo ||
                                  "No additional information available."}
                              </p>
                              <h3 className="font-bold mt-4 mb-2">Skills:</h3>
                              <div className="flex flex-wrap gap-2">
                                {job.skills &&
                                typeof job.skills === "string" ? (
                                  job.skills.split(",").map((skill, index) => (
                                    <span
                                      key={index}
                                      className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs"
                                    >
                                      {skill.trim()}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-gray-500">
                                    No skills listed.
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const plannedJobs = jobs.filter((job) => job.status === "Planned");
  const activeJobs = jobs.filter((job) =>
    ["Applied", "Interviewed"].includes(job.status)
  );
  const completedJobs = jobs.filter((job) =>
    ["Rejected", "Accepted"].includes(job.status)
  );

  const NotificationInbox = () => (
    <div className="bg-white shadow-md rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        🔔 Notifications
      </h3>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        <div className="border-b pb-2">
          <h4 className="font-medium">It's been more than a week</h4>
          <p className="text-sm text-gray-600 break-words">
            You've applied to google last week. <br></br>
            <a href="https://google.com">Click here</a> to generate an email
          </p>
        </div>
        <div className="border-b pb-2">
          <h4 className="font-medium">Interview scheduled</h4>
          <p className="text-sm text-gray-600 break-words">
            You have an interview with Amazon
          </p>
        </div>
      </div>
    </div>
  );

  const ApplicationStats = () => {
    const [hoveredSegment, setHoveredSegment] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    const statusCounts = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {});

    const recentApplications = jobs
      .filter((job) => job.appliedOn)
      .reduce((acc, job) => {
        const appliedDate = new Date(job.appliedOn + "T00:00:00");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = Math.abs(today - appliedDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 7) {
          const dayName = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ][appliedDate.getDay()];
          acc[dayName] = (acc[dayName] || 0) + 1;
        }

        return acc;
      }, {});

    const orderedDays = [
      "Sunday",
      "Saturday",
      "Friday",
      "Thursday",
      "Wednesday",
      "Tuesday",
      "Monday",
    ];
    const recentApplicationsArray = orderedDays
      .map((day) => ({
        day:
          day === new Date().toLocaleDateString("en-US", { weekday: "long" })
            ? `${day}`
            : day,
        count: recentApplications[day] || 0,
      }))
      .reverse();

    // const plannedApplications = statusCounts["Planned"] || 0;

    const pieChartData = [
      {
        status: "Interviewing",
        count: statusCounts["Interviewed"] || 0,
        color: "#5199fa",
      },
      {
        status: "Applied",
        count: statusCounts["Applied"] || 0,
        color: "#fcec3e",
      },
      {
        status: "Rejected",
        count: statusCounts["Rejected"] || 0,
        color: "#f95757",
      },
      {
        status: "Accepted",
        count: statusCounts["Accepted"] || 0,
        color: "#11c44e",
      },
    ];

    const totalActiveApplications = pieChartData.reduce(
      (sum, item) => sum + item.count,
      0
    );

    const plannedApplications = statusCounts["Planned"] || 0;

    let startAngle = 0;
    const radius = 80;
    const centerX = 100;
    const centerY = 100;

    const handleMouseMove = (e, item) => {
      setHoveredSegment(item);
      setTooltipPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseLeave = () => {
      setHoveredSegment(null);
    };

    return (
      <>
        <div className="bg-white shadow-md rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-0">❇️ Application Stats</h3>
          <div className="flex justify-center items-center mb-0 relative">
            <svg width="250" height="250" viewBox="0 0 200 200">
              {pieChartData.map((item, index) => {
                const percentage = item.count / totalActiveApplications;
                const endAngle = startAngle + percentage * 360;
                const largeArcFlag = percentage > 0.5 ? 1 : 0;
                const x1 =
                  centerX + radius * Math.cos((startAngle * Math.PI) / 180);
                const y1 =
                  centerY + radius * Math.sin((startAngle * Math.PI) / 180);
                const x2 =
                  centerX + radius * Math.cos((endAngle * Math.PI) / 180);
                const y2 =
                  centerY + radius * Math.sin((endAngle * Math.PI) / 180);

                const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                startAngle = endAngle;

                return (
                  <path
                    key={item.status}
                    d={pathData}
                    fill={item.color}
                    stroke="white"
                    strokeWidth="2"
                    onMouseMove={(e) => handleMouseMove(e, item)}
                    onMouseLeave={handleMouseLeave}
                  />
                );
              })}
              <circle cx={centerX} cy={centerY} r="70" fill="white" />
              <text
                x={centerX}
                y={centerY - 8}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs text-gray-500"
              >
                Planned
              </text>
              <text
                x={centerX}
                y={centerY + 15}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-2xl font-bold"
              >
                {plannedApplications}
              </text>
            </svg>
            {hoveredSegment && (
              <div
                className="absolute bg-white border border-gray-200 rounded p-2 shadow-md text-sm"
                style={{
                  left: tooltipPosition.x - 100,
                  top: tooltipPosition.y - 220,
                  pointerEvents: "none",
                }}
              >
                {hoveredSegment.status}: {hoveredSegment.count}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4">📅 Week's Progress</h3>
          <div className="space-y-2">
            {recentApplicationsArray.map((day, index) => (
              <div key={index} className="flex items-center">
                <span
                  className="text-sm text-gray-600"
                  style={{ minWidth: "80px" }}
                >
                  {day.day}
                </span>
                <span className="ml-4">{"✓ ".repeat(day.count)}</span>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800">Job Tracker</h1>
            <img src="/img/cat.png" className="w-20 ml-5" alt="cat" />
          </div>
          <div className="flex items-center">
            <div className="relative">
              <button
                onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                className="outline-none ring-2 ring-offset-2 ring-blue-500 w-10 h-10 text-2xl rounded-full bg-gray-300 flex items-center justify-center mr-2 text-gray-600 hover:bg-gray-400"
              >
                <Settings></Settings>
                {/* {userProfile.icon} */}
              </button>
              {showSettingsDropdown && (
                <div className="absolute right-0 mt-2 w-60  bg-white rounded-md shadow-lg py-1">
                  <button className="bg-gray-50 text-lg font-bold block px-4 py-2 text-sm text-gray-700 w-full text-left">
                    <span>Welcome Back, {userProfile.name}</span>
                  </button>
                  <button
                    onClick={() => setShowUserSetupModal(true)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => setShowAPIKeySetupModal(true)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    Set API Key
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="w-full px-4 sm:px-6 xl:px-8 py-8">
        <div className="w-full">
          <div className="flex flex-col xl:flex-row gap-6">
            <div className="lg:w-70">
              <NotificationInbox />
              <ApplicationStats />
            </div>
            <div className="lg:w-full">
              <div className="">
                <div className="flex flex-col sm:flex-row justify-start sm:justify-between items-start sm:items-center mb-10 gap-2 sm:gap-0">
                  <h2 className="text-4xl font-bold text-gray-800 pb-5 md:pb-0">
                    Dashboard
                  </h2>
                  <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-2">
                    <button
                      onClick={() => setShowAutoAddModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md w-full sm:w-auto hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Auto Add
                    </button>
                    {showAutoAddModal && (
                      <AutoAddJobModal
                        onClose={() => setShowAutoAddModal(false)}
                      />
                    )}
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md w-full sm:w-auto hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Manual Add
                    </button>
                  </div>
                </div>
              </div>
              {renderJobTable("🛜 Planned Applications", plannedJobs, "planned")}
              {renderJobTable("🚼 Active Applications", activeJobs, "active")}
              {renderJobTable(
                "✅ Completed Applications",
                completedJobs,
                "completed"
              )}
            </div>
          </div>
        </div>
      </main>

      {showAddModal && (
        <AddJobModal
          onClose={() => setShowAddModal(false)}
          onAddJob={handleAddJob}
        />
      )}
      {showAutoAddModal && (
        <AutoAddJobModal
          onClose={() => setShowAutoAddModal(false)}
          onAddJob={handleAddJob}
          apiKey={userProfile?.apiKey}
        />
      )}
      {showUserSetupModal && (
        <UserSetupModal
          onSubmit={handleUserSetup}
          onClose={() => setShowUserSetupModal(false)}
        />
      )}
      {showAPIKeySetupModal && (
        <APIKeySetupModal
          onSubmit={handleAPIKeySetup}
          onClose={() => setShowAPIKeySetupModal(false)}
        />
      )}
    </div>
  );
}
