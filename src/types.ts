export interface Category {
  id: string
  name: string
  slug: string
}

export interface Game {
  id: string
  title: string
  description: string
  categoryId: string
  imagePath?: string
  rating: number
  recommended: boolean
  tags: string[]
  platform: string
  createdAt: string
  updatedAt: string
}

export interface Db {
  categories: Category[]
  games: Game[]
}

export type Permission = 'admin' | 'write' | 'read' | 'none'
