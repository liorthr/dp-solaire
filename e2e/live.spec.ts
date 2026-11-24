// Tests de bout en bout sur le site EN LIGNE (vraies API publiques, comptes Supabase réels, paiement Stripe en mode test).
// Ignorés par défaut. Lancement :
//   LIVE_PASSWORD=… E2E_BASE_URL=https://permizy.com npx playwright test --trace off e2e/live.spec.ts --project=desktop
// Comptes créés : live-<horodatage>-<parcours>@permizy.com (à supprimer après le test, voir seo/SEO_HISTORY.md).
import { expect, test, type Page } from "@playwright/test";
import JSZip from "jszip";
import { readFileSync } from "node:fs";
import path from "node:path";

const BASE = process.env.E2E_BASE_URL ?? "";
const PWD = process.env.LIVE_PASSWORD ?? "";
const RUN = process.env.LIVE_RUN ?? String(Date.now());
const photo = (k: string) => path.join(import.meta.dirname, "..", "public", "demo", `sans-contrainte-${k}.jpg`);
const ADDRESS = "Allée des Tilleuls 80480 Pont-de-Metz";

test.skip(!BASE.startsWith("https://") || !PWD, "tests en ligne : définir E2E_BASE_URL et LIVE_PASSWORD");
test.describe.configure({ mode: "serial" });

function watchErrors(page: Page) {
  const errors: string[] = [];
  // seules les erreurs des pages Permizy comptent (pas celles de la page de paiement hébergée par Stripe)
  page.on("pageerror", (e) => {
    if (!/stripe\.com/.test(page.url()) && !/stripe\.com/.test(e.message)) errors.push(e.message);
  });
  return errors;
}

async function signup(page: Page, who: string, pro: boolean, company = "") {
  if (!page.url().includes("/connexion/")) await page.goto(`${BASE}/connexion/?mode=signup${pro ? "&pro=1" : ""}`);
  await expect(page.locator("button[type=submit]")).toBeEnabled({ timeout: 90_000 });
  if (pro) await page.getByRole("radio", { name: "Je suis un professionnel" }).click();
  if (pro) await page.fill("#company", company);
  await page.fill("#fullname", "Camille Testeuse");
  await page.fill("#email", `live-${RUN}-${who}@permizy.com`);
  await page.fill("#password", PWD);
  await page.getByRole("button", { name: "Créer mon espace" }).click();
}

async function photos(page: Page) {
  await page.getByTestId("photo-facade").setInputFiles(photo("facade"));
  await page.getByTestId("photo-proche").setInputFiles(photo("proche"));
  await page.getByTestId("photo-lointain").setInputFiles(photo("lointain"));
  await expect(page.getByText(/Qualité correcte/).first()).toBeVisible({ timeout: 30_000 });
}

async function payWithTestCard(page: Page, opts: { button?: string; withRac?: boolean; returnTab?: string } = {}) {
  await page.getByTestId(opts.button ?? "pay").click();
  await page.waitForURL(/stripe\.com/, { timeout: 60_000 });
  await page.locator("#cardNumber").waitFor({ timeout: 60_000 });
  // option proposée par Stripe : « Ajouter » le pack raccordement
  if (opts.withRac) await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  await page.locator("#cardNumber").fill("4242424242424242");
  await page.locator("#cardExpiry").fill("12 / 34");
  await page.locator("#cardCvc").fill("123");
  if (await page.locator("#billingName").isVisible()) await page.locator("#billingName").fill("Camille Testeuse");
  const eur = page.getByRole("button", { name: /€/ }).first();
  if (await eur.isVisible().catch(() => false)) await eur.click().catch(() => undefined);
  if (await page.locator("#billingCountry").isVisible().catch(() => false)) await page.locator("#billingCountry").selectOption("FR");
  const link = page.locator("#enableStripePass");
  if (await link.isChecked().catch(() => false)) await link.uncheck({ force: true });
  await page.locator(".SubmitButton, button[type=submit]").first().click();
  await page.waitForURL(new RegExp(`/app/dossier/.*tab=${opts.returnTab ?? "dossier"}`), { timeout: 120_000 });
}

