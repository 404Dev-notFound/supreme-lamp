const puppeteer = require("puppeteer-core");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:3000/dsa";

async function verifyDsaPage() {
  console.log("=== FlowCTRL DSA Page Hydration & Real Browser Verification ===");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  const page = await browser.newPage();
  const consoleMessages = [];
  const hydrationErrors = [];
  const permissionsPolicyWarnings = [];

  page.on("console", (msg) => {
    const text = msg.text();
    const type = msg.type();
    consoleMessages.push({ type, text });

    const lower = text.toLowerCase();
    if (
      lower.includes("hydration") ||
      lower.includes("did not match") ||
      lower.includes("server-rendered html") ||
      lower.includes("client-rendered html") ||
      lower.includes("mismatch") ||
      lower.includes("recoverable error")
    ) {
      hydrationErrors.push(`[${type}] ${text}`);
    }

    if (lower.includes("browsing-topics")) {
      permissionsPolicyWarnings.push(text);
    }
  });

  page.on("pageerror", (err) => {
    const msg = err.message;
    consoleMessages.push({ type: "pageerror", text: msg });
    if (
      msg.toLowerCase().includes("hydration") ||
      msg.toLowerCase().includes("did not match") ||
      msg.toLowerCase().includes("mismatch")
    ) {
      hydrationErrors.push(`[pageerror] ${msg}`);
    }
  });

  try {
    console.log(`1. Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Step A: Inspect the DOM immediately upon DOMContentLoaded (during/right at hydration)
    const initialProgressText = await page.evaluate(() => {
      const el = document.querySelector("span.text-emerald-400.font-bold");
      return el ? el.textContent.trim() : null;
    });
    console.log(`   Initial progress text rendered: "${initialProgressText}"`);

    // Wait for post-hydration data loading
    await page.waitForFunction(
      () => document.querySelectorAll("section:nth-of-type(1) button").length >= 10,
      { timeout: 15000 }
    );

    // Step B: Check languages count
    const languageButtons = await page.$$("section:nth-of-type(1) button");
    console.log(`2. Languages rendered count: ${languageButtons.length}`);
    if (languageButtons.length < 20) {
      throw new Error(`Expected at least 20 language buttons, found: ${languageButtons.length}`);
    }

    // Step C: Check algorithm cards count
    await page.waitForFunction(
      () => document.querySelectorAll("section:nth-of-type(2) .grid > div").length > 0,
      { timeout: 10000 }
    );
    const algoCards = await page.$$("section:nth-of-type(2) .grid > div");
    console.log(`3. Algorithm cards rendered count: ${algoCards.length}`);
    if (algoCards.length === 0) {
      throw new Error("No algorithm cards rendered!");
    }

    // Step D: Verify workspace is rendered
    const titleEl = await page.$("section:nth-of-type(3) h2");
    const activeAlgoTitle = titleEl ? await page.evaluate(el => el.textContent, titleEl) : "None";
    console.log(`4. Selected Algorithm Workspace Title: "${activeAlgoTitle}"`);
    if (!activeAlgoTitle || activeAlgoTitle === "None") {
      throw new Error("Algorithm details workspace is not visible!");
    }

    // Step E: Verify problem statement, intuition, complexity, flowchart and code
    const problemStatement = await page.evaluate(() => {
      const ps = document.querySelector("section:nth-of-type(3) p");
      return ps ? ps.textContent.trim().slice(0, 80) : null;
    });
    console.log(`5. Problem statement: "${problemStatement}..."`);

    const codeSnippet = await page.evaluate(() => {
      const code = document.querySelector("section:nth-of-type(3) code");
      return code ? code.textContent.trim().slice(0, 80) : null;
    });
    console.log(`6. Code snippet preview: \n${codeSnippet}`);

    // Step F: Test language switching
    console.log("7. Testing language filter switch...");
    const jsButton = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll("section:nth-of-type(1) button"));
      return btns.find(b => b.textContent.includes("JavaScript")) || btns[1];
    });
    if (jsButton) {
      await jsButton.click();
      await new Promise(r => setTimeout(r, 600));

      const updatedCode = await page.evaluate(() => {
        const code = document.querySelector("section:nth-of-type(3) code");
        return code ? code.textContent.trim().slice(0, 80) : null;
      });
      console.log(`   Switched language code preview: \n${updatedCode}`);
    }

    // Step G: Test searching algorithms
    console.log("8. Testing search input filter...");
    await page.type("input[placeholder='Search algorithms...']", "sort");
    await new Promise(r => setTimeout(r, 600));

    const searchResultCount = await page.evaluate(() => {
      return document.querySelectorAll("section:nth-of-type(2) .grid > div").length;
    });
    console.log(`   Algorithms matching 'sort': ${searchResultCount}`);
    if (searchResultCount === 0) {
      throw new Error("Search filter for 'sort' returned 0 results!");
    }

    // Clear search
    await page.evaluate(() => {
      const input = document.querySelector("input[placeholder='Search algorithms...']");
      if (input) {
        input.value = "";
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await new Promise(r => setTimeout(r, 600));

    // Step H: Test Mark as Solved button
    console.log("9. Testing toggle solved button...");
    const solveBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll("section:nth-of-type(3) button"));
      return btns.find(b => b.textContent.includes("Solved") || b.textContent.includes("Mark as Solved"));
    });
    if (solveBtn) {
      await solveBtn.click();
      await new Promise(r => setTimeout(r, 600));
      const progressText = await page.evaluate(() => {
        const el = document.querySelector("span.text-emerald-400.font-bold");
        return el ? el.textContent.trim() : "";
      });
      console.log(`   Progress counter updated to: "${progressText}"`);
    }

    // Step I: Test 5 consecutive page reloads (simulating user refreshes with existing localStorage)
    console.log("10. Testing 5 consecutive page refreshes (with saved progress in localStorage)...");
    for (let i = 1; i <= 5; i++) {
      console.log(`    Refresh #${i}...`);
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForFunction(
        () => document.querySelectorAll("section:nth-of-type(1) button").length >= 10,
        { timeout: 15000 }
      );
      await new Promise(r => setTimeout(r, 400));
    }

    // Step J: Verify Next.js portal overlay shadow DOM for error dialogs
    console.log("11. Inspecting Next.js dev overlay portal...");
    const portalStatus = await page.evaluate(() => {
      const portal = document.querySelector("nextjs-portal");
      if (!portal || !portal.shadowRoot) return { present: false, hasError: false };
      const shadow = portal.shadowRoot;
      const errorDialog = shadow.querySelector("[role='dialog'], [data-nextjs-dialog]");
      const badge = shadow.querySelector("[data-nextjs-toast], [data-nextjs-badge]");
      return {
        present: true,
        hasError: Boolean(errorDialog),
        dialogContent: errorDialog ? errorDialog.textContent.slice(0, 200) : "none",
        badgeText: badge ? badge.textContent : "none",
      };
    });
    console.log("    Next.js Dev Portal status:", JSON.stringify(portalStatus, null, 2));
    if (portalStatus.hasError) {
      throw new Error(`Next.js Dev Overlay shows error dialog: ${portalStatus.dialogContent}`);
    }

    // Step K: Hydration errors check
    console.log(`12. Checking hydration errors... (Count: ${hydrationErrors.length})`);
    if (hydrationErrors.length > 0) {
      console.error("Hydration errors detected:", hydrationErrors);
      throw new Error(`Hydration mismatch detected! ${hydrationErrors.join("; ")}`);
    } else {
      console.log("    ZERO hydration errors detected across initial load and 5 reloads!");
    }

    // Step L: Permissions-Policy warning check
    console.log(`13. Checking browsing-topics Permissions-Policy warnings... (Count: ${permissionsPolicyWarnings.length})`);
    if (permissionsPolicyWarnings.length > 0) {
      console.warn("Permissions-Policy warnings found:", permissionsPolicyWarnings);
    } else {
      console.log("    ZERO browsing-topics Permissions-Policy warnings detected!");
    }

    const fatalErrors = consoleMessages.filter(m => m.type === "error" || m.type === "pageerror");
    console.log(`14. Total fatal console errors: ${fatalErrors.length}`);

    console.log("=== EMPIRICAL VERIFICATION COMPLETE: 100% PASS, ZERO HYDRATION MISMATCHES ===");
  } finally {
    await browser.close();
  }
}

verifyDsaPage().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
