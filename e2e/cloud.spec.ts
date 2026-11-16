// Comptes en ligne (Supabase) : connexion réelle, sauvegarde d'un dossier, récupération sur un « autre appareil ».
// Exécuté seulement avec E2E_CLOUD_PASSWORD (compte de test confirmé test-e2e@permizy.com).
import { expect, test, type Browser } from "@playwright/test";
import path from "node:path";

const EMAIL = "test-e2e@permizy.com";
const PASSWORD = process.env.E2E_CLOUD_PASSWORD ?? "";
const photo = (k: string) => path.join(import.meta.dirname, "..", "public", "demo", `sans-contrainte-${k}.jpg`);

async function device(browser: Browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto("connexion/");
  await page.evaluate(() => window.localStorage.setItem("dp:providerMode", "fixtures"));
  await expect(page.locator("button[type=submit]")).toBeEnabled({ timeout: 90_000 });
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await page.click("button[type=submit]");
  await page.waitForURL(/\/app\/?$/, { timeout: 60_000 });
  return { ctx, page };
}

test("compte en ligne : dossier créé sur un appareil, retrouvé sur un autre, puis supprimé", async ({ browser }, info) => {
  test.skip(!PASSWORD || info.project.name === "mobile", "nécessite E2E_CLOUD_PASSWORD");
  test.setTimeout(240_000);
  // appareil 1 : création d'un dossier
  const a = await device(browser);
  await expect(a.page.getByTestId("sync-state")).toBeVisible();
  await a.page.goto("app/nouveau/");
  await a.page.getByTestId("works-pac").check();
  await a.page.fill("#address", "Allée des Tilleuls 80480 Pont-de-Metz");
  await a.page.locator("#address-list button").first().click();
  await a.page.getByRole("button", { name: "Continuer" }).click();
  // un particulier déjà connu n'a pas à ressaisir ses coordonnées
  if (await a.page.locator("#ln").isVisible()) {
    await a.page.fill("#ln", "Nuage");
    await a.page.fill("#fn", "Test");
    await a.page.fill("#em", "test.nuage@example.org");
  }
  await a.page.getByRole("button", { name: "Continuer" }).click();
  await a.page.getByRole("button", { name: "Continuer" }).click();
  await a.page.getByTestId("photo-facade").setInputFiles(photo("facade"));
  await expect(a.page.getByText(/Qualité correcte/).first()).toBeVisible({ timeout: 30_000 });
  await a.page.getByTestId("create-project").click();
  await a.page.waitForURL(/\/app\/dossier\//, { timeout: 90_000 });
  const ref = (await a.page.getByTestId("project-title").textContent())!.trim();
  // particulier : parcours en étapes ; le téléchargement est payant
  await a.page.getByTestId("step-dossier").click();
  await expect(a.page.getByTestId("paywall")).toContainText("49 €", { timeout: 30_000 });
  await expect(a.page.getByTestId("pay")).toBeVisible();
  await a.page.getByTestId("step-depot").click();
  await expect(a.page.getByText(/Téléchargez d'abord votre dossier complet/)).toBeVisible();
  await expect(a.page.getByTestId("sync-state")).toHaveText(/Sauvegardé en ligne/, { timeout: 60_000 });
  await a.ctx.close();

  // appareil 2 (navigateur vierge) : le dossier et sa photo sont là
  const b = await device(browser);
  await expect(b.page.getByTestId("project-row").filter({ hasText: ref })).toBeVisible({ timeout: 60_000 });
  await b.page.getByTestId("project-row").filter({ hasText: ref }).getByRole("button", { name: "Continuer" }).click();
  await b.page.getByTestId("step-photos").click();
  await expect(b.page.getByTestId("insertion-editor")).toBeVisible({ timeout: 60_000 });
  // nettoyage : suppression (propagée au serveur)
  b.page.once("dialog", (d) => d.accept());
  await b.page.getByRole("button", { name: "Supprimer le dossier" }).click();
  await b.page.waitForURL(/\/app\/?$/);
  await expect(b.page.getByTestId("sync-state")).toHaveText(/Sauvegardé en ligne/, { timeout: 60_000 });
  // déconnexion : la copie locale est effacée
  await b.page.getByRole("button", { name: "Se déconnecter" }).click();
  await b.page.waitForURL(/connexion/);
  expect(await b.page.evaluate(() => window.localStorage.getItem("dp:db:v1") ?? "")).not.toContain(ref);
  await b.ctx.close();
});
