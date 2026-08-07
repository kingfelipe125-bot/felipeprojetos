import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createProjectSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  client: z.string().optional(),
  location: z.string().optional(),
});

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      documents: {
        select: { id: true, discipline: true },
      },
    },
  });
  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = createProjectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.project.create({ data: parsed.data });
  return NextResponse.json({ project }, { status: 201 });
}
