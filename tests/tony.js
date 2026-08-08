const TONY_NAMES = [
  { name: 'Tony Stark', email: 'tony.stark@starkindustries.com', address: '10880 Malibu Colony Rd, Malibu, CA' },
  { name: 'Tony Soprano', email: 'tony.s@sadaffiliates.com', address: '14 Aspen Drive, North Caldwell, NJ' },
  { name: 'Tony Hawk', email: 'tony.hawk@skatebird.com', address: '42 Birdhouse Way, San Diego, CA' },
  { name: 'Tony Montana', email: 'tony.m@lopezshipping.com', address: '485 Ocean Drive, Miami, FL' }
];

const TONY_DEVICES = [
  {
    viewport: { width: 1280, height: 800 }, // Samsung Galaxy Tab / Android
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-X810) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 EdgA/122.0.2365.86'
  },
  {
    viewport: { width: 1024, height: 1366 }, // iPad Pro Portrait
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/17.4 Mobile/15E148 EdgiOS/122.0.2365.80'
  },
  {
    viewport: { width: 1366, height: 768 }, // Surface Pro / Edge Windows
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.2365.92'
  }
];

function createTonyPersona() {
  // 1. Pick random Identity and Device sets
  const identity = TONY_NAMES[Math.floor(Math.random() * TONY_NAMES.length)];
  const device = TONY_DEVICES[Math.floor(Math.random() * TONY_DEVICES.length)];

  // 2. Select at least 1 product randomly based on your specific weighted rule
  const availableProducts = [];
  // Weighted entry pool to match your ratio ("mug":30 -> 3 entries, "tshirt":20 -> 2 entries)
  for (let i = 0; i < 3; i++) availableProducts.push('mug');
  for (let i = 0; i < 2; i++) availableProducts.push('tshirt');

  // Determine how many unique product types Tony decides to look at (1 or 2)
  const productTypesCount = Math.random() > 0.5 ? 2 : 1;
  const plan = [];

  if (productTypesCount === 1) {
    const chosenProduct = availableProducts[Math.floor(Math.random() * availableProducts.length)];
    const qty = Math.floor(Math.random() * 3) + 1; // Buy 1 to 3 items
    plan.push({ product: chosenProduct, quantity: qty });
  } else {
    // Tony buys both products
    plan.push({ product: 'mug', quantity: Math.floor(Math.random() * 3) + 1 });
    plan.push({ product: 'tshirt', quantity: Math.floor(Math.random() * 2) + 1 });
  }

  // 3. Handle abandonment probability rule ('80%' chance to flake out early)
  const isAbandoning = Math.random() < 0.80;
  const abandonAt = isAbandoning ? (Math.random() > 0.5 ? 'cart' : 'checkout') : null;

  return {
    id: 'tony',
    name: identity.name,
    email: identity.email,
    address: identity.address,
    viewport: device.viewport,
    userAgent: device.userAgent,
    plan: plan,
    thinkTimeMs: 800,
    abandonAt: abandonAt
  };
}

exports.createTonyPersona = createTonyPersona;
