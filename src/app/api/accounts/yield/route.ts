import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { YieldService } from '@/services/yield.service';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const result = await YieldService.processYields(session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Yield Process Error:', error);
    return NextResponse.json({ message: 'Internal Error' }, { status: 500 });
  }
}
