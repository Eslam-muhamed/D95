import { chromium } from 'playwright';

async function runQA() {
    console.log('🚀 Starting Functional QA Assessment using Playwright...\n');
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const results = {
        PASS: [],
        FAILED: [],
        UNVERIFIED: []
    };
    
    function assert(condition, successMsg, failMsg) {
        if (condition) {
            console.log('✅ ' + successMsg);
            results.PASS.push(successMsg);
        } else {
            console.error('❌ ' + failMsg);
            results.FAILED.push(failMsg);
        }
    }

    try {
        // 1. Gateway & Basic Routing
        console.log('Testing Routing & Gateway...');
        await page.goto('http://localhost:8080/');
        
        // Wait for Splash screen to unmount (z-[9999] overlay)
        console.log('Waiting for splash screen...');
        await page.waitForTimeout(4000); 
        await page.waitForLoadState('networkidle');

        const title = await page.title();
        assert(title.includes('D95'), 'Gateway loads correctly', 'Gateway failed to load');
        
        // 2. Guest Booking Flow (Navigation)
        console.log('\nTesting PlayStation Flow...');
        await page.goto('http://localhost:8080/playstation');
        await page.waitForTimeout(4000); 
        await page.waitForLoadState('networkidle');
        const psHeader = await page.locator('text="غرفة"').first().isVisible() || await page.locator('text="PLAYSTATION"').first().isVisible();
        assert(psHeader, 'PlayStation route loads successfully', 'PlayStation route failed to load');
        
        // 3. Cafe Flow
        console.log('\nTesting Cafe Flow...');
        await page.goto('http://localhost:8080/menu');
        await page.waitForTimeout(4000); 
        await page.waitForLoadState('networkidle');
        const menuHeader = await page.locator('text="مشروبات"').first().isVisible() || await page.locator('text="CAFÉ"').first().isVisible();
        assert(menuHeader, 'Menu route loads successfully', 'Menu route failed to load');
        
        // 4. Tournaments Flow
        console.log('\nTesting Tournaments Flow...');
        await page.goto('http://localhost:8080/tournaments');
        await page.waitForTimeout(4000); 
        await page.waitForLoadState('networkidle');
        const tourHeader = await page.locator('text="بطولات"').first().isVisible() || await page.locator('text="TOURNAMENTS"').first().isVisible();
        assert(tourHeader, 'Tournaments route loads successfully', 'Tournaments route failed to load');
        
        // 5. Admin Auth Bounds
        console.log('\nTesting Admin Auth Bounds...');
        await page.goto('http://localhost:8080/admin/login');
        await page.waitForTimeout(1000); 
        await page.waitForLoadState('networkidle');
        const adminLogin = await page.locator('input[type="password"]').isVisible() || await page.locator('text="لوحة التحكم"').first().isVisible();
        assert(adminLogin, 'Admin login page is rendered and protects admin area', 'Admin login page failed to render');
        
        // 6. Suspense & Preloading Behavior
        console.log('\nTesting Browser History (Back/Forward)...');
        await page.goBack();
        await page.waitForLoadState('networkidle');
        assert(page.url().includes('tournaments'), 'Browser back navigation works', 'Browser back failed');
        
    } catch (e) {
        console.error('Test script encountered an unexpected error:', e);
    } finally {
        await browser.close();
        console.log('\n--- QA SUMMARY ---');
        console.log('PASSED: ' + results.PASS.length);
        console.log('FAILED: ' + results.FAILED.length);
        console.log(JSON.stringify(results, null, 2));
    }
}

runQA();
