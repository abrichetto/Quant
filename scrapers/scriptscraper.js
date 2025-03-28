const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false }); // Set headless to false for debugging
    const page = await browser.newPage();

    try {
        // Navigate to the script page
        const scriptUrl = 'https://www.tradingview.com/script/bkvQ5hNF-CM-Ultimate-MA-MTF-V4/'; // Replace with the actual script URL
        await page.goto(scriptUrl, { waitUntil: 'networkidle2' });

        console.log('Navigated to the script page.');

        // Wait for the chart interface to load
        console.log('Waiting for the chart interface to load...');
        await page.waitForSelector('.roundTabButton-JbssaNvk.small-JbssaNvk', { timeout: 30000 });

        console.log('Chart interface loaded. Looking for the "Source code" tab...');

        // Click the "Source code" tab
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('.roundTabButton-JbssaNvk.small-JbssaNvk'));
            const sourceCodeButton = buttons.find(button => button.textContent.trim() === 'Source code');
            if (sourceCodeButton) {
                sourceCodeButton.click();
            } else {
                throw new Error('"Source code" tab not found.');
            }
        });

        console.log('Clicked the "Source code" tab. Waiting for the Pine Script code to appear...');

        // Wait for the Pine Script code to appear
        await page.waitForFunction(() => {
            const codeElement = document.querySelector('.tv-script__code');
            return codeElement && codeElement.innerText.trim().length > 0;
        }, { timeout: 10000 });

        console.log('Pine Script code found. Extracting the code...');

        // Extract the Pine Script code
        const pineScript = await page.evaluate(() => {
            const codeElement = document.querySelector('.tv-script__code');
            return codeElement ? codeElement.innerText : null;
        });

        if (pineScript) {
            console.log(`Extracted Pine Script:\n${pineScript}`);
            // Optionally save the Pine Script to a file
            const fs = require('fs');
            fs.writeFileSync('pine-script.txt', pineScript);
            console.log('Pine Script saved to pine-script.txt');
        } else {
            console.error('Pine Script not found on this page.');
        }
    } catch (error) {
        console.error('Error during scraping:', error);
    } finally {
        await browser.close();
    }
})();