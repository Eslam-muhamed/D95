const puppeteer = require('/Users/jrslam/.gemini/antigravity-ide/brain/99fa4d74-42a1-42b8-97d9-880efd0e3955/scratch/node_modules/puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('pageerror', err => {
    console.log('Page error:', err.toString());
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });

  await page.goto('http://localhost:5173/playstation/success?id=RES-4MDFU');
  await new Promise(r => setTimeout(r, 4000));
  await browser.close();
})();
