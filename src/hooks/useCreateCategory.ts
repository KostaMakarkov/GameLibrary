import { useCallback } from 'react'
import { useOptimisticCommit } from './useOptimisticCommit'
import { slugify } from '../lib/slug'
import type { Category } from '../types'

export function useCreateCategory() {
  const { run } = useOptimisticCommit()

  const createCategory = useCallback(
    (name: string): Promise<Category> => {
      const category: Category = { id: crypto.randomUUID(), name, slug: slugify(name) }
      run(
        (current) => ({ ...current, categories: [...current.categories, category] }),
        `Add category: ${name}`,
        `Added category "${name}"`,
        `Failed to add category "${name}"`,
      )
      return Promise.resolve(category)
    },
    [run],
  )

  return { createCategory }
}