test("1. particulier : accueil → verdict → inscription → dossier → paiement → téléchargement → dépôt → suivi → autre appareil", async ({ page, browser }) => {
  test.setTimeout(420_000);
  const errors = watchErrors(page);
  await page.goto(`${BASE}/`);
  await page.selectOption("[data-testid=home-works]", "pv");
  await page.fill("#address", ADDRESS);
  await page.locator("#address-list button").first().click({ timeout: 30_000 });
  await page.getByTestId("home-check").click();
  await page.waitForURL(/\/verifier\//);
  await page.getByTestId("quick-answer-visible").first().click();
  await page.getByTestId("quick-answer-copropriete").first().click();
  await expect(page.getByTestId("verdict")).toContainText("déclaration", { timeout: 90_000 });
  await page.getByTestId("quick-prepare").click();
  await page.waitForURL(/\/connexion\/.*next=draft/);
  await signup(page, "particulier", false);
  await page.waitForURL(/\/app\/nouveau\/\?draft=1/, { timeout: 60_000 });
  await expect(page.locator("#ln")).toHaveValue("Testeuse");
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await photos(page);
  await page.getByTestId("create-project").click();
  await page.waitForURL(/\/app\/dossier\//, { timeout: 180_000 });
  await expect(page.getByTestId("step-projet")).toBeVisible();
  // photomontage validé
  await page.getByTestId("step-photos").click();
  await expect(page.getByTestId("insertion-editor")).toBeVisible({ timeout: 60_000 });
  await page.getByTestId("save-insertion").click();
  // cerfa complété puis paiement
  await page.getByTestId("step-dossier").click();
  await expect(page.getByTestId("cerfa-completion")).toBeVisible({ timeout: 30_000 });
  await page.fill("#cg-birthDate", "1985-03-14");
  await page.fill("#cg-birthPlace", "Amiens");
  await page.getByTestId("cerfa-save").click();
  await expect(page.getByTestId("paywall")).toContainText("49");
  await expect(page.getByTestId("rac-upsell")).toContainText("39");
  await payWithTestCard(page, { withRac: true });
  await page.getByTestId("generate").click();
  await expect(page.getByTestId("downloads")).toBeVisible({ timeout: 180_000 });
  const [pdf] = await Promise.all([page.waitForEvent("download"), page.getByTestId("download-pdf").click()]);
  expect(readFileSync((await pdf.path())!).subarray(0, 5).toString()).toBe("%PDF-");
  const [zipDl] = await Promise.all([page.waitForEvent("download"), page.getByTestId("download-zip").click()]);
  const names = Object.keys((await JSZip.loadAsync(readFileSync((await zipDl.path())!))).files).map((n) => n.split("/").pop());
  for (const f of ["DP1_plan_de_situation.pdf", "DP2_plan_de_masse.pdf", "Cerfa_16702-03_declaration_prealable.pdf"]) expect(names).toContain(f);
  expect(names).not.toContain("Mandat_depot_DP.pdf"); // le particulier dépose lui-même
  // dépôt par le particulier et suivi
  await page.getByTestId("step-depot").click();
  await page.getByTestId("deposit-email").click();
  const [eml] = await Promise.all([page.waitForEvent("download"), page.getByTestId("homeowner-eml").click()]);
  expect(readFileSync((await eml.path())!, "utf8")).toContain("Content-Disposition: attachment");
  await page.getByTestId("homeowner-deposited").click();
  await expect(page.getByTestId("key-dates")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("sync-state")).toContainText("Sauvegardé", { timeout: 60_000 });
  // pack raccordement acheté avec le dossier : génération débloquée
  await page.getByTestId("step-raccordement").click();
  await expect(page.getByTestId("generate-rac")).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("generate-rac").click();
  await expect(page.getByTestId("rac-downloads")).toBeVisible({ timeout: 120_000 });
  // autre appareil : connexion, le dossier déposé est là
  const other = await browser.newPage();
  await other.goto(`${BASE}/connexion/`);
  await expect(other.locator("button[type=submit]")).toBeEnabled({ timeout: 90_000 });
  await other.fill("#email", `live-${RUN}-particulier@permizy.com`);
  await other.fill("#password", PWD);
  await other.click("button[type=submit]");
  await other.waitForURL(/\/app\/?$/, { timeout: 60_000 });
  await expect(other.getByTestId("project-row")).toHaveCount(1, { timeout: 60_000 });
  await expect(other.getByTestId("project-row")).toContainText(/déposé|Suivi/i);
  await other.close();
  expect(errors, errors.join("\n")).toEqual([]);
});

test("2. professionnel : inscription → dossier client solaire → raccordement et Consuel", async ({ page }) => {
  test.setTimeout(300_000);
  const errors = watchErrors(page);
  await signup(page, "pro", true, "Solaire Test SAS");
  await page.waitForURL(/\/app\/?$/, { timeout: 60_000 });
  await expect(page.getByRole("link", { name: /Clients/ }).first()).toBeVisible();
  await page.goto(`${BASE}/app/nouveau/`);
  await page.getByTestId("works-pv").check();
  await page.fill("#address", ADDRESS);
  await page.locator("#address-list button").first().click({ timeout: 30_000 });
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.fill("#ln", "Client-Fictif");
  await page.fill("#fn", "Paul");
  await page.fill("#em", `live-${RUN}-client@permizy.com`);
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.fill("#count", "10");
  await page.getByRole("button", { name: "Continuer" }).click();
  await photos(page);
  await page.getByTestId("create-project").click();
  await page.waitForURL(/\/app\/dossier\//, { timeout: 180_000 });
  await expect(page.getByText("Déclaration préalable", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Raccordement & Consuel" }).click();
  await page.getByTestId("pdl").fill("12345678901234");
  await page.getByTestId("pdl").blur();
  await expect(page.getByTestId("grid-domain")).toContainText("jusqu'à 36 kVA");
  // pack non acheté : offre à 39 €, puis achat du pack seul et génération
  await expect(page.getByTestId("rac-offer")).toContainText("39");
  await expect(page.getByTestId("sync-state")).toContainText("Sauvegardé", { timeout: 60_000 });
  await payWithTestCard(page, { button: "pay-rac", returnTab: "raccordement" });
  await page.getByRole("tab", { name: "Raccordement & Consuel" }).click();
  await page.getByTestId("generate-rac").click();
  await expect(page.getByTestId("rac-downloads")).toBeVisible({ timeout: 120_000 });
  await page.getByRole("tab", { name: "Dossier" }).click();
  await expect(page.getByTestId("paywall")).toContainText("49");
  await expect(page.getByTestId("sync-state")).toContainText("Sauvegardé", { timeout: 60_000 });
  expect(errors, errors.join("\n")).toEqual([]);
});

test("3. agricole : carte de l'accueil → inscription pro → EARL → prix 239 €", async ({ page }) => {
  test.setTimeout(300_000);
  const errors = watchErrors(page);
  await page.goto(`${BASE}/`);
  await page.getByTestId("home-agri").click();
  await page.waitForURL(/\/connexion\/.*pro=1/);
  await signup(page, "agri", true, "EARL Test");
  await page.waitForURL(/\/app\/nouveau\/\?works=pv_agri/, { timeout: 60_000 });
  await expect(page.getByTestId("works-pv_agri")).toBeChecked();
  await page.fill("#address", ADDRESS);
  await page.locator("#address-list button").first().click({ timeout: 30_000 });
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.fill("#ln", "Exploitant");
  await page.fill("#fn", "Paul");
  await page.fill("#em", `live-${RUN}-earl@permizy.com`);
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByTestId("agri-declarant").selectOption("societe");
  await page.getByTestId("agri-name").fill("du Moulin");
  await page.getByTestId("agri-siret").fill("12345678900012");
  await page.getByRole("button", { name: "Continuer" }).click();
  await photos(page);
  await page.getByTestId("create-project").click();
  await page.waitForURL(/\/app\/dossier\//, { timeout: 180_000 });
  await expect(page.getByText("Solaire agricole", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Raccordement & Consuel" }).click();
  await expect(page.getByTestId("grid-domain")).toBeVisible();
  await page.getByRole("tab", { name: "Dossier" }).click();
  await expect(page.getByTestId("paywall")).toContainText("239");
  await expect(page.getByTestId("rac-upsell")).toBeVisible();
  await expect(page.getByTestId("sync-state")).toContainText("Sauvegardé", { timeout: 60_000 });
  expect(errors, errors.join("\n")).toEqual([]);
});

test("4. guide SEO : encart adresse → vérification → verdict", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto(`${BASE}/declaration-prealable-panneaux-solaires/`);
  await page.getByTestId("guide-quick-check").locator("#address").fill(ADDRESS);
  await page.locator("#address-list button").first().click({ timeout: 30_000 });
  await page.getByTestId("guide-quick-go").click();
  await page.waitForURL(/\/verifier\/\?w=pv/);
  await page.getByTestId("quick-answer-visible").first().click();
  await page.getByTestId("quick-answer-copropriete").first().click();
  await expect(page.getByTestId("verdict")).toContainText("déclaration", { timeout: 90_000 });
  expect(errors, errors.join("\n")).toEqual([]);
});

test("5. pages publiques : statut, titre, aucune erreur JavaScript", async ({ page }) => {
  const errors = watchErrors(page);
  for (const p of ["/", "/guides/", "/tarifs/", "/verifier/", "/declaration-prealable-travaux/", "/permis-de-construire-maison/", "/refus-declaration-prealable/", "/pieces-declaration-prealable-dp1-dp8/", "/mentions-legales/", "/a-propos/", "/connexion/"]) {
    const r = await page.goto(`${BASE}${p}`);
    expect(r?.status(), p).toBe(200);
    await expect(page.locator("h1").first(), p).toBeVisible();
  }
  expect(errors, errors.join("\n")).toEqual([]);
});

test("6. demande de permis de construire : accueil → type de projet → verdict → inscription → dossier → paiement 149 € → pièces PCMI", async ({ page }) => {
  test.setTimeout(420_000);
  const errors = watchErrors(page);
  await page.goto(`${BASE}/`);
  await page.selectOption("[data-testid=home-works]", "permis");
  await page.fill("#address", ADDRESS);
  await page.locator("#address-list button").first().click({ timeout: 30_000 });
  await page.getByTestId("home-check").click();
  await page.waitForURL(/intent=pc/);
  await page.getByTestId("quick-answer-pcProject").filter({ hasText: "Agrandir ma maison" }).click();
  await page.getByTestId("quick-answer-extKind").first().click();
  await page.getByTestId("quick-number-extAreaM2").fill("45");
  await page.getByTestId("quick-number-ok-extAreaM2").click();
  await page.getByTestId("quick-number-extExistingM2").fill("95");
  await page.getByTestId("quick-number-ok-extExistingM2").click();
  await page.getByTestId("quick-answer-visible").first().click();
  await page.getByTestId("quick-answer-copropriete").first().click();
  await expect(page.getByTestId("verdict")).toContainText("permis de construire", { timeout: 90_000 });
  await page.getByTestId("quick-prepare").click();
  await page.waitForURL(/\/connexion\/.*next=draft/);
  await signup(page, "permis", false);
  await page.waitForURL(/\/app\/nouveau\/\?draft=1/, { timeout: 60_000 });
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await photos(page);
  await page.getByTestId("create-project").click();
  await page.waitForURL(/\/app\/dossier\//, { timeout: 180_000 });
  await page.getByTestId("step-photos").click();
  await expect(page.getByTestId("insertion-editor")).toBeVisible({ timeout: 60_000 });
  await page.getByTestId("save-insertion").click();
  await page.getByTestId("step-dossier").click();
  await expect(page.getByTestId("cerfa-completion")).toBeVisible({ timeout: 30_000 });
  await page.fill("#cg-birthDate", "1985-03-14");
  await page.fill("#cg-birthPlace", "Amiens");
  await page.getByTestId("cerfa-save").click();
  await expect(page.getByTestId("paywall")).toContainText("149");
  await expect(page.getByTestId("rac-upsell")).toHaveCount(0); // pas d'option solaire pour un agrandissement
  await payWithTestCard(page);
  await page.getByTestId("generate").click();
  await expect(page.getByTestId("downloads")).toBeVisible({ timeout: 180_000 });
  const [zipDl] = await Promise.all([page.waitForEvent("download"), page.getByTestId("download-zip").click()]);
  const names = Object.keys((await JSZip.loadAsync(readFileSync((await zipDl.path())!))).files).map((n) => n.split("/").pop());
  for (const f of ["PCMI1_plan_de_situation.pdf", "PCMI2_plan_de_masse.pdf", "PCMI5_plan_des_facades_et_toitures.pdf", "Cerfa_13406-17_demande_permis_de_construire.pdf"]) expect(names).toContain(f);
  expect(errors, errors.join("\n")).toEqual([]);
});
