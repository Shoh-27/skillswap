import { useState, useEffect, useRef } from 'react'
import { resourcesApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { Button, Spinner } from './ui'
import {
  Paperclip, Link2, FileText, Plus,
  Download, ExternalLink, Trash2, X,
  File, Image, FileVideo,
} from 'lucide-react'

/* ── Helpers ── */
function getMimeIcon(mimeType) {
  if (!mimeType) return File
  if (mimeType.startsWith('image/'))  return Image
  if (mimeType.startsWith('video/'))  return FileVideo
  return File
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

/* ── Add Resource Form ── */
function AddResourceForm({ onAdd, onClose }) {
  const [type, setType]     = useState('link')
  const [form, setForm]     = useState({ title: '', url: '', content: '' })
  const [file, setFile]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const fileRef             = useRef()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async () => {
    setError('')
    if (!form.title) { setError('Title is required.'); return }
    if (type === 'link' && !form.url) { setError('URL is required.'); return }
    if (type === 'note' && !form.content) { setError('Content is required.'); return }
    if (type === 'file' && !file) { setError('Please select a file.'); return }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('type', type)
      fd.append('title', form.title)
      if (type === 'link')   fd.append('url', form.url)
      if (type === 'note')   fd.append('content', form.content)
      if (type === 'file')   fd.append('file', file)
      await onAdd(fd)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed.')
    } finally { setLoading(false) }
  }

  const typeBtn = (t, icon, label) => (
    <button
      type="button"
      onClick={() => setType(t)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
        type === t
          ? 'bg-indigo-600 text-white border-indigo-600'
          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
      }`}
    >
      {icon}{label}
    </button>
  )

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {typeBtn('link', <Link2 size={12} />, 'Link')}
          {typeBtn('file', <Paperclip size={12} />, 'File')}
          {typeBtn('note', <FileText size={12} />, 'Note')}
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
          <X size={15} />
        </button>
      </div>

      {error && <p className="text-xs text-rose-500">{error}</p>}

      <input
        type="text"
        placeholder="Title"
        value={form.title}
        onChange={set('title')}
        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
      />

      {type === 'link' && (
        <input
          type="url"
          placeholder="https://..."
          value={form.url}
          onChange={set('url')}
          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
      )}

      {type === 'note' && (
        <textarea
          placeholder="Write your note..."
          value={form.content}
          onChange={set('content')}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
        />
      )}

      {type === 'file' && (
        <div>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={e => setFile(e.target.files[0])}
            accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all"
          >
            {file ? (
              <span className="text-slate-700 dark:text-slate-300 font-medium">{file.name}</span>
            ) : (
              <span>Click to select file (max 20 MB)</span>
            )}
          </button>
        </div>
      )}

      <Button size="sm" loading={loading} onClick={handleSubmit} className="self-start">
        <Plus size={13} /> Add Resource
      </Button>
    </div>
  )
}

/* ── Resource Item ── */
function ResourceItem({ resource, canDelete, onDelete }) {
  const [deleting, setDeleting] = useState(false)
  const MimeIcon = getMimeIcon(resource.mime_type)

  const handleDelete = async () => {
    setDeleting(true)
    try { await onDelete(resource.id) }
    finally { setDeleting(false) }
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
      {/* Icon */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        resource.type === 'link' ? 'bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400' :
        resource.type === 'note' ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' :
        'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
      }`}>
        {resource.type === 'link' ? <Link2 size={15} /> :
         resource.type === 'note' ? <FileText size={15} /> :
         <MimeIcon size={15} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{resource.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-400">{resource.uploader?.name} · {timeAgo(resource.created_at)}</span>
          {resource.formatted_size && (
            <span className="text-xs text-slate-400">{resource.formatted_size}</span>
          )}
        </div>
        {resource.type === 'note' && resource.content && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{resource.content}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {resource.type === 'link' && resource.url && (
          <a href={resource.url} target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors">
            <ExternalLink size={14} />
          </a>
        )}
        {resource.type === 'file' && resource.download_url && (
          <a href={resource.download_url} download={resource.file_name}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors">
            <Download size={14} />
          </a>
        )}
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-50"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

/* ── Main Panel ── */
export default function ResourcesPanel({ contextType, contextId, canAdd = false }) {
  const { user }                = useAuth()
  const [resources, setResources] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)

  const load = () => {
    setLoading(true)
    const fetcher = contextType === 'session'
      ? resourcesApi.listForSession(contextId)
      : resourcesApi.listForGroup(contextId)

    fetcher
      .then(r => setResources(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (contextId) load() }, [contextId])

  const handleAdd = async (formData) => {
    const uploader = contextType === 'session'
      ? resourcesApi.uploadForSession(contextId, formData)
      : resourcesApi.uploadForGroup(contextId, formData)
    await uploader
    load()
  }

  const handleDelete = async (resourceId) => {
    await resourcesApi.delete(resourceId)
    setResources(prev => prev.filter(r => r.id !== resourceId))
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Paperclip size={14} /> Resources ({resources.length})
        </h3>
        {canAdd && !showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            <Plus size={12} /> Add
          </button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <AddResourceForm onAdd={handleAdd} onClose={() => setShowAdd(false)} />
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-4"><Spinner /></div>
      ) : resources.length === 0 ? (
        <div className="text-center py-5 text-sm text-slate-400">
          No resources yet.
          {canAdd && <span> Add a link, file, or note above.</span>}
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {resources.map(r => (
            <ResourceItem
              key={r.id}
              resource={r}
              canDelete={r.uploader?.id === user?.id}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
