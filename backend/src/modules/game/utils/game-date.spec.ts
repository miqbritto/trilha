import { describe, it } from "node:test";
import { getGameDate } from "./game-date";

describe("getGameDate", () => {
    it("mantém o dia anterior antes da meia-noite em SP", () => {
        const instant = new Date("2026-09-12T02:59:59Z");
        expect(getGameDate(instant)).toBe("2026-09-11")
    })

    it("altera o dia após a meia-noite em SP", () => {
        const instant = new Date("2026-09-12T03:00:00Z")
        expect(getGameDate(instant)).toBe("2026-09-12")
    })
    
})