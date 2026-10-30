import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(), delete: vi.fn(), eq: vi.fn(), select: vi.fn(), single: vi.fn(), setLista: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mocks.from } }));
vi.mock("react", () => ({
  useState: () => [[], mocks.setLista],
  useEffect: () => {},
  useCallback: (callback: unknown) => callback,
}));
import { useMediciones } from "./datos";

describe("Borrar mediciones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.from.mockReturnValue(mocks);
    mocks.delete.mockReturnValue(mocks);
    mocks.eq.mockReturnValue(mocks);
    mocks.select.mockReturnValue(mocks);
    mocks.single.mockResolvedValue({ data: { id: "lectura-1" }, error: null });
  });
  it("borra la medición seleccionada y conserva las demás", async () => {
    await useMediciones("usuario-1").eliminar("lectura-1");
    expect(mocks.from).toHaveBeenCalledWith("mediciones");
    expect(mocks.eq).toHaveBeenCalledWith("id", "lectura-1");
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "usuario-1");
    const actualizar = mocks.setLista.mock.calls[0]?.[0];
    expect(actualizar([{ id: "lectura-1" }, { id: "lectura-2" }])).toEqual([{ id: "lectura-2" }]);
  });
  it("conserva la lista cuando falla el borrado", async () => {
    mocks.single.mockResolvedValue({ data: null, error: new Error("Sin conexión") });
    await expect(useMediciones("usuario-1").eliminar("lectura-1")).rejects.toThrow("Sin conexión");
    expect(mocks.setLista).not.toHaveBeenCalled();
  });
  it("no borra sin sesión", async () => {
    await expect(useMediciones().eliminar("lectura-1")).rejects.toThrow();
    expect(mocks.delete).not.toHaveBeenCalled();
  });
});