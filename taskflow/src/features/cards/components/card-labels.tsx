"use client";

import { Badge } from "@/components/ui/badge";
import { labelColorClasses } from "@/lib/label-colors";
import type { CardLabelDto } from "../types";

/**
 * TaskFlow — chips de labels affichées sur une carte (kanban + modal).
 */
export function CardLabels({ labels, max = 4 }: { labels: CardLabelDto[]; max?: number }) {
  if (labels.length === 0) return null;
  const shown = labels.slice(0, max);
  const hidden = labels.length - shown.length;

  return (
    <div className="flex flex-wrap gap-1" aria-label={`Labels : ${labels.map((l) => l.name).join(", ")}`}>
      {shown.map((label) => (
        <Badge key={label.id} colorClasses={labelColorClasses(label.color)} title={label.name}>
          {label.name}
        </Badge>
      ))}
      {hidden > 0 && <Badge variant="outline">+{hidden}</Badge>}
    </div>
  );
}
