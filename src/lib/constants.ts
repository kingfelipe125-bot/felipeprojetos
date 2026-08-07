export const DISCIPLINES = [
  "ARQUITETURA",
  "ESTRUTURAS",
  "ELETRICA",
  "HIDRAULICA",
  "OUTROS",
] as const;

export type Discipline = (typeof DISCIPLINES)[number];

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  ARQUITETURA: "Arquitetura",
  ESTRUTURAS: "Estruturas",
  ELETRICA: "Elétrica",
  HIDRAULICA: "Hidráulica",
  OUTROS: "Outros",
};

export const STATUSES = [
  "RASCUNHO",
  "EM_REVISAO",
  "APROVADO_PARA_OBRA",
  "OBSOLETO",
] as const;

export type DocumentStatus = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<DocumentStatus, string> = {
  RASCUNHO: "Rascunho",
  EM_REVISAO: "Em Revisão",
  APROVADO_PARA_OBRA: "Aprovado para Obra",
  OBSOLETO: "Obsoleto",
};

export const STATUS_BADGE_CLASSES: Record<DocumentStatus, string> = {
  RASCUNHO: "bg-slate-100 text-slate-700 border-slate-300",
  EM_REVISAO: "bg-amber-100 text-amber-800 border-amber-300",
  APROVADO_PARA_OBRA: "bg-emerald-100 text-emerald-800 border-emerald-300",
  OBSOLETO: "bg-red-100 text-red-800 border-red-300",
};

// Transições permitidas no workflow de aprovação.
export const STATUS_TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  RASCUNHO: ["EM_REVISAO", "OBSOLETO"],
  EM_REVISAO: ["APROVADO_PARA_OBRA", "RASCUNHO", "OBSOLETO"],
  APROVADO_PARA_OBRA: ["OBSOLETO"],
  OBSOLETO: [],
};

export const USER_ROLES = ["COORDENADOR", "ENGENHEIRO", "OBRA"] as const;
export type UserRole = (typeof USER_ROLES)[number];
