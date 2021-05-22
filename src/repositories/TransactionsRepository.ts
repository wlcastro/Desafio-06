import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();
    const balance: Balance = { income: 0, outcome: 0, total: 0 };

    const tot = (acc: number, trans: Transaction): number => {
      if (trans.type === 'income') return acc + trans.value;
      return acc - trans.value;
    };

    const inc = (acc: number, trans: Transaction): number => {
      if (trans.type === 'income') return acc + trans.value;
      return acc;
    };
    const out = (acc: number, trans: Transaction): number => {
      if (trans.type === 'outcome') return acc + trans.value;
      return acc;
    };

    balance.income = transactions.reduce(inc, 0);
    balance.outcome = transactions.reduce(out, 0);
    balance.total = transactions.reduce(tot, 0);

    return balance || null;
  }
}

export default TransactionsRepository;
