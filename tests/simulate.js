const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { createTonyPersona } = require('./tony');
const baseUrl = 'https://poc-gtm-nu.vercel.app';
const screenshotsDir = path.join(__dirname, 'screenshots');
fs.mkdirSync(screenshotsDir, { recursive: true });

// Max number of user sessions running at the exact same second
const MAX_CONCURRENT_USERS = 3;
const GTM_STORAGE_KEYS = ['gtmPersonaId', 'gtmPersonaName', 'gtmPlanCount', 'gtmEmailDomain', 'gtmUserId'];

const personas = [
  {
    id: 'tony',
  },
  {
    id: 'alex',
    name: 'Alex Chen',
    email: 'alex.chen@example.com',
    address: '88 Market Street, Seattle, WA',
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    plan: [{ product: 'mug', quantity: 2 }],
    thinkTimeMs: 1500
  },
  {
    id: 'mina',
    name: 'Mina Patel',
    email: 'mina.patel@example.com',
    address: '12 Rose Avenue, Austin, TX',
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
    plan: [{ product: 'backpack', quantity: 1 }],
    thinkTimeMs: 2500
  },
  {
    id: 'jordan',
    name: 'Jordan Kim',
    email: 'jordan.kim@example.com',
    address: '302 Pine Road, Denver, CO',
    viewport: { width: 1024, height: 768 },
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    plan: [{ product: 'mug', quantity: 1 }, { product: 'backpack', quantity: 1 }],
    thinkTimeMs: 3200
  },
  {
    id: 'sofia',
    name: 'Sofia Martinez',
    email: 'sofia.martinez@example.com',
    address: '7 Harbor Blvd, Miami, FL',
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    plan: [{ product: 'backpack', quantity: 2 }, { product: 'tshirt', quantity: 1 }],
    thinkTimeMs: 2200,
    wander: true,
    wanderPages: ['/', '/shop.html', '/', '/product.html', '/cart.html']
  },
  {
    id: 'chris',
    name: 'Chris Nguyen',
    email: 'chris.nguyen@example.com',
    address: '45 Willow Lane, Chicago, IL',
    viewport: { width: 768, height: 1024 },
    userAgent: 'Mozilla/5.0 (Android 14; Mobile; rv:120.0) Gecko/120.0 Firefox/120.0',
    plan: [{ product: 'mug', quantity: 3 }],
    thinkTimeMs: 4000,
    abandonAt: 'cart'
  },
  {
    id: 'taylor',
    name: 'Taylor Brooks',
    email: 'taylor.brooks@example.com',
    address: '1600 Broadway, New York, NY',
    viewport: { width: 1536, height: 960 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    plan: [{ product: 'backpack', quantity: 1 }, { product: 'mug', quantity: 1 }],
    thinkTimeMs: 1800,
    tourPages: ['/about.html', '/contact.html', '/shop.html', '/product.html', '/cart.html', '/checkout.html']
  },
  {
    id: 'elena',
    name: 'Elena Rostova',
    email: 'elena.rostova@example.com',
    address: '55 Ocean Drive, Boston, MA',
    viewport: { width: 820, height: 1180 }, // iPad Air (Vertical Tablet)
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/17.4 Mobile/15E148 EdgiOS/122.0.2365.80', // Edge on iOS Tablet
    plan: [{ product: 'mug', quantity: 5 }], // Corporate bulk buyer
    thinkTimeMs: 5000, // Very slow, careful reviewer
    wander: true,
    wanderPages: ['/', '/about.html', '/shop.html', '/product.html']
  },
  {
    id: 'marcus',
    name: 'Marcus Vance',
    email: 'marcus.vance@example.com',
    address: '901 Grand Ave, Phoenix, AZ',
    viewport: { width: 1366, height: 768 }, // Desktop / Surface Pro (Horizontal Tablet)
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.2365.92', // Edge on Windows Desktop/Tablet
    plan: [{ product: 'backpack', quantity: 2 }, { product: 'mug', quantity: 2 }],
    thinkTimeMs: 1200, // Fast, decisive clicker
    tourPages: ['/', '/shop.html', '/product.html', '/cart.html', '/checkout.html']
  },
  {
    id: 'yuki',
    name: 'Yuki Tanaka',
    email: 'yuki.tanaka@example.com',
    address: '22 Sakura Way, San Francisco, CA',
    viewport: { width: 1280, height: 800 }, // Samsung Galaxy Tab (Horizontal Tablet)
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-X810) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 EdgA/122.0.2365.86', // Edge on Android Tablet
    plan: [{ product: 'tshirt', quantity: 1 }],
    thinkTimeMs: 2800,
    abandonAt: 'checkout' // Window shopper who flakes at the final step
  }

];

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function buildUserContext(persona) {
  const planCount = (persona.plan || []).reduce((total, item) => total + Number(item.quantity || 0), 0);
  return {
    persona: persona.id,
    personaName: persona.name,
    userId: persona.email,
    planCount: String(planCount),
    emailDomain: persona.email.split('@')[1] || 'unknown'
  };
}

