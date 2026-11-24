import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { OPTION_PRICES, PRICES } from "./prices";

describe("prix et webhook Stripe", () => {
  it("le webhook reconnaît chaque montant affiché, avec et sans pack raccordement", () => {
    const wh = readFileSync("supabase/functions/stripe-webhook/index.ts", "utf8");
    const cents = (e: number) => Math.round(e * 100);
    const expected: [number, string, string][] = [
      [cents(PRICES.DP), "DP", "[]"],
      [cents(PRICES.DP + OPTION_PRICES.RAC), "DP", '["RAC"]'],
      [cents(PRICES.PC), "PC", "[]"],
      [cents(PRICES.AGRI), "AGRI", "[]"],
      [cents(PRICES.AGRI + OPTION_PRICES.RAC), "AGRI", '["RAC"]'],
      [cents(OPTION_PRICES.RAC), "RAC", '["RAC"]'],
    ];
    for (const [amount, kind, options] of expected) expect(wh, `${amount}`).toContain(`${amount}: { kind: "${kind}", options: ${options} }`);
    // montants distincts : un paiement ne peut pas être confondu avec un autre
    expect(new Set(expected.map((x) => x[0])).size).toBe(expected.length);
  });
});
