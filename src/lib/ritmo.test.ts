import { describe, expect, it } from "vitest";
import { sugerirContexto } from "./ritmo";

describe("sugerirContexto", () => {
  it("70 BPM a los 20 años es Reposo", () => expect(sugerirContexto(70, 20)).toBe("Reposo"));
  it("105 BPM a los 20 años (52%) es Post-ejercicio", () =>
    expect(sugerirContexto(105, 20)).toBe("Post-ejercicio"));
  it("130 BPM a los 20 años (65%) es Ejercicio", () =>
    expect(sugerirContexto(130, 20)).toBe("Ejercicio"));
});
