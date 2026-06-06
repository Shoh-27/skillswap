import { useState, useEffect, useRef } from 'react'
import {
  Paperclip, Link2, FileText, Plus, X,
  Download, ExternalLink, Trash2,
  File, Image, FileVideo,
  ChevronDown, ChevronUp, Loader2,
} from 'lucide-react'
import { resourcesApi } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { Spinner } from './ui'

/* ── Helpers ── */
function getMimeIcon(mime) {
  if (!mime) return File
  if (mime.startsWith('image/'))  return Image
  if (mime.startsWith('video/'))  return FileVideo
  if (mime === 'application/pdf') return FileText   // FilePdf lucide'da yo'q, FileText ishlatildi
  return File
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024)       return bytes + ' B'
  if (bytes < 1048576)    return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(iso).toLocaleDateString()
}

/* ── Upload Panel ── */
function UploadPanel({ connectionId, onUploaded, onClose }) {
  const [type, setType]       = useState('link')
  const [title, setTitle]     = useState('')
  const [url, setUrl]         = useState('')
  const [content, setContent] = useState('')
  const [file, setFile]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const fileRef               = useRef()

  const reset = () => {
    setTitle(''); setUrl(''); setContent(''); setFile(null); setError('')
  }

  const handleSubmit = async () => {
    setError('')
    if (!title.trim()) { setError('Title is required.'); return }
    if (type === 'link' && !url.trim()) { setError('URL is required.'); return }
    if (type === 'note' && !content.trim()) { setError('Content is required.'); return }
    if (type === 'file' && !file) { setError('Please select a file.'); return }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('type', type)
      fd.append('title', title.trim())
      if (type === 'link') fd.append('url', url.trim())
      if (type === 'note') fd.append('content', content.trim())
      if (type === 'file') fd.append('file', file)

      await resourcesApi.uploadForChat(connectionId, fd)
      reset()
      onUploaded()
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const TypeBtn = ({ value, icon: Icon, label }) => (
      <button
          type="button"
          onClick={() => { setType(value); reset() }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
              type === value
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
          }`}
      >
        <Icon size={12} />{label}
      </button>
  )

  return (
      <div className="border border-indigo-100 bg-indigo-50/40 rounded-2xl p-4 flex flex-col gap-3">
        {/* Type selector */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            <TypeBtn value="link" icon={Link2}     label="Link" />
            <TypeBtn value="file" icon={Paperclip} label="File" />
            <TypeBtn value="note" icon={FileText}  label="Note" />
          </div>
          <button
              onClick={onClose}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all"
          >
            <X size={13} />
          </button>
        </div>

        {/* Error */}
        {error && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {error}
            </p>
        )}

        {/* Title */}
        <input
            type="text"
            placeholder={type === 'link' ? 'Link title' : type === 'file' ? 'File title (optional)' : 'Note title'}
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all placeholder-slate-400"
        />

        {/* Type-specific fields */}
        {type === 'link' && (
            <input
                type="url"
                placeholder="https://..."
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all placeholder-slate-400"
            />
        )}

        {type === 'note' && (
            <textarea
                rows={3}
                placeholder="Write your note here..."
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 resize-none transition-all placeholder-slate-400"
            />
        )}

        {type === 'file' && (
            <>
              <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files[0]
                    if (f) { setFile(f); if (!title) setTitle(f.name) }
                  }}
                  accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.txt,.zip,.csv"
              />
              <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className={`w-full py-4 border-2 border-dashed rounded-xl text-sm transition-all ${
                      file
                          ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                          : 'border-slate-300 text-slate-400 hover:border-indigo-300 hover:text-indigo-500'
                  }`}
              >
                {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <Paperclip size={15} />
                      <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                      <span className="text-xs opacity-70">({formatSize(file.size)})</span>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Plus size={15} />
                      <span>Click to select file</span>
                      <span className="text-xs opacity-60">(max 20 MB)</span>
                    </div>
                )}
              </button>
            </>
        )}

        {/* Submit */}
        <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-sm shadow-indigo-200"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          {loading ? 'Uploading...' : 'Share Resource'}
        </button>
      </div>
  )
}

/* ── Single Resource Item ── */
function ResourceItem({ resource, canDelete, onDelete }) {
  const [deleting, setDeleting] = useState(false)
  const MimeIcon = getMimeIcon(resource.mime_type)

  const colorMap = {
    link: { bg: 'bg-sky-50',    text: 'text-sky-600',    border: 'border-sky-200/80' },
    file: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200/80' },
    note: { bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-200/80' },
  }
  const color = colorMap[resource.type] || colorMap.file

  return (
      <div className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${color.border} ${color.bg} group transition-all`}>
        {/* Icon */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color.text} bg-white shadow-sm`}>
          {resource.type === 'link' ? <Link2 size={14} /> :
              resource.type === 'note' ? <FileText size={14} /> :
                  <MimeIcon size={14} />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-800 truncate">{resource.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-slate-400">{resource.uploader?.name}</span>
            <span className="text-[10px] text-slate-300">·</span>
            <span className="text-[10px] text-slate-400">{timeAgo(resource.created_at)}</span>
            {resource.formatted_size && (
                <>
                  <span className="text-[10px] text-slate-300">·</span>
                  <span className="text-[10px] text-slate-400">{resource.formatted_size}</span>
                </>
            )}
          </div>
          {resource.type === 'note' && resource.content && (
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{resource.content}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {resource.type === 'link' && resource.url && (
              <a
                  href={resource.url} target="_blank" rel="noopener noreferrer"
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white hover:text-sky-600 transition-all"
              >
                <ExternalLink size={12} />
              </a>
          )}
          {resource.type === 'file' && resource.download_url && (
              <a
                  href={resource.download_url} download={resource.file_name}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white hover:text-indigo-600 transition-all"
              >
                <Download size={12} />
              </a>
          )}
          {canDelete && (
              <button
                  onClick={async () => {
                    setDeleting(true)
                    try { await onDelete(resource.id) }
                    finally { setDeleting(false) }
                  }}
                  disabled={deleting}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white hover:text-rose-500 transition-all disabled:opacity-50"
              >
                {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              </button>
          )}
        </div>
      </div>
  )
}

/* ── Main Panel ── */
export default function ChatResourcesPanel({ connectionId }) {
  const { user }                  = useAuth()
  const [resources, setResources] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showAdd, setShowAdd]     = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const load = async () => {
    if (!connectionId) return
    setLoading(true)
    try {
      const res = await resourcesApi.listForChat(connectionId)
      setResources(res.data.data || [])
    } catch {
      setResources([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [connectionId])

  const handleDelete = async (id) => {
    await resourcesApi.delete(id)
    setResources(prev => prev.filter(r => r.id !== id))
  }

  return (
      <div className="border-t border-slate-100 bg-white">
        {/* Header — collapsible */}
        <button
            onClick={() => setCollapsed(c => !c)}
            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Paperclip size={13} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">
            Shared Resources
          </span>
            {resources.length > 0 && (
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
              {resources.length}
            </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!collapsed && (
                <button
                    onClick={e => { e.stopPropagation(); setShowAdd(v => !v) }}
                    className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-all ${
                        showAdd
                            ? 'bg-indigo-600 text-white'
                            : 'text-indigo-600 hover:bg-indigo-50'
                    }`}
                >
                  <Plus size={10} />
                  Add
                </button>
            )}
            {collapsed
                ? <ChevronDown size={14} className="text-slate-400" />
                : <ChevronUp size={14} className="text-slate-400" />
            }
          </div>
        </button>

        {/* Body */}
        {!collapsed && (
            <div className="px-3 pb-3 flex flex-col gap-2">
              {/* Upload panel */}
              {showAdd && (
                  <UploadPanel
                      connectionId={connectionId}
                      onUploaded={() => { load(); setShowAdd(false) }}
                      onClose={() => setShowAdd(false)}
                  />
              )}

              {/* Resources list */}
              {loading ? (
                  <div className="flex justify-center py-4">
                    <Spinner size={18} />
                  </div>
              ) : resources.length === 0 ? (
                  <div className="text-center py-5">
                    <p className="text-xs text-slate-400">No shared resources yet.</p>
                    <button
                        onClick={() => setShowAdd(true)}
                        className="text-xs text-indigo-600 font-medium hover:underline mt-1"
                    >
                      Share a file, link, or note
                    </button>
                  </div>
              ) : (
                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-0.5">
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
        )}
      </div>
  )
}