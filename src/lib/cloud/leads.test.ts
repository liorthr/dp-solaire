import { describe, expect, it } from "vitest";
import { validateLead } from "./leads";

describe("demande de mise en relation", () => {
  const ok = { fullName: "Camille Exemple", email: "camille@example.org", consent: true };
  it("exige un consentement explicite", () => {
    expect(validateLead({ ...ok, consent: false })).toMatch(/accord/);
    expect(validateLead(ok)).toBeNull();
  });
  it("vérifie email, téléphone et code postal", () => {
    expect(validateLead({ ...ok, email: "pas-un-email" })).toMatch(/email/);
    expect(validateLead({ ...ok, phone: "abc" })).toMatch(/téléphone/);
    expect(validateLead({ ...ok, postcode: "7500" })).toMatch(/postal/);
  });
});