function buildPageUrl(path, persona) {
  const context = buildUserContext(persona);
  const params = new URLSearchParams({
    persona: context.persona,
    personaName: context.personaName,
    userId: context.userId,
    planCount: context.planCount,
    emailDomain: context.emailDomain
  });

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}?${params.toString()}`;
}

async function resetGtmStorage(page) {
  try {
    await page.evaluate((storageKeys) => {
      for (const key of storageKeys) {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
      }
    }, GTM_STORAGE_KEYS);
  } catch (error) {
    // Ignore storage access errors on blank or restricted contexts; the page still receives the persona URL params.
  }
}

async function navigateWithProfile(page, persona, path) {
  const targetUrl = buildPageUrl(path, persona);
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  await resetGtmStorage(page);
}

// Visual Anchor: Randomizes thinking time to mimic variable human processing speeds
async function think(persona, label) {
  const humanVariance = Math.floor(Math.random() * 1500) - 500; // Adds/subtracts up to 1 second
  const finalWait = Math.max(500, (persona.thinkTimeMs || 1500) + humanVariance);
  console.log(`[${persona.id}] ${label} (Waiting ${finalWait}ms)`);
  await new Promise(resolve => setTimeout(resolve, finalWait));
}

// Visual Anchor: Browser instance shared via argument injection
async function simulateUser(browser, personaTemplate, startDelayMs = 0) {
  // Deep clone and add a unique instance ID to prevent duplicate persona conflicts
  const instanceId = `${personaTemplate.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const persona = { ...personaTemplate, id: instanceId };

  if (startDelayMs > 0) {
    console.log(`[${persona.id}] Queued: Arriving after ${startDelayMs}ms`);
    await new Promise(resolve => setTimeout(resolve, startDelayMs));
  }

  const context = await browser.newContext({
    viewport: persona.viewport,
    userAgent: persona.userAgent,
    storageState: { cookies: [], origins: [] }
  });

  const page = await context.newPage();

  // Handle alerts globally for this page session to prevent unhandled dialog freezes
  page.on('dialog', async dialog => {
    console.log(`[${persona.id}] Dialog encountered: ${dialog.message()}`);
    await dialog.accept();
  });

  try {
    console.log(`\n[${persona.id}] Starting simulation for ${persona.name}`);
    await navigateWithProfile(page, persona, '/');

    if (persona.tourPages) {
      console.log(`[${persona.id}] Touring the site before buying`);
      for (const path of persona.tourPages) {
        await navigateWithProfile(page, persona, path);
        await think(persona, `Browsing ${path}`);
      }
    }

    if (persona.wander) {
      console.log(`[${persona.id}] Wandering between pages`);
      for (const path of persona.wanderPages) {
        await navigateWithProfile(page, persona, path);
        await think(persona, `Looking around ${path}`);
      }
    }

    for (const step of persona.plan) {
      const targetPath = step.product === 'backpack'
        ? '/product.html'
        : step.product === 'tshirt'
          ? '/product-tshirt.html'
          : '/product-mug.html';
      console.log(`[${persona.id}] Adding ${step.quantity} ${step.product}${step.quantity > 1 ? 's' : ''} to cart`);

      for (let index = 0; index < step.quantity; index += 1) {
        // Optimize: Only navigate if we aren't already on the correct product page
        if (!page.url().includes(targetPath)) {
          await navigateWithProfile(page, persona, targetPath);
        }
        await think(persona, `Considering ${step.product}`);
        await page.getByRole('button', { name: 'Add to cart' }).click({ timeout: 5000 });
      }
    }

    if (persona.abandonAt === 'cart') {
      console.log(`[${persona.id}] Getting distracted and leaving the flow at the cart`);
      await navigateWithProfile(page, persona, '/cart.html');
      await think(persona, 'Checking the cart and then leaving');
      return;
    }

    if (persona.abandonAt === 'checkout') {
      console.log(`[${persona.id}] Getting distracted and leaving the flow at checkout`);
      await navigateWithProfile(page, persona, '/checkout.html');
      await think(persona, 'Filling in some details but then leaving');
      return;
    }

    console.log(`[${persona.id}] Going to the cart`);
    await navigateWithProfile(page, persona, '/cart.html');
    await think(persona, 'Reviewing cart before checkout');
    await page.getByRole('button', { name: 'Proceed to checkout' }).click({ timeout: 5000 });

    console.log(`[${persona.id}] Filling out checkout details`);
    await think(persona, 'Filling in contact details');
    await page.getByLabel('Full name:').fill(persona.name);
    await page.getByLabel('Email:').fill(persona.email);
    await page.getByLabel('Shipping address:').fill(persona.address);

    console.log(`[${persona.id}] Completing purchase`);
    await think(persona, 'Submitting the order');
    await page.getByRole('button', { name: 'Complete purchase' }).click({ timeout: 5000 });

    // Explicitly wait for navigation to complete to ensure the transaction ID exists in the URL
    await page.waitForURL('**/checkout.html**', { timeout: 7000 }).catch(() => {});

    const confirmationUrl = page.url();
    const transactionId = new URL(confirmationUrl).searchParams.get('transactionId') || 'N/A';
    console.log(`[${persona.id}] Confirmation URL: ${confirmationUrl}`);
    console.log(`[${persona.id}] Transaction ID: ${transactionId}`);

    console.log(`[${persona.id}] Saving confirmation screenshot`);
    await page.screenshot({ path: path.join(screenshotsDir, `checkout_success_${persona.id}.png`), fullPage: true });
  } catch (error) {
    console.error(`[${persona.id}] Simulation failed:`, error.message);
    await page.screenshot({ path: path.join(screenshotsDir, `error_${persona.id}.png`), fullPage: true }).catch(() => {});
  } finally {
    await page.waitForTimeout(500);
    await context.close();
    console.log(`[${persona.id}] Session closed context cleanly.`);
  }
}


