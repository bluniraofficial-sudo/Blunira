import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { put } from '@vercel/blob';
import { sendPaymentReminderEmail } from '@/lib/email';

// POST /api/payments - Record payment
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
      include: { role: true, advertiser: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const orderId = formData.get('orderId') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const paymentType = formData.get('paymentType') as string; // ADVANCE or BALANCE
    const paymentMethod = formData.get('paymentMethod') as string;
    const transactionId = formData.get('transactionId') as string;
    const notes = formData.get('notes') as string;
    const paymentProofFile = formData.get('paymentProof') as File | null;

    // Validate required fields
    if (!orderId || !amount || !paymentType || !paymentMethod) {
      return NextResponse.json(
        { error: 'Order ID, amount, payment type, and method are required' },
        { status: 400 }
      );
    }

    // Get order
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { advertiser: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check authorization (advertiser can only pay for their own orders)
    if (user.role.name === 'ADVERTISER' && order.advertiserId !== user.advertiserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Upload payment proof if provided
    let paymentProofUrl: string | null = null;
    if (paymentProofFile && paymentProofFile.size > 0) {
      const filename = `payments/${orderId}-${Date.now()}-${paymentProofFile.name}`;
      const blob = await put(filename, paymentProofFile, {
        access: 'public',
      });
      paymentProofUrl = blob.url;
    }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        orderId,
        amount,
        paymentType,
        paymentMethod,
        transactionId,
        paymentProof: paymentProofUrl,
        notes,
        status: 'PENDING', // Admin needs to verify
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'PAYMENT_SUBMITTED',
        details: `Payment of ₹${amount} submitted for order ${order.orderNumber}`,
      },
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { error: 'Failed to record payment', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/payments - Get payments (with filtering)
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    let whereClause: any = {};
    
    if (orderId) {
      whereClause.orderId = orderId;
    }

    // If advertiser, filter by their orders
    if (user.role.name === 'ADVERTISER') {
      const advertiserOrders = await db.order.findMany({
        where: { advertiserId: user.advertiserId! },
        select: { id: true },
      });
      whereClause.orderId = { in: advertiserOrders.map((o) => o.id) };
    }

    const payments = await db.payment.findMany({
      where: whereClause,
      include: {
        order: {
          include: {
            advertiser: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ payments });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments', details: error.message },
      { status: 500 }
    );
  }
}
