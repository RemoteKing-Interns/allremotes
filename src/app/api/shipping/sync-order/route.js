import { NextResponse } from 'next/server';
import StarshipitAPI from '../../../../lib/starshipit';

export async function POST(request) {
  try {
    const orderData = await request.json();

    if (!orderData || !orderData.id) {
      return NextResponse.json(
        { error: 'Order data is required' },
        { status: 400 }
      );
    }

    // Initialize Starshipit API
    const starshipit = new StarshipitAPI();
    
    // Sync order with Starshipit
    const result = await starshipit.createOrder(orderData);

    return NextResponse.json({
      success: true,
      starshipitOrderId: result.order_id,
      message: 'Order synced with Starshipit successfully',
    });

  } catch (error) {
    console.error('Starshipit order sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to sync order with Starshipit' 
      },
      { status: 500 }
    );
  }
}
