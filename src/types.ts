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
  createdBy: string
  createdByUserId?: string
  createdAt: string
  updatedAt: string
}

export interface Db {
  categories: Category[]
  games: Game[]
}

export type Permission = 'admin' | 'write' | 'read' | 'none'

export interface StoredUser {
  id: string
  username: string
  displayName: string
  isOwner: boolean
  mustChangePin: boolean
  salt: string
  iv: string
  ciphertext: string
}

export interface UsersDb {
  users: StoredUser[]
}

// A personal list is a user's own way of organizing any game in the library
// (e.g. "Games to play") - independent of the shared admin-managed categories.
export interface PersonalList {
  id: string
  ownerId: string
  name: string
  gameIds: string[]
}

export interface UserListsDb {
  lists: PersonalList[]
}
