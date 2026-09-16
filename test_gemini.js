const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function test() {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: "You are a test." }]
      },
      contents: [
        { role: 'user', parts: [{ text: 'ازيك' }] },
        { role: 'model', parts: [{ text: 'الحمد لله تمام' }] },
        { role: 'user', parts: [{ text: 'ليه بس' }] }
      ],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 1024,
      },
    }),
  });

  const text = await response.text();
  console.log("Status:", response.status);
  console.log("Response:", text);
}

test();
