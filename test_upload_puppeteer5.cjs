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
  
  await page.waitForSelector('button');
  
  await page.evaluate(() => {
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
  
  const inputs = await page.$$('input[type="text"]');
  if(inputs.length >= 2) {
    await inputs[0].type('Puppeteer Song');
    await inputs[1].type('Test Org');
  }
  
  const fileInputs = await page.$$('input[type=file]');
  if(fileInputs.length > 0) {
      await fileInputs[0].uploadFile('dummy.pdf');
  }
  
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
  
  await wait(15000);
  await browser.close();
})();
