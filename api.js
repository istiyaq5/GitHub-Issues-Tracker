const BASE_URL = "https://phi-lab-server.vercel.app/api/v1/lab";

async function getIssues() {
  const res = await fetch(`${BASE_URL}/issues`);
  const data = await res.json();
  return data.issues || data.data || [];
}

async function getIssue(id) {
  const res = await fetch(`${BASE_URL}/issue/${id}`);
  const data = await res.json();

  const issue = data.issue || data.data || data;

  if (!issue || Array.isArray(issue)) {
    throw new Error("Invalid issue response");
  }
  return issue;
}

async function searchIssues(text) {
  const res = await fetch(
    `${BASE_URL}/issues/search?q=${encodeURIComponent(text)}`,
  );
  const data = await res.json();
  return data.issues || data.data || [];
}
