import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Badge } from "@/components/ui/badge";

/**
 * TaskFlow — tests de composants UI (Étape 19, Testing Library).
 * Cible le composant le plus utilisé du produit : Badge (labels de carte,
 * rôles de membre, compteurs de filtre). Vérifie rendu, variantes, classes
 * libres `colorClasses`, fusion `className` et accessibilité textuelle.
 */

describe("<Badge />", () => {
  it("rend son contenu texte", () => {
    render(<Badge>Urgent</Badge>);
    expect(screen.getByText("Urgent")).toBeInTheDocument();
  });

  it("applique la variante par défaut (indigo)", () => {
    render(<Badge>Défaut</Badge>);
    const el = screen.getByText("Défaut");
    expect(el.className).toContain("bg-indigo-100");
    expect(el.className).toContain("text-xs");
  });

  it("change de palette selon la variant", () => {
    render(<Badge variant="danger">Retard</Badge>);
    const el = screen.getByText("Retard");
    expect(el.className).toContain("bg-red-100");
    expect(el.className).not.toContain("bg-indigo-100");
  });

  it("colorClasses prime sur la variant (palette des labels)", () => {
    render(
      <Badge variant="danger" colorClasses="bg-emerald-500 text-white">
        Dev
      </Badge>,
    );
    const el = screen.getByText("Dev");
    expect(el.className).toContain("bg-emerald-500");
    expect(el.className).not.toContain("bg-red-100");
  });

  it("fusionne className sans écraser les classes de base (tailwind-merge)", () => {
    render(<Badge className="rounded-full">Chip</Badge>);
    const el = screen.getByText("Chip");
    expect(el.className).toContain("rounded-full"); // override rounded-md
    expect(el.className).toContain("inline-flex"); // base conservée
  });

  it("transmet les attributs additionnels (title pour tooltip)", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Badge title="Label de priorité" onClick={onClick}>
        P1
      </Badge>,
    );
    const el = screen.getByText("P1");
    expect(el).toHaveAttribute("title", "Label de priorité");
    await user.click(el);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("reste un élément sémantiquement neutre (<span>)", () => {
    const { container } = render(<Badge>X</Badge>);
    expect(container.querySelector("span")).not.toBeNull();
  });
});
