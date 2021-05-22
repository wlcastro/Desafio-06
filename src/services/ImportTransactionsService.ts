import csvParse from 'csv-parse';
import { getRepository, getCustomRepository, In } from 'typeorm';
import path from 'path';
import fs from 'fs';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

import Category from '../models/Category';

interface Request {
  csvFilename: string;
}

interface CSVTransaction {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute({ csvFilename }: Request): Promise<Transaction[]> {
    const csvFilePath = path.resolve(__dirname, '..', '..', 'tmp', csvFilename);
    const readCSVStream = fs.createReadStream(csvFilePath);
    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });
    const cats: string[] = [];
    const trans: CSVTransaction[] = [];

    const parseCSV = readCSVStream.pipe(parseStream);
    parseCSV.on('data', async line => {
      trans.push({
        title: line[0],
        value: line[2],
        type: line[1],
        category: line[3],
      });
      cats.push(line[3]);
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const categoryRepository = getRepository(Category);

    const oldCategories = await categoryRepository.find({
      where: { title: In(cats) },
    });

    const existCatsTits = oldCategories.map(cat => cat.title);

    const addCat = cats
      .filter(cat => !existCatsTits.includes(cat))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCats = categoryRepository.create(addCat.map(title => ({ title })));
    await categoryRepository.save(newCats);

    const allCats = [...newCats, ...oldCategories];
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transactions = transactionsRepository.create(
      trans.map(tran => ({
        title: tran.title,
        type: tran.type,
        value: tran.value,
        category: allCats.find(cat => cat.title === tran.category),
      })),
    );

    await transactionsRepository.save(transactions);
    await fs.promises.unlink(csvFilePath);

    return transactions;
  }
}

export default ImportTransactionsService;
