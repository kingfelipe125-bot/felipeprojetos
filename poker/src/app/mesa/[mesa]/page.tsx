import { notFound } from "next/navigation";
import { TableScreen } from "@/components/game/TableScreen";
import { findTable, TABLES } from "@/lib/economy/tables";

export function generateStaticParams() {
  return TABLES.map((t) => ({ mesa: t.id }));
}

export default function MesaPage({ params }: { params: { mesa: string } }) {
  if (!findTable(params.mesa)) notFound();
  return <TableScreen tableId={params.mesa} />;
}
