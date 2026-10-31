"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";
import { TextareaField } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { useCreateBoard } from "@/features/boards/hooks/use-boards";
import { createBoardSchema } from "@/lib/validations/board.schema";
import { apiErrorMessage, ApiClientError } from "@/lib/api-client";

/**
 * TaskFlow — modale de création de tableau.
 * Validation Zod miroir (messages instantanés) + erreurs serveur remontées
 * (422 fieldErrors, 401…). Ferme la modale et affiche un retour inline au succès.
 */
export function CreateBoardModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const createBoard = useCreateBoard();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; description?: string }>({});

  const reset = () => {
    setName("");
    setDescription("");
    setFieldErrors({});
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = createBoardSchema.safeParse({ name, description });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({ name: flat.name?.[0], description: flat.description?.[0] });
      return;
    }
    setFieldErrors({});
    try {
      await createBoard.mutateAsync(parsed.data);
      reset();
      onClose();
    } catch (error) {
      if (error instanceof ApiClientError && error.fieldErrors) {
        setFieldErrors({
          name: error.fieldErrors.name?.[0],
          description: error.fieldErrors.description?.[0],
        });
      }
      // Les autres erreurs s'affichent via `createBoard.isError` ci-dessous.
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Nouveau tableau" size="md">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <InputField
          label="Nom du tableau"
          name="name"
          placeholder="Ex. Produit — Roadmap Q4"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
          autoFocus
          maxLength={100}
        />
        <TextareaField
          label="Description (optionnelle)"
          name="description"
          placeholder="À quoi sert ce tableau ?"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={fieldErrors.description}
          maxLength={500}
        />

        {createBoard.isError && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {apiErrorMessage(createBoard.error)}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={createBoard.isPending}>
            {createBoard.isPending && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Créer le tableau
          </Button>
        </div>
      </form>
    </Modal>
  );
}
