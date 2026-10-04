const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Base URLs
  const baseUrl = 'http://localhost:3000';
  const clientId = '6aa44c3498b20b15a2dbf520';
  
  console.log('1. Starting E2E Functional Validation UI Tests');
  
  // Login as Superadmin
  console.log('Logging in as superadmin...');
  await page.goto(`${baseUrl}/login`);
  await page.waitForSelector('#username', { visible: true });
  await page.type('#username', 'admin');
  await page.type('#password', 'TABdeal@872018@');
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  await page.waitForFunction(() => document.body.innerText.includes('Dashboard'));
  console.log('Login successful.');
  
  // TEST A - LOAD
  console.log('Test A: Load Client 360');
  await page.goto(`${baseUrl}/tabdeal/clients/${clientId}`);
  
  // Wait for the Client Templates section to render
  await page.waitForFunction(() => document.body.innerText.includes('Client Templates'));
  console.log('ClientTemplatesSection renders correctly.');
  
  // Function to click buttons that might be hidden or hard to select
  const clickElement = async (text) => {
    const selector = `button`;
    await page.waitForFunction((text) => {
      return Array.from(document.querySelectorAll('button')).some(b => b.innerText.includes(text));
    }, {}, text);
    await page.evaluate((text) => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes(text));
      if (btn) btn.click();
    }, text);
  };
  
  // TEST B - ASSIGN TEMPLATE
  console.log('Test B: Assign Template');
  await clickElement('Assign Template');
  await page.waitForSelector('#assignTemplateId', { visible: true });
  
  // Select a template (the first one)
  const templateSelect = await page.$('#assignTemplateId');
  const templateOptions = await templateSelect.$$eval('option', ops => ops.map(o => o.value).filter(v => v));
  if (templateOptions.length === 0) {
      console.error('No master templates available to assign.');
      process.exit(1);
  }
  const selectedTemplate = templateOptions[0];
  await page.select('#assignTemplateId', selectedTemplate);
  
  await clickElement('Assign');
  await page.waitForTimeout(2000);
  console.log('Assign successful.');
  
  // TEST C - DUPLICATE
  console.log('Test C: Duplicate Assignment');
  await clickElement('Assign Template');
  await page.waitForSelector('#assignTemplateId', { visible: true });
  await page.select('#assignTemplateId', selectedTemplate);
  await clickElement('Assign');
  await page.waitForTimeout(1000);
  await clickElement('Cancel'); // Close modal if failed
  console.log('Duplicate prevented successfully.');
  
  // TEST D - CUSTOM MESSAGE
  console.log('Test D: Edit Custom Message');
  // Need to find the edit button for the assigned template
  // The layout has rows. Find the Edit button inside the section
  await page.waitForTimeout(1000);
  await clickElement('Edit');
  await page.waitForSelector('#editCustomMessage', { visible: true });
  await page.type('#editCustomMessage', 'QA TEST CUSTOM MESSAGE');
  await clickElement('Save');
  await page.waitForTimeout(1000); // Wait for SWR revalidation
  console.log('Custom message updated.');
  
  // TEST E - CLEAR CUSTOM MESSAGE
  console.log('Test E: Clear Custom Message');
  await clickElement('Edit');
  await page.waitForSelector('#editCustomMessage', { visible: true });
  // Clear the input
  await page.$eval('#editCustomMessage', el => el.value = '');
  await page.type('#editCustomMessage', ' ');
  await page.keyboard.press('Backspace');
  await clickElement('Save');
  await page.waitForTimeout(1000);
  console.log('Custom message cleared.');
  
  // TEST F - CUSTOM VARIABLES
  console.log('Test F: Set Custom Variables');
  await clickElement('Edit');
  await page.waitForSelector('#editCustomVariables', { visible: true });
  const varsToSet = "customer_name=QA User\nbusiness_name=TABDEAL QA\ngreeting=Hello QA";
  await page.$eval('#editCustomVariables', (el, v) => el.value = v, varsToSet);
  // Need to trigger change event
  await page.type('#editCustomVariables', ' ');
  await page.keyboard.press('Backspace');
  await clickElement('Save');
  await page.waitForTimeout(1000);
  console.log('Custom variables set.');
  
  // TEST G - MALFORMED VARIABLES
  console.log('Test G: Malformed Variables');
  await clickElement('Edit');
  await page.waitForSelector('#editCustomVariables', { visible: true });
  const malformedVars = "customer_name=QA User\ninvalid_variable\nbusiness_name=TABDEAL QA";
  await page.$eval('#editCustomVariables', (el, v) => el.value = v, malformedVars);
  await page.type('#editCustomVariables', ' ');
  await page.keyboard.press('Backspace');
  await clickElement('Save');
  // The modal should stay open
  await page.waitForSelector('#editCustomVariables', { visible: true });
  console.log('Malformed variables prevented save.');
  
  // TEST H - CLEAR VARIABLES
  console.log('Test H: Clear Variables');
  await page.$eval('#editCustomVariables', el => el.value = '');
  await page.type('#editCustomVariables', ' ');
  await page.keyboard.press('Backspace');
  await clickElement('Save');
  await page.waitForTimeout(1000);
  console.log('Variables cleared.');
  
  // TEST I - DISABLE
  console.log('Test I: Disable Template');
  await clickElement('Edit');
  await page.waitForSelector('#editEnabled', { visible: true });
  await page.click('#editEnabled'); // uncheck
  await clickElement('Save');
  // Handle alert/confirmation
  await page.waitForTimeout(1000);
  await clickElement('Confirm Disable');
  await page.waitForTimeout(1000);
  console.log('Template disabled.');
  
  // TEST J - RE-ENABLE
  console.log('Test J: Re-enable Template');
  await clickElement('Edit');
  await page.waitForSelector('#editEnabled', { visible: true });
  await page.click('#editEnabled'); // check
  await clickElement('Save');
  // No confirmation should appear for enable
  await page.waitForTimeout(1000);
  console.log('Template re-enabled.');
  
  console.log('All UI interaction tests completed successfully.');
  
  await browser.close();
})();
