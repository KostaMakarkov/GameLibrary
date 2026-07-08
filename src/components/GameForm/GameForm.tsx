import { useState, type FormEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { uploadImage } from '../../lib/github'
import { getImageUrl } from '../../lib/db'
import { getRepoInfo } from '../../lib/repoInfo'
import { GITHUB_BRANCH } from '../../config'
import { StarRating } from '../StarRating'
import type { Category, Game } from '../../types'

export interface GameFormValues {
  title: string
  description: string
  categoryId: string
  imagePath?: string
  rating: number
  recommended: boolean
  tags: string[]
  platform: string
}

const PLATFORM_OPTIONS = ['PC', 'PS4', 'PS5', 'Switch', 'Switch2', 'XBOX']
const NEW_CATEGORY_VALUE = '__new__'

function parsePlatform(platform: string | undefined): { selected: string[]; other: string } {
  if (!platform) return { selected: [], other: '' }
  const tokens = platform
    .split('/')
    .map((t) => t.trim())
    .filter(Boolean)
  const selected: string[] = []
  const other: string[] = []
  for (const token of tokens) {
    const match = PLATFORM_OPTIONS.find((opt) => opt.toLowerCase() === token.toLowerCase())
    if (match) {
      if (!selected.includes(match)) selected.push(match)
    } else {
      other.push(token)
    }
  }
  return { selected, other: other.join(' / ') }
}

interface GameFormProps {
  categories: Category[]
  initial?: Game
  onSubmit: (values: GameFormValues) => void
  onCancel: () => void
  onCreateCategory?: (name: string) => Promise<Category>
  submitting?: boolean
}

export function GameForm({
  categories,
  initial,
  onSubmit,
  onCancel,
  onCreateCategory,
  submitting,
}: GameFormProps) {
  const { token } = useAuth()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? '')
  const [imagePath, setImagePath] = useState(initial?.imagePath)
  const [rating, setRating] = useState(initial?.rating ?? 3)
  const [recommended, setRecommended] = useState(initial?.recommended ?? false)
  const [tagsText, setTagsText] = useState(initial?.tags.join(', ') ?? '')
  const initialPlatform = parsePlatform(initial?.platform)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(initialPlatform.selected)
  const [otherEnabled, setOtherEnabled] = useState(initialPlatform.other.length > 0)
  const [otherPlatform, setOtherPlatform] = useState(initialPlatform.other)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [creatingCategory, setCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [creatingCategoryBusy, setCreatingCategoryBusy] = useState(false)
  const [creatingCategoryError, setCreatingCategoryError] = useState<string | null>(null)

  const handleImageChange = async (file: File | undefined) => {
    if (!file || !token) return
    setUploading(true)
    setUploadError(null)
    try {
      const { owner, repo } = getRepoInfo()
      const path = await uploadImage(token, owner, repo, file, GITHUB_BRANCH)
      setImagePath(path)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleCategoryChange = (value: string) => {
    if (value === NEW_CATEGORY_VALUE) {
      setCreatingCategory(true)
      return
    }
    setCategoryId(value)
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !onCreateCategory) return
    setCreatingCategoryBusy(true)
    setCreatingCategoryError(null)
    try {
      const category = await onCreateCategory(newCategoryName.trim())
      setCategoryId(category.id)
      setCreatingCategory(false)
      setNewCategoryName('')
    } catch (err) {
      setCreatingCategoryError(err instanceof Error ? err.message : 'Failed to create category')
    } finally {
      setCreatingCategoryBusy(false)
    }
  }

  const togglePlatform = (name: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name],
    )
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !categoryId) return
    const platform = [...selectedPlatforms, ...(otherEnabled && otherPlatform.trim() ? [otherPlatform.trim()] : [])].join(
      ' / ',
    )
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      categoryId,
      imagePath,
      rating,
      recommended,
      tags: tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      platform,
    })
  }

  const previewUrl = getImageUrl(imagePath)

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Title</label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded border border-slate-300 bg-transparent px-3 py-1.5 text-sm dark:border-slate-700"
          required
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded border border-slate-300 bg-transparent px-3 py-1.5 text-sm dark:border-slate-700"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Category</label>
        {creatingCategory ? (
          <div className="space-y-1.5">
            <div className="flex gap-2">
              <input
                autoFocus
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category name"
                className="flex-1 rounded border border-slate-300 bg-transparent px-3 py-1.5 text-sm dark:border-slate-700"
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={creatingCategoryBusy || !newCategoryName.trim()}
                className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {creatingCategoryBusy ? 'Adding…' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => setCreatingCategory(false)}
                className="rounded px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
            {creatingCategoryError && <p className="text-xs text-red-600">{creatingCategoryError}</p>}
          </div>
        ) : (
          <select
            value={categoryId}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full rounded border border-slate-300 bg-transparent px-2 py-1.5 text-sm dark:border-slate-700"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            {onCreateCategory && <option value={NEW_CATEGORY_VALUE}>+ Add new category…</option>}
          </select>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Platform</label>
        <div className="flex flex-wrap gap-2">
          {PLATFORM_OPTIONS.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-1.5 rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-700"
            >
              <input
                type="checkbox"
                checked={selectedPlatforms.includes(opt)}
                onChange={() => togglePlatform(opt)}
              />
              {opt}
            </label>
          ))}
          <label className="flex items-center gap-1.5 rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-700">
            <input
              type="checkbox"
              checked={otherEnabled}
              onChange={(e) => {
                setOtherEnabled(e.target.checked)
                if (!e.target.checked) setOtherPlatform('')
              }}
            />
            Other
          </label>
        </div>
        {otherEnabled && (
          <input
            autoFocus
            value={otherPlatform}
            onChange={(e) => setOtherPlatform(e.target.value)}
            placeholder="Custom platform"
            className="mt-2 w-full rounded border border-slate-300 bg-transparent px-3 py-1.5 text-sm dark:border-slate-700"
          />
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Tags (comma separated)</label>
        <input
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder="co-op, roguelike"
          className="w-full rounded border border-slate-300 bg-transparent px-3 py-1.5 text-sm dark:border-slate-700"
        />
      </div>

      <div className="flex items-center gap-4">
        <div>
          <span className="mb-1 block text-xs font-medium text-slate-500">Rating</span>
          <StarRating value={rating} onChange={setRating} />
        </div>
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={recommended}
            onChange={(e) => setRecommended(e.target.checked)}
          />
          Recommended
        </label>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Cover image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleImageChange(e.target.files?.[0])}
          disabled={uploading}
          className="text-sm"
        />
        {uploading && <p className="mt-1 text-xs text-slate-500">Uploading…</p>}
        {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}
        {previewUrl && (
          <img src={previewUrl} alt="Cover preview" className="mt-2 h-24 w-24 rounded object-cover" />
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || uploading || !title.trim()}
          className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Save game'}
        </button>
      </div>
    </form>
  )
}
