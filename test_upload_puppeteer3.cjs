const puppeteer = require('puppeteer');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log('[BROWSER CONSOLE]', msg.type(), msg.text());
  });
  
  page.on('pageerror', err => {
    console.log('[BROWSER ERROR]', err.message);
  });

  await page.goto('http://localhost:3000');
  
  // Wait for login or state
  await page.waitForSelector('button');
  
  // Assuming the user needs to login first, we can do it via code or localStorage
  await page.evaluate(() => {
    // try to force login as admin
    const state = JSON.parse(localStorage.getItem('hymn-store') || '{}');
    state.state = state.state || {};
    state.state.currentUser = {
      id: "80386154-0346-41f0-9e05-89a0a1339a6d",
      email: "khiemvinhtran1112@gmail.com",
      name: "Admin",
      role: "admin",
      favourites: []
    };
    localStorage.setItem('hymn-store', JSON.stringify(state));
  });
  
  await page.reload();
  await wait(1000);
  
  await page.goto('http://localhost:3000/publisher');
  await wait(1000);
  
  // Fill the form using element handles
  const inputs = await page.$$('input[type="text"]');
  if(inputs.length >= 2) {
    await inputs[0].type('Puppeteer Song');
    await inputs[1].type('Test Org');
  }
  
  // File upload
  const fileInput = await page.$('input[type=file]');
  await fileInput.uploadFile('dummy.pdf');
  
  // Submit
  const button = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent.toLowerCase().includes('đăng bài') || b.textContent.toLowerCase().includes('submit'));
  });
  
  if (button) {
    await button.click();
    console.log('Clicked submit');
  } else {
    console.log('Submit button not found');
  }
  
  await wait(15000); // Wait 15s to see what logs
  
  await browser.close();
})();
