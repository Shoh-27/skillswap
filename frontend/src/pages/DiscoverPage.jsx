import { useState, useEffect, useCallback } from 'react'
import { Search, SlidersHorizontal, X, Star } from 'lucide-react'
import { usersApi, skillsApi, connectionsApi } from '../services/api'
import { Spinner, EmptyState, Button, SkeletonCard } from '../components/ui'
import UserCard from '../components/UserCard'
import AIMatchesSection from '../components/AIMatchesSection'

export default function DiscoverPage() {
  const [users, setUsers]         = useState([])
  const [skills, setSkills]       = useState([])
  const [connections, setConns]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const [search, setSearch]           = useState('')
  const [selectedSkills, setSelectedSkills] = useState([])
  const [typeFilter, setTypeFilter]   = useState('')
  const [minRating, setMinRating]     = useState(0)
  const [sortBy, setSortBy]           = useState('relevance')

  const fetchConnections = () =>
    connectionsApi.list('').then(r => setConns(r.data.data)).catch(() => {})

  useEffect(() => {
    Promise.all([skillsApi.list(), connectionsApi.list('')])
      .then(([sr, cr]) => { setSkills(sr.data.data); setConns(cr.data.data) })
      .catch(() => {})
  }, [])

  const loadUsers = useCallback(() => {
    setLoading(true)
    const params = {}
    if (typeFilter) params.type = typeFilter
    if (minRating > 0) params.min_rating = minRating
    if (sortBy !== 'relevance') params.sort = sortBy
    if (selectedSkills.length) params['skill_ids[]'] = selectedSkills.map(s => s.id)
    if (search) params.search = search

    usersApi.discover(params)
      .then(r => setUsers(r.data.data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [selectedSkills, typeFilter, minRating, sortBy, search])

  useEffect(() => {
    const t = setTimeout(loadUsers, 300)
    return () => clearTimeout(t)
  }, [loadUsers])

  const connectionInfo = (userId) => {
    const c = connections.find(c => c.sender?.id === userId || c.receiver?.id === userId)
    return { status: c?.status || null, id: c?.id }
  }

  const addSkill = (skill) => {
    if (!selectedSkills.find(s => s.id === skill.id))
      setSelectedSkills(prev => [...prev, skill])
  }
  const removeSkill = (id) => setSelectedSkills(prev => prev.filter(s => s.id !== id))

  const activeCount = selectedSkills.length + (typeFilter ? 1 : 0) + (minRating > 0 ? 1 : 0)

  return (
    <div className="p-6 md:p-8 max-w-5xl animate-fade-up">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Discover</h1>
          <p className="text-sm text-slate-400 mt-1">Find people to exchange skills with</p>
        </div>
        {!loading && <p className="text-sm text-slate-400">{users.length} found</p>}
      </div>

      {/* AI Matches */}
      <AIMatchesSection onConnect={fetchConnections} />

      {/* Search bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 mb-5 flex flex-col gap-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name or bio..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              showFilters || activeCount > 0
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <SlidersHorizontal size={15} />
            Filters
            {activeCount > 0 && (
              <span className="bg-indigo-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{activeCount}</span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="border-t border-slate-100 pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-up">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Add Skill</p>
              <select
                onChange={e => { const s = skills.find(sk => sk.id === Number(e.target.value)); if(s) addSkill(s); e.target.value = '' }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              >
                <option value="">Pick a skill…</option>
                {skills.filter(s => !selectedSkills.find(x => x.id === s.id)).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Type</p>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400">
                <option value="">Any</option>
                <option value="teach">Teaches</option>
                <option value="learn">Wants to learn</option>
              </select>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Min Rating</p>
              <select value={minRating} onChange={e => setMinRating(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400">
                <option value={0}>Any</option>
                <option value={3}>3+ ⭐</option>
                <option value={4}>4+ ⭐</option>
                <option value={4.5}>4.5+ ⭐</option>
              </select>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Sort by</p>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400">
                <option value="relevance">Relevance</option>
                <option value="rating">Highest Rated</option>
                <option value="sessions">Most Sessions</option>
              </select>
            </div>
          </div>
        )}

        {selectedSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {selectedSkills.map(s => (
              <span key={s.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-medium">
                {s.name}
                <button onClick={() => removeSkill(s.id)}><X size={11} /></button>
              </span>
            ))}
            <button onClick={() => setSelectedSkills([])} className="text-xs text-slate-400 hover:text-rose-500 px-1 transition-colors">
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* All Users */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">All People</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No users found"
          description="Try different filters or search terms."
          action={activeCount > 0 ? (
            <Button variant="secondary" size="sm" onClick={() => { setSelectedSkills([]); setTypeFilter(''); setMinRating(0) }}>
              Clear Filters
            </Button>
          ) : null}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(user => {
            const { status, id } = connectionInfo(user.id)
            return (
              <UserCard
                key={user.id}
                user={user}
                connectionStatus={status}
                connectionId={id}
                onConnect={fetchConnections}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
