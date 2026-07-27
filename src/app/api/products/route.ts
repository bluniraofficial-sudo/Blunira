import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/products - Get all active bottle products
export async function GET(request: NextRequest) {
  try {
    const products = await db.bottleProduct.findMany({
      where: {
        isDeleted: false,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        description: true,
        capacity: true,
        moq: true,
        bottlesPerPack: true,
        pricePerUnit: true,
        pricePerPack: true,
        imageUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        moq: 'asc',
      },
    });

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/products - Create product (admin only)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    });

    if (!user || user.role.name !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, capacity, moq, bottlesPerPack, pricePerPack, imageUrl } = body;

    if (!name || !capacity || !moq || !bottlesPerPack || !pricePerPack) {
      return NextResponse.json(
        { error: 'Name, capacity, MOQ, bottles per pack, and price per pack are required' },
        { status: 400 }
      );
    }

    const pricePerUnit = Number(pricePerPack) / Number(bottlesPerPack);
    const product = await db.bottleProduct.create({
      data: {
        name,
        description,
        capacity,
        moq: parseInt(moq),
        bottlesPerPack: parseInt(bottlesPerPack),
        pricePerUnit,
        pricePerPack: parseFloat(pricePerPack),
        imageUrl,
        status: 'ACTIVE',
      },
    });

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'PRODUCT_CREATED',
        details: `Created product ${product.name}`,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product', details: error.message },
      { status: 500 }
    );
  }
}
