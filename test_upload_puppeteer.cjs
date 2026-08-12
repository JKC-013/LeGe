const puppeteer = require('puppeteer');

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
  await page.waitForTimeout(1000);
  
  await page.goto('http://localhost:3000/publisher');
  await page.waitForTimeout(1000);
  
  // Fill the form
  await page.type('input[placeholder="Tên bài hát"]', 'Puppeteer Song');
  await page.type('input[placeholder="Tổ chức / Nhóm"]', 'Test Org');
  
  // File upload
  const fileInput = await page.$('input[type=file]');
  await fileInput.uploadFile('dummy.pdf');
  
  // Submit
  const button = await page.evaluateHandle(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.find(b => b.textContent.includes('Đăng bài'));
  });
  
  if (button) {
    await button.click();
    console.log('Clicked submit');
  } else {
    console.log('Submit button not found');
  }
  
  await page.waitForTimeout(15000); // Wait 15s to see what logs
  
  await browser.close();
})();
