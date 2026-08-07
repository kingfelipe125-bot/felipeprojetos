"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DISCIPLINES, DISCIPLINE_LABELS } from "@/lib/constants";

type UserOption = { id: string; name: string; role: string };

export function NewDocumentDialog({ projectId, users }: { projectId: string; users: UserOption[] }) {
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
    form.set("projectId", projectId);

    try {
      const res = await fetch("/api/documents", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Não foi possível criar o documento.");
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
        <Plus className="h-4 w-4" />
        Novo Documento
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>Novo Documento</DialogTitle>
          <DialogDescription>
            Cadastre uma nova folha/planta. O arquivo enviado se torna a revisão inicial (R00).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="discipline">Disciplina *</Label>
              <Select id="discipline" name="discipline" required defaultValue="">
                <option value="" disabled>
                  Selecione
                </option>
                {DISCIPLINES.map((d) => (
                  <option key={d} value={d}>
                    {DISCIPLINE_LABELS[d]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code">Código *</Label>
              <Input id="code" name="code" placeholder="Ex: ARQ-001" required />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Título *</Label>
            <Input id="title" name="title" placeholder="Ex: Planta Baixa - Pavimento Térreo" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="authorId">Enviado por *</Label>
            <Select id="authorId" name="authorId" required defaultValue="">
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
            <Label htmlFor="changeReason">Observação</Label>
            <Textarea id="changeReason" name="changeReason" placeholder="Ex: Emissão inicial para revisão interna" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="file">Arquivo (PDF, DWG, RVT...) *</Label>
            <Input id="file" name="file" type="file" required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              Criar e Enviar
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  );
}
