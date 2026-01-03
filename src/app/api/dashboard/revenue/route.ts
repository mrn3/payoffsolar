import { NextRequest, NextResponse } from 'next/server';
import { OrderModel } from '@/lib/models';

export async function GET(request: NextRequest) {
	try {
	  const { searchParams } = new URL(request.url);
	  const timePeriod = searchParams.get('timePeriod') || 'month';

	  let revenueData;

	  switch (timePeriod) {
	    case 'year': {
	      const years = parseInt(searchParams.get('years') || '5');
	      if (isNaN(years) || years < 1 || years > 10) {
	        return NextResponse.json({ error: 'Years must be between 1 and 10' }, { status: 400 });
	      }
	      revenueData = await OrderModel.getRevenueByYear(years);
	      break;
	    }

	    case 'month': {
	      const months = parseInt(searchParams.get('months') || '12');
	      if (isNaN(months) || months < 1 || months > 24) {
	        return NextResponse.json({ error: 'Months must be between 1 and 24' }, { status: 400 });
	      }
	      revenueData = await OrderModel.getRevenueByMonth(months);
	      break;
	    }

	    case 'week': {
	      const weeks = parseInt(searchParams.get('weeks') || '20');
	      if (isNaN(weeks) || weeks < 1 || weeks > 52) {
	        return NextResponse.json({ error: 'Weeks must be between 1 and 52' }, { status: 400 });
	      }
	      revenueData = await OrderModel.getRevenueByWeek(weeks);
	      break;
	    }

	    case 'day': {
	      const days = parseInt(searchParams.get('days') || '31');
	      if (isNaN(days) || days < 1 || days > 365) {
	        return NextResponse.json({ error: 'Days must be between 1 and 365' }, { status: 400 });
	      }
	      revenueData = await OrderModel.getRevenueByDay(days);
	      break;
	    }

	    default:
	      return NextResponse.json({ error: 'Invalid timePeriod. Must be year, month, week, or day' }, { status: 400 });
	  }

	  return NextResponse.json(revenueData);
	} catch (error) {
	  console.error('Error fetching revenue data:', error);
	  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
