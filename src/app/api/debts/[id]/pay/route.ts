import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { DebtService } from '@/services/debt.service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { amount, accountId, date } = body;

    if (!amount || !accountId) {
      return NextResponse.json({ message: 'Dados incompletos' }, { status: 400 });
    }

    const userId = session.user.id;
    const dateStr = date || new Date().toISOString();

    try {
      await DebtService.pay(id, userId, Math.abs(Number(amount)), accountId, dateStr);
      return NextResponse.json({ message: 'Pagamento processado com sucesso' });
    } catch (err: any) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Debt Pay Error:', error);
    return NextResponse.json({ message: 'Erro ao processar pagamento', details: error.message }, { status: 500 });
  }
}
