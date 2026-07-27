import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { generateInvoiceHtml, getInvoiceFilename } from '@/lib/invoice';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

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
      include: { role: true, advertiser: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const order = await db.order.findUnique({
      where: { id, isDeleted: false },
      include: {
        advertiser: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (user.role.name === 'ADVERTISER' && order.advertiserId !== user.advertiserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!order.invoiceNumber) {
      const year = new Date().getFullYear();
      const count = await db.order.count();
      order.invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, '0')}`;
      await db.order.update({
        where: { id },
        data: { invoiceNumber: order.invoiceNumber },
      });
    }

    const html = generateInvoiceHtml({
      orderNumber: order.orderNumber,
      invoiceNumber: order.invoiceNumber,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      advanceAmount: Number(order.advanceAmount),
      balanceAmount: Number(order.balanceAmount),
      advancePaid: order.advancePaid,
      fullPaid: order.fullPaid,
      createdAt: order.createdAt.toISOString(),
      shippingAddress: order.shippingAddress,
      shippingCity: order.shippingCity,
      shippingState: order.shippingState,
      shippingPincode: order.shippingPincode,
      gstNumber: order.gstNumber || undefined,
      advertiser: {
        name: order.advertiser.name,
        companyName: order.advertiser.companyName,
        email: order.advertiser.email,
        phone: order.advertiser.phone || undefined,
      },
      items: order.items.map((item: any) => ({
        product: { name: item.product.name, capacity: item.product.capacity },
        quantity: item.quantity,
        pricePerUnit: Number(item.pricePerUnit),
        totalPrice: Number(item.totalPrice),
      })),
    });

    const buffer = Buffer.from(html, 'utf-8');
    const filename = getInvoiceFilename({
      invoiceNumber: order.invoiceNumber,
      orderNumber: order.orderNumber,
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/msword',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice', details: error.message },
      { status: 500 }
    );
  }
}
