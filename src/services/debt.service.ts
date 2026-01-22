import prisma from '@/lib/prisma';

export class DebtService {
  
  static async createInstallments(data: {
    userId: string;
    description: string;
    totalAmount: number; // Valor total da compra
    installmentsCount: number;
    startDate: string;
    accountId: string;
  }) {
    const { userId, description, totalAmount, installmentsCount, startDate, accountId } = data;
    const installmentAmount = totalAmount / installmentsCount;
    const baseDate = new Date(startDate);
    const groupId = crypto.randomUUID();

    const debts = [];
    for (let i = 1; i <= installmentsCount; i++) {
      const dueDate = new Date(baseDate);
      dueDate.setMonth(baseDate.getMonth() + (i - 1));

      // Ajuste para fim do mês
      if (dueDate.getMonth() !== (baseDate.getMonth() + (i - 1)) % 12) {
        dueDate.setDate(0);
      }

      debts.push({
        description: `${description} (${i}/${installmentsCount})`,
        totalAmount: installmentAmount,
        paidAmount: 0,
        dueDate,
        userId,
        groupId // Facilita deletar ou editar o grupo todo
      });
    }

    return await prisma.debt.createMany({
      data: debts
    });
  }

  static async pay(debtId: string, userId: string, amount: number, accountId: string, date: string) {
    const debt = await prisma.debt.findUnique({ where: { id: debtId, userId } });
    if (!debt) throw new Error('Dívida não encontrada');

    const txDate = new Date(date);
    
    // Resolver categoria de Dívidas
    let category = await prisma.category.findUnique({
      where: { name_userId: { name: 'Dívidas', userId } }
    });

    if (!category) {
      category = await prisma.category.create({
        data: { name: 'Dívidas', type: 'EXPENSE', userId }
      });
    }

    return await prisma.$transaction([
      // 1. Atualizar a dívida
      prisma.debt.update({
        where: { id: debtId },
        data: { paidAmount: { increment: amount } }
      }),
      // 2. Criar a transação financeira real
      prisma.transaction.create({
        data: {
          description: `Pagamento: ${debt.description}`,
          amount,
          date: txDate,
          type: 'EXPENSE',
          categoryId: category.id,
          accountId,
          userId
        }
      })
    ]);
  }
}
