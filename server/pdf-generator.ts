import type { Browser } from "puppeteer";

let browserInstance: Browser | null = null;
let puppeteerAvailable: boolean | null = null;

async function checkPuppeteerAvailable(): Promise<boolean> {
  if (puppeteerAvailable !== null) return puppeteerAvailable;
  
  try {
    const fs = await import("fs");
    const chromiumPath = process.env.PUPPETEER_EXECUTABLE_PATH || "/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium";
    puppeteerAvailable = fs.existsSync(chromiumPath);
    if (!puppeteerAvailable) {
      console.log("PDF generation unavailable: Chromium not found at", chromiumPath);
    }
    return puppeteerAvailable;
  } catch {
    puppeteerAvailable = false;
    return false;
  }
}

async function getBrowser(): Promise<Browser> {
  if (!(await checkPuppeteerAvailable())) {
    throw new Error("PDF generation is not available in this environment");
  }
  
  if (!browserInstance || !browserInstance.connected) {
    const puppeteer = await import("puppeteer");
    browserInstance = await puppeteer.default.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-web-security",
        "--font-render-hinting=none"
      ]
    });
  }
  return browserInstance;
}

export async function generatePdfFromUrl(url: string, timeout: number = 30000): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });
    await page.emulateMediaType("print");
    
    await page.goto(url, { 
      waitUntil: "networkidle0",
      timeout 
    });

    await page.waitForFunction(
      () => (window as any).__REPORT_READY__ === true,
      { timeout: timeout - 5000 }
    ).catch(() => {
      console.warn("Report ready signal not received, proceeding anyway");
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      preferCSSPageSize: true
    });

    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

export async function generatePdfFromHtml(html: string, timeout: number = 30000): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });
    await page.emulateMediaType("print");
    
    await page.setContent(html, { 
      waitUntil: "networkidle0",
      timeout 
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
      preferCSSPageSize: true
    });

    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

export async function isPdfAvailable(): Promise<boolean> {
  return checkPuppeteerAvailable();
}

process.on("SIGTERM", closeBrowser);
process.on("SIGINT", closeBrowser);
