"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

type UserOption = { id: string; name: string; role: string };

export function UploadVersionDialog({
  documentId,
  nextRevisionLabel,
  users,
}: {
  documentId: string;
  nextRevisionLabel: string;
  users: UserOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formEl = e.currentTarget;
    const form = new FormData(formEl);

    try {
      const res = await fetch(`/api/documents/${documentId}/versions`, { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Não foi possível enviar a nova revisão.");
      }
      setOpen(false);
      formEl.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UploadCloud className="h-4 w-4" />
        Enviar Nova Revisão
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>Enviar Nova Revisão · {nextRevisionLabel}</DialogTitle>
          <DialogDescription>
            O novo arquivo entra como Rascunho e segue o fluxo de aprovação até ser marcado como Aprovado para Obra.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="v-authorId">Enviado por *</Label>
            <Select id="v-authorId" name="authorId" required defaultValue="">
              <option value="" disabled>
                Selecione o responsável
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="v-changeReason">Motivo da alteração *</Label>
            <Textarea
              id="v-changeReason"
              name="changeReason"
              placeholder="Ex: Ajuste de layout solicitado pelo cliente"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="v-file">Arquivo (PDF, DWG, RVT...) *</Label>
            <Input id="v-file" name="file" type="file" required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar Revisão
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  );
}
