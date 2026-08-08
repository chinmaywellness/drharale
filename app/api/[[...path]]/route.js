import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { Resend } from 'resend'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ---------- Mongo ----------
let client
let db
let connectingPromise
async function connectToMongo() {
  if (db) return db
  if (!connectingPromise) {
    client = new MongoClient(process.env.MONGO_URL)
    connectingPromise = client.connect().then(() => {
      db = client.db(process.env.DB_NAME)
      return db
    })
  }
  await connectingPromise
  return db
}

// ---------- Resend ----------
const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM || 'Chinmay Wellness Club <onboarding@resend.dev>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

// ---------- Auth helpers ----------
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const COOKIE = 'cwc_session'

function signToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url')
  return `${data}.${sig}`
}
function verifyToken(token) {
  try {
    if (!token) return null
    const [data, sig] = token.split('.')
    if (!data || !sig) return null
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url')
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString())
    if (!payload.exp || payload.exp < Date.now()) return null
    return payload
  } catch (e) {
    return null
  }
}

function envAdmins() {
  return (process.env.ADMIN_EMAILS || ADMIN_EMAIL || '')
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean)
}

async function isAdminEmail(database, email) {
  if (!email) return false
  const e = email.toLowerCase()
  if (envAdmins().includes(e)) return true
  const found = await database.collection('admins').findOne({ email: e })
  return Boolean(found)
}

async function requireAdmin(request, database) {
  const token = request.cookies.get(COOKIE)?.value
  const payload = verifyToken(token)
  if (!payload?.email) return null
  const ok = await isAdminEmail(database, payload.email)
  if (!ok) return null
  return payload
}

// ---------- rate limit (in-memory) ----------
const hits = new Map()
function rateLimit(key, max, windowMs) {
  const now = Date.now()
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs)
  arr.push(now)
  hits.set(key, arr)
  return arr.length <= max
}

