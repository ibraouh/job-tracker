import axios from "axios";

interface JobPostingData {
  company: string;
  position: string;
  salary: string | null;
  h1bSponsorship: "true" | "false" | "not found";
  moreInfo: string;
  skills: string;
}

export async function parseJobPosting(
  jobLink: string,
  apiKey: string,
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

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const requestBody = {
        model: "gpt-3.5-turbo",
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
                - Skills (list of skills mentioned in the job posting)

              Notes:
                - Ensure to thoroughly check the page for all requested details. Only return "not found" when absolutely necessary.
                - If H1B or work visa are mentioned, return true or false depending on content, HOWEVER, if no mention of "sponsorship", "visa", "H1B", or anything that means something similar are in the website, then return "not found"
                - For skills, include any technical requirements, degrees, or tools mentioned.
                - For salary, it 

              Response format:
                Only return the following JSON format. If some information is missing, return null for that field.

                {
                  "company": "Company Name",
                  "position": "Job Position",
                  "salary": "xxxxxx", (if not found, return null)
                  "h1bSponsorship": "true" | "false" | "not found",
                  "moreInfo": "Additional relevant information",
                  "skills": "Skill 1, Skill 2, Skill 3, ..."
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
