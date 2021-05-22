import { getRepository } from 'typeorm';
// import AppError from '../errors/AppError';

import Category from '../models/Category';

interface Request {
  title: string;
}

class CreateCategoryService {
  public async execute({ title }: Request): Promise<Category> {
    const categoryRepository = getRepository(Category);
    const categories = await categoryRepository.find({
      where: { title },
    });
    if (!categories.length) {
      const newCategory = categoryRepository.create({ title });
      await categoryRepository.save(newCategory);
      categories.push(newCategory);
    }
    return categories[0];
  }
}

export default CreateCategoryService;
