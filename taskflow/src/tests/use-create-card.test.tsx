import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { useCreateCard, useDeleteCard } from "@/features/cards/hooks/use-cards";
import type { CardDto } from "@/features/cards/types";

/**
 * TaskFlow — test d'un hook de mutation avec mock réseau (Étape 19).
 * `useCreateCard` est rendu dans un vrai QueryClientProvider ; fetch est
 * mocké pour simuler POST /api/lists/:id/cards puis vérifier :
 *  - le DTO renvoyé par la mutation,
 *  - le patch local du cache ["cards", boardId, listId] (pas de refetch),
 *  - le comportement en cas d'erreur serveur (cache inchangé).
 */

const card: CardDto = {
  id: "card-1",
  title: "Carte créée",
  description: null,
  dueDate: null,
  completedAt: null,
  order: 1000,
  listId: "list-1",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  labels: [],
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, Wrapper };
}

describe("useCreateCard (mutation + mock fetch)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("envoie un POST valide et insère la carte dans le cache local", async () => {
    const { queryClient, Wrapper } = createWrapper();
    // Seed du cache comme le ferait BoardView (données SSR)
    queryClient.setQueryData(["cards", "board-1", "list-1"], [] as CardDto[]);

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ card }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { result } = renderHook(() => useCreateCard("board-1", "list-1"), {
      wrapper: Wrapper,
    });

    await act(async () => {
      const created = await result.current.mutateAsync({ title: "Carte créée" });
      expect(created.id).toBe("card-1");
    });

    // 1) fetch appelé sur la bonne route, méthode POST, body JSON trimé
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("/api/lists/list-1/cards");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({ title: "Carte créée" });

    // 2) cache patché localement avec la vraie carte
    await waitFor(() => {
      expect(queryClient.getQueryData(["cards", "board-1", "list-1"])).toEqual([card]);
    });
  });

  it("en cas d'erreur serveur (403), ne touche pas au cache", async () => {
    const { queryClient, Wrapper } = createWrapper();
    const seed: CardDto[] = [card];
    queryClient.setQueryData(["cards", "board-1", "list-1"], seed);

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Accès refusé", code: "FORBIDDEN" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { result } = renderHook(() => useCreateCard("board-1", "list-1"), {
      wrapper: Wrapper,
    });

    await expect(
      result.current.mutateAsync({ title: "Carte interdite" }),
    ).rejects.toThrow(/Accès refusé/);

    expect(queryClient.getQueryData(["cards", "board-1", "list-1"])).toEqual(seed);
  });

  it("valide l'entrée avec Zod AVANT appel réseau (titre vide → pas de fetch)", async () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCard("board-1", "list-1"), {
      wrapper: Wrapper,
    });

    await expect(result.current.mutateAsync({ title: "   " })).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("useDeleteCard (mutation + mock fetch)", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.unstubAllGlobals());

  it("retire la carte de tous les caches ['cards'] après un DELETE réussi", async () => {
    const { queryClient, Wrapper } = createWrapper();
    queryClient.setQueryData(["cards", "board-1", "list-1"], [card]);

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { result } = renderHook(() => useDeleteCard(), { wrapper: Wrapper });
    await act(async () => {
      await result.current.mutateAsync("card-1");
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(["cards", "board-1", "list-1"])).toEqual([]);
    });
  });
});
