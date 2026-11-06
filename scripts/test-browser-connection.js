const puppeteer = require("puppeteer-core");

async function main() {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const version = await browser.version();
  console.log("Connected to Real Chrome:", version);

  const page = await browser.newPage();
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded", timeout: 10000 });
  const title = await page.title();
  console.log("Page title:", title);

  await browser.close();
  console.log("SUCCESS!");
}

main().catch((err) => {
  console.error("Browser launch error:", err);
  process.exit(1);
});
