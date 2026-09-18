const fs = require('fs');
async function run() {
  try {
    const res = await fetch("https://eprpagnkxxkuykbzhvge.supabase.co/functions/v1/smart-waiter", {
      method: "POST",
      headers: {
        "Authorization": "Bearer sb_publishable_mSDH8vHZfdbb3lGVrM71bg_bmUQ9eJi",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: "ازيك يادبور", history: [], menuContext: "test" })
    });
    const text = await res.text();
    console.log("Raw Response:", text);
  } catch (e) {
    console.error(e);
  }
}
run();
