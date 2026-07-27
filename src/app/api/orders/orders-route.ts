import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { sendOrderConfirmationEmail } from '@/lib/email';

// GET /api/orders - List orders (with role-based filtering)
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
      include: { role: true, advertiser: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build query based on role
    let whereClause: any = { isDeleted: false };
    
    if (user.role.name === 'ADVERTISER') {
      if (!user.advertiserId) {
        return NextResponse.json({ error: 'Advertiser not linked' }, { status: 400 });
      }
      whereClause.advertiserId = user.advertiserId;
    }
    // Super admins can see all orders (no additional where clause)

    const orders = await db.order.findMany({
      where: whereClause,
      include: {
        advertiser: {
          select: {
            id: true,
            name: true,
            companyName: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create new order
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

    if (!user || !user.advertiser) {
      return NextResponse.json({ error: 'Advertiser not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      items, // [{ productId, quantity }]
      shippingAddress,
      shippingCity,
      shippingState,
      shippingPincode,
      billingAddress,
      billingCity,
      billingState,
      billingPincode,
      gstNumber,
      notes,
      deliveryInstructions,
      handleMissingItems,
      deliveryPreference,
      specialHandling,
    } = body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Order items are required' }, { status: 400 });
    }

    // Validate shipping address
    if (!shippingAddress || !shippingCity || !shippingState || !shippingPincode) {
      return NextResponse.json({ error: 'Complete shipping address is required' }, { status: 400 });
    }

    // Calculate order total and validate MOQ
    let totalAmount = 0;
    const orderItems: any[] = [];

    for (const item of items) {
      const product = await db.bottleProduct.findUnique({
        where: { id: item.productId },
      });

      if (!product || product.isDeleted || product.status !== 'ACTIVE') {
        return NextResponse.json(
          { error: `Product ${item.productId} not found or inactive` },
          { status: 400 }
        );
      }

      // Check MOQ in bottles
      const moqUnits = product.moq * product.bottlesPerPack;
      if (item.quantity < moqUnits) {
        return NextResponse.json(
          { error: `Minimum order quantity for ${product.name} is ${product.moq} pack${product.moq === 1 ? '' : 's'} (${moqUnits} bottles)` },
          { status: 400 }
        );
      }

      const packs = Math.floor(item.quantity / product.bottlesPerPack);
      const remaining = item.quantity % product.bottlesPerPack;
      const remainingPrice = remaining > 0 ? (Number(product.pricePerPack) / product.bottlesPerPack) * remaining : 0;
      const itemTotal = packs * Number(product.pricePerPack) + remainingPrice;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        pricePerUnit: Number(product.pricePerPack) / product.bottlesPerPack,
        totalPrice: itemTotal,
      });
    }

    // Calculate advance (50%)
    const advanceAmount = totalAmount * 0.5;
    const balanceAmount = totalAmount - advanceAmount;

    // Generate order number
    const currentYear = new Date().getFullYear();
    const orderCount = await db.order.count();
    const orderNumber = `ORD-${currentYear}-${String(orderCount + 1).padStart(5, '0')}`;

    // Create order with items
    const order = await db.order.create({
      data: {
        orderNumber,
        advertiserId: user.advertiser.id,
        totalAmount,
        advanceAmount,
        balanceAmount,
        shippingAddress,
        shippingCity,
        shippingState,
        shippingPincode,
        billingAddress: billingAddress || shippingAddress,
        billingCity: billingCity || shippingCity,
        billingState: billingState || shippingState,
        billingPincode: billingPincode || shippingPincode,
        gstNumber,
        notes,
        deliveryInstructions,
        handleMissingItems,
        specialHandling,
        status: 'PENDING',
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        advertiser: true,
      },
    });

    // Send order confirmation email
    try {
      await sendOrderConfirmationEmail(user.advertiser.email, {
        orderNumber: order.orderNumber,
        companyName: user.advertiser.companyName,
        totalAmount,
        advanceAmount,
        items: order.items.map((item: any) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: Number(item.totalPrice),
        })),
      });
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
      // Don't fail the order creation if email fails
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'ORDER_CREATED',
        details: `Created order ${order.orderNumber} for ${user.advertiser.companyName}`,
      },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    );
  }
}
