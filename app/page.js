'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Menu, X, MessageCircle, Phone, CheckCircle2, Star, Salad, HeartPulse, UserRound,
  ArrowRight, ChevronLeft, ChevronRight, CalendarDays, Clock, Sparkles, ShieldCheck,
  MapPin, PlayCircle, Quote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Calendar } from '@/components/ui/calendar'
import { toast } from 'sonner'

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919975727098'
const iconMap = { salad: Salad, heart: HeartPulse, user: UserRound }

function waLink(text) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`
}
function vimeoEmbed(url) {
  if (!url) return null
  const m = String(url).match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/)
  return m ? `https://player.vimeo.com/video/${m[1]}` : null
}
const fade = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const GOALS = ['Weight Loss', 'More Energy', 'Manage Lifestyle Habits', 'Family Program']
const TIMES = ['Morning', 'Afternoon', 'Evening']

export default function App() {
  const [content, setContent] = useState(null)
  const [testimonials, setTestimonials] = useState([])
  const [transformations, setTransformations] = useState([])
  const [gallery, setGallery] = useState([])
  const [faqs, setFaqs] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [popupOpen, setPopupOpen] = useState(false)
  const [leadOpen, setLeadOpen] = useState(false)

  useEffect(() => {
    const safeJson = async (url) => {
      try {
        const r = await fetch(url)
        if (!r.ok) return null
        return await r.json()
      } catch (e) {
        return null
      }
    }
    const load = async () => {
      // content is critical — retry a couple times
      let c = null
      for (let i = 0; i < 4 && !c; i++) {
        c = await safeJson('/api/content')
        if (!c) await new Promise((res) => setTimeout(res, 700))
      }
      if (c) setContent(c)
      const [t, tr, g, f] = await Promise.all([
        safeJson('/api/testimonials'),
        safeJson('/api/transformations'),
        safeJson('/api/gallery'),
        safeJson('/api/faqs'),
      ])
      if (Array.isArray(t)) setTestimonials(t)
      if (Array.isArray(tr)) setTransformations(tr)
      if (Array.isArray(g)) setGallery(g)
      if (Array.isArray(f)) setFaqs(f)
    }
    load()
    if (typeof window !== 'undefined' && !sessionStorage.getItem('cwc_popup')) {
      setTimeout(() => setPopupOpen(true), 1400)
      sessionStorage.setItem('cwc_popup', '1')
    }
  }, [])

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-offwhite">
        <div className="flex items-center gap-3 text-brand-emerald">
          <Sparkles className="animate-pulse" />
          <span className="font-head font-bold text-lg">Chinmay Wellness Club</span>
        </div>
      </div>
    )
  }

  const scrollTo = (id) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const nav = [
    ['Program', 'program'],
    ['Results', 'results'],
    ['About', 'about'],
    ['Achievements', 'achievements'],
    ['Gallery', 'gallery'],
    ['FAQ', 'faq'],
  ]

  return (
    <div className="min-h-screen bg-brand-offwhite text-brand-charcoal font-body overflow-x-hidden">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-40 bg-brand-offwhite/85 backdrop-blur-md border-b border-brand-emerald/10">
        <div className="container flex items-center justify-between h-16">
          <button onClick={() => scrollTo('hero')} className="flex items-center gap-2">
            <span className="h-9 w-9 rounded-full bg-brand-emerald text-white grid place-items-center font-head font-extrabold">C</span>
            <span className="font-head font-extrabold text-brand-emerald leading-tight text-sm sm:text-base">{content.siteName}</span>
          </button>
          <nav className="hidden lg:flex items-center gap-6">
            {nav.map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)} className="text-sm font-medium text-brand-charcoal/80 hover:text-brand-emerald transition">
                {label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button onClick={() => scrollTo('booking')} className="hidden sm:inline-flex bg-brand-emerald hover:bg-brand-emerald-dark text-white rounded-full">
              {content.hero.ctaPrimary}
            </Button>
            <button className="lg:hidden p-2" onClick={() => setMenuOpen((v) => !v)}>
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="lg:hidden border-t border-brand-emerald/10 bg-brand-offwhite">
            <div className="container py-4 flex flex-col gap-3">
              {nav.map(([label, id]) => (
                <button key={id} onClick={() => scrollTo(id)} className="text-left py-2 font-medium">
                  {label}
                </button>
              ))}
              <Button onClick={() => scrollTo('booking')} className="bg-brand-emerald text-white rounded-full">
                {content.hero.ctaPrimary}
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* ===== Floating WhatsApp ===== */}
      <a
        href={waLink('नमस्ते! मुझे Chinmay Wellness Club के बारे में जानना है।')}
        target="_blank" rel="noreferrer"
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-[#25D366] text-white grid place-items-center shadow-xl hover:scale-105 transition"
        aria-label="WhatsApp"
      >
        <MessageCircle className="h-7 w-7" />
      </a>

      {/* ===== Hero ===== */}
      <section id="hero" className="relative">
        <div className="absolute inset-0">
          <img src={content.hero.image} alt="Wellness lifestyle" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-charcoal/90 via-brand-emerald-dark/80 to-brand-emerald/50" />
        </div>
        <div className="relative container py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <motion.div initial="hidden" animate="show" variants={fade}>
            <Badge className="bg-brand-mint text-brand-emerald-dark hover:bg-brand-mint rounded-full mb-4 font-semibold">{content.hero.badge}</Badge>
            <h1 className="font-hindi text-white text-3xl md:text-5xl font-extrabold leading-tight mb-3">{content.hero.titleHi}</h1>
            <p className="text-brand-mint font-head font-semibold text-lg md:text-xl mb-4">{content.hero.titleEn}</p>
            <p className="text-white/85 text-base md:text-lg mb-6 max-w-xl">{content.hero.subtitle}</p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => scrollTo('booking')} size="lg" className="bg-brand-coral hover:bg-brand-coral-dark text-white rounded-full text-base px-6">
                {content.hero.ctaPrimary} <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button onClick={() => setLeadOpen(true)} size="lg" variant="outline" className="rounded-full border-white text-white bg-white/10 hover:bg-white hover:text-brand-emerald text-base px-6">
                {content.hero.ctaSecondary}
              </Button>
            </div>
            <p className="text-brand-mint/90 text-sm mt-4 flex items-center gap-2"><Sparkles className="h-4 w-4" /> {content.hero.urgency}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="justify-self-center">
            <Card className="p-4 bg-white/95 backdrop-blur rounded-3xl shadow-2xl max-w-xs">
              <img src={content.hero.founderImage} alt={content.hero.founderName} className="w-full h-56 object-cover rounded-2xl mb-3" />
              <p className="font-hindi text-brand-charcoal text-sm italic mb-3">{content.hero.missionLine}</p>
              <div className="flex items-center gap-2 border-t border-brand-emerald/10 pt-3">
                <div className="h-9 w-9 rounded-full bg-brand-emerald text-white grid place-items-center font-bold">Dr</div>
                <div>
                  <p className="font-head font-bold text-brand-emerald text-sm leading-none">{content.hero.founderName}</p>
                  <p className="text-xs text-brand-charcoal/60">{content.hero.founderTitle}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ===== Program ===== */}
      <Section id="program" heading={content.program.heading} sub={content.program.subheading}>
        <div className="grid md:grid-cols-3 gap-6">
          {content.program.cards.map((c, i) => {
            const Ic = iconMap[c.icon] || Sparkles
            return (
              <motion.div key={i} variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }}>
                <Card className="p-6 h-full rounded-2xl border-brand-emerald/10 hover:shadow-lg transition bg-white">
                  <div className="h-12 w-12 rounded-xl bg-brand-mint-soft grid place-items-center mb-4">
                    <Ic className="h-6 w-6 text-brand-emerald" />
                  </div>
                  <h3 className="font-head font-bold text-lg text-brand-charcoal mb-3">{c.title}</h3>
                  <ul className="space-y-2 text-sm text-brand-charcoal/75">
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-brand-emerald shrink-0 mt-0.5" /> {c.b1}</li>
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-brand-emerald shrink-0 mt-0.5" /> {c.b2}</li>
                  </ul>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </Section>

      {/* ===== Process ===== */}
      <Section id="process" heading={content.process.heading} sub={content.process.subheading} tint>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {content.process.steps.map((s, i) => (
            <motion.div key={i} variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <Card className="p-6 h-full rounded-2xl bg-white border-brand-emerald/10 relative">
                <div className="h-10 w-10 rounded-full bg-brand-emerald text-white grid place-items-center font-head font-extrabold mb-4">{i + 1}</div>
                <h3 className="font-hindi font-bold text-brand-charcoal mb-1">{s.title}</h3>
                <p className="text-sm text-brand-charcoal/70">{s.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ===== Testimonials (Vimeo carousel) ===== */}
      <Section id="testimonials" heading="Real Member Stories" sub="असली सदस्यों की कहानियाँ">
        <VideoCarousel items={testimonials} />
      </Section>

      {/* ===== About ===== */}
      <Section id="about" heading={content.about.heading} sub={content.about.subheading} tint>
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <motion.img variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }}
            src={content.about.image} alt={content.hero.founderName}
            className="rounded-3xl shadow-xl w-full h-[360px] object-cover" />
          <motion.div variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <p className="font-hindi text-brand-charcoal/80 leading-relaxed mb-6">{content.about.bio}</p>
            <div className="border-l-4 border-brand-coral pl-4 bg-brand-mint-soft/60 py-4 rounded-r-xl">
              <Quote className="h-5 w-5 text-brand-coral mb-1" />
              <p className="font-hindi italic text-brand-emerald-dark font-medium">{content.about.quote}</p>
            </div>
            <div className="mt-6 flex items-center gap-2 text-brand-emerald font-semibold">
              <ShieldCheck className="h-5 w-5" /> कोई Bots नहीं, कोई Assistants नहीं — सीधा व्यक्तिगत मार्गदर्शन
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ===== Achievements ===== */}
      <Section id="achievements" heading={content.achievements.heading} sub={content.achievements.subheading}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {content.achievements.stats.map((s, i) => (
            <motion.div key={i} variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <Card className="p-6 text-center rounded-2xl bg-gradient-to-br from-brand-emerald to-brand-emerald-dark text-white">
                <p className="font-head font-extrabold text-4xl mb-1">{s.value}</p>
                <p className="text-sm text-brand-mint">{s.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ===== Gallery ===== */}
      <GallerySection gallery={gallery} />

      {/* ===== Community ===== */}
      <Section id="community" heading={content.community.heading} sub={content.community.ratingText} tint>
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex">
            {[...Array(5)].map((_, i) => <Star key={i} className="h-6 w-6 fill-brand-coral text-brand-coral" />)}
          </div>
          <span className="font-head font-extrabold text-2xl text-brand-emerald">{content.rating}</span>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {(content.community.images || []).map((img, i) => (
            <img key={i} src={img} alt={`Community ${i + 1}`} className="h-44 w-64 object-cover rounded-2xl shrink-0 shadow" />
          ))}
        </div>
      </Section>

      {/* ===== Transformations ===== */}
      <Section id="results" heading="Real Transformations" sub="वास्तविक बदलाव">
        <div className="grid md:grid-cols-2 gap-6">
          {transformations.map((t) => (
            <motion.div key={t.id} variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <Card className="p-4 rounded-2xl bg-white border-brand-emerald/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-head font-bold text-brand-charcoal">{t.name}</span>
                  <Badge className="bg-brand-mint text-brand-emerald-dark rounded-full">{t.resultTag}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <img src={t.before} alt="Before" className="h-48 w-full object-cover rounded-xl" />
                    <p className="text-center text-xs mt-1 text-brand-charcoal/60 font-semibold">BEFORE</p>
                  </div>
                  <div>
                    <img src={t.after} alt="After" className="h-48 w-full object-cover rounded-xl" />
                    <p className="text-center text-xs mt-1 text-brand-emerald font-semibold">AFTER</p>
                  </div>
                </div>
                {t.note && <p className="text-sm text-brand-charcoal/70 mt-3">{t.note}</p>}
                <p className="text-[11px] text-brand-charcoal/50 mt-3 border-t pt-2 leading-snug">
                  यह परिणाम सामान्य नहीं है। परिणाम व्यक्ति दर व्यक्ति भिन्न हो सकते हैं। / This result is not typical. Results may vary from person to person.
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ===== Booking ===== */}
      <BookingSection content={content} />

      {/* ===== FAQ ===== */}
      <Section id="faq" heading="Frequently Asked Questions" sub="अक्सर पूछे जाने वाले प्रश्न" tint>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f) => (
              <AccordionItem key={f.id} value={f.id} className="bg-white rounded-2xl border border-brand-emerald/10 px-5">
                <AccordionTrigger className="text-left font-hindi font-semibold text-brand-charcoal hover:no-underline">{f.question}</AccordionTrigger>
                <AccordionContent className="text-brand-charcoal/75 font-hindi">{f.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* ===== Footer ===== */}
      <footer className="bg-brand-charcoal text-white pt-14 pb-8">
        <div className="container grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-9 w-9 rounded-full bg-brand-emerald grid place-items-center font-head font-extrabold">C</span>
              <span className="font-head font-extrabold">{content.siteName}</span>
            </div>
            <p className="text-white/60 text-sm font-hindi">{content.footer.tagline}</p>
          </div>
          <div>
            <h4 className="font-head font-bold mb-3">Quick Links</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-white/70">
              {nav.map(([label, id]) => (
                <button key={id} onClick={() => scrollTo(id)} className="text-left hover:text-brand-mint">{label}</button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-head font-bold mb-3">Contact</h4>
            <a href={waLink('नमस्ते!')} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-white/70 hover:text-brand-mint mb-2"><MessageCircle className="h-4 w-4" /> +{WHATSAPP}</a>
            <p className="flex items-center gap-2 text-sm text-white/70"><MapPin className="h-4 w-4" /> {content.footer.address}</p>
          </div>
        </div>
        <div className="container mt-10 pt-6 border-t border-white/10 text-center text-white/40 text-xs">
          © {new Date().getFullYear()} {content.siteName}. All rights reserved.
        </div>
      </footer>

      {/* ===== Welcome Popup ===== */}
      {content.popup?.enabled && (
        <Dialog open={popupOpen} onOpenChange={setPopupOpen}>
          <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl">
            <img src={content.popup.image} alt="Welcome" className="w-full h-40 object-cover" />
            <div className="p-6">
              <h3 className="font-hindi font-extrabold text-xl text-brand-emerald mb-1">{content.popup.headline}</h3>
              <p className="text-sm text-brand-charcoal/70 mb-4">{content.popup.credibility}</p>
              <ul className="space-y-2 mb-4">
                {content.popup.points.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-brand-emerald shrink-0 mt-0.5" /> {p}</li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Button onClick={() => { setPopupOpen(false); scrollTo('booking') }} className="flex-1 bg-brand-emerald hover:bg-brand-emerald-dark text-white rounded-full">{content.popup.ctaPrimary}</Button>
                <Button onClick={() => { setPopupOpen(false); setLeadOpen(true) }} variant="outline" className="flex-1 rounded-full border-brand-emerald text-brand-emerald">{content.popup.ctaSecondary}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ===== Lead Capture Modal ===== */}
      <LeadModal open={leadOpen} onOpenChange={setLeadOpen} />
    </div>
  )
}

/* ---------------- Section wrapper ---------------- */
function Section({ id, heading, sub, tint, children }) {
  return (
    <section id={id} className={`py-16 md:py-20 ${tint ? 'bg-brand-mint-soft/40' : ''}`}>
      <div className="container">
        <div className="text-center mb-10">
          {sub && <p className="text-brand-coral font-semibold font-hindi mb-1">{sub}</p>}
          <h2 className="font-head font-extrabold text-2xl md:text-4xl text-brand-charcoal">{heading}</h2>
          <div className="h-1 w-16 bg-brand-coral rounded-full mx-auto mt-4" />
        </div>
        {children}
      </div>
    </section>
  )
}

/* ---------------- Video Carousel ---------------- */
function VideoCarousel({ items }) {
  const ref = useRef(null)
  const scroll = (dir) => {
    ref.current?.scrollBy({ left: dir * 340, behavior: 'smooth' })
  }
  if (!items.length) return <p className="text-center text-brand-charcoal/50">Testimonials coming soon.</p>
  return (
    <div className="relative">
      <div ref={ref} className="flex gap-5 overflow-x-auto no-scrollbar pb-3 snap-x">
        {items.map((t) => {
          const embed = vimeoEmbed(t.vimeoUrl)
          return (
            <Card key={t.id} className="w-[320px] shrink-0 snap-start rounded-2xl overflow-hidden bg-white border-brand-emerald/10">
              <div className="aspect-video bg-black">
                {embed ? (
                  <iframe src={embed} className="w-full h-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title={t.name} />
                ) : (
                  <div className="w-full h-full grid place-items-center text-white/60"><PlayCircle className="h-10 w-10" /></div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(t.rating || 5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-brand-coral text-brand-coral" />)}
                </div>
                {t.quote && <p className="text-sm text-brand-charcoal/75 mb-2 line-clamp-2">{t.quote}</p>}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-head font-bold text-sm text-brand-charcoal">{t.name}</p>
                    <p className="text-xs text-brand-charcoal/50">{t.city}</p>
                  </div>
                  {t.resultTag && <Badge className="bg-brand-mint text-brand-emerald-dark rounded-full">{t.resultTag}</Badge>}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
      <button onClick={() => scroll(-1)} className="absolute -left-2 top-1/3 h-10 w-10 rounded-full bg-white shadow grid place-items-center text-brand-emerald hover:bg-brand-mint-soft"><ChevronLeft /></button>
      <button onClick={() => scroll(1)} className="absolute -right-2 top-1/3 h-10 w-10 rounded-full bg-white shadow grid place-items-center text-brand-emerald hover:bg-brand-mint-soft"><ChevronRight /></button>
    </div>
  )
}

/* ---------------- Gallery ---------------- */
function GallerySection({ gallery }) {
  const [filter, setFilter] = useState('All')
  const cats = ['All', 'Sessions', 'Community', 'Results']
  const shown = filter === 'All' ? gallery : gallery.filter((g) => g.category === filter)
  return (
    <Section id="gallery" heading="Gallery" sub="हमारे पल">
      <div className="flex justify-center gap-2 mb-8 flex-wrap">
        {cats.map((c) => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${filter === c ? 'bg-brand-emerald text-white' : 'bg-white text-brand-charcoal/70 border border-brand-emerald/15'}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {shown.map((g) => (
          <motion.img key={g.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            src={g.url} alt={g.alt} className="w-full h-56 object-cover rounded-2xl shadow-sm" />
        ))}
      </div>
    </Section>
  )
}

/* ---------------- Booking ---------------- */
function BookingSection({ content }) {
  const [step, setStep] = useState(1)
  const [date, setDate] = useState(null)
  const [slots, setSlots] = useState([])
  const [time, setTime] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [form, setForm] = useState({ name: '', whatsapp: '', email: '', goal: '' })
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const openDays = content.booking?.days || [1, 2, 3, 4, 5, 6]
  const fmt = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const onPickDate = async (d) => {
    if (!d) return
    setDate(d)
    setTime('')
    setLoadingSlots(true)
    try {
      const res = await fetch(`/api/availability?date=${fmt(d)}`).then((r) => r.json())
      setSlots(res.slots || [])
    } catch (e) { setSlots([]) }
    setLoadingSlots(false)
    setStep(2)
  }

  const submit = async () => {
    if (!form.name || !form.whatsapp) { toast.error('कृपया नाम और WhatsApp भरें'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, date: fmt(date), time }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setDone(true)
      toast.success('Booking confirmed! 🎉')
    } catch (e) {
      toast.error(e.message)
    }
    setSubmitting(false)
  }

  const waHandoff = waLink(`नमस्ते! मैंने ${date ? fmt(date) : ''} ${time} के लिए Discovery Call book की है। मेरा नाम ${form.name} है।`)

  return (
    <section id="booking" className="py-16 md:py-20 bg-gradient-to-br from-brand-emerald to-brand-emerald-dark text-white">
      <div className="container max-w-3xl">
        <div className="text-center mb-8">
          <p className="text-brand-mint font-hindi font-semibold mb-1">{content.booking.subheading}</p>
          <h2 className="font-head font-extrabold text-2xl md:text-4xl">{content.booking.heading}</h2>
        </div>
        <Card className="p-6 md:p-8 rounded-3xl bg-white text-brand-charcoal">
          {done ? (
            <div className="text-center py-6">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                <CheckCircle2 className="h-16 w-16 text-brand-emerald mx-auto mb-4" />
              </motion.div>
              <h3 className="font-head font-extrabold text-xl mb-2">Booking Confirmed!</h3>
              <p className="text-brand-charcoal/70 mb-1">{fmt(date)} • {time}</p>
              <p className="text-sm text-brand-charcoal/60 mb-6">हमने आपको confirmation email भेजा है। Dr. Harale जल्द ही संपर्क करेंगे।</p>
              <a href={waHandoff} target="_blank" rel="noreferrer">
                <Button className="bg-[#25D366] hover:bg-[#1eb658] text-white rounded-full"><MessageCircle className="h-4 w-4 mr-1" /> WhatsApp पर continue करें</Button>
              </a>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 mb-6">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center">
                    <div className={`h-8 w-8 rounded-full grid place-items-center text-sm font-bold ${step >= s ? 'bg-brand-emerald text-white' : 'bg-brand-mint-soft text-brand-emerald'}`}>{s}</div>
                    {s < 3 && <div className={`w-10 h-1 ${step > s ? 'bg-brand-emerald' : 'bg-brand-mint-soft'}`} />}
                  </div>
                ))}
              </div>

              {step === 1 && (
                <div className="flex flex-col items-center">
                  <p className="font-semibold mb-3 flex items-center gap-2"><CalendarDays className="h-5 w-5 text-brand-emerald" /> तारीख चुनें</p>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={onPickDate}
                    disabled={(d) => {
                      const today = new Date(); today.setHours(0, 0, 0, 0)
                      return d < today || !openDays.includes(d.getDay())
                    }}
                    className="rounded-xl border"
                  />
                </div>
              )}

              {step === 2 && (
                <div>
                  <button onClick={() => setStep(1)} className="text-sm text-brand-emerald mb-3 flex items-center gap-1"><ChevronLeft className="h-4 w-4" /> तारीख बदलें</button>
                  <p className="font-semibold mb-3 flex items-center gap-2"><Clock className="h-5 w-5 text-brand-emerald" /> समय चुनें — {fmt(date)}</p>
                  {loadingSlots ? (
                    <p className="text-brand-charcoal/50">Loading slots...</p>
                  ) : slots.length === 0 ? (
                    <p className="text-brand-charcoal/50">इस दिन कोई slot उपलब्ध नहीं। कृपया दूसरी तारीख चुनें।</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {slots.map((s) => (
                        <button key={s} onClick={() => { setTime(s); setStep(3) }}
                          className={`py-2 rounded-xl text-sm border transition ${time === s ? 'bg-brand-emerald text-white border-brand-emerald' : 'border-brand-emerald/20 hover:bg-brand-mint-soft'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <button onClick={() => setStep(2)} className="text-sm text-brand-emerald mb-1 flex items-center gap-1"><ChevronLeft className="h-4 w-4" /> समय बदलें</button>
                  <p className="font-semibold">Confirm — {fmt(date)} • {time}</p>
                  <Input placeholder="आपका नाम / Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <Input placeholder="WhatsApp Number" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
                  <Input placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  <div className="flex flex-wrap gap-2">
                    {GOALS.map((g) => (
                      <button key={g} onClick={() => setForm({ ...form, goal: g })}
                        className={`px-3 py-1.5 rounded-full text-sm border ${form.goal === g ? 'bg-brand-coral text-white border-brand-coral' : 'border-brand-emerald/20'}`}>{g}</button>
                    ))}
                  </div>
                  <Button onClick={submit} disabled={submitting} className="w-full bg-brand-emerald hover:bg-brand-emerald-dark text-white rounded-full">
                    {submitting ? 'Booking...' : 'Confirm Booking'}
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </section>
  )
}

/* ---------------- Lead Modal ---------------- */
function LeadModal({ open, onOpenChange }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name: '', whatsapp: '', goal: '', contactTime: '' })
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const reset = () => { setStep(1); setForm({ name: '', whatsapp: '', goal: '', contactTime: '' }); setDone(false) }

  const submit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed')
      setDone(true); setStep(4)
    } catch (e) { toast.error('कुछ गड़बड़ हुई, फिर कोशिश करें') }
    setSubmitting(false)
  }

  const waHandoff = waLink(`नमस्ते! मैं ${form.name} — मेरा goal: ${form.goal}. मैं Free Discovery Call चाहता/चाहती हूँ।`)

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setTimeout(reset, 300) }}>
      <DialogContent className="max-w-md rounded-3xl">
        <div className="mb-2">
          <div className="h-1.5 bg-brand-mint-soft rounded-full overflow-hidden">
            <div className="h-full bg-brand-emerald transition-all" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <h3 className="font-head font-extrabold text-xl text-brand-emerald">आइए शुरू करें</h3>
            <Input placeholder="आपका नाम / Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="WhatsApp Number" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
            <Button onClick={() => { if (!form.name || !form.whatsapp) return toast.error('कृपया दोनों भरें'); setStep(2) }} className="w-full bg-brand-emerald text-white rounded-full">Next</Button>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-3">
            <h3 className="font-head font-extrabold text-xl text-brand-emerald">आपका मुख्य लक्ष्य?</h3>
            <div className="grid grid-cols-2 gap-3">
              {GOALS.map((g) => (
                <button key={g} onClick={() => { setForm({ ...form, goal: g }); setStep(3) }}
                  className={`p-4 rounded-2xl border text-sm font-medium text-left ${form.goal === g ? 'bg-brand-mint-soft border-brand-emerald' : 'border-brand-emerald/15'}`}>{g}</button>
              ))}
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-3">
            <h3 className="font-head font-extrabold text-xl text-brand-emerald">कब संपर्क करें?</h3>
            <div className="flex gap-3">
              {TIMES.map((t) => (
                <button key={t} onClick={() => setForm({ ...form, contactTime: t })}
                  className={`flex-1 py-3 rounded-2xl border text-sm ${form.contactTime === t ? 'bg-brand-coral text-white border-brand-coral' : 'border-brand-emerald/15'}`}>{t}</button>
              ))}
            </div>
            <Button onClick={submit} disabled={submitting || !form.contactTime} className="w-full bg-brand-emerald text-white rounded-full">{submitting ? 'Sending...' : 'Submit'}</Button>
          </div>
        )}
        {step === 4 && done && (
          <div className="text-center py-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
              <CheckCircle2 className="h-16 w-16 text-brand-emerald mx-auto mb-3" />
            </motion.div>
            <h3 className="font-head font-extrabold text-xl mb-1">धन्यवाद, {form.name}!</h3>
            <p className="text-sm text-brand-charcoal/70 mb-5">हम जल्द ही आपसे संपर्क करेंगे।</p>
            <a href={waHandoff} target="_blank" rel="noreferrer">
              <Button className="bg-[#25D366] hover:bg-[#1eb658] text-white rounded-full"><MessageCircle className="h-4 w-4 mr-1" /> WhatsApp पर बात करें</Button>
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
