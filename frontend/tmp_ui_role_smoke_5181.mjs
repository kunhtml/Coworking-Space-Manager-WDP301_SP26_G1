import { chromium } from "playwright";

const BASE_URL = "http://127.0.0.1:5181";

const ROLE_MATRIX = [
  {
    role: "Admin",
    identifier: "admin@coworking.com",
    password: "123456",
    routes: [
      "/",
      "/admin-dashboard/users",
      "/admin-dashboard/spaces",
      "/admin-dashboard/services",
      "/admin-dashboard/revenue",
      "/admin-dashboard/occupancy",
      "/admin-dashboard/profile",
      "/admin-dashboard/password",
    ],
  },
  {
    role: "Staff",
    identifier: "staff1@coworking.com",
    password: "123456",
    routes: [
      "/",
      "/staff-dashboard",
      "/staff-dashboard/checkin",
      "/staff-dashboard/tables",
      "/staff-dashboard/orders",
      "/staff-dashboard/counter-pos",
      "/staff-dashboard/create-service",
      "/staff-dashboard/services",
      "/staff-dashboard/profile",
      "/staff-dashboard/password",
    ],
  },
  {
    role: "Customer",
    identifier: "customer@gmail.com",
    password: "123456",
    routes: [
      "/",
      "/order-table",
      "/menu",
      "/customer-dashboard/orders",
      "/customer-dashboard/profile",
      "/customer-dashboard/password",
      "/forgot-password",
    ],
  },
];

function summarizeFatalText(html) {
  if (!html) return null;
  if (html.includes("Unexpected Application Error")) return "Unexpected Application Error";
  if (html.includes("Cannot GET")) return "Cannot GET";
  if (html.includes("ReferenceError")) return "ReferenceError";
  return null;
}

async function loginAs(page, identifier, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[placeholder="admin"]').fill(identifier);
  await page.locator('input[placeholder="admin123"]').fill(password);

  await Promise.all([
    page.locator('form button[type="submit"]').click(),
    page.waitForTimeout(1800),
  ]);

  const current = page.url();
  return {
    success: current === `${BASE_URL}/` || current === `${BASE_URL}`,
    currentUrl: current,
  };
}

async function checkRoute(context, path) {
  const page = await context.newPage();
  const pageErrors = [];
  const apiErrors = [];

  page.on("pageerror", (err) => {
    pageErrors.push(String(err.message || err));
  });

  page.on("response", (res) => {
    const url = res.url();
    if (url.includes("/api/") && res.status() >= 400) {
      apiErrors.push(`${res.status()} ${url}`);
    }
  });

  let docStatus = null;
  let finalUrl = "";
  let fatalText = null;

  try {
    const response = await page.goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded" });
    docStatus = response ? response.status() : null;
    await page.waitForTimeout(1200);
    finalUrl = page.url();
    fatalText = summarizeFatalText(await page.content());
  } catch (err) {
    pageErrors.push(`Navigation failed: ${String(err.message || err)}`);
  }

  await page.close();

  const blockedByLogin = finalUrl.includes("/login");
  const pass =
    !blockedByLogin &&
    (docStatus === null || docStatus < 500) &&
    !fatalText &&
    pageErrors.length === 0 &&
    apiErrors.length === 0;

  return {
    roleRoute: path,
    pass,
    docStatus,
    finalUrl,
    blockedByLogin,
    fatalText,
    pageErrors,
    apiErrors,
  };
}

async function runRole(browser, cfg) {
  const context = await browser.newContext();
  const loginPage = await context.newPage();

  const login = await loginAs(loginPage, cfg.identifier, cfg.password);
  await loginPage.close();

  const routeResults = [];
  for (const path of cfg.routes) {
    routeResults.push(await checkRoute(context, path));
  }

  await context.close();

  return {
    role: cfg.role,
    login,
    routes: routeResults,
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const roleCfg of ROLE_MATRIX) {
    results.push(await runRole(browser, roleCfg));
  }

  await browser.close();

  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    roles: results,
  }, null, 2));
})();
