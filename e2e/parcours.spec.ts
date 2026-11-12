// Parcours principal de bout en bout : création d'un dossier sur une adresse réelle, génération PDF + ZIP,
// email pour la bonne mairie, dépôt et suivi. Mode fixtures (réponses réelles enregistrées) pour un test déterministe ;
// E2E_LIVE=1 utilise les API en direct.
import { expect, test, type Page } from "@playwright/test";
import JSZip from "jszip";
import { readFileSync } from "node:fs";
import path from "node:path";

const DEMO = { email: "demo@dp-solaire.fr", password: "Demo-2026!" };
const photo = (k: string) => path.join(import.meta.dirname, "..", "public", "demo", `sans-contrainte-${k}.jpg`);

async function login(page: Page) {
  await page.goto("connexion/");
  if (!process.env.E2E_LIVE) await page.evaluate(() => window.localStorage.setItem("dp:providerMode", "fixtures"));
  await expect(page.locator("button[type=submit]")).toBeEnabled({ timeout: 90_000 });
  await page.fill("#email", DEMO.email);
  await page.fill("#password", DEMO.password);
  await page.click("button[type=submit]");
  await page.waitForURL(/\/app\/?$/);
  await expect(page.getByTestId("project-row").first()).toBeVisible({ timeout: 60_000 });
}

test("connexion et tableau de bord avec les 3 dossiers de démo", async ({ page }) => {
  await login(page);
  await expect(page.getByTestId("project-row")).toHaveCount(3);
  await expect(page.getByText("DEMO-2-ABF")).toBeVisible();
});

