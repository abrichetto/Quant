const { createWorker } = require('tesseract.js');
const screenshot = require('screenshot-desktop');
const path = require('path');
const fs = require('fs');
const os = require('os');
const logger = require('../utils/logger');

const tempDir = path.join(os.tmpdir(), 'algotrade');

async function testOCR() {
    const TEST_TIMEOUT = 30000;
    let worker;

    try {
        const testPromise = new Promise(async (resolve, reject) => {
            logger.info('Performing OCR test...');
            const screenshotPath = await screenshot({ filename: path.join(tempDir, 'test_screenshot.png') });

            worker = await createWorker();
            await worker.load();
            await worker.loadLanguage('eng');
            await worker.initialize('eng');

            const { data } = await worker.recognize(screenshotPath);

            if (data.confidence < 50) {
                reject(new Error(`Low OCR confidence: ${data.confidence}%`));
                return;
            }

            logger.info(`OCR test completed with confidence: ${data.confidence}%`);
            resolve(true);
        });

        return await Promise.race([
            testPromise,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('OCR test timeout')), TEST_TIMEOUT)
            )
        ]);
    } catch (error) {
        logger.error('OCR test failed:', error);
        return false;
    } finally {
        if (worker) {
            await worker.terminate();
        }
    }
}

module.exports = {
    testOCR
};
