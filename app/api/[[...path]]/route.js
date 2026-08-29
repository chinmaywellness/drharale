import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ---------- Supabase clients (server-side) ----------
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const anonC = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
})
const svcC = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
})

// ---------- Resend ----------
const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM || 'Chinmay Wellness Club <onboarding@resend.dev>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

// ---------- admin session (custom signed cookie — no Supabase Auth) ----------
// Login is now email + password. Passwords are hashed with scrypt (Node's
// built-in crypto, no extra dependency, no native bindings to break on
// Hostinger). Session is a signed cookie (HMAC-SHA256), not a Supabase Auth
// session — simpler and removes the Supabase Auth/OTP/SMTP dependency
// entirely for admin login.
const SESSION_COOKIE = 'cwc_sess'
const SESSION_SECRET = process.env.SESSION_SECRET || ''
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days
const cookieBase = { httpOnly: true, secure: true, sameSite: 'lax', path: '/' }

function b64url(str) { return Buffer.from(str).toString('base64url') }
function signPayload(payloadB64) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url')
}
function createSessionToken(email) {
  const payloadB64 = b64url(JSON.stringify({ email, exp: Date.now() + SESSION_MAX_AGE * 1000 }))
  return `${payloadB64}.${signPayload(payloadB64)}`
}
function readSessionToken(token) {
  if (!token || !SESSION_SECRET) return null
  const [payloadB64, sig] = token.split('.')
  if (!payloadB64 || !sig) return null
  const expected = signPayload(payloadB64)
  const a = Buffer.from(sig), b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'))
    if (!payload?.email || !payload?.exp || payload.exp < Date.now()) return null
    return payload
  } catch { return null }
}
function setSession(res, email) {
  res.cookies.set(SESSION_COOKIE, createSessionToken(email), { ...cookieBase, maxAge: SESSION_MAX_AGE })
  return res
}
function clearSession(res) {
  res.cookies.delete(SESSION_COOKIE)
  res.cookies.delete('cwc_at'); res.cookies.delete('cwc_rt') // clean up old OTP-era cookies
  return res
}

// ---------- password hashing (scrypt, built into Node — no extra package) ----------
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}
function verifyPassword(password, stored) {
  if (!password || !stored || !stored.includes(':')) return false
  const [salt, hashHex] = stored.split(':')
  const hashBuf = Buffer.from(hashHex, 'hex')
  const testBuf = crypto.scryptSync(password, salt, 64)
  if (hashBuf.length !== testBuf.length) return false
  return crypto.timingSafeEqual(hashBuf, testBuf)
}

// ---------- helpers ----------
function clean(v, maxLen = 300) {
  if (typeof v !== 'string') return ''
  return v.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLen)
}
function escapeHtml(v) {
  return String(v).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;')
}
const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || 'https://chinmaywellnessclub.in'
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  response.headers.set('Vary', 'Origin')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}
function json(data, status = 200) { return handleCORS(NextResponse.json(data, { status })) }
export async function OPTIONS() { return handleCORS(new NextResponse(null, { status: 200 })) }

// ---------- rate limit (in-memory) ----------
const hits = new Map()
function rateLimit(key, max, windowMs) {
  const now = Date.now()
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs)
  arr.push(now); hits.set(key, arr)
  return arr.length <= max
}

// ---------- admin allowlist ----------
function envAdmins() {
  return (process.env.ADMIN_EMAILS || ADMIN_EMAIL || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean)
}
async function isAdminEmail(email) {
  if (!email) return false
  const e = email.toLowerCase()
  if (envAdmins().includes(e)) return true
  const { data, error } = await svcC.from('admins').select('email').eq('email', e).maybeSingle()
  if (error) console.error(`isAdminEmail: DB check failed for ${e} — ${error.message} (is 'admins' table missing? run supabase/migration.sql)`)
  return Boolean(data)
}
async function requireAdmin(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  const payload = readSessionToken(token)
  if (!payload?.email) return null
  if (!(await isAdminEmail(payload.email))) return null
  return { email: payload.email }
}

