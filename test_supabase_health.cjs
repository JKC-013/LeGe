require('dotenv').config({ path: '.env.local' });
const url = process.env.VITE_SUPABASE_URL;
console.log("URL is:", url);
if (url) {
  fetch(`${url}/auth/v1/health`)
    .then(r => r.json())
    .then(data => console.log("Health:", data))
    .catch(err => console.error("Health error:", err));
}
