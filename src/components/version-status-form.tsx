"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRightCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { STATUS_LABELS, type DocumentStatus } from "@/lib/constants";

type UserOption = { id: string; name: string; role: string };

export function VersionStatusForm({
  versionId,
  allowedTransitions,
  users,
}: {
  versionId: string;
  allowedTransitions: DocumentStatus[];
  users: UserOption[];
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (allowedTransitions.length === 0) {
    return <p className="text-xs text-muted-foreground">Nenhuma ação disponível.</p>;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      status: String(form.get("status")),
      userId: String(form.get("userId")),
      note: String(form.get("note") || ""),
    };

    try {
      const res = await fetch(`/api/versions/${versionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Não foi possível alterar o status.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <Select name="status" required defaultValue="" className="h-9 w-auto min-w-[10rem]">
        <option value="" disabled>
          Alterar status para...
        </option>
        {allowedTransitions.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </Select>
      <Select name="userId" required defaultValue="" className="h-9 w-auto min-w-[9rem]">
        <option value="" disabled>
          Responsável
        </option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </Select>
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRightCircle className="h-3.5 w-3.5" />}
        Aplicar
      </Button>
      {error && <p className="w-full text-xs text-destructive">{error}</p>}
    </form>
  );
}