// ---------- images ----------
const IMG = {
  hero: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1400&q=70',
  founder: 'https://images.unsplash.com/photo-1549476464-37392f717541?auto=format&fit=crop&w=900&q=75',
  coaching: 'https://images.unsplash.com/photo-1567281105113-a9b2effdc9a8?auto=format&fit=crop&w=900&q=70',
  yoga: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=70',
  jogging: 'https://images.pexels.com/photos/5319373/pexels-photo-5319373.jpeg?auto=compress&cs=tinysrgb&w=900',
  salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=70',
  group: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=70',
  running: 'https://images.unsplash.com/photo-1603455778956-d71832eafa4e?auto=format&fit=crop&w=900&q=70',
}

const DISCLAIMER = 'यह परिणाम सामान्य नहीं है। परिणाम व्यक्ति दर व्यक्ति भिन्न हो सकते हैं। / This result is not typical. Results may vary from person to person.'

const DEFAULT_CONTENT = {
  siteName: 'Chinmay Wellness Club',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919975727098',
  rating: '4.9',
  seo: {
    title: 'Chinmay Wellness Club | वजन नहीं, जीवनशैली बदलिए — Kolhapur',
    description: 'Chinmay Wellness Club, Kolhapur — Dr. Chandrashekhar Harale यांचे वैयक्तिक wellness coaching. No gym, no starving. Sustainable, personalised Indian nutrition & daily guidance.',
  },
  hero: {
    badge: 'Kolhapur • Personal Wellness Coaching',
    titleHi: 'सिर्फ़ वजन नहीं — अपनी ऊर्जा, आत्मविश्वास और जीवनशैली बदलिए',
    titleEn: 'Transform your energy, confidence & lifestyle — not just your weight',
    subtitle: 'No gym. No starving. सिर्फ़ आपके शरीर और दिनचर्या के अनुसार बना एक sustainable plan — और रोज़ Dr. Harale का व्यक्तिगत मार्गदर्शन।',
    urgency: 'नए batch की सीमित seats — आज ही availability check करें।',
    ctaPrimary: 'Check Batch Availability',
    ctaSecondary: 'Free Discovery Call',
    image: IMG.hero,
    founderName: 'Dr. Chandrashekhar Harale',
    founderTitle: 'Founder & Wellness Coach',
    founderImage: IMG.founder,
    missionLine: '"मी फक्त वजन कमी करायला मदत करत नाही — मी अशी शाश्वत जीवनशैली तयार करायला मदत करतो जी तुम्ही आयुष्यभर सहज जगू शकाल."',
  },
  program: {
    heading: 'आपको इस प्रोग्राम में क्या मिलेगा',
    subheading: 'What you get inside the program',
    cards: [
      { icon: 'salad', title: 'Personalized Indian Nutrition Plan', b1: 'आपके स्वाद और routine के अनुसार भारतीय भोजन', b2: 'No crash diets — sustainable, ghar-ka-khana friendly' },
      { icon: 'heart', title: 'Continuous Wellness Support', b1: 'हर हफ़्ते progress review और adjustments', b2: 'WhatsApp पर लगातार accountability और motivation' },
      { icon: 'user', title: 'Daily Personal Guidance from Dr. Harale', b1: 'रोज़ सुबह सीधा व्यक्तिगत मार्गदर्शन', b2: 'कोई Bots नहीं, कोई Assistants नहीं' },
    ],
  },
  process: {
    heading: 'यह कैसे काम करता है',
    subheading: 'How it works',
    steps: [
      { title: 'WhatsApp पर आवेदन करें', desc: 'एक message भेजें और अपनी journey शुरू करें' },
      { title: 'Free Discovery Call', desc: 'आपके goals और lifestyle को समझने के लिए बातचीत' },
      { title: 'व्यक्तिगत प्लान', desc: 'आपके शरीर व दिनचर्या के अनुसार custom plan' },
      { title: 'रोज़ाना व्यक्तिगत मार्गदर्शन', desc: 'हर दिन accountability और support' },
    ],
  },
  about: {
    heading: 'About Dr. Chandrashekhar Harale',
    subheading: 'संस्थापक की कहानी',
    image: IMG.founder,
    bio: 'डॉ. चंद्रशेखर हराळे यांनी स्वतः एक कठीण lifestyle health journey अनुभवली आहे — सतत discipline, योग्य nutrition आणि consistent workout च्या मदतीने त्यांनी स्वतःचं वजन आणि एकंदर आरोग्य लक्षणीयरीत्या सुधारलं, कोणत्याही shortcuts शिवाय. हाच अनुभव आज ते Chinmay Wellness Club च्या माध्यमातून १००+ सदस्यांसोबत share करत आहेत — प्रत्येकाला त्यांची स्वतःची, sustainable health journey सुरू करण्यास मदत करत आहेत. कोणतेही bots नाहीत, कोणतेही assistants नाहीत — प्रत्येक सदस्याला थेट, वैयक्तिक मार्गदर्शन डॉ. हराळे स्वतः देतात, रोज सकाळी.',
    quote: '"मी फक्त वजन कमी करायला मदत करत नाही — मी अशी शाश्वत जीवनशैली तयार करायला मदत करतो जी तुम्ही आयुष्यभर सहज जगू शकाल, कारण मी स्वतः तीच journey जगलो आहे."',
    credentialsBanner: '',
  },
  achievements: {
    heading: 'Experience You Can Trust',
    subheading: 'अनुभव जिस पर आप भरोसा कर सकते हैं',
    stats: [
      { value: '3+', label: 'Years of Wellness Coaching' },
      { value: '100+', label: 'Members Guided' },
      { value: '100%', label: 'Personal, 1-on-1 Guidance' },
      { value: '0', label: 'Bots or Assistants' },
    ],
  },
  community: {
    heading: 'A Real, Supportive Community',
    ratingText: 'सदस्यों द्वारा पसंद किया गया',
    images: [IMG.group, IMG.jogging, IMG.coaching, IMG.running, IMG.yoga],
  },
  popup: {
    enabled: true, image: IMG.founder,
    headline: 'Chinmay Wellness Club में आपका स्वागत है',
    credibility: 'Dr. Chandrashekhar Harale के साथ 100+ सदस्य अपनी sustainable journey जी रहे हैं।',
    points: ['Personalized coaching', 'Real community support', 'Sustainable change', 'Direct founder guidance'],
    ctaPrimary: 'Check Batch Availability', ctaSecondary: 'Discovery Call',
  },
  footer: { tagline: 'वजन नहीं, जीवनशैली बदलिए। — Kolhapur, Maharashtra', address: 'Kolhapur, Maharashtra, India', email: '' },
  finalCta: {
    enabled: true,
    image: IMG.group,
    heading: 'अब और इंतज़ार नहीं — अपनी sustainable journey आज शुरू करें',
    subheading: "इस महीने के batch में सीमित seats बची हैं — Dr. Harale से सीधे बात करें।",
    ctaText: 'Check Batch Availability',
  },
  booking: {
    heading: 'Book Your Free Discovery Call',
    subheading: 'एक call जो आपकी journey बदल सकती है',
    bannerImage: IMG.group,
    days: [1, 2, 3, 4, 5, 6],
    slots: ['07:00 AM', '08:00 AM', '09:00 AM', '05:00 PM', '06:00 PM', '07:00 PM'],
  },
}