test("dossier démo ABF : périmètre AC1 détecté, alerte et délai de 2 mois", async ({ page }) => {
  await login(page);
  await page.getByTestId("project-row").filter({ hasText: "DEMO-2-ABF" }).click();
  await expect(page.getByText("Consultation de l'ABF :")).toBeVisible();
  await expect(page.getByTestId("rules")).toContainText("Secteur protégé : consultation de l'ABF");
  await expect(page.getByText(/Délai d'instruction attendu/)).toContainText("2 mois");
});

test("dossier démo PLU restrictif : règle de zone N citée avec sa source", async ({ page }) => {
  await login(page);
  await page.getByTestId("project-row").filter({ hasText: "DEMO-3" }).click();
  await expect(page.getByTestId("rules")).toContainText("intégrés de façon harmonieuse");
  await expect(page.getByTestId("rules")).toContainText("À_VÉRIFIER");
});

test("parcours complet : nouvelle adresse → dossier PDF + ZIP → email mairie → dépôt → suivi", async ({ page }, info) => {
  test.skip(info.project.name === "mobile" && !process.env.E2E_ALL, "parcours long exécuté sur le profil desktop");
  await login(page);
  await page.goto("app/nouveau/");
  // 1. adresse (autocomplétion BAN)
  await page.fill("#address", "Allée des Tilleuls 80480 Pont-de-Metz");
  await page.locator("#address-list button").first().click();
  await expect(page.getByText(/INSEE 80632/)).toBeVisible();
  await page.getByRole("button", { name: "Continuer" }).click();
  // 2. client + mandat signé
  await page.selectOption("#client", "");
  await page.fill("#ln", "Testeur-Fictif");
  await page.fill("#fn", "Paul");
  await page.fill("#em", "paul.testeur@example.org");
  const pad = page.getByTestId("signature-pad");
  const box = (await pad.boundingBox())!;
  await page.mouse.move(box.x + 20, box.y + 60);
  await page.mouse.down();
  for (let i = 1; i < 12; i++) await page.mouse.move(box.x + 20 + i * 18, box.y + 60 + (i % 2 ? -25 : 25));
  await page.mouse.up();
  await page.getByTestId("mandate-consent").check();
  await page.getByRole("button", { name: "Continuer" }).click();
  // 3. projet
  await page.fill("#count", "10");
  await expect(page.getByText(/4,3 kWc/)).toBeVisible();
  await page.getByRole("button", { name: "Continuer" }).click();
  // 4. photos
  await page.getByTestId("photo-facade").setInputFiles(photo("facade"));
  await page.getByTestId("photo-proche").setInputFiles(photo("proche"));
  await page.getByTestId("photo-lointain").setInputFiles(photo("lointain"));
  await expect(page.getByText(/Qualité correcte/).first()).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("create-project").click();
  // enrichissement → page dossier
  await page.waitForURL(/\/app\/dossier\//, { timeout: 90_000 });
  await expect(page.getByText("Déclaration préalable", { exact: true })).toBeVisible();
  await expect(page.getByText(/zone UC/)).toBeVisible();
  await expect(page.getByText(/AI 0182/)).toBeVisible();
  // insertion : valider le placement proposé
  await page.getByRole("tab", { name: "Photos & insertion" }).click();
  await expect(page.getByTestId("insertion-editor")).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("save-insertion").click();
  await expect(page.getByText("enregistré")).toBeVisible();
  // plus aucun point bloquant
  await page.getByRole("tab", { name: "Synthèse" }).click();
  await expect(page.getByText("0 bloquant(s)")).toBeVisible();
  // génération
  await page.getByRole("tab", { name: "Dossier" }).click();
  const t0 = Date.now();
  await page.getByTestId("generate").click();
  await expect(page.getByTestId("downloads")).toBeVisible({ timeout: 120_000 });
  expect(Date.now() - t0).toBeLessThan(60_000);
  const [pdf] = await Promise.all([page.waitForEvent("download"), page.getByTestId("download-pdf").click()]);
  const pdfBytes = readFileSync((await pdf.path())!);
  expect(pdfBytes.subarray(0, 5).toString()).toBe("%PDF-");
  expect(pdfBytes.length).toBeGreaterThan(200_000);
  const [zipDl] = await Promise.all([page.waitForEvent("download"), page.getByTestId("download-zip").click()]);
  const zip = await JSZip.loadAsync(readFileSync((await zipDl.path())!));
  const names = Object.keys(zip.files).map((n) => n.split("/").pop());
  for (const f of ["DP1_plan_de_situation.pdf", "DP2_plan_de_masse.pdf", "DP4_plan_des_facades_et_toitures.pdf", "DP5_aspect_exterieur.pdf", "DP6_insertion_paysagere.pdf", "DP7_photo_environnement_proche.pdf", "DP8_photo_paysage_lointain.pdf", "Cerfa_16702-03_declaration_prealable.pdf", "Mandat_depot_DP.pdf", "00_Bordereau_des_pieces.pdf", "Email_mairie.txt"]) expect(names).toContain(f);
  // envoi : bonne mairie, email prêt
  await page.getByRole("tab", { name: "Envoi" }).click();
  await expect(page.getByTestId("mairie-email")).toHaveText("mairie@pontdemetz.fr");
  await page.getByRole("button", { name: /Email à la mairie/ }).click();
  const [eml] = await Promise.all([page.waitForEvent("download"), page.getByTestId("download-eml").click()]);
  const emlText = readFileSync((await eml.path())!, "utf8");
  expect(emlText).toContain("To: mairie@pontdemetz.fr");
  expect(emlText).toContain("Content-Disposition: attachment");
  // dépôt (validation humaine) puis suivi
  await page.getByTestId("mark-deposited").click();
  await page.getByTestId("confirm-deposit").click();
  await expect(page.getByTestId("key-dates")).toContainText("Date limite de décision (1 mois)");
});

test("adresse par coordonnées GPS (BAN indisponible) → commune, parcelle et zonage trouvés", async ({ page }, info) => {
  test.skip(info.project.name === "mobile" && !process.env.E2E_ALL, "exécuté sur le profil desktop");
  await login(page);
  await page.goto("app/nouveau/");
  await page.getByTestId("gps-input").fill("49.880454, 2.238535");
  await page.getByTestId("gps-validate").click();
  await expect(page.getByText(/INSEE 80632/)).toBeVisible();
  await expect(page.getByText(/Position GPS/).first()).toBeVisible();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.fill("#ln", "Gps-Fictif");
  await page.fill("#fn", "Lea");
  await page.fill("#em", "lea.gps@example.org");
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByTestId("create-project").click();
  await page.waitForURL(/\/app\/dossier\//, { timeout: 90_000 });
  await expect(page.getByText(/zone UC/)).toBeVisible();
  await expect(page.getByText(/AI 0182/)).toBeVisible();
});

test("raccordement & Consuel : PDL, formulaire SC 144C2-2 et pack ZIP", async ({ page }, info) => {
  test.skip(info.project.name === "mobile" && !process.env.E2E_ALL, "exécuté sur le profil desktop");
  await login(page);
  await page.getByTestId("project-row").filter({ hasText: "DEMO-1" }).click();
  await page.getByRole("tab", { name: "Raccordement & Consuel" }).click();
  await expect(page.getByTestId("rac-rules")).toContainText("Point de livraison (PDL) renseigné");
  await page.getByTestId("pdl").fill("12345678901234");
  await page.getByTestId("pdl").blur();
  await expect(page.getByTestId("rac-rules")).not.toContainText("Point de livraison (PDL) renseigné");
  await expect(page.getByTestId("consuel-form")).toHaveText("SC 144C2-2");
  await expect(page.getByTestId("rac-rules")).toContainText("1,1 c€/kWh");
  await page.getByTestId("generate-rac").click();
  await expect(page.getByTestId("rac-downloads")).toBeVisible({ timeout: 90_000 });
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByTestId("download-rac-zip").click()]);
  const zip = await JSZip.loadAsync(readFileSync((await dl.path())!));
  const names = Object.keys(zip.files).map((n) => n.split("/").pop());
  for (const f of ["01_Schema_unifilaire.pdf", "02_Consuel_SC_144C2-2_pre-rempli.pdf", "03_Note_de_calcul.pdf", "04_Recapitulatif_demande_Enedis.pdf", "05_Mandat_raccordement_Consuel.pdf", "06_Plan_de_situation.pdf"]) expect(names).toContain(f);
});
