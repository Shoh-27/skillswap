import { useState, useEffect } from 'react'
import { Sparkles, RefreshCw, UserPlus, Check, Clock } from 'lucide-react'
import { aiApi, connectionsApi } from '../services/api'
import { Avatar, StarRating, SkillTag, Button, SkeletonCard, Badge } from './ui'

function AIMatchCard({ match, onConnect }) {
  const { user, reason, score } = match
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleConnect = async () => {
    setLoading(true)
    try {
      await connectionsApi.send(user.id)
      setStatus('pending')
      onConnect?.()
    } catch (err) {
      // Already connected?
      if (err.response?.status === 422) setStatus('pending')
    } finally { setLoading(false) }
  }

  return (
    <div className="bg-white border border-indigo-100 rounded-2xl p-4 hover:border-indigo-200 hover:shadow-[0_4px_20px_rgba(79,70,229,0.10)] transition-all duration-300">
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar name={user.name} size="md" />
          {score >= 90 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
              <span className="text-[9px]">🔥</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-slate-900 text-sm truncate">{user.name}</p>
              <StarRating rating={user.avg_rating} count={user.total_reviews} />
            </div>
            {score && (
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 flex-shrink-0">
                {score}% match
              </span>
            )}
          </div>
        </div>
      </div>

      {/* AI reason */}
      <div className="mt-3 flex gap-2">
        <Sparkles size={13} className="text-indigo-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500 leading-relaxed">{reason}</p>
      </div>

      {/* Skills preview */}
      {user.skills_can_teach?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {user.skills_can_teach.slice(0, 2).map(s => (
            <SkillTag key={s.id} name={s.name} type="teach" />
          ))}
          {user.skills_can_teach.length > 2 && (
            <span className="text-xs text-slate-400 self-center">+{user.skills_can_teach.length - 2}</span>
          )}
        </div>
      )}

      {/* CTA */}
      <div className="mt-3">
        {!status && (
          <Button size="sm" loading={loading} onClick={handleConnect} className="w-full">
            <UserPlus size={13} /> Connect
          </Button>
        )}
        {status === 'pending' && (
          <div className="flex items-center justify-center gap-1.5 py-1.5 text-xs text-amber-600 font-medium">
            <Clock size={12} /> Request sent
          </div>
        )}
      </div>
    </div>
  )
}

export default function AIMatchesSection({ onConnect }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    try {
      const res = await aiApi.matches()
      setData(res.data.data)
    } catch {}
    finally { setLoading(false) }
  }

  const refresh = async () => {
    setRefreshing(true)
    try {
      const res = await aiApi.refresh()
      setData(res.data.data)
    } catch {}
    finally { setRefreshing(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} className="text-indigo-500" />
          <h2 className="font-semibold text-slate-900">AI Recommendations</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1,2,3].map(i => <SkeletonCard key={i} lines={2} />)}
        </div>
      </div>
    )
  }

  if (!data?.matches?.length) return null

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Sparkles size={15} className="text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 text-sm">AI Recommendations</h2>
            <p className="text-xs text-slate-400">{data.explanation}</p>
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.matches.map((match, i) => (
          <AIMatchCard key={i} match={match} onConnect={onConnect} />
        ))}
      </div>

      {data.cached_at && (
        <p className="text-xs text-slate-300 mt-3 text-right">
          Updated {new Date(data.cached_at).toLocaleTimeString()}
        </p>
      )}
    </div>
  )
}