// ---------- default seeds ----------
const DEFAULT_TESTIMONIALS = [
  { name: 'Placeholder Member 1', city: 'Kolhapur', rating: 5, quote: 'Video testimonial — admin से Vimeo link जोड़ें।', result_tag: 'More Energy', vimeo_url: 'https://vimeo.com/76979871', sort_order: 1 },
  { name: 'Placeholder Member 2', city: 'Sangli', rating: 5, quote: 'Video testimonial — admin से Vimeo link जोड़ें।', result_tag: 'Weight Loss', vimeo_url: 'https://vimeo.com/22439234', sort_order: 2 },
  { name: 'Placeholder Member 3', city: 'Pune', rating: 5, quote: 'Video testimonial — admin से Vimeo link जोड़ें।', result_tag: 'Lifestyle', vimeo_url: 'https://vimeo.com/1084537', sort_order: 3 },
]
const DEFAULT_FAQS = [
  { question: 'क्या gym जाना ज़रूरी है? / Is a gym required?', answer: 'नहीं। हमारा focus sustainable lifestyle और घर पर की जा सकने वाली activity पर है। No gym required.', sort_order: 1 },
  { question: 'क्या यह vegetarian-friendly है? / Is it vegetarian-friendly?', answer: 'हाँ। आपका plan पूरी तरह आपके भोजन (veg/non-veg) और स्वाद के अनुसार बनाया जाता है।', sort_order: 2 },
  { question: 'क्या यह PCOS/Thyroid के लिए उपयुक्त है? / Suitable for PCOS/Thyroid?', answer: 'हम lifestyle और nutrition पर personalised guidance देते हैं। कृपया अपनी medical condition discovery call में बताएं; यह चिकित्सा उपचार का विकल्प नहीं है।', sort_order: 3 },
  { question: 'क्या कोई छिपे हुए charges हैं? / Any hidden charges?', answer: 'नहीं। सब कुछ discovery call में स्पष्ट रूप से बताया जाता है — कोई hidden charges नहीं।', sort_order: 4 },
  { question: 'शुरुआत कैसे करें? / How to start?', answer: 'बस WhatsApp पर message करें या Free Discovery Call book करें — हम आपको आगे guide करेंगे।', sort_order: 5 },
]
const DEFAULT_TRANSFORMATIONS = [
  { name: 'Member A', result_tag: 'Sustainable Weight Loss', before_image: IMG.running, after_image: IMG.jogging, note: 'Consistency के साथ real results.', disclaimer_text: DISCLAIMER, sort_order: 1 },
  { name: 'Member B', result_tag: 'More Energy', before_image: IMG.yoga, after_image: IMG.group, note: 'Better routine, better energy.', disclaimer_text: DISCLAIMER, sort_order: 2 },
]
const DEFAULT_GALLERY = [
  { category: 'Sessions', image_url: IMG.coaching, alt_text: 'Coaching session', sort_order: 1 },
  { category: 'Community', image_url: IMG.group, alt_text: 'Community yoga', sort_order: 2 },
  { category: 'Results', image_url: IMG.jogging, alt_text: 'Members jogging', sort_order: 3 },
  { category: 'Sessions', image_url: IMG.yoga, alt_text: 'Yoga session', sort_order: 4 },
  { category: 'Community', image_url: IMG.running, alt_text: 'Outdoor run', sort_order: 5 },
  { category: 'Results', image_url: IMG.salad, alt_text: 'Healthy nutrition', sort_order: 6 },
]

