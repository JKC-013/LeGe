const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 10000 }).catch(e => console.log("Goto error:", e.message));
  
  // Click login
  await page.waitForSelector('button:has-text("登入 / 註冊"), button:has-text("Đăng nhập / Đăng ký"), button:has-text("Login / Sign up")');
  const loginBtns = await page.$$('button');
  for (let btn of loginBtns) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('登入') || text.includes('Đăng nhập') || text.includes('Login')) {
      await btn.click();
      break;
    }
  }

  await page.waitForTimeout(1000);
  console.log("Modal opened");
  await browser.close();
})();
