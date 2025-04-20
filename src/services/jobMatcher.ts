export async function calculateMatchScore(
  resume: string,
  skills: string[]
): Promise<number> {
  const res = await fetch("https://ml-resume-score.onrender.com/score", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resume_text: resume, keywords: skills }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch match score");
  }

  const { match_score } = (await res.json()) as { match_score: number };
  console.log("Match score:", match_score);
  return match_score;
}
