import { AppDataSource } from '../config/data-source'
import { makeError } from '../lib/errors'
import { Category } from './category.entity'

export class CategoryService {
  categoryRepository = AppDataSource.getRepository(Category)

  async getAllCategories(
    pageSize: number,
    offset: number
  ): Promise<{ data: Category[]; total: number; page: number; pages: number }> {
    const allowedSizes = [10, 25, 50]

    if (!Number.isFinite(pageSize) || !Number.isFinite(offset)) {
      throw makeError('CategoryError', 400, 'Page size and offset are required')
    }

    if (!allowedSizes.includes(pageSize)) {
      throw makeError('CategoryError', 400, 'This page size is not allowed')
    }

    const skip = Math.max(0, offset)

    const [categories, total] = await this.categoryRepository.findAndCount({
      order: { name: 'ASC' },
      take: pageSize,
      skip: skip,
    })

    const page = Math.floor(skip / pageSize) + 1
    const pages = Math.max(1, Math.ceil(total / pageSize))

    return { data: categories, total, page, pages }
  }

  async addCategory(name: string, description: string) {
    if (!name || !description)
      throw makeError('CategoryError', 400, 'Name and description are required')

    const categoryName = name.trim()
    const categoryDescription = description.trim()

    try {
      const newCategory = this.categoryRepository.create({
        name: categoryName,
        description: categoryDescription,
      })

      await this.categoryRepository.save(newCategory)
      return newCategory
    } catch (error: any) {
      if (error.code === '23505')
        throw makeError('CategoryError', 409, 'Category already exists')

      throw makeError('CategoryError', 500, 'Failed to create category')
    }
  }

  async updateCategory(id: number, name: string, description: string) {
    if (!id || !name || !description)
      throw makeError('CategoryError', 400, 'Name and description are required')

    const categoryName = name.trim()
    const categoryDescription = description.trim()

    const existingCategory = await this.categoryRepository.findOneBy({
      id,
    })

    if (!existingCategory) {
      throw makeError(
        'CategoryError',
        404,
        `Category with id ${id} doesn't exists`
      )
    }
    existingCategory.name = categoryName
    existingCategory.description = categoryDescription

    try {
      const saved = await this.categoryRepository.save(existingCategory)
      return saved
    } catch (err: any) {
      if (err?.code === '23505') {
        throw makeError('CategoryError', 409, `Category name already exists`)
      }
      throw makeError('CategoryError', 500, 'Failed to update category')
    }
  }

  async deleteCategory(id: number) {
    if (id == null) {
      throw makeError('CategoryError', 400, 'Category id is required')
    }

    let result

    try {
      const result = await this.categoryRepository.delete(id)
    } catch (err: any) {
      if (err?.code === '23503') {
        throw makeError(
          'CategoryError',
          409,
          'Category is in use and cannot be deleted'
        )
      }
      throw makeError('CategoryError', 500, 'Failed to delete category')
    }

    if (result!.affected === 0) {
      throw makeError('CategoryError', 404, `Category with id ${id} not found`)
    }
  }
}
