import { Router } from 'express'
import { handleError } from '../lib/http'
import { isAuthorized } from '../lib/middlewares'
import { CategoryService } from './category.service'

const router = Router()
const categoryService = new CategoryService()

router.use(isAuthorized)

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories()
    res.status(200).json(categories)
  } catch (err: unknown) {
    handleError(res, err)
  }
})

// Add a new category
router.post('/', async (req, res) => {
  const { name, description } = req.body
  try {
    const newCategory = await categoryService.addCategory(name, description)
    res.status(201).json(newCategory)
  } catch (err: unknown) {
    handleError(res, err)
  }
})

// Update a category
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const { name, description } = req.body

  try {
    const updatedCategory = await categoryService.updateCategory(
      id,
      name,
      description
    )
    res.status(200).json(updatedCategory)
  } catch (err: unknown) {
    handleError(res, err)
  }
})

// Delete a category
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid category id' })
  }

  try {
    await categoryService.deleteCategory(id)
    res.status(204).send()
  } catch (err: unknown) {
    handleError(res, err)
  }
})

export { router as categoryRouter }
