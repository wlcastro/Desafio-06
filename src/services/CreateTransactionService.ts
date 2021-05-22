import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateCategoryService from './CreateCategoryService';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const balance = await transactionsRepository.getBalance();
    if (type === 'outcome' && balance.total < value) {
      throw new AppError('Insufficient funds', 400);
    }
    const createCategoryService = new CreateCategoryService();
    const newCategory = await createCategoryService.execute({
      title: category,
    });
    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: newCategory,
    });
    await transactionsRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
