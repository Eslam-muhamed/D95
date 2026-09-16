const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function test() {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
  const data = await response.json();
  const models = data.models || [];
  models.forEach(m => {
    if(m.name.includes('flash') || m.name.includes('pro')) {
      console.log(m.name);
    }
  });
}

test();
