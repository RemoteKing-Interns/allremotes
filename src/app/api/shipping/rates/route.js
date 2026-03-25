import { NextResponse } from 'next/server';
import StarshipitAPI from '../../../../lib/starshipit';

const starshipit = new StarshipitAPI();

export async function POST(request) {
  try {
    const { address } = await request.json();

    if (!address || !address.zipCode || !address.city) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Get shipping rates from Starshipit
    const rates = await starshipit.getRates(address);

    // Format rates for frontend
    const formattedRates = rates.rates?.map(rate => ({
      id: rate.courier_code,
      name: rate.courier_name,
      description: rate.service_description,
      price: rate.total_price,
      estimatedDays: rate.estimated_delivery_days,
      tracking: rate.tracking_available,
      icon: getCourierIcon(rate.courier_code),
    })) || [];

    return NextResponse.json({
      rates: formattedRates,
      success: true,
    });

  } catch (error) {
    console.error('Shipping rates error:', error);
    
    // Return fallback rates if Starshipit fails
    const fallbackRates = [
      {
        id: 'standard',
        name: 'Standard Shipping',
        description: '3-5 business days',
        price: 12.00,
        estimatedDays: '3-5',
        tracking: true,
        icon: '📦',
      },
      {
        id: 'express',
        name: 'Express Shipping',
        description: '1-2 business days',
        price: 18.00,
        estimatedDays: '1-2',
        tracking: true,
        icon: '🚀',
      },
    ];

    return NextResponse.json({
      rates: fallbackRates,
      success: false,
      error: error.message,
    });
  }
}

function getCourierIcon(courierCode) {
  const icons = {
    'auspost': '📮',
    'sendle': '🚚',
    'fastway': '🏃',
    'tnt': '🚛',
    'dhl': '🚁',
    'fedex': '🛩️',
    'ups': '📦',
    'startrack': '⭐',
  };
  
  return icons[courierCode.toLowerCase()] || '📦';
}