// ---------- collection mappers ----------
const COLL = {
  testimonials: {
    table: 'testimonials',
    toApi: (r) => ({ id: r.id, name: r.name, city: r.city, quote: r.quote, rating: r.rating, vimeoUrl: r.vimeo_url, resultTag: r.result_tag, order: r.sort_order }),
    toDb: (b) => ({ name: clean(b.name, 120), city: clean(b.city, 80), quote: clean(b.quote, 600), rating: parseInt(b.rating) || 5, vimeo_url: clean(b.vimeoUrl, 300), result_tag: clean(b.resultTag, 60), sort_order: parseInt(b.order) || 0 }),
    defaults: DEFAULT_TESTIMONIALS,
  },
  transformations: {
    table: 'transformations',
    toApi: (r) => ({ id: r.id, name: r.name, before: r.before_image, after: r.after_image, resultTag: r.result_tag, note: r.note, disclaimer: r.disclaimer_text, order: r.sort_order }),
    toDb: (b) => ({ name: clean(b.name, 120), before_image: clean(b.before, 100000), after_image: clean(b.after, 100000), result_tag: clean(b.resultTag, 60), note: clean(b.note, 600), disclaimer_text: b.disclaimer ? clean(b.disclaimer, 600) : DISCLAIMER, sort_order: parseInt(b.order) || 0 }),
    defaults: DEFAULT_TRANSFORMATIONS,
  },
  gallery: {
    table: 'gallery',
    toApi: (r) => ({ id: r.id, category: r.category, url: r.image_url, alt: r.alt_text, order: r.sort_order }),
    toDb: (b) => ({ category: clean(b.category, 40), image_url: clean(b.url, 200000), alt_text: clean(b.alt, 200), sort_order: parseInt(b.order) || 0 }),
    defaults: DEFAULT_GALLERY,
  },
  faqs: {
    table: 'faqs',
    toApi: (r) => ({ id: r.id, question: r.question, answer: r.answer, order: r.sort_order }),
    toDb: (b) => ({ question: clean(b.question, 300), answer: clean(b.answer, 2000), sort_order: parseInt(b.order) || 0 }),
    defaults: DEFAULT_FAQS,
  },
}

