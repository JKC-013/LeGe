const puppeteer = require('puppeteer');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  
  await page.goto('http://localhost:3000');
  await page.waitForSelector('button');
  
  // Find login button (header)
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const loginBtn = buttons.find(b => b.textContent.includes('Đăng nhập') || b.textContent.toLowerCase().includes('sign in') || b.textContent.toLowerCase().includes('login'));
    if (loginBtn) loginBtn.click();
  });
  
  await wait(1000);
  
  // Type email and password
  const inputs = await page.$$('input');
  if (inputs.length >= 2) {
    await inputs[0].type('khiemvinhtran1112@gmail.com');
    await inputs[1].type('wrongpassword');
  }
  
  // Submit form directly
  await page.evaluate(() => {
    const forms = document.querySelectorAll('form');
    if (forms.length > 0) {
        forms[0].dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        const submitBtn = forms[0].querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.click();
    }
  });
  
  // Wait a bit for response
  await wait(10000);
  
  await browser.close();
})();
