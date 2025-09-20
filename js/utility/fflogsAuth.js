const clientId = "9fe1d266-b67e-4b27-bc68-8f34a536456f";
const redirectUri = window.location.origin + window.location.pathname;

function generateCodeVerifier(length = 128) {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function startLogin() {
  const verifier = generateCodeVerifier();
  localStorage.setItem("pkce_verifier", verifier);

  const challenge = await generateCodeChallenge(verifier);
  const state = crypto.randomUUID();

  const authUrl = `https://www.fflogs.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&code_challenge=${challenge}&code_challenge_method=S256&state=${state}`;

  window.location = authUrl;
}

export async function exchangeCode() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const verifier = localStorage.getItem("pkce_verifier");

  if (!code) return null;

  const res = await fetch("https://www.fflogs.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    }),
  });

  return await res.json();
}
