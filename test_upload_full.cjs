const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  // Create a dummy PDF
  fs.writeFileSync('dummy.pdf', '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n189\n%%EOF');

  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 10000 }).catch(e => console.log("Goto error:", e.message));
  
  // Login first
  await page.evaluate(() => {
    // Simulate being logged in by directly setting the store
    const store = window.useStore && window.useStore.getState();
    if (store) {
      store.currentUser = { id: 'test-user-id', email: 'khiemvinhtran1112@gmail.com', role: 'admin', favourites: [] };
    }
  });

  await page.goto('http://localhost:3000/publisher', { waitUntil: 'networkidle0', timeout: 10000 });
  
  // Fill the form
  const inputUpload = await page.$('input[type="file"]');
  if (inputUpload) {
    await inputUpload.uploadFile('dummy.pdf');
  } else {
    console.log("Upload input not found");
  }

  const titleInput = await page.$('input[type="text"]');
  if (titleInput) {
    await titleInput.type('Test Song');
  }

  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) {
    await submitBtn.click();
    console.log("Clicked submit");
  }

  await page.waitForTimeout(3000);
  console.log("Upload test finished");
  await browser.close();
})();
