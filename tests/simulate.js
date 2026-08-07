const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();

  try {
    console.log('Navigating to the homepage...');
    await page.goto('https://poc-gtm-nu.vercel.app/', { waitUntil: 'domcontentloaded' });

    console.log('Opening the shop...');
    await page.getByRole('link', { name: 'Shop' }).click();

    console.log('Opening the first product page...');
    await page.getByRole('link', { name: 'View details' }).first().click();

    console.log('Adding the product to the cart...');
    page.once('dialog', async dialog => {
      console.log('Dialog shown:', dialog.message());
      await dialog.accept();
    });
    await page.getByRole('button', { name: 'Add to cart' }).click();

    console.log('Going to the cart...');
    await page.getByRole('link', { name: 'Cart' }).click();
    await page.getByRole('button', { name: 'Proceed to checkout' }).click();

    console.log('Filling out checkout details...');
    await page.getByLabel('Full name:').fill('Test User');
    await page.getByLabel('Email:').fill('test@example.com');
    await page.getByLabel('Shipping address:').fill('123 Test Street');

    console.log('Completing the purchase...');
    await page.getByRole('button', { name: 'Complete purchase' }).click();

    console.log('Saving a screenshot of the confirmation page...');
    await page.screenshot({ path: 'checkout_simulation.png', fullPage: true });
  } catch (error) {
    console.error('Simulation failed:', error);
    await page.screenshot({ path: 'simulation_error.png', fullPage: true });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
    console.log('Browser closed.');
  }
})();