// ---------- sanitize ----------
function clean(v, maxLen = 300) {
  if (typeof v !== 'string') return ''
  return v.trim().slice(0, maxLen)
}
function escapeHtml(v) {
  return String(v)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

// ---------- CORS ----------
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_BASE_URL || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// ---------- default content ----------
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

const DEFAULT_CONTENT = {
  id: 'site',
  siteName: 'Chinmay Wellness Club',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '919975727098',
  rating: '4.9',
  seo: {
    title: 'Chinmay Wellness Club | वजन नहीं, जीवनशैली बदलिए — Kolhapur',
    description:
      'Chinmay Wellness Club, Kolhapur — Dr. Chandrashekhar Harale यांचे वैयक्तिक wellness coaching. No gym, no starving. Sustainable, personalised Indian nutrition & daily guidance.',
  },
  hero: {
    badge: 'Kolhapur • Personal Wellness Coaching',
    titleHi: 'सिर्फ़ वजन नहीं — अपनी ऊर्जा, आत्मविश्वास और जीवनशैली बदलिए',
    titleEn: 'Transform your energy, confidence & lifestyle — not just your weight',
    subtitle:
      'No gym. No starving. सिर्फ़ आपके शरीर और दिनचर्या के अनुसार बना एक sustainable plan — और रोज़ Dr. Harale का व्यक्तिगत मार्गदर्शन।',
    urgency: 'नए batch की सीमित seats — आज ही availability check करें।',
    ctaPrimary: 'Check Batch Availability',
    ctaSecondary: 'Free Discovery Call',
    image: IMG.hero,
    founderName: 'Dr. Chandrashekhar Harale',
    founderTitle: 'Founder & Wellness Coach',
    founderImage: IMG.founder,
    missionLine:
      '"मी फक्त वजन कमी करायला मदत करत नाही — मी अशी शाश्वत जीवनशैली तयार करायला मदत करतो जी तुम्ही आयुष्यभर सहज जगू शकाल."',
  },
  program: {
    heading: 'आपको इस प्रोग्राम में क्या मिलेगा',
    subheading: 'What you get inside the program',
    cards: [
      {
        icon: 'salad',
        title: 'Personalized Indian Nutrition Plan',
        b1: 'आपके स्वाद और routine के अनुसार भारतीय भोजन',
        b2: 'No crash diets — sustainable, ghar-ka-khana friendly',
      },
      {
        icon: 'heart',
        title: 'Continuous Wellness Support',
        b1: 'हर हफ़्ते progress review और adjustments',
        b2: 'WhatsApp पर लगातार accountability और motivation',
      },
      {
        icon: 'user',
        title: 'Daily Personal Guidance from Dr. Harale',
        b1: 'रोज़ सुबह सीधा व्यक्तिगत मार्गदर्शन',
        b2: 'कोई Bots नहीं, कोई Assistants नहीं',
      },
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
    bio:
      'डॉ. चंद्रशेखर हराळे यांनी स्वतः एक कठीण lifestyle health journey अनुभवली आहे — सतत discipline, योग्य nutrition आणि consistent workout च्या मदतीने त्यांनी स्वतःचं वजन आणि एकंदर आरोग्य लक्षणीयरीत्या सुधारलं, कोणत्याही shortcuts शिवाय. हाच अनुभव आज ते Chinmay Wellness Club च्या माध्यमातून १००+ सदस्यांसोबत share करत आहेत — प्रत्येकाला त्यांची स्वतःची, sustainable health journey सुरू करण्यास मदत करत आहेत. कोणतेही bots नाहीत, कोणतेही assistants नाहीत — प्रत्येक सदस्याला थेट, वैयक्तिक मार्गदर्शन डॉ. हराळे स्वतः देतात, रोज सकाळी.',
    quote:
      '"मी फक्त वजन कमी करायला मदत करत नाही — मी अशी शाश्वत जीवनशैली तयार करायला मदत करतो जी तुम्ही आयुष्यभर सहज जगू शकाल, कारण मी स्वतः तीच journey जगलो आहे."',
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
    enabled: true,
    image: IMG.founder,
    headline: 'Chinmay Wellness Club में आपका स्वागत है',
    credibility: 'Dr. Chandrashekhar Harale के साथ 100+ सदस्य अपनी sustainable journey जी रहे हैं।',
    points: [
      'Personalized coaching',
      'Real community support',
      'Sustainable change',
      'Direct founder guidance',
    ],
    ctaPrimary: 'Check Batch Availability',
    ctaSecondary: 'Discovery Call',
  },
  footer: {
    tagline: 'वजन नहीं, जीवनशैली बदलिए। — Kolhapur, Maharashtra',
    address: 'Kolhapur, Maharashtra, India',
    email: '',
  },
  booking: {
    heading: 'Book Your Free Discovery Call',
    subheading: 'एक call जो आपकी journey बदल सकती है',
    days: [1, 2, 3, 4, 5, 6], // 0=Sun ... 6=Sat
    slots: ['07:00 AM', '08:00 AM', '09:00 AM', '05:00 PM', '06:00 PM', '07:00 PM'],
  },
  updatedAt: new Date(),
}

const DEFAULT_TESTIMONIALS = [
  { id: uuidv4(), name: 'Placeholder Member 1', city: 'Kolhapur', rating: 5, quote: 'Video testimonial — admin से Vimeo link जोड़ें।', resultTag: 'More Energy', vimeoUrl: 'https://vimeo.com/76979871', order: 1 },
  { id: uuidv4(), name: 'Placeholder Member 2', city: 'Sangli', rating: 5, quote: 'Video testimonial — admin से Vimeo link जोड़ें।', resultTag: 'Weight Loss', vimeoUrl: 'https://vimeo.com/22439234', order: 2 },
  { id: uuidv4(), name: 'Placeholder Member 3', city: 'Pune', rating: 5, quote: 'Video testimonial — admin से Vimeo link जोड़ें।', resultTag: 'Lifestyle', vimeoUrl: 'https://vimeo.com/1084537', order: 3 },
]

const DEFAULT_FAQS = [
  { id: uuidv4(), question: 'क्या gym जाना ज़रूरी है? / Is a gym required?', answer: 'नहीं। हमारा focus sustainable lifestyle और घर पर की जा सकने वाली activity पर है। No gym required.', order: 1 },
  { id: uuidv4(), question: 'क्या यह vegetarian-friendly है? / Is it vegetarian-friendly?', answer: 'हाँ। आपका plan पूरी तरह आपके भोजन (veg/non-veg) और स्वाद के अनुसार बनाया जाता है।', order: 2 },
  { id: uuidv4(), question: 'क्या यह PCOS/Thyroid के लिए उपयुक्त है? / Suitable for PCOS/Thyroid?', answer: 'हम lifestyle और nutrition पर personalised guidance देते हैं। कृपया अपनी medical condition discovery call में बताएं; यह चिकित्सा उपचार का विकल्प नहीं है।', order: 3 },
  { id: uuidv4(), question: 'क्या कोई छिपे हुए charges हैं? / Any hidden charges?', answer: 'नहीं। सब कुछ discovery call में स्पष्ट रूप से बताया जाता है — कोई hidden charges नहीं।', order: 4 },
  { id: uuidv4(), question: 'शुरुआत कैसे करें? / How to start?', answer: 'बस WhatsApp पर message करें या Free Discovery Call book करें — हम आपको आगे guide करेंगे।', order: 5 },
]

const DEFAULT_TRANSFORMATIONS = [
  { id: uuidv4(), name: 'Member A', resultTag: 'Sustainable Weight Loss', before: IMG.running, after: IMG.jogging, note: 'Consistency के साथ real results.', order: 1 },
  { id: uuidv4(), name: 'Member B', resultTag: 'More Energy', before: IMG.yoga, after: IMG.group, note: 'Better routine, better energy.', order: 2 },
]

const DEFAULT_GALLERY = [
  { id: uuidv4(), category: 'Sessions', url: IMG.coaching, alt: 'Coaching session', order: 1 },
  { id: uuidv4(), category: 'Community', url: IMG.group, alt: 'Community yoga', order: 2 },
  { id: uuidv4(), category: 'Results', url: IMG.jogging, alt: 'Members jogging', order: 3 },
  { id: uuidv4(), category: 'Sessions', url: IMG.yoga, alt: 'Yoga session', order: 4 },
  { id: uuidv4(), category: 'Community', url: IMG.running, alt: 'Outdoor run', order: 5 },
  { id: uuidv4(), category: 'Results', url: IMG.salad, alt: 'Healthy nutrition', order: 6 },
]

async function getContent(database) {
  let doc = await database.collection('content').findOne({ id: 'site' })
  if (!doc) {
    await database.collection('content').insertOne(DEFAULT_CONTENT)
    doc = DEFAULT_CONTENT
  }
  const { _id, ...rest } = doc
  return rest
}

async function seedList(database, coll, defaults) {
  const count = await database.collection(coll).countDocuments()
  if (count === 0 && defaults.length) {
    await database.collection(coll).insertMany(defaults.map((d) => ({ ...d })))
  }
  const items = await database.collection(coll).find({}).sort({ order: 1 }).toArray()
  return items.map(({ _id, ...rest }) => rest)
}

// ---------- emails ----------
async function sendBookingEmails(lead) {
  if (!process.env.RESEND_API_KEY) return
  const safe = (v) => escapeHtml(v || '')
  try {
    const tasks = []
    if (lead.email) {
      tasks.push(
        resend.emails.send({
          from: FROM,
          to: [lead.email],
          subject: 'आपकी Free Discovery Call — Chinmay Wellness Club',
          html: `<div style="font-family:Inter,Arial,sans-serif"><h2 style="color:#0F6B4C">धन्यवाद, ${safe(lead.name)}!</h2><p>आपका request हमें मिल गया है। हम जल्द ही आपसे संपर्क करेंगे।</p>${lead.date ? `<p><b>Requested date/time:</b> ${safe(lead.date)} ${safe(lead.time)}</p>` : ''}<p style="color:#666">Reference: ${lead.id}</p><p style="margin-top:16px">— Dr. Chandrashekhar Harale, Chinmay Wellness Club</p></div>`,
        })
      )
    }
    if (ADMIN_EMAIL) {
      tasks.push(
        resend.emails.send({
          from: FROM,
          to: [ADMIN_EMAIL],
          replyTo: lead.email || undefined,
          subject: `🔔 New ${lead.type || 'lead'}: ${lead.name}`,
          html: `<div style="font-family:Inter,Arial,sans-serif"><h2>New ${safe(lead.type)}</h2><p><b>Name:</b> ${safe(lead.name)}</p><p><b>WhatsApp:</b> ${safe(lead.whatsapp)}</p>${lead.goal ? `<p><b>Goal:</b> ${safe(lead.goal)}</p>` : ''}${lead.date ? `<p><b>Date/Time:</b> ${safe(lead.date)} ${safe(lead.time)}</p>` : ''}${lead.contactTime ? `<p><b>Preferred time:</b> ${safe(lead.contactTime)}</p>` : ''}<p style="color:#666">Ref: ${lead.id}</p></div>`,
        })
      )
    }
    await Promise.allSettled(tasks)
  } catch (e) {
    console.error('email error', e?.message)
  }
}

// ---------- OTP email ----------
async function sendOtpEmail(email, code) {
  if (!process.env.RESEND_API_KEY) return { skipped: true }
  return resend.emails.send({
    from: FROM,
    to: [email],
    subject: `${code} — Chinmay Wellness Admin OTP`,
    html: `<div style="font-family:Inter,Arial,sans-serif"><h2 style="color:#0F6B4C">Admin Login OTP</h2><p>Your one-time code is:</p><p style="font-size:32px;font-weight:800;letter-spacing:8px;color:#1E2A26">${code}</p><p style="color:#666">10 मिनट में expire होगा। अगर आपने यह request नहीं किया तो ignore करें।</p></div>`,
  })
}

// ---------- main handler ----------
async function handleRoute(request, { params }) {
  const { path = [] } = await params
  const route = `/${path.join('/')}`
  const method = request.method
  const ip = request.headers.get('x-forwarded-for') || 'local'

  try {
    const database = await connectToMongo()

    // ===== PUBLIC GET =====
    if (route === '/content' && method === 'GET') {
      return handleCORS(NextResponse.json(await getContent(database)))
    }
    if (route === '/testimonials' && method === 'GET') {
      return handleCORS(NextResponse.json(await seedList(database, 'testimonials', DEFAULT_TESTIMONIALS)))
    }
    if (route === '/transformations' && method === 'GET') {
      return handleCORS(NextResponse.json(await seedList(database, 'transformations', DEFAULT_TRANSFORMATIONS)))
    }
    if (route === '/gallery' && method === 'GET') {
      return handleCORS(NextResponse.json(await seedList(database, 'gallery', DEFAULT_GALLERY)))
    }
    if (route === '/faqs' && method === 'GET') {
      return handleCORS(NextResponse.json(await seedList(database, 'faqs', DEFAULT_FAQS)))
    }
    if (route === '/availability' && method === 'GET') {
      const dateStr = request.nextUrl.searchParams.get('date')
      const content = await getContent(database)
      const bk = content.booking || { days: [1, 2, 3, 4, 5, 6], slots: [] }
      if (!dateStr) return handleCORS(NextResponse.json({ slots: [] }))
      const d = new Date(dateStr + 'T00:00:00')
      const weekday = d.getDay()
      if (!bk.days?.includes(weekday)) return handleCORS(NextResponse.json({ slots: [], dayOpen: false }))
      const booked = await database.collection('bookings').find({ date: dateStr }).toArray()
      const takenSlots = booked.map((b) => b.time)
      const available = (bk.slots || []).filter((s) => !takenSlots.includes(s))
      return handleCORS(NextResponse.json({ slots: available, dayOpen: true }))
    }

    // ===== PUBLIC POST: leads =====
    if (route === '/leads' && method === 'POST') {
      if (!rateLimit(`lead:${ip}`, 5, 60 * 1000)) {
        return handleCORS(NextResponse.json({ error: 'Too many requests' }, { status: 429 }))
      }
      const body = await request.json()
      const name = clean(body.name, 120)
      const whatsapp = clean(body.whatsapp, 20)
      if (!name || !whatsapp) return handleCORS(NextResponse.json({ error: 'Name and WhatsApp required' }, { status: 400 }))
      const lead = {
        id: uuidv4(),
        type: 'lead',
        name,
        whatsapp,
        goal: clean(body.goal, 60),
        contactTime: clean(body.contactTime, 40),
        email: clean(body.email, 120),
        status: 'New',
        createdAt: new Date(),
      }
      await database.collection('leads').insertOne(lead)
      sendBookingEmails(lead)
      return handleCORS(NextResponse.json({ ok: true, id: lead.id }))
    }

    // ===== PUBLIC POST: bookings =====
    if (route === '/bookings' && method === 'POST') {
      if (!rateLimit(`booking:${ip}`, 5, 60 * 1000)) {
        return handleCORS(NextResponse.json({ error: 'Too many requests' }, { status: 429 }))
      }
      const body = await request.json()
      const name = clean(body.name, 120)
      const whatsapp = clean(body.whatsapp, 20)
      const date = clean(body.date, 20)
      const time = clean(body.time, 20)
      if (!name || !whatsapp || !date || !time) {
        return handleCORS(NextResponse.json({ error: 'All fields required' }, { status: 400 }))
      }
      // prevent double booking
      const existing = await database.collection('bookings').findOne({ date, time })
      if (existing) return handleCORS(NextResponse.json({ error: 'Slot just got booked, choose another' }, { status: 409 }))
      const booking = {
        id: uuidv4(),
        type: 'booking',
        name,
        whatsapp,
        email: clean(body.email, 120),
        goal: clean(body.goal, 60),
        date,
        time,
        status: 'New',
        createdAt: new Date(),
      }
      await database.collection('bookings').insertOne(booking)
      sendBookingEmails(booking)
      return handleCORS(NextResponse.json({ ok: true, id: booking.id }))
    }

    // ===== AUTH =====
    if (route === '/auth/send-otp' && method === 'POST') {
      if (!rateLimit(`otp:${ip}`, 5, 10 * 60 * 1000)) {
        return handleCORS(NextResponse.json({ error: 'Too many OTP requests. Try later.' }, { status: 429 }))
      }
      const body = await request.json()
      const email = clean(body.email, 120).toLowerCase()
      if (!email.includes('@')) return handleCORS(NextResponse.json({ error: 'Valid email required' }, { status: 400 }))
      // do not reveal admin allowlist
      if (!(await isAdminEmail(database, email))) {
        return handleCORS(NextResponse.json({ ok: true, message: 'If eligible, an OTP was sent.' }))
      }
      const now = Date.now()
      const existingOtp = await database.collection('otps').findOne({ email })
      let code
      if (existingOtp && existingOtp.code && existingOtp.expiresAt > now && existingOtp.createdAt && (now - existingOtp.createdAt) < 90 * 1000) {
        // Re-send within 90s: reuse the same code so the emailed code always matches the DB
        code = existingOtp.code
      } else {
        code = '' + Math.floor(100000 + Math.random() * 900000)
      }
      await database.collection('otps').updateOne(
        { email },
        { $set: { email, code, expiresAt: now + 15 * 60 * 1000, createdAt: now, attempts: 0 } },
        { upsert: true }
      )
      await sendOtpEmail(email, code)
      return handleCORS(NextResponse.json({ ok: true, message: 'OTP sent to your email.' }))
    }

    if (route === '/auth/verify-otp' && method === 'POST') {
      const body = await request.json()
      const email = clean(body.email, 120).toLowerCase()
      const code = clean(body.code, 6)
      const rec = await database.collection('otps').findOne({ email })
      if (!rec || rec.expiresAt < Date.now() || (rec.attempts || 0) > 10) {
        return handleCORS(NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 }))
      }
      await database.collection('otps').updateOne({ email }, { $inc: { attempts: 1 } })
      if (String(rec.code).trim() !== String(code).trim()) {
        return handleCORS(NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 401 }))
      }
      if (!(await isAdminEmail(database, email))) {
        return handleCORS(NextResponse.json({ error: 'Not authorized' }, { status: 403 }))
      }
      await database.collection('otps').deleteOne({ email })
      const token = signToken({ email, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })
      const res = NextResponse.json({ ok: true, email })
      res.cookies.set(COOKIE, token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      })
      return handleCORS(res)
    }

    if (route === '/auth/logout' && method === 'POST') {
      const res = NextResponse.json({ ok: true })
      res.cookies.delete(COOKIE)
      return handleCORS(res)
    }

    if (route === '/auth/me' && method === 'GET') {
      const admin = await requireAdmin(request, database)
      if (!admin) return handleCORS(NextResponse.json({ authenticated: false }, { status: 401 }))
      return handleCORS(NextResponse.json({ authenticated: true, email: admin.email }))
    }

    // ===== ADMIN (protected) =====
    if (route.startsWith('/admin/')) {
      const admin = await requireAdmin(request, database)
      if (!admin) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))

      // content
      if (route === '/admin/content' && method === 'PUT') {
        const body = await request.json()
        delete body._id
        body.id = 'site'
        body.updatedAt = new Date()
        await database.collection('content').updateOne({ id: 'site' }, { $set: body }, { upsert: true })
        return handleCORS(NextResponse.json({ ok: true }))
      }

      // generic collection CRUD: testimonials, transformations, gallery, faqs
      const collMatch = route.match(/^\/admin\/(testimonials|transformations|gallery|faqs)(?:\/(.+))?$/)
      if (collMatch) {
        const coll = collMatch[1]
        const itemId = collMatch[2]
        if (method === 'GET') {
          const items = await database.collection(coll).find({}).sort({ order: 1 }).toArray()
          return handleCORS(NextResponse.json(items.map(({ _id, ...r }) => r)))
        }
        if (method === 'POST') {
          const body = await request.json()
          delete body._id
          const item = { ...body, id: uuidv4(), order: body.order ?? Date.now() }
          await database.collection(coll).insertOne(item)
          const { _id, ...rest } = item
          return handleCORS(NextResponse.json(rest))
        }
        if (method === 'PUT' && itemId) {
          const body = await request.json()
          delete body._id
          delete body.id
          await database.collection(coll).updateOne({ id: itemId }, { $set: body })
          return handleCORS(NextResponse.json({ ok: true }))
        }
        if (method === 'DELETE' && itemId) {
          await database.collection(coll).deleteOne({ id: itemId })
          return handleCORS(NextResponse.json({ ok: true }))
        }
      }

      // leads / bookings dashboards
      const dashMatch = route.match(/^\/admin\/(leads|bookings)(?:\/(.+))?$/)
      if (dashMatch) {
        const coll = dashMatch[1]
        const itemId = dashMatch[2]
        if (method === 'GET') {
          const items = await database.collection(coll).find({}).sort({ createdAt: -1 }).limit(1000).toArray()
          return handleCORS(NextResponse.json(items.map(({ _id, ...r }) => r)))
        }
        if (method === 'PATCH' && itemId) {
          const body = await request.json()
          const update = {}
          if (body.status) update.status = clean(body.status, 20)
          await database.collection(coll).updateOne({ id: itemId }, { $set: update })
          return handleCORS(NextResponse.json({ ok: true }))
        }
        if (method === 'DELETE' && itemId) {
          await database.collection(coll).deleteOne({ id: itemId })
          return handleCORS(NextResponse.json({ ok: true }))
        }
      }

      // admins management
      if (route === '/admin/admins' && method === 'GET') {
        const list = await database.collection('admins').find({}).toArray()
        const envList = envAdmins().map((email) => ({ email, source: 'env', locked: true }))
        const dbList = list.map(({ _id, ...r }) => ({ ...r, source: 'db' }))
        return handleCORS(NextResponse.json([...envList, ...dbList]))
      }
      if (route === '/admin/admins' && method === 'POST') {
        const body = await request.json()
        const email = clean(body.email, 120).toLowerCase()
        if (!email.includes('@')) return handleCORS(NextResponse.json({ error: 'Valid email required' }, { status: 400 }))
        await database.collection('admins').updateOne({ email }, { $set: { email, createdAt: new Date() } }, { upsert: true })
        return handleCORS(NextResponse.json({ ok: true }))
      }
      const adminDel = route.match(/^\/admin\/admins\/(.+)$/)
      if (adminDel && method === 'DELETE') {
        await database.collection('admins').deleteOne({ email: decodeURIComponent(adminDel[1]).toLowerCase() })
        return handleCORS(NextResponse.json({ ok: true }))
      }

      // image upload (base64 data url stored + returned) with server-side validation
      if (route === '/admin/upload' && method === 'POST') {
        const form = await request.formData()
        const file = form.get('file')
        if (!file || typeof file === 'string') return handleCORS(NextResponse.json({ error: 'file required' }, { status: 400 }))
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if (!allowed.includes(file.type)) return handleCORS(NextResponse.json({ error: 'Unsupported image type' }, { status: 415 }))
        if (file.size > 6 * 1024 * 1024) return handleCORS(NextResponse.json({ error: 'Max 6MB' }, { status: 413 }))
        const buf = Buffer.from(await file.arrayBuffer())
        const dataUrl = `data:${file.type};base64,${buf.toString('base64')}`
        return handleCORS(NextResponse.json({ ok: true, url: dataUrl }))
      }

      return handleCORS(NextResponse.json({ error: `Admin route ${route} not found` }, { status: 404 }))
    }

    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }))
  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
