import { chromium } from 'playwright';

(async () => {
  let browser;
  try {
    browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const TARGET_URL = 'http://localhost:8080/admin//evil.example';
    
    console.log(`[TEST] Navigating to malicious URL: ${TARGET_URL}`);
    
    // We navigate to the malicious URL and wait until the network is idle.
    // This allows React Router to perform any immediate client-side redirects.
    await page.goto(TARGET_URL, { waitUntil: 'networkidle' });
    
    // We check the final URL to ensure we have not been redirected off the origin.
    const finalUrl = page.url();
    console.log(`[TEST] Final URL observed: ${finalUrl}`);
    
    // Assertion 1: Must remain on localhost:8080
    if (!finalUrl.startsWith('http://localhost:8080')) {
      console.error(`[FAIL] External navigation detected! Redirected to: ${finalUrl}`);
      process.exit(1);
    }
    
    // Assertion 2: Must not have redirected to the login page (which would have stored the bad state)
    if (finalUrl.includes('/admin/login')) {
      console.error(`[FAIL] Improperly redirected to login page! The URL is: ${finalUrl}`);
      process.exit(1);
    }
    
    // Assertion 3: Must explicitly render the 404 / NotFound state
    // The NotFound component renders: <span className="font-display text-6xl brand-text">404</span>
    // and <p>الصفحة مش موجودة</p>
    const content = await page.content();
    if (!content.includes('404') && !content.includes('الصفحة مش موجودة')) {
      console.error(`[FAIL] 404/NotFound state was not rendered!`);
      process.exit(1);
    }
    
    console.log('[PASS] Application safely handled the malicious URL by rendering 404 without redirecting.');
    process.exit(0);
    
  } catch (error) {
    console.error(`[ERROR] Test crashed: ${error.message}`);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
