import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const product = await db.bottleProduct.findUnique({
      where: { id: id, isDeleted: false },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/products/[id] - Update product (admin only)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
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
    const { name, description, capacity, moq, bottlesPerPack, pricePerUnit, pricePerPack, imageUrl, status } = body;

    const product = await db.bottleProduct.update({
      where: { id: id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(capacity && { capacity }),
        ...(moq && { moq: parseInt(moq) }),
        ...(bottlesPerPack && { bottlesPerPack: parseInt(bottlesPerPack) }),
        ...(pricePerPack && { pricePerPack: parseFloat(pricePerPack) }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(status && { status }),
      },
    });

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'PRODUCT_UPDATED',
        details: `Updated product ${product.name}`,
      },
    });

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Soft delete product (admin only)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
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

    await db.bottleProduct.update({
      where: { id: id },
      data: { isDeleted: true, status: 'INACTIVE' },
    });

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'PRODUCT_DELETED',
        details: `Deleted product ${id}`,
      },
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product', details: error.message },
      { status: 500 }
    );
  }
}
