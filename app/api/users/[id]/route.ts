import { userSchema } from "@/ValidationSchemas/user";
import prisma from "@/prisma/db";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

interface Props {
  params: { id: string };
}

export async function PATH(request: NextRequest, { params }: Props) {
  const body = await request.json();
  const validation = userSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(validation.error.format(), { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: parseInt(params.id) },
  });

  if (!user) {
    return NextResponse.json({ error: "User Not Found" }, { status: 404 });
  }

  if (body?.password) {
    const hashPassword = await bcrypt.hash(body.password, 10);
    body.password = hashPassword;
  }

  if (user.username !== body.username) {
    const userDuplicate = await prisma.user.findUnique({
      where: { id: body.username },
    });

    if (userDuplicate) {
      return NextResponse.json(
        { message: "Duplicate Username" },
        { status: 409 }
      );
    }
  }

  const updateUser = await prisma.user.update({
    where: { id: user.id },
    data: { ...body },
  });

  return NextResponse.json(updateUser);
}
