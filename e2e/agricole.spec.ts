// Solaire agricole : hangar existant d'une EARL, cerfa « personne morale », raccordement fortes puissances.
import { expect, test } from "@playwright/test";
import JSZip from "jszip";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

const photo = (k: string) => path.join(import.meta.dirname, "..", "public", "demo", `sans-contrainte-${k}.jpg`);

test("solaire agricole : EARL, 240 panneaux, DP, cerfa personne morale, raccordement > 36 kVA", async ({ page }, info) => {
  test.skip(info.project.name === "mobile" && !process.env.E2E_ALL, "parcours long exécuté sur le profil desktop");
  test.setTimeout(240_000);
  // l'accueil mène à l'inscription professionnelle puis au bon assistant
  await page.goto("./");
  await expect(page.getByTestId("home-agri")).toHaveAttribute("href", /pro=1.*works%3Dpv_agri/);
  await page.goto("connexion/");
  await page.evaluate(() => window.localStorage.setItem("dp:providerMode", "fixtures"));
  await expect(page.locator("button[type=submit]")).toBeEnabled({ timeout: 90_000 });
  await page.fill("#email", "demo@permizy.com");
  await page.fill("#password", "Demo-2026!");
  await page.click("button[type=submit]");
  await page.waitForURL(/\/app\/?$/);
  await page.goto("app/nouveau/?works=pv_agri");
  await expect(page.getByTestId("works-pv_agri")).toBeChecked();
  await page.fill("#address", "Allée des Tilleuls 80480 Pont-de-Metz");
  await page.locator("#address-list button").first().click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.selectOption("#client", "");
  await page.fill("#ln", "Exemple");
  await page.fill("#fn", "Paul");
  await page.fill("#em", "earl.exemple@example.org");
  await page.getByRole("button", { name: "Continuer" }).click();
  // bâtiment et société
  await page.getByTestId("agri-declarant").selectOption("societe");
  await page.getByTestId("agri-name").fill("du Moulin");
  await page.getByTestId("agri-siret").fill("12345678900012");
  await page.fill("#count", "240");
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByTestId("photo-facade").setInputFiles(photo("facade"));
  await page.getByTestId("photo-proche").setInputFiles(photo("proche"));
  await page.getByTestId("photo-lointain").setInputFiles(photo("lointain"));
  await expect(page.getByText(/Qualité correcte/).first()).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("create-project").click();
  await page.waitForURL(/\/app\/dossier\//, { timeout: 90_000 });
  await expect(page.getByText("Solaire agricole", { exact: true })).toBeVisible();
  await expect(page.getByText("Déclaration préalable", { exact: true })).toBeVisible();

  // raccordement : basse tension > 36 kVA, rapport de contrôle, appel d'offres > 100 kWc
  await page.getByRole("tab", { name: "Raccordement & Consuel" }).click();
  await expect(page.getByTestId("grid-domain")).toContainText("de 36 à 250 kVA");
  await expect(page.getByTestId("rac-rules")).toContainText("rapport de contrôle");
  await expect(page.getByTestId("rac-rules")).toContainText("Petit PV");
  await expect(page.getByTestId("rac-rules")).not.toContainText("Point de livraison (PDL) renseigné");
  await page.getByTestId("generate-rac").click();
  await expect(page.getByTestId("rac-downloads")).toBeVisible({ timeout: 90_000 });
  const [rac] = await Promise.all([page.waitForEvent("download"), page.getByTestId("download-rac-zip").click()]);
  const racNames = Object.keys((await JSZip.loadAsync(readFileSync((await rac.path())!))).files).map((n) => n.split("/").pop());
  expect(racNames).toContain("02c_Consuel_SC_143_vierge.pdf");

  // dossier mairie : cerfa au nom de la société
  await page.getByRole("tab", { name: "Photos & insertion" }).click();
  await expect(page.getByTestId("insertion-editor")).toBeVisible({ timeout: 30_000 });
  await page.getByTestId("save-insertion").click();
  await page.getByRole("tab", { name: "Dossier" }).click();
  await page.getByTestId("generate").click();
  await expect(page.getByTestId("downloads")).toBeVisible({ timeout: 120_000 });
  const [zipDl] = await Promise.all([page.waitForEvent("download"), page.getByTestId("download-zip").click()]);
  const zip = await JSZip.loadAsync(readFileSync((await zipDl.path())!));
  const cerfaName = Object.keys(zip.files).find((n) => n.endsWith("Cerfa_16702-03_declaration_prealable.pdf"))!;
  const form = (await PDFDocument.load(await zip.files[cerfaName].async("uint8array"))).getForm();
  expect(form.getTextField("D2D_denomination").getText()).toBe("du Moulin");
  expect(form.getTextField("D2J_type").getText()).toBe("EARL");
  expect(form.getTextField("D2S_siret").getText()).toBe("12345678900012");
  expect(form.getTextField("C2ZD1_description").getText()).toMatch(/240 panneaux.*hangar agricole/s);
  const mail = await zip.files[Object.keys(zip.files).find((n) => n.endsWith("Email_mairie.txt"))!].async("string");
  expect(mail).toContain("EARL du Moulin, représentée par");
});