// Visual Anchor: Worker pool execution loop to enforce maximum active windows
async function runWithConcurrencyLimit(browser, tasks) {
  const pool = new Set();
  const promises = [];

  for (const task of tasks) {
    if (pool.size >= MAX_CONCURRENT_USERS) {
      await Promise.race(pool);
    }
    const promise = (async () => {
      await task();
    })();
    promises.push(promise);
    pool.add(promise);
    promise.finally(() => pool.delete(promise));
  }
  await Promise.all(promises);
}

(async () => {
  // Generates a random target between 4 and 20 visits
  const dailyVisitCount = 4 + Math.floor(Math.random() * 17);

  // FIX: Create an array populated by randomly picking from the 7 available personas
  const selectedPersonas = [];
  for (let i = 0; i < dailyVisitCount; i++) {
    const randomIndex = Math.floor(Math.random() * personas.length);
    // Deep clone the persona object if you plan to modify properties per session
    //selectedPersonas.push({ ...personas[randomIndex] });

    const chosenBase = personas[randomIndex];
    if (chosenBase.id === 'tony') {
      // Generate a brand new randomized Tony variant
      selectedPersonas.push(createTonyPersona());
    } else {
      selectedPersonas.push({ ...chosenBase });
    }
  }

  const arrivalOffsets = selectedPersonas.map(() => Math.floor(Math.random() * 8000));

  console.log(`Simulating a daily traffic load of ${selectedPersonas.length} visitors.`);
  console.log(`Maximum parallel browser tasks allowed: ${MAX_CONCURRENT_USERS}\n`);

  // Launch a unique browser container process to minimize CPU load
  const browser = await chromium.launch({
    headless: true,
    slowMo: 50
  });

  const sessionTasks = selectedPersonas.map((persona, index) => {
    return () => simulateUser(browser, persona, arrivalOffsets[index]);
  });

  await runWithConcurrencyLimit(browser, sessionTasks);

  await browser.close();
  console.log(`\nCompleted ${selectedPersonas.length} visitor simulations clean.`);
})();
