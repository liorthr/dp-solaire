import { describe, expect, it } from "vitest";
import { addMonths, computeInstruction } from "./deadlines";
import type { InstructionEvent } from "@/lib/types";

const ev = (type: InstructionEvent["type"], date: string, payload?: Record<string, unknown>): InstructionEvent => ({ id: `${type}${date}`, type, date, payload });

describe("addMonths (de date à date)", () => {
  it("cas simples et fin de mois", () => {
    expect(addMonths("2026-03-15", 1)).toBe("2026-04-15");
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
    expect(addMonths("2026-11-30", 2)).toBe("2027-01-30");
  });
});

describe("computeInstruction", () => {
  it("non déposé", () => {
    expect(computeInstruction([], 1).status).toBe("brouillon");
  });
  it("droit commun : décision à 1 mois, tacite ensuite", () => {
    const s = computeInstruction([ev("depot", "2026-09-10")], 1, "2026-09-20");
    expect(s.decisionDeadline).toBe("2026-10-10");
    expect(s.status).toBe("instruction");
    expect(s.tacitAcquired).toBe(false);
    const t = computeInstruction([ev("depot", "2026-09-10")], 1, "2026-10-11");
    expect(t.tacitAcquired).toBe(true);
    expect(t.status).toBe("accord");
    expect(t.keyDates.find((k) => k.code === "retrait")?.date).toBe("2027-01-10");
  });
  it("secteur protégé : 2 mois", () => {
    expect(computeInstruction([ev("depot", "2026-09-10")], 2, "2026-09-11").decisionDeadline).toBe("2026-11-10");
  });
  it("majoration notifiée par la mairie prime", () => {
    const s = computeInstruction([ev("depot", "2026-09-10"), ev("notification_majoration", "2026-09-30", { totalMonths: 2 })], 1, "2026-10-01");
    expect(s.decisionDeadline).toBe("2026-11-10");
  });
  it("demande de pièces : suspension puis redémarrage à réception", () => {
    const a = computeInstruction([ev("depot", "2026-09-10"), ev("demande_pieces", "2026-09-25")], 1, "2026-10-01");
    expect(a.suspended).toBe(true);
    expect(a.status).toBe("pieces_demandees");
    expect(a.decisionDeadline).toBeUndefined();
    expect(a.keyDates.find((k) => k.code === "pieces_limite")?.date).toBe("2026-12-25");
    const b = computeInstruction([ev("depot", "2026-09-10"), ev("demande_pieces", "2026-09-25"), ev("pieces_fournies", "2026-10-05")], 1, "2026-10-06");
    expect(b.suspended).toBe(false);
    expect(b.decisionDeadline).toBe("2026-11-05");
  });
  it("refus : délais de recours", () => {
    const s = computeInstruction([ev("depot", "2026-09-10"), ev("decision_refus", "2026-10-01")], 1, "2026-10-02");
    expect(s.status).toBe("refus");
    expect(s.keyDates.find((k) => k.code === "recours_contentieux")?.date).toBe("2026-12-01");
  });
  it("rappels J-7 sur les échéances futures", () => {
    const s = computeInstruction([ev("depot", "2026-09-10")], 1, "2026-09-12");
    expect(s.reminders.find((r) => r.code === "rappel_decision")?.date).toBe("2026-10-03");
  });
});
