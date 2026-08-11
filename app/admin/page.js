'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  MessageCircle, LogOut, Plus, Trash2, Save, Loader2, Sparkles, Search, Upload, RefreshCw,
} from 'lucide-react'

const STATUSES = ['New', 'Confirmed', 'Completed', 'No-show']
const api = (path, opts = {}) =>
  fetch(`/api${path}`, { credentials: 'include', ...opts }).then(async (r) => {
    const d = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(d.error || 'Error')
    return d
  })

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    api('/auth/me').then(() => setAuthed(true)).catch(() => setAuthed(false)).finally(() => setChecking(false))
  }, [])

  if (checking) {
    return <div className="min-h-screen grid place-items-center bg-brand-offwhite"><Loader2 className="animate-spin text-brand-emerald" /></div>
  }
  return authed ? <Dashboard onLogout={() => setAuthed(false)} /> : <Login onSuccess={() => setAuthed(true)} />
}

/* ---------------- Login ---------------- */
function Login({ onSuccess }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const send = async () => {
    setBusy(true)
    try {
      await api('/auth/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      setSent(true); toast.success('अगर यह admin email है, तो OTP भेजा गया है।')
    } catch (e) { toast.error(e.message) }
    setBusy(false)
  }
  const verify = async () => {
    setBusy(true)
    try {
      await api('/auth/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) })
      toast.success('Welcome!'); onSuccess()
    } catch (e) { toast.error(e.message) }
    setBusy(false)
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-brand-emerald to-brand-emerald-dark p-4">
      <Card className="w-full max-w-sm p-8 rounded-3xl">
        <div className="flex items-center gap-2 mb-6">
          <span className="h-10 w-10 rounded-full bg-brand-emerald text-white grid place-items-center font-head font-extrabold">C</span>
          <div>
            <p className="font-head font-extrabold text-brand-emerald leading-none">Admin Panel</p>
            <p className="text-xs text-brand-charcoal/50">Chinmay Wellness Club</p>
          </div>
        </div>
        {!sent ? (
          <div className="space-y-3">
            <p className="text-sm text-brand-charcoal/70">Admin email दर्ज करें — हम OTP भेजेंगे।</p>
            <Input type="email" placeholder="admin@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button onClick={send} disabled={busy || !email} className="w-full bg-brand-emerald text-white rounded-full">{busy ? <Loader2 className="animate-spin h-4 w-4" /> : 'Send OTP'}</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-brand-charcoal/70">{email} पर भेजा गया 6-digit OTP दर्ज करें।</p>
            <Input inputMode="numeric" maxLength={6} placeholder="______" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} className="text-center tracking-[0.5em] text-lg" />
            <Button onClick={verify} disabled={busy || code.length !== 6} className="w-full bg-brand-emerald text-white rounded-full">{busy ? <Loader2 className="animate-spin h-4 w-4" /> : 'Verify & Login'}</Button>
            <button onClick={() => setSent(false)} className="text-xs text-brand-emerald w-full text-center">Email बदलें</button>
          </div>
        )}
      </Card>
    </div>
  )
}

/* ---------------- Dashboard ---------------- */
function Dashboard({ onLogout }) {
  const logout = async () => { await api('/auth/logout', { method: 'POST' }); toast.success('Logged out'); onLogout() }
  return (
    <div className="min-h-screen bg-brand-offwhite">
      <header className="sticky top-0 z-20 bg-white border-b">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="h-9 w-9 rounded-full bg-brand-emerald text-white grid place-items-center font-head font-extrabold">C</span>
            <span className="font-head font-extrabold text-brand-emerald">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" rel="noreferrer"><Button variant="outline" className="rounded-full">View Site</Button></a>
            <Button onClick={logout} variant="outline" className="rounded-full"><LogOut className="h-4 w-4 mr-1" /> Logout</Button>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <Tabs defaultValue="bookings">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-white p-1 rounded-2xl mb-6">
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="transformations">Transformations</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="faqs">FAQ</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="admins">Admins</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings"><SubmissionsTab endpoint="/admin/bookings" isBooking /></TabsContent>
          <TabsContent value="leads"><SubmissionsTab endpoint="/admin/leads" /></TabsContent>
          <TabsContent value="testimonials">
            <CrudManager title="Testimonials (Vimeo videos)" endpoint="/admin/testimonials" fields={[
              { key: 'name', label: 'Name' }, { key: 'city', label: 'City' },
              { key: 'rating', label: 'Rating (1-5)', type: 'number' },
              { key: 'quote', label: 'Short quote', type: 'textarea' },
              { key: 'resultTag', label: 'Result tag' },
              { key: 'vimeoUrl', label: 'Vimeo URL (e.g. https://vimeo.com/12345)' },
            ]} />
          </TabsContent>
          <TabsContent value="transformations">
            <CrudManager title="Transformations" endpoint="/admin/transformations" fields={[
              { key: 'name', label: 'Name' }, { key: 'resultTag', label: 'Result tag' },
              { key: 'before', label: 'Before image', type: 'image' },
              { key: 'after', label: 'After image', type: 'image' },
              { key: 'note', label: 'Note', type: 'textarea' },
            ]} />
          </TabsContent>
          <TabsContent value="gallery">
            <CrudManager title="Gallery" endpoint="/admin/gallery" fields={[
              { key: 'category', label: 'Category', type: 'select', options: ['Sessions', 'Community', 'Results'] },
              { key: 'url', label: 'Image', type: 'image' },
              { key: 'alt', label: 'Alt text (SEO)' },
            ]} />
          </TabsContent>
          <TabsContent value="faqs">
            <CrudManager title="FAQ" endpoint="/admin/faqs" fields={[
              { key: 'question', label: 'Question' }, { key: 'answer', label: 'Answer', type: 'textarea' },
            ]} />
          </TabsContent>
          <TabsContent value="content"><ContentTab /></TabsContent>
          <TabsContent value="admins"><AdminsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

/* ---------------- Submissions (Bookings/Leads) ---------------- */
function SubmissionsTab({ endpoint, isBooking }) {
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)

  const load = () => { setLoading(true); api(endpoint).then(setItems).catch((e) => toast.error(e.message)).finally(() => setLoading(false)) }
  useEffect(load, [endpoint])

  const setStatus = async (id, status) => {
    try { await api(`${endpoint}/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); setItems((p) => p.map((i) => i.id === id ? { ...i, status } : i)) }
    catch (e) { toast.error(e.message) }
  }
  const del = async (id) => { try { await api(`${endpoint}/${id}`, { method: 'DELETE' }); setItems((p) => p.filter((i) => i.id !== id)) } catch (e) { toast.error(e.message) } }

  const filtered = items.filter((i) =>
    (filter === 'All' || i.status === filter) &&
    (!q || `${i.name} ${i.whatsapp} ${i.goal || ''}`.toLowerCase().includes(q.toLowerCase()))
  )
  const statusColor = (s) => ({ New: 'bg-brand-coral', Confirmed: 'bg-brand-emerald', Completed: 'bg-blue-500', 'No-show': 'bg-gray-400' }[s] || 'bg-gray-400')

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-brand-charcoal/40" />
          <Input placeholder="Search name / number..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {['All', ...STATUSES].map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-sm ${filter === s ? 'bg-brand-emerald text-white' : 'bg-white border'}`}>{s}</button>
          ))}
        </div>
        <Button variant="outline" onClick={load} className="rounded-full"><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {loading ? <Loader2 className="animate-spin text-brand-emerald" /> : filtered.length === 0 ? (
        <p className="text-brand-charcoal/50 py-10 text-center">कोई entry नहीं मिली।</p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((i) => (
            <Card key={i.id} className="p-4 rounded-2xl">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-head font-bold text-brand-charcoal">{i.name}</span>
                    <Badge className={`${statusColor(i.status)} text-white rounded-full`}>{i.status}</Badge>
                  </div>
                  <p className="text-sm text-brand-charcoal/70">📱 {i.whatsapp}{i.email ? ` • ✉️ ${i.email}` : ''}</p>
                  {isBooking && <p className="text-sm text-brand-charcoal/70">📅 {i.date} • {i.time}</p>}
                  {i.goal && <p className="text-sm text-brand-charcoal/70">🎯 {i.goal}</p>}
                  {i.contactTime && <p className="text-sm text-brand-charcoal/70">⏰ Prefers: {i.contactTime}</p>}
                  <p className="text-xs text-brand-charcoal/40 mt-1">{new Date(i.createdAt).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <a href={`https://wa.me/${String(i.whatsapp).replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                    <Button size="sm" className="bg-[#25D366] hover:bg-[#1eb658] text-white rounded-full"><MessageCircle className="h-4 w-4 mr-1" /> WhatsApp</Button>
                  </a>
                  <button onClick={() => del(i.id)} className="text-xs text-red-500 flex items-center gap-1"><Trash2 className="h-3 w-3" /> Delete</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t">
                {STATUSES.map((s) => (
                  <button key={s} onClick={() => setStatus(i.id, s)} className={`px-3 py-1 rounded-full text-xs border ${i.status === s ? 'bg-brand-emerald text-white border-brand-emerald' : 'border-brand-emerald/20'}`}>{s}</button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------------- Image Field ---------------- */
function ImageField({ value, onChange }) {
  const [busy, setBusy] = useState(false)
  const upload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setBusy(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const d = await api('/admin/upload', { method: 'POST', body: fd })
      onChange(d.url); toast.success('Uploaded')
    } catch (err) { toast.error(err.message) }
    setBusy(false)
  }
  return (
    <div className="space-y-2">
      {value && <img src={value} alt="preview" className="h-24 w-full object-cover rounded-lg" />}
      <div className="flex gap-2">
        <Input placeholder="Image URL or upload →" value={value || ''} onChange={(e) => onChange(e.target.value)} />
        <label className="shrink-0">
          <input type="file" accept="image/*" onChange={upload} className="hidden" />
          <span className="inline-flex items-center h-10 px-3 rounded-md border cursor-pointer text-sm bg-white">{busy ? <Loader2 className="animate-spin h-4 w-4" /> : <Upload className="h-4 w-4" />}</span>
        </label>
      </div>
    </div>
  )
}

/* ---------------- Generic CRUD ---------------- */
function CrudManager({ title, endpoint, fields }) {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => { setLoading(true); api(endpoint).then(setItems).catch((e) => toast.error(e.message)).finally(() => setLoading(false)) }
  useEffect(load, [endpoint])

  const blank = () => Object.fromEntries(fields.map((f) => [f.key, '']))
  const save = async () => {
    try {
      if (editing.id) await api(`${endpoint}/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) })
      else await api(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) })
      toast.success('Saved'); setEditing(null); load()
    } catch (e) { toast.error(e.message) }
  }
  const del = async (id) => { try { await api(`${endpoint}/${id}`, { method: 'DELETE' }); load() } catch (e) { toast.error(e.message) } }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-head font-extrabold text-lg text-brand-charcoal">{title}</h3>
        <Button onClick={() => setEditing(blank())} className="bg-brand-emerald text-white rounded-full"><Plus className="h-4 w-4 mr-1" /> Add</Button>
      </div>

      {editing && (
        <Card className="p-5 rounded-2xl mb-4 border-brand-emerald/30">
          <div className="grid gap-3">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="text-sm font-medium text-brand-charcoal/70">{f.label}</label>
                {f.type === 'textarea' ? (
                  <Textarea value={editing[f.key] || ''} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })} />
                ) : f.type === 'image' ? (
                  <ImageField value={editing[f.key]} onChange={(v) => setEditing({ ...editing, [f.key]: v })} />
                ) : f.type === 'select' ? (
                  <select className="w-full h-10 rounded-md border px-3 bg-white" value={editing[f.key] || ''} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}>
                    <option value="">Select...</option>
                    {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <Input type={f.type || 'text'} value={editing[f.key] || ''} onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })} />
                )}
              </div>
            ))}
            <div className="flex gap-2">
              <Button onClick={save} className="bg-brand-emerald text-white rounded-full"><Save className="h-4 w-4 mr-1" /> Save</Button>
              <Button onClick={() => setEditing(null)} variant="outline" className="rounded-full">Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      {loading ? <Loader2 className="animate-spin text-brand-emerald" /> : (
        <div className="grid gap-3">
          {items.map((it) => (
            <Card key={it.id} className="p-4 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {(it.url || it.before || it.image) && <img src={it.url || it.before || it.image} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />}
                <div className="min-w-0">
                  <p className="font-semibold text-brand-charcoal truncate">{it.name || it.question || it.category || it.alt || 'Item'}</p>
                  <p className="text-sm text-brand-charcoal/60 truncate">{it.quote || it.answer || it.resultTag || it.vimeoUrl || ''}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => setEditing(it)} className="rounded-full">Edit</Button>
                <Button size="sm" variant="outline" onClick={() => del(it.id)} className="rounded-full text-red-500"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------------- Content Editor ---------------- */
function ContentTab() {
  const [c, setC] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { api('/content').then(setC).catch((e) => toast.error(e.message)) }, [])
  if (!c) return <Loader2 className="animate-spin text-brand-emerald" />

  const set = (path, value) => {
    setC((prev) => {
      const next = structuredClone(prev)
      let o = next
      const keys = path.split('.')
      for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]]
      o[keys[keys.length - 1]] = value
      return next
    })
  }
  const save = async () => {
    setSaving(true)
    try { await api('/admin/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(c) }); toast.success('Content saved!') }
    catch (e) { toast.error(e.message) }
    setSaving(false)
  }
  const F = ({ label, path, area }) => (
    <div>
      <label className="text-sm font-medium text-brand-charcoal/70">{label}</label>
      {area ? (
        <Textarea value={path.split('.').reduce((o, k) => o?.[k], c) || ''} onChange={(e) => set(path, e.target.value)} rows={4} />
      ) : (
        <Input value={path.split('.').reduce((o, k) => o?.[k], c) || ''} onChange={(e) => set(path, e.target.value)} />
      )}
    </div>
  )

  const toggleDay = (d) => {
    const days = c.booking.days.includes(d) ? c.booking.days.filter((x) => x !== d) : [...c.booking.days, d]
    set('booking.days', days.sort())
  }
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="space-y-6 max-w-3xl">
      <Button onClick={save} disabled={saving} className="bg-brand-emerald text-white rounded-full sticky top-20 z-10 shadow-lg">
        {saving ? <Loader2 className="animate-spin h-4 w-4 mr-1" /> : <Save className="h-4 w-4 mr-1" />} Save All Content
      </Button>

      <Card className="p-5 rounded-2xl space-y-3">
        <h3 className="font-head font-bold text-brand-emerald">General</h3>
        <F label="Site name" path="siteName" />
        <F label="WhatsApp number (with country code)" path="whatsapp" />
        <F label="Rating (e.g. 4.9)" path="rating" />
        <F label="SEO Title" path="seo.title" />
        <F label="SEO Description" path="seo.description" area />
      </Card>

      <Card className="p-5 rounded-2xl space-y-3">
        <h3 className="font-head font-bold text-brand-emerald">Hero</h3>
        <F label="Eyebrow badge" path="hero.badge" />
        <F label="Headline (Hindi)" path="hero.titleHi" area />
        <F label="Headline (English)" path="hero.titleEn" />
        <F label="Subtitle" path="hero.subtitle" area />
        <F label="Urgency line" path="hero.urgency" />
        <F label="Primary CTA text" path="hero.ctaPrimary" />
        <F label="Secondary CTA text" path="hero.ctaSecondary" />
        <div><label className="text-sm font-medium text-brand-charcoal/70">Hero background image</label><ImageField value={c.hero.image} onChange={(v) => set('hero.image', v)} /></div>
        <F label="Founder name" path="hero.founderName" />
        <F label="Founder title" path="hero.founderTitle" />
        <div><label className="text-sm font-medium text-brand-charcoal/70">Founder photo</label><ImageField value={c.hero.founderImage} onChange={(v) => set('hero.founderImage', v)} /></div>
        <F label="Mission line" path="hero.missionLine" area />
      </Card>

      <Card className="p-5 rounded-2xl space-y-3">
        <h3 className="font-head font-bold text-brand-emerald">About / Founder</h3>
        <F label="Heading" path="about.heading" />
        <F label="Subheading" path="about.subheading" />
        <div><label className="text-sm font-medium text-brand-charcoal/70">About image</label><ImageField value={c.about.image} onChange={(v) => set('about.image', v)} /></div>
        <F label="Bio paragraph" path="about.bio" area />
        <F label="Pull-quote" path="about.quote" area />
      </Card>

      <Card className="p-5 rounded-2xl space-y-3">
        <h3 className="font-head font-bold text-brand-emerald">Achievement Stats</h3>
        {c.achievements.stats.map((s, i) => (
          <div key={i} className="flex gap-2">
            <Input value={s.value} onChange={(e) => set(`achievements.stats.${i}.value`, e.target.value)} placeholder="Value" className="w-24" />
            <Input value={s.label} onChange={(e) => set(`achievements.stats.${i}.label`, e.target.value)} placeholder="Label" />
          </div>
        ))}
      </Card>

      <Card className="p-5 rounded-2xl space-y-3">
        <h3 className="font-head font-bold text-brand-emerald">Booking Availability</h3>
        <p className="text-sm text-brand-charcoal/60">कौन से दिन open हैं?</p>
        <div className="flex flex-wrap gap-2">
          {dayNames.map((d, i) => (
            <button key={i} onClick={() => toggleDay(i)} className={`px-3 py-1.5 rounded-full text-sm border ${c.booking.days.includes(i) ? 'bg-brand-emerald text-white border-brand-emerald' : 'border-brand-emerald/20'}`}>{d}</button>
          ))}
        </div>
        <label className="text-sm font-medium text-brand-charcoal/70">Time slots (comma separated)</label>
        <Input value={(c.booking.slots || []).join(', ')} onChange={(e) => set('booking.slots', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} />
        <F label="Booking heading" path="booking.heading" />
        <F label="Booking subheading" path="booking.subheading" />
        <div><label className="text-sm font-medium text-brand-charcoal/70">Current batch banner (16:9)</label><ImageField value={c.booking.bannerImage} onChange={(v) => set('booking.bannerImage', v)} /></div>
      </Card>

      <Card className="p-5 rounded-2xl space-y-3">
        <h3 className="font-head font-bold text-brand-emerald">Welcome Popup</h3>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={c.popup.enabled} onChange={(e) => set('popup.enabled', e.target.checked)} /> Enable popup</label>
        <div><label className="text-sm font-medium text-brand-charcoal/70">Popup image</label><ImageField value={c.popup.image} onChange={(v) => set('popup.image', v)} /></div>
        <F label="Headline" path="popup.headline" />
        <F label="Credibility line" path="popup.credibility" area />
      </Card>

      <Card className="p-5 rounded-2xl space-y-3">
        <h3 className="font-head font-bold text-brand-emerald">Footer</h3>
        <F label="Tagline" path="footer.tagline" />
        <F label="Address" path="footer.address" />
      </Card>

      <Button onClick={save} disabled={saving} className="bg-brand-emerald text-white rounded-full">
        {saving ? <Loader2 className="animate-spin h-4 w-4 mr-1" /> : <Save className="h-4 w-4 mr-1" />} Save All Content
      </Button>
    </div>
  )
}

/* ---------------- Admins ---------------- */
function AdminsTab() {
  const [list, setList] = useState([])
  const [email, setEmail] = useState('')
  const load = () => api('/admin/admins').then(setList).catch((e) => toast.error(e.message))
  useEffect(() => { load() }, [])
  const add = async () => {
    try { await api('/admin/admins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }); setEmail(''); toast.success('Admin added'); load() }
    catch (e) { toast.error(e.message) }
  }
  const del = async (em) => { try { await api(`/admin/admins/${encodeURIComponent(em)}`, { method: 'DELETE' }); load() } catch (e) { toast.error(e.message) } }
  return (
    <div className="max-w-xl">
      <h3 className="font-head font-extrabold text-lg mb-4">Manage Admins</h3>
      <div className="flex gap-2 mb-4">
        <Input placeholder="new-admin@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button onClick={add} className="bg-brand-emerald text-white rounded-full"><Plus className="h-4 w-4 mr-1" /> Add</Button>
      </div>
      <div className="grid gap-2">
        {list.map((a) => (
          <Card key={a.email} className="p-3 rounded-xl flex items-center justify-between">
            <span className="text-sm">{a.email} {a.locked && <Badge className="ml-2 bg-brand-mint text-brand-emerald-dark rounded-full">primary</Badge>}</span>
            {!a.locked && <button onClick={() => del(a.email)} className="text-red-500"><Trash2 className="h-4 w-4" /></button>}
          </Card>
        ))}
      </div>
      <p className="text-xs text-brand-charcoal/50 mt-3">OTP login इन emails पर ही काम करता है।</p>
    </div>
  )
}