async function getContentData() {
  const { data } = await anonC.from('site_content').select('data').eq('id', 'site').maybeSingle()
  if (!data) {
    await svcC.from('site_content').upsert({ id: 'site', data: DEFAULT_CONTENT, updated_at: new Date().toISOString() })
    return DEFAULT_CONTENT
  }
  return { ...DEFAULT_CONTENT, ...(data.data || {}) }
}

async function getList(collKey) {
  const c = COLL[collKey]
  let { data } = await anonC.from(c.table).select('*').order('sort_order', { ascending: true })
  if (!data || data.length === 0) {
    await svcC.from(c.table).insert(c.defaults)
    const r = await svcC.from(c.table).select('*').order('sort_order', { ascending: true })
    data = r.data || []
  }
  return data.map(c.toApi)
}

// ---------- emails ----------
async function sendSubmissionEmails(item) {
  if (!process.env.RESEND_API_KEY) return
  const s = (v) => escapeHtml(v || '')
  try {
    const tasks = []
    if (item.email) {
      tasks.push(resend.emails.send({
        from: FROM, to: [item.email],
        subject: 'आपकी Free Discovery Call — Chinmay Wellness Club',
        html: `<div style="font-family:Inter,Arial,sans-serif"><h2 style="color:#0F6B4C">धन्यवाद, ${s(item.name)}!</h2><p>आपका request हमें मिल गया है। हम जल्द ही आपसे संपर्क करेंगे।</p>${item.date ? `<p><b>Requested:</b> ${s(item.date)} ${s(item.time)}</p>` : ''}<p style="color:#666">Ref: ${item.id}</p><p style="margin-top:16px">— Dr. Chandrashekhar Harale</p></div>`,
      }))
    }
    if (ADMIN_EMAIL) {
      tasks.push(resend.emails.send({
        from: FROM, to: [ADMIN_EMAIL], replyTo: item.email || undefined,
        subject: `🔔 New ${item.type}: ${item.name}`,
        html: `<div style="font-family:Inter,Arial,sans-serif"><h2>New ${s(item.type)}</h2><p><b>Name:</b> ${s(item.name)}</p><p><b>WhatsApp:</b> ${s(item.whatsapp)}</p>${item.goal ? `<p><b>Goal:</b> ${s(item.goal)}</p>` : ''}${item.date ? `<p><b>Date/Time:</b> ${s(item.date)} ${s(item.time)}</p>` : ''}${item.contactTime ? `<p><b>Prefers:</b> ${s(item.contactTime)}</p>` : ''}<p style="color:#666">Ref: ${item.id}</p></div>`,
      }))
    }
    await Promise.allSettled(tasks)
  } catch (e) { console.error('email error', e?.message) }
}

