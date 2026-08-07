"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export function NewProjectDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      client: String(form.get("client") || ""),
      location: String(form.get("location") || ""),
      description: String(form.get("description") || ""),
    };

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.fieldErrors?.name?.[0] || "Não foi possível criar o projeto.");
      }
      setOpen(false);
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
        Novo Projeto
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogHeader>
          <DialogTitle>Novo Projeto</DialogTitle>
          <DialogDescription>Cadastre uma nova obra ou empreendimento para organizar os documentos.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome do Projeto *</Label>
            <Input id="name" name="name" placeholder="Ex: Edifício Horizon" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="client">Cliente</Label>
              <Input id="client" name="client" placeholder="Ex: Construtora Alfa" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="location">Local</Label>
              <Input id="location" name="location" placeholder="Ex: São Paulo, SP" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" name="description" placeholder="Detalhes sobre o empreendimento..." />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar Projeto
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  );
}
