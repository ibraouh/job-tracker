import axios from "axios";
import { getDoc, doc } from "firebase/firestore";
import { db } from "./firebase";
import { calculateMatchScore } from "./jobMatcher";

interface JobPostingData {
  company: string;
  position: string;
  salary: string | null;
  h1bSponsorship: "true" | "false" | "not found";
  moreInfo: string;
  skills: string;
  resumeMatch: number | null;
}

async function getUserResume(userId: string): Promise<string> {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.error("User document not found");
      throw new Error("User document not found");
    }

    const userData = userDoc.data();

    // First try to use the resume summary if available
    if (userData.resumeSummary && typeof userData.resumeSummary === "string") {
      return userData.resumeSummary;
    }

    // Fall back to the full resume text if summary isn't available
    if (userData.resume && typeof userData.resume === "string") {
      return userData.resume;
    }
    throw new Error("No resume found for this user");
  } catch (error) {
    console.error("Error fetching user resume:", error);
    throw new Error("Failed to fetch user resume");
  }
}

export async function parseJobPosting(
  jobLink: string,
  apiKey: string,
  userId: string,
  retries = 5
): Promise<JobPostingData> {
  if (!jobLink || typeof jobLink !== "string") {
    throw new Error("Invalid job link provided");
  }

  if (!apiKey) {
    throw new Error("API key is required");
  }

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
  const apiUrl = "https://api.openai.com/v1/chat/completions";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  let resume: string;
  try {
    resume = await getUserResume(userId);
  } catch (error) {
    console.error("Error fetching user resume:", error);
    resume = "No resume found for this user";
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const requestBody = {
        model: "gpt-4.1",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that extracts job information from job postings.",
          },
          {
            role: "user",
            content: `
              Task:
                Given the job posting link: ${jobLink}, extract and return the following details:

                - Company Name
                - Position Name
                - Salary (it helps to look for a "$" anywhere in the website, and that's usually the salary. if it is in a range format, return the midpoint value as an integer, formatted with commas and no "$". NEVER respond with "Not found" instead return null)
                - H1B Sponsorship (return "true," "false," or "not found")
                - More Info (any additional relevant details)
                - Skills (list of skills mentioned in the job posting, as many skills as possible, separated by commas. At least 30 skills total. Never return null)

              Notes:
                - Ensure to thoroughly check the page for all requested details. Only return "not found" when absolutely necessary.
                - If H1B or work visa are mentioned, return true or false depending on content, HOWEVER, if no mention of "sponsorship", "visa", "H1B", or anything that means something similar are in the website, then return "not found"
                - For skills, include any technical requirements, degrees, or tools mentioned. If no skills are mentioned, feel free to add skills that are relevant to the job title. Please return at least 30 skills.
                - For salary, it helps to look for a "$" anywhere in the website, and that's usually the salary. If it is in a range format, return the midpoint value as an integer, formatted with commas and no "$". NEVER respond with "Not found" instead return null.

              Response format:
                Only return the following JSON format. If some information is missing, return null for that field.

                {
                  "company": "Company Name",
                  "position": "Job Position",
                  "salary": "xxxxxx", (if not found, return null)
                  "h1bSponsorship": "true" | "false" | "not found",
                  "moreInfo": "Additional relevant information",
                  "skills": "Skill 1, Skill 2, Skill 3, ...",
              }
            `,
          },
        ],
      };

      const { data } = await axios.post(apiUrl, requestBody, { headers });

      if (
        !data.choices ||
        data.choices.length === 0 ||
        !data.choices[0].message
      ) {
        throw new Error("Invalid response from OpenAI API");
      }

      let parsedData: JobPostingData;
      try {
        parsedData = JSON.parse(data.choices[0].message.content);
      } catch (error) {
        throw new Error("Failed to parse JSON response from OpenAI API");
      }

      let score: number | null;
      try {
        score = await calculateMatchScore(
          resume,
          parsedData.skills.split(",").map((skill) => skill.trim())
        );
      } catch (err) {
        console.warn(
          "Couldn't calcualte the match score, defualting to null:",
          err
        );
        score = null;
      }
      parsedData.resumeMatch = score;

      // Validate the parsed data
      if (!parsedData.company || typeof parsedData.company !== "string") {
        throw new Error(
          "Invalid response format: missing or invalid company field"
        );
      }
      if (!parsedData.position || typeof parsedData.position !== "string") {
        throw new Error(
          "Invalid response format: missing or invalid position field"
        );
      }
      if (parsedData.salary !== null && typeof parsedData.salary !== "string") {
        throw new Error("Invalid response format: invalid salary field");
      }
      if (!["true", "false", "not found"].includes(parsedData.h1bSponsorship)) {
        throw new Error(
          "Invalid response format: invalid h1bSponsorship field"
        );
      }
      if (!parsedData.moreInfo || typeof parsedData.moreInfo !== "string") {
        throw new Error(
          "Invalid response format: missing or invalid moreInfo field"
        );
      }
      if (!parsedData.skills || typeof parsedData.skills !== "string") {
        throw new Error(
          "Invalid response format: missing or invalid skills field"
        );
      }
      return parsedData;
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);

      if (error.response?.status === 429 && attempt < retries - 1) {
        const retryAfter = error.response?.headers["retry-after"] || 1;
        console.warn(`Rate limit hit. Retrying after ${retryAfter} seconds...`);
        await delay(retryAfter * 1000 * (attempt + 1));
      } else {
        throw new Error(`Failed after ${retries} attempts: ${error.message}`);
      }
    }
  }

  throw new Error("Failed to parse job posting after retries");
}
