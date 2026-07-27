import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { sendInvoiceEmail } from '@/lib/email';

// PATCH /api/payments/[id]/verify - Verify payment (admin only)
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
    const { status, notes } = body; // status: VERIFIED or REJECTED

    if (!status || !['VERIFIED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status (VERIFIED or REJECTED) is required' },
        { status: 400 }
      );
    }

    const payment = await db.payment.findUnique({
      where: { id: id },
      include: {
        order: {
          include: {
            advertiser: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Update payment
    const updatedPayment = await db.payment.update({
      where: { id },
      data: {
        status,
        verifiedBy: user.id,
        verifiedAt: new Date(),
        notes,
      },
    });

    // If verified, update order payment status
    if (status === 'VERIFIED') {
      const order = payment.order;
      const updateData: any = {};

      if (payment.paymentType === 'ADVANCE') {
        updateData.advancePaid = true;
        updateData.advancePaidAt = new Date();
        updateData.status = 'CONFIRMED'; // Move order to confirmed status
      } else if (payment.paymentType === 'BALANCE') {
        updateData.fullPaid = true;
        updateData.fullPaidAt = new Date();
      }

      await db.order.update({
        where: { id: order.id },
        data: updateData,
      });

      // Send invoice if advance paid and invoice exists
      if (payment.paymentType === 'ADVANCE' && order.invoiceUrl) {
        try {
          await sendInvoiceEmail(order.advertiser.email, {
            orderNumber: order.orderNumber,
            companyName: order.advertiser.companyName,
            invoiceNumber: order.invoiceNumber!,
            invoiceUrl: order.invoiceUrl,
          });
        } catch (emailError) {
          console.error('Failed to send invoice email:', emailError);
        }
      }
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'PAYMENT_VERIFIED',
        details: `Payment ${id} ${status} for order ${payment.order.orderNumber}`,
      },
    });

    return NextResponse.json({ payment: updatedPayment });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment', details: error.message },
      { status: 500 }
    );
  }
}
