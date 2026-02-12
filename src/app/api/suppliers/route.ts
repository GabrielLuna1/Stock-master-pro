import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Supplier from "@/models/Supplier";
import Product from "@/models/Product"; // Necessário para verificar vínculo antes de excluir
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ----------------------------------------------------------------------
// 1. LISTAR FORNECEDORES (GET)
// ----------------------------------------------------------------------
export async function GET() {
  try {
    await connectDB();
    // Busca todos, ordenados pelo nome
    const suppliers = await Supplier.find().sort({ name: 1 });
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("Erro ao buscar fornecedores:", error);
    return NextResponse.json(
      { error: "Erro ao carregar lista." },
      { status: 500 },
    );
  }
}

// ----------------------------------------------------------------------
// 2. CRIAR FORNECEDOR (POST)
// ----------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    // Segurança: Apenas logados podem criar
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { name, corporateName, cnpj, email, phone, address } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Nome do fornecedor é obrigatório." },
        { status: 400 },
      );
    }

    await connectDB();

    // Verifica duplicidade de CNPJ (se informado)
    if (cnpj) {
      const existing = await Supplier.findOne({ cnpj });
      if (existing) {
        return NextResponse.json(
          { error: "Já existe um fornecedor com este CNPJ." },
          { status: 400 },
        );
      }
    }

    const newSupplier = await Supplier.create({
      name,
      corporateName,
      cnpj,
      email,
      phone,
      address,
      active: true,
    });

    return NextResponse.json(newSupplier, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar fornecedor:", error);
    return NextResponse.json(
      { error: "Erro ao salvar fornecedor." },
      { status: 500 },
    );
  }
}

// ----------------------------------------------------------------------
// 3. ATUALIZAR FORNECEDOR (PUT)
// ----------------------------------------------------------------------
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await req.json();
    const { _id, name, corporateName, cnpj, email, phone, address } = body;

    if (!_id)
      return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });

    await connectDB();

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      _id,
      { name, corporateName, cnpj, email, phone, address },
      { new: true }, // Retorna o objeto atualizado
    );

    if (!updatedSupplier) {
      return NextResponse.json(
        { error: "Fornecedor não encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json(updatedSupplier);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao atualizar." }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// 4. EXCLUIR FORNECEDOR (DELETE) - COM TRAVA DE SEGURANÇA
// ----------------------------------------------------------------------
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id)
      return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });

    await connectDB();

    // 🔒 TRAVA DE INTEGRIDADE: Verifica se tem produtos usando este fornecedor
    const productsUsingSupplier = await Product.countDocuments({
      supplier: id,
    });

    if (productsUsingSupplier > 0) {
      return NextResponse.json(
        {
          error: `Não é possível excluir. Existem ${productsUsingSupplier} produtos vinculados a este fornecedor.`,
        },
        { status: 400 },
      );
    }

    const deleted = await Supplier.findByIdAndDelete(id);

    if (!deleted)
      return NextResponse.json(
        { error: "Fornecedor não encontrado." },
        { status: 404 },
      );

    return NextResponse.json({
      success: true,
      message: "Fornecedor excluído.",
    });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao excluir." }, { status: 500 });
  }
}
