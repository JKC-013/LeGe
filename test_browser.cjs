const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 10000 }).catch(e => console.log("Goto error:", e.message));
  
  const content = await page.content();
  console.log("HTML:", content.substring(0, 500));
  
  // check if there is an error boundary message
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("Body:", bodyText.substring(0, 1000));
  
  await browser.close();
})();
