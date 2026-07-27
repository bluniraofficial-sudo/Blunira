import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { sendOrderStatusEmail } from '@/lib/email';

// GET /api/orders/[id] - Get single order
export async function GET(
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const order = await db.order.findUnique({
      where: { id: id, isDeleted: false },
      include: {
        advertiser: true,
        items: {
          include: {
            product: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check authorization
    if (user.role.name === 'ADVERTISER' && order.advertiserId !== user.advertiserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[id] - Update order (admin only)
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

    const order = await db.order.findUnique({
      where: { id: id },
      include: { advertiser: true, payments: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const body = await request.json();
    const { status, invoiceNumber, invoiceUrl, notes, advancePaid, fullPaid, paidAmount, paymentMethod, paymentNotes, dispatchDate, trackingNumber, courierName, deliveryDate, deliveredBy, deliveryInstructions, handleMissingItems, specialHandling } = body;

    const updateData: any = {
      ...(invoiceNumber && { invoiceNumber }),
      ...(invoiceUrl && { invoiceUrl }),
      ...(notes && { notes }),
      ...(deliveryInstructions && { deliveryInstructions }),
      ...(handleMissingItems && { handleMissingItems }),
      ...(specialHandling && { specialHandling }),
      ...(dispatchDate && { dispatchDate: new Date(dispatchDate) }),
      ...(trackingNumber && { trackingNumber }),
      ...(courierName && { courierName }),
      ...(deliveryDate && { deliveryDate: new Date(deliveryDate) }),
      ...(deliveredBy && { deliveredBy }),
    };

    if (status && status !== order.status) {
      updateData.status = status;
      const timestampField = `${status.toLowerCase()}At`;
      if (timestampField === 'confirmedAt') updateData.confirmedAt = new Date();
      else if (timestampField === 'processingAt') updateData.processingAt = new Date();
      else if (timestampField === 'shippedAt') updateData.shippedAt = new Date();
      else if (timestampField === 'deliveredAt') updateData.deliveredAt = new Date();
      else if (timestampField === 'cancelledAt') updateData.cancelledAt = new Date();
    }

    if (advancePaid !== undefined) {
      updateData.advancePaid = advancePaid;
      if (advancePaid && !order.advancePaid) {
        updateData.advancePaidAt = new Date();
        if (!updateData.status || order.status === 'PENDING') {
          updateData.status = 'CONFIRMED';
          updateData.confirmedAt = new Date();
        }
      }
    }

    if (fullPaid !== undefined) {
      updateData.fullPaid = fullPaid;
      if (fullPaid && !order.fullPaid) {
        updateData.fullPaidAt = new Date();
      }
    }

    if (!order.invoiceNumber) {
      updateData.invoiceNumber = `INV-${order.orderNumber}`;
      updateData.invoiceUrl = `/api/orders/${id}/invoice`;
    }

    const updatedOrder = await db.order.update({
      where: { id },
      data: updateData,
      include: {
        advertiser: true,
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
      },
    });

    if (paidAmount && Number(paidAmount) > 0) {
      const verifiedPayments = order.payments.filter((p) => p.status === 'VERIFIED');
      const totalVerified = verifiedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      const advanceVerified = verifiedPayments
        .filter((p) => p.paymentType === 'ADVANCE')
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const balanceVerified = verifiedPayments
        .filter((p) => p.paymentType === 'BALANCE')
        .reduce((sum, p) => sum + Number(p.amount), 0);

      let paymentType = 'ADVANCE';
      if (advancePaid && !order.advancePaid) {
        paymentType = 'ADVANCE';
      } else if (fullPaid && !order.fullPaid) {
        paymentType = 'BALANCE';
      } else if (paymentMethod === 'BANK_TRANSFER' || paymentMethod === 'UPI' || paymentMethod === 'CARD' || paymentMethod === 'CASH') {
        paymentType = advanceVerified < Number(order.advanceAmount) ? 'ADVANCE' : 'BALANCE';
      }

      await db.payment.create({
        data: {
          orderId: id,
          amount: Number(paidAmount),
          paymentType,
          paymentMethod: paymentMethod || 'BANK_TRANSFER',
          status: 'VERIFIED',
          notes: paymentNotes || 'Manually marked as paid by admin',
          verifiedBy: user.id,
          verifiedAt: new Date(),
        },
      });

      if (!updatedOrder.invoiceNumber) {
        await db.order.update({
          where: { id },
          data: {
            invoiceNumber: `INV-${order.orderNumber}`,
            invoiceUrl: `/api/orders/${id}/invoice`,
          },
        });
      }
    }

    // Send status update email if status changed
    if (status && status !== order.status) {
      const statusMessages: Record<string, string> = {
        CONFIRMED: 'Your order has been confirmed and is being prepared.',
        PROCESSING: 'Your order is being processed and packed.',
        SHIPPED: 'Your order has been shipped and is on its way!',
        DELIVERED: 'Your order has been successfully delivered.',
        CANCELLED: 'Your order has been cancelled.',
      };

      try {
        await sendOrderStatusEmail(order.advertiser.email, {
          orderNumber: order.orderNumber,
          companyName: order.advertiser.companyName,
          status,
          statusMessage: statusMessages[status] || 'Order status has been updated.',
        });
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
      }
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'ORDER_UPDATED',
        details: `Updated order ${order.orderNumber}. Changes: ${JSON.stringify(body)}`,
      },
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[id] - Soft delete order (admin only)
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

    await db.order.update({
      where: { id },
      data: { isDeleted: true },
    });

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'ORDER_DELETED',
        details: `Deleted order ${id}`,
      },
    });

    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order', details: error.message },
      { status: 500 }
    );
  }
}
