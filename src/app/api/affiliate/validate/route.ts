import { NextRequest, NextResponse } from 'next/server';
import { AffiliateCodeModel } from '@/lib/models';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({
        error: 'Affiliate code is required'
      }, { status: 400 });
    }

    const validation = await AffiliateCodeModel.validateCode(code.toUpperCase());

    if (!validation.valid) {
      return NextResponse.json({
        valid: false,
        reason: validation.reason
      }, { status: 200 });
    }

    return NextResponse.json({
      valid: true,
      affiliateCode: {
        id: validation.affiliateCode!.id,
        code: validation.affiliateCode!.code,
        name: validation.affiliateCode!.name,
        discount_type: validation.affiliateCode!.discount_type,
        discount_value: validation.affiliateCode!.discount_value
      }
    });
  } catch (error) {
    console.error('Error validating affiliate code:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({
        error: 'Affiliate code is required'
      }, { status: 400 });
    }

    const validation = await AffiliateCodeModel.validateCode(code.toUpperCase());

    if (!validation.valid) {
      return NextResponse.json({
        valid: false,
        reason: validation.reason
      }, { status: 200 });
    }

    return NextResponse.json({
      valid: true,
      affiliateCode: {
        id: validation.affiliateCode!.id,
        code: validation.affiliateCode!.code,
        name: validation.affiliateCode!.name,
        discount_type: validation.affiliateCode!.discount_type,
        discount_value: validation.affiliateCode!.discount_value
      }
    });
  } catch (error) {
    console.error('Error validating affiliate code:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
