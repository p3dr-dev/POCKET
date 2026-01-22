import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { AIRouterService } from '@/services/ai-router.service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { input } = await request.json();
    if (!input) return NextResponse.json({ error: 'Input vazio' }, { status: 400 });

    const result = await AIRouterService.process(session.user.id, input);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI Agent Error:', error);
    return NextResponse.json({ error: 'Erro no processamento da IA' }, { status: 500 });
  }
}