// ============ MAIN HANDLER ============
async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const route = `/${path.join('/')}`
  const method = request.method
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'local'

  try {
    // ===== PUBLIC GET =====
    if (route === '/content' && method === 'GET') return json(await getContentData())
    if (route === '/testimonials' && method === 'GET') return json(await getList('testimonials'))
    if (route === '/transformations' && method === 'GET') return json(await getList('transformations'))
    if (route === '/gallery' && method === 'GET') return json(await getList('gallery'))
    if (route === '/faqs' && method === 'GET') return json(await getList('faqs'))

    if (route === '/availability' && method === 'GET') {
      const dateStr = request.nextUrl.searchParams.get('date')
      if (!dateStr) return json({ slots: [] })
      const content = await getContentData()
      const bk = content.booking || { days: [1, 2, 3, 4, 5, 6], slots: [] }
      const weekday = new Date(dateStr + 'T00:00:00').getDay()
      if (!bk.days?.includes(weekday)) return json({ slots: [], dayOpen: false })
      const { data: booked } = await svcC.from('bookings').select('slot').eq('booking_date', dateStr)
      const taken = (booked || []).map((b) => b.slot)
      return json({ slots: (bk.slots || []).filter((s) => !taken.includes(s)), dayOpen: true })
    }

    // ===== PUBLIC POST: leads =====
    if (route === '/leads' && method === 'POST') {
      if (!rateLimit(`lead:${ip}`, 5, 60 * 1000)) return json({ error: 'Too many requests' }, 429)
      const body = await request.json()
      const name = clean(body.name, 120)
      const whatsapp = clean(body.whatsapp, 20)
      if (!name || !whatsapp) return json({ error: 'Name and WhatsApp required' }, 400)
      const row = { name, whatsapp, email: clean(body.email, 120), goal: clean(body.goal, 60), preferred_time: clean(body.contactTime, 40), status: 'New' }
      const { data, error } = await svcC.from('leads').insert(row).select('id').single()
      if (error) {
        console.error(`leads insert failed: ${error.message} (code ${error.code || 'n/a'}) — is 'leads' table missing/out of date? run supabase/migration.sql`)
        return json({ error: 'Could not save' }, 500)
      }
      sendSubmissionEmails({ ...row, id: data.id, type: 'lead', contactTime: row.preferred_time })
      return json({ ok: true, id: data.id })
    }

    // ===== PUBLIC POST: bookings =====
    if (route === '/bookings' && method === 'POST') {
      if (!rateLimit(`booking:${ip}`, 5, 60 * 1000)) return json({ error: 'Too many requests' }, 429)
      const body = await request.json()
      const name = clean(body.name, 120)
      const whatsapp = clean(body.whatsapp, 20)
      const booking_date = clean(body.date, 20)
      const slot = clean(body.time, 20)
      if (!name || !whatsapp || !booking_date || !slot) return json({ error: 'All fields required' }, 400)
      const row = { name, whatsapp, email: clean(body.email, 120), goal: clean(body.goal, 60), booking_date, slot, status: 'New' }
      const { data, error } = await svcC.from('bookings').insert(row).select('id').single()
      if (error) {
        if (error.code === '23505') return json({ error: 'Slot just got booked, choose another' }, 409)
        console.error(`bookings insert failed: ${error.message} (code ${error.code || 'n/a'}) — is 'bookings' table missing/out of date? run supabase/migration.sql`)
        return json({ error: 'Could not save' }, 500)
      }
      sendSubmissionEmails({ ...row, id: data.id, type: 'booking', date: booking_date, time: slot })
      return json({ ok: true, id: data.id })
    }

    // ===== AUTH (email + password) =====
    if (route === '/auth/login' && method === 'POST') {
      if (!rateLimit(`login:${ip}`, 8, 10 * 60 * 1000)) return json({ error: 'Too many attempts. Try again later.' }, 429)
      if (!SESSION_SECRET) { console.error('SESSION_SECRET is not set'); return json({ error: 'Server not configured' }, 500) }
      const body = await request.json()
      const email = clean(body.email, 120).toLowerCase()
      const password = typeof body.password === 'string' ? body.password : ''
      if (!email.includes('@') || !password) return json({ error: 'Email and password required' }, 400)

      const { data: row, error } = await svcC.from('admins').select('email, password_hash').eq('email', email).maybeSingle()
      if (error) console.error(`login: DB check failed for ${email} — ${error.message} (is 'admins' table missing 'password_hash'? run supabase/migration.sql)`)
      if (!row) {
        console.log(`login: failed — no admin row for ${email} (run supabase/migration.sql, or add this admin from the Admins tab if another admin can still log in)`)
        return json({ error: 'Invalid email or password' }, 401)
      }
      if (!row.password_hash) {
        console.log(`login: failed — ${email} exists in admins table but has NO password_hash set. Re-run the latest supabase/migration.sql (it seeds samfonde0@gmail.com's password), or set one via PUT /api/admin/admins/${email}/password once another admin can log in.`)
        return json({ error: 'Invalid email or password' }, 401)
      }
      if (!verifyPassword(password, row.password_hash)) {
        console.log(`login: failed — wrong password for ${email}`)
        return json({ error: 'Invalid email or password' }, 401)
      }
      const res = json({ ok: true, email })
      return setSession(res, email)
    }

    if (route === '/auth/logout' && method === 'POST') {
      return clearSession(json({ ok: true }))
    }

    if (route === '/auth/me' && method === 'GET') {
      const admin = await requireAdmin(request)
      if (admin) return json({ authenticated: true, email: admin.email })
      return json({ authenticated: false }, 401)
    }

    // ===== ADMIN (protected) =====
    if (route.startsWith('/admin/')) {
      const admin = await requireAdmin(request)
      if (!admin) return json({ error: 'Unauthorized' }, 401)

      // system health check — for the site owner to self-diagnose without
      // needing server-log access. Checks every table the app depends on,
      // plus the specific things that have broken before (admin password
      // hash present, required env vars set).
      if (route === '/admin/health' && method === 'GET') {
        const checks = []
        const tableCheck = async (table) => {
          const { error, count } = await svcC.from(table).select('*', { count: 'exact', head: true })
          checks.push({
            name: `Table: ${table}`,
            ok: !error,
            detail: error ? error.message : `reachable (${count ?? 0} rows)`,
          })
        }
        await Promise.all(['site_content', 'testimonials', 'transformations', 'gallery', 'faqs', 'leads', 'bookings', 'admins'].map(tableCheck))

        // admin password_hash specifically — the most common real-world break
        const { data: adminRows, error: adminErr } = await svcC.from('admins').select('email, password_hash')
        if (adminErr) {
          checks.push({ name: 'Admin passwords', ok: false, detail: `Could not read admins table — ${adminErr.message}` })
        } else {
          const withoutPassword = (adminRows || []).filter((a) => !a.password_hash)
          checks.push({
            name: 'Admin passwords',
            ok: (adminRows || []).length > 0 && withoutPassword.length === 0,
            detail: !adminRows?.length
              ? 'No admin rows found at all — run supabase/migration.sql'
              : withoutPassword.length
                ? `No password set for: ${withoutPassword.map((a) => a.email).join(', ')} — set one from the Admins tab, or re-run supabase/migration.sql`
                : `${adminRows.length} admin(s), all have a password set`,
          })
        }

        const envChecks = [
          ['SESSION_SECRET', SESSION_SECRET],
          ['SUPABASE_SERVICE_ROLE_KEY', SERVICE_KEY],
          ['NEXT_PUBLIC_SUPABASE_ANON_KEY', ANON_KEY],
          ['RESEND_API_KEY', process.env.RESEND_API_KEY],
          ['RESEND_FROM', FROM],
        ]
        for (const [name, val] of envChecks) {
          checks.push({ name: `Env: ${name}`, ok: Boolean(val), detail: val ? 'set' : 'MISSING — set this in Hostinger env vars and redeploy' })
        }

        return json({ checks, allOk: checks.every((c) => c.ok) })
      }

      // content
      if (route === '/admin/content' && method === 'PUT') {
        const body = await request.json()
        delete body._id
        await svcC.from('site_content').upsert({ id: 'site', data: body, updated_at: new Date().toISOString() })
        return json({ ok: true })
      }

      // collection CRUD
      const collMatch = route.match(/^\/admin\/(testimonials|transformations|gallery|faqs)(?:\/(.+))?$/)
      if (collMatch) {
        const c = COLL[collMatch[1]]
        const itemId = collMatch[2]
        if (method === 'GET') {
          const { data } = await svcC.from(c.table).select('*').order('sort_order', { ascending: true })
          return json((data || []).map(c.toApi))
        }
        if (method === 'POST') {
          const body = await request.json()
          const { data, error } = await svcC.from(c.table).insert(c.toDb(body)).select('*').single()
          if (error) return json({ error: error.message }, 400)
          return json(c.toApi(data))
        }
        if (method === 'PUT' && itemId) {
          const body = await request.json()
          const { error } = await svcC.from(c.table).update(c.toDb(body)).eq('id', itemId)
          if (error) return json({ error: error.message }, 400)
          return json({ ok: true })
        }
        if (method === 'DELETE' && itemId) {
          await svcC.from(c.table).delete().eq('id', itemId)
          return json({ ok: true })
        }
      }

      // leads/bookings dashboards
      const dashMatch = route.match(/^\/admin\/(leads|bookings)(?:\/(.+))?$/)
      if (dashMatch) {
        const coll = dashMatch[1]
        const itemId = dashMatch[2]
        if (method === 'GET') {
          const { data } = await svcC.from(coll).select('*').order('created_at', { ascending: false }).limit(1000)
          const mapped = (data || []).map((r) => coll === 'bookings'
            ? { id: r.id, name: r.name, whatsapp: r.whatsapp, email: r.email, goal: r.goal, date: r.booking_date, time: r.slot, status: r.status, createdAt: r.created_at }
            : { id: r.id, name: r.name, whatsapp: r.whatsapp, email: r.email, goal: r.goal, contactTime: r.preferred_time, status: r.status, createdAt: r.created_at })
          return json(mapped)
        }
        if (method === 'PATCH' && itemId) {
          const body = await request.json()
          await svcC.from(coll).update({ status: clean(body.status, 20) }).eq('id', itemId)
          return json({ ok: true })
        }
        if (method === 'DELETE' && itemId) {
          await svcC.from(coll).delete().eq('id', itemId)
          return json({ ok: true })
        }
      }

      // admins management
      if (route === '/admin/admins' && method === 'GET') {
        const { data } = await svcC.from('admins').select('email, created_at').order('created_at', { ascending: true })
        const envList = envAdmins().map((email) => ({ email, source: 'env', locked: true }))
        const dbList = (data || []).map((r) => ({ email: r.email, source: 'db', locked: envAdmins().includes(r.email) }))
        // de-dup by email, env locked wins
        const seen = new Set()
        const out = []
        for (const a of [...envList, ...dbList]) { if (!seen.has(a.email)) { seen.add(a.email); out.push(a) } }
        return json(out)
      }
      if (route === '/admin/admins' && method === 'POST') {
        const body = await request.json()
        const email = clean(body.email, 120).toLowerCase()
        const password = typeof body.password === 'string' ? body.password : ''
        if (!email.includes('@')) return json({ error: 'Valid email required' }, 400)
        if (password.length < 8) return json({ error: 'Password must be at least 8 characters' }, 400)
        const password_hash = hashPassword(password)
        const { error } = await svcC.from('admins').insert({ email, password_hash })
        if (error) {
          if (error.code === '23505') return json({ error: 'This email is already an admin' }, 409)
          console.error('add admin error', error.message)
          return json({ error: 'Could not add admin' }, 400)
        }
        return json({ ok: true })
      }
      // change an existing admin's password
      const pwMatch = route.match(/^\/admin\/admins\/([^/]+)\/password$/)
      if (pwMatch && method === 'PUT') {
        const email = decodeURIComponent(pwMatch[1]).toLowerCase()
        const body = await request.json()
        const password = typeof body.password === 'string' ? body.password : ''
        if (password.length < 8) return json({ error: 'Password must be at least 8 characters' }, 400)
        const password_hash = hashPassword(password)
        const { data, error } = await svcC.from('admins').update({ password_hash }).eq('email', email).select('email')
        if (error) { console.error('change password error', error.message); return json({ error: 'Could not update password' }, 400) }
        if (!data?.length) {
          // env-listed admin with no DB row yet (e.g. first-ever password set) — create it
          if (envAdmins().includes(email)) {
            const { error: insErr } = await svcC.from('admins').insert({ email, password_hash })
            if (insErr) { console.error('create admin on password-set error', insErr.message); return json({ error: 'Could not update password' }, 400) }
          } else {
            return json({ error: 'Admin not found' }, 404)
          }
        }
        return json({ ok: true })
      }
      const adminDel = route.match(/^\/admin\/admins\/([^/]+)$/)
      if (adminDel && method === 'DELETE') {
        const email = decodeURIComponent(adminDel[1]).toLowerCase()
        if (envAdmins().includes(email)) return json({ error: 'Primary admin cannot be removed' }, 400)
        const { count } = await svcC.from('admins').select('email', { count: 'exact', head: true })
        if ((count || 0) <= 1 && envAdmins().length === 0) return json({ error: 'Cannot remove the last remaining admin' }, 400)
        await svcC.from('admins').delete().eq('email', email)
        return json({ ok: true })
      }

      // image upload -> Supabase Storage
      if (route === '/admin/upload' && method === 'POST') {
        const form = await request.formData()
        const file = form.get('file')
        if (!file || typeof file === 'string') return json({ error: 'file required' }, 400)
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if (!allowed.includes(file.type)) return json({ error: 'Unsupported image type' }, 415)
        if (file.size > 6 * 1024 * 1024) return json({ error: 'Max 6MB' }, 413)
        const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
        const objectPath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const buf = Buffer.from(await file.arrayBuffer())
        const { error } = await svcC.storage.from('site-images').upload(objectPath, buf, { contentType: file.type, upsert: false })
        if (error) return json({ error: 'Upload failed' }, 400)
        const { data } = svcC.storage.from('site-images').getPublicUrl(objectPath)
        return json({ ok: true, url: data.publicUrl })
      }

      return json({ error: `Admin route ${route} not found` }, 404)
    }

    return json({ error: `Route ${route} not found` }, 404)
  } catch (error) {
    console.error('API Error:', error)
    return json({ error: 'Internal server error' }, 500)
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
