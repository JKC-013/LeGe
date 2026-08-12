import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    Promise.all(msg.args().map(arg => arg.jsonValue())).then(args => {
      console.log('PAGE LOG:', ...args);
    });
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));
  
  const content = await page.content();
  const debugMatch = content.match(/<div class="space-y-20">.*?<\/section>/s);
  if (debugMatch) {
    console.log("DEBUG HTML:", debugMatch[0]);
  }
  
  await browser.close();
})();
