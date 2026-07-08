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

interface GameFormProps {
  categories: Category[]
  initial?: Game
  onSubmit: (values: GameFormValues) => void
  onCancel: () => void
  submitting?: boolean
}

export function GameForm({ categories, initial, onSubmit, onCancel, submitting }: GameFormProps) {
  const { token } = useAuth()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? '')
  const [imagePath, setImagePath] = useState(initial?.imagePath)
  const [rating, setRating] = useState(initial?.rating ?? 3)
  const [recommended, setRecommended] = useState(initial?.recommended ?? false)
  const [tagsText, setTagsText] = useState(initial?.tags.join(', ') ?? '')
  const [platform, setPlatform] = useState(initial?.platform ?? '')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !categoryId) return
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
      platform: platform.trim(),
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

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-500">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded border border-slate-300 bg-transparent px-2 py-1.5 text-sm dark:border-slate-700"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-500">Platform</label>
          <input
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            placeholder="PC / Switch"
            className="w-full rounded border border-slate-300 bg-transparent px-3 py-1.5 text-sm dark:border-slate-700"
          />
        </div>
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
