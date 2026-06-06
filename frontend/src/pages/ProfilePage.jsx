import { useState, useEffect } from 'react'
import { Save, Plus, BookOpen, Star } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { profileApi, skillsApi } from '../services/api'
import { Avatar, Card, Button, Input, Textarea, SkillTag, Spinner, EmptyState } from '../components/ui'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [allSkills, setAllSkills] = useState([])
  const [saving, setSaving]       = useState(false)
  const [success, setSuccess]     = useState(false)
  const [form, setForm]           = useState({ name: user?.name || '', bio: user?.bio || '' })
  const [errors, setErrors]       = useState({})

  // Skill adding state
  const [addingType, setAddingType]   = useState(null)   // 'teach' | 'learn'
  const [selectedSkill, setSelectedSkill] = useState('')
  const [addingLoading, setAddingLoading] = useState(false)

  useEffect(() => {
    skillsApi.list().then(r => setAllSkills(r.data.data)).catch(() => {})
  }, [])

  // Sync form when user changes (after refresh)
  useEffect(() => {
    setForm({ name: user?.name || '', bio: user?.bio || '' })
  }, [user])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true); setErrors({})
    try {
      await profileApi.update(form)
      await refreshUser()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setErrors(err.response?.data?.errors || {})
    } finally { setSaving(false) }
  }

  const handleAddSkill = async (type) => {
    if (!selectedSkill) return
    setAddingLoading(true)
    try {
      await profileApi.addSkill(Number(selectedSkill), type)
      await refreshUser()
      setSelectedSkill(''); setAddingType(null)
    } catch (err) {
      console.error(err)
    } finally { setAddingLoading(false) }
  }

  const handleRemoveSkill = async (userSkillId) => {
    try {
      await profileApi.removeSkill(userSkillId)
      await refreshUser()
    } catch {}
  }

  // Determine which skills are already added (for filtering dropdown)
  const usedTeachIds  = new Set(user?.skills_can_teach?.map(s => s.id)  || [])
  const usedLearnIds  = new Set(user?.skills_want_to_learn?.map(s => s.id) || [])
  const teachOptions  = allSkills.filter(s => !usedTeachIds.has(s.id))
  const learnOptions  = allSkills.filter(s => !usedLearnIds.has(s.id))

  const stats = [
    { n: user?.skills_can_teach?.length ?? 0,    label: 'Teaching' },
    { n: user?.skills_want_to_learn?.length ?? 0, label: 'Learning' },
  ]

  return (
    <div className="p-6 md:p-8 max-w-4xl animate-fade-in">
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">My Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your info and skills</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
        {/* Left panel */}
        <div className="flex flex-col gap-4">
          <Card className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <Avatar name={user?.name || '?'} size="xl" />
            </div>
            <h2 className="font-semibold text-slate-900 dark:text-white text-lg">{user?.name}</h2>
            <p className="text-sm text-slate-400 mt-0.5">{user?.email}</p>
            {user?.bio && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">{user.bio}</p>
            )}
            <div className="flex divide-x divide-slate-200 dark:divide-slate-700 border-t border-slate-200 dark:border-slate-700 mt-5 pt-5">
              {stats.map(({ n, label }) => (
                <div key={label} className="flex-1 text-center">
                  <p className="text-xl font-semibold text-slate-900 dark:text-white">{n}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* Edit info */}
          <Card className="p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-5">Personal Info</h3>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <Input
                label="Full Name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                error={errors.name?.[0]}
              />
              <Input
                label="Email"
                value={user?.email}
                disabled
                className="opacity-60 cursor-not-allowed"
              />
              <Textarea
                label="Bio"
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Tell people about yourself, what you do, what you're passionate about…"
                rows={3}
                error={errors.bio?.[0]}
              />
              <div className="flex items-center gap-3">
                <Button type="submit" loading={saving}>
                  <Save size={15} /> Save Changes
                </Button>
                {success && (
                  <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium animate-fade-in">
                    ✓ Saved!
                  </span>
                )}
              </div>
            </form>
          </Card>

          {/* Teach skills */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={18} className="text-emerald-500" />
              <h3 className="font-semibold text-slate-900 dark:text-white">Skills I Can Teach</h3>
            </div>
            <p className="text-sm text-slate-400 mb-4">Share your expertise with others</p>

            {user?.skills_can_teach?.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {user.skills_can_teach.map(s => (
                  <SkillTag
                    key={s.id}
                    name={s.name}
                    type="teach"
                    onRemove={() => handleRemoveSkill(s.pivot?.id || s.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 mb-4 italic">No skills added yet.</p>
            )}

            {addingType === 'teach' ? (
              <div className="flex gap-2 mt-2">
                <select
                  value={selectedSkill}
                  onChange={e => setSelectedSkill(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="">Select a skill…</option>
                  {teachOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <Button size="sm" loading={addingLoading} onClick={() => handleAddSkill('teach')}>Add</Button>
                <Button size="sm" variant="ghost" onClick={() => { setAddingType(null); setSelectedSkill('') }}>Cancel</Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setAddingType('teach')}>
                <Plus size={14} /> Add Skill
              </Button>
            )}
          </Card>

          {/* Learn skills */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Star size={18} className="text-indigo-500" />
              <h3 className="font-semibold text-slate-900 dark:text-white">Skills I Want to Learn</h3>
            </div>
            <p className="text-sm text-slate-400 mb-4">What are you curious about?</p>

            {user?.skills_want_to_learn?.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {user.skills_want_to_learn.map(s => (
                  <SkillTag
                    key={s.id}
                    name={s.name}
                    type="learn"
                    onRemove={() => handleRemoveSkill(s.pivot?.id || s.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 mb-4 italic">No skills added yet.</p>
            )}

            {addingType === 'learn' ? (
              <div className="flex gap-2 mt-2">
                <select
                  value={selectedSkill}
                  onChange={e => setSelectedSkill(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="">Select a skill…</option>
                  {learnOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <Button size="sm" loading={addingLoading} onClick={() => handleAddSkill('learn')}>Add</Button>
                <Button size="sm" variant="ghost" onClick={() => { setAddingType(null); setSelectedSkill('') }}>Cancel</Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setAddingType('learn')}>
                <Plus size={14} /> Add Skill
              </Button>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
