import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Go to a dynamic route with a malicious ID
  const response = await page.goto('http://localhost:8080/tournaments/register//evil.example');
  
  // Wait a bit to see what happens
  await page.waitForTimeout(2000);
  
  console.log('Currently at:', page.url());
  const content = await page.content();
  if (content.includes('404') || content.includes('مش موجودة')) {
      console.log('Hit 404 Not Found');
  } else {
      console.log('Hit the route!');
  }

  await browser.close();
})();
