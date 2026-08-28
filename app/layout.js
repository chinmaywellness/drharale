import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { createClient } from '@supabase/supabase-js'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://chinmaywellnessclub.in'
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=75'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
}

async function getHeroImage() {
  try {
    const { data } = await getSupabase().from('site_content').select('data').eq('id', 'site').maybeSingle()
    return data?.data?.hero?.image || FALLBACK_IMAGE
  } catch (e) {
    return FALLBACK_IMAGE
  }
}

export async function generateMetadata() {
  const heroImage = await getHeroImage()
  return {
    title: 'Chinmay Wellness Club | वजन नहीं, जीवनशैली बदलिए — Kolhapur',
    description:
      'Chinmay Wellness Club, Kolhapur — Dr. Chandrashekhar Harale यांचे वैयक्तिक wellness coaching. No gym, no starving. Sustainable, personalised Indian nutrition & daily personal guidance.',
    keywords:
      'wellness coach Kolhapur, weight loss Kolhapur, Chinmay Wellness Club, Dr Chandrashekhar Harale, Indian diet plan, lifestyle coaching Maharashtra, sustainable weight loss coach, personal wellness coaching Kolhapur',
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: '/' },
    openGraph: {
      title: 'Chinmay Wellness Club — Kolhapur',
      description: 'Sustainable wellness coaching with daily personal guidance from Dr. Chandrashekhar Harale. No gym, no starving, no bots — just a real person guiding your journey.',
      type: 'website',
      url: SITE_URL,
      siteName: 'Chinmay Wellness Club',
      locale: 'en_IN',
      images: [{ url: heroImage, width: 1200, height: 630, alt: 'Chinmay Wellness Club — Kolhapur' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Chinmay Wellness Club — Kolhapur',
      description: 'Sustainable wellness coaching with daily personal guidance from Dr. Chandrashekhar Harale.',
      images: [heroImage],
    },
    robots: { index: true, follow: true },
  }
}

export const viewport = { themeColor: '#0F6B4C', width: 'device-width', initialScale: 1 }

async function getSchemaData() {
  try {
    const supabase = getSupabase()
    const [faqRes, tRes] = await Promise.all([
      supabase.from('faqs').select('question, answer').order('sort_order'),
      supabase.from('testimonials').select('name, quote, rating').order('sort_order'),
    ])
    return { faqs: faqRes.data || [], testimonials: tRes.data || [] }
  } catch (e) {
    return { faqs: [], testimonials: [] }
  }
}

export default async function RootLayout({ children }) {
  const { faqs, testimonials } = await getSchemaData()

  const localBusiness = {
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    name: 'Chinmay Wellness Club',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
    '@id': SITE_URL,
    url: SITE_URL,
    telephone: '+919975727098',
    founder: { '@type': 'Person', name: 'Dr. Chandrashekhar Harale' },
    address: { '@type': 'PostalAddress', addressLocality: 'Kolhapur', addressRegion: 'Maharashtra', addressCountry: 'IN' },
    areaServed: 'Kolhapur, Maharashtra',
    description: 'Personal wellness & lifestyle coaching in Kolhapur.',
    ...(testimonials.length
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: (testimonials.reduce((a, t) => a + (t.rating || 5), 0) / testimonials.length).toFixed(1),
            reviewCount: String(testimonials.length),
          },
          review: testimonials.map((t) => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: t.name || 'Member' },
            reviewRating: { '@type': 'Rating', ratingValue: String(t.rating || 5) },
            reviewBody: t.quote || '',
          })),
        }
      : {}),
  }

  const faqSchema = faqs.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      }
    : null

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Dr. Chandrashekhar Harale',
    jobTitle: 'Founder & Wellness Coach',
    worksFor: { '@type': 'Organization', name: 'Chinmay Wellness Club', url: SITE_URL },
    description: 'Personal wellness and lifestyle coach in Kolhapur, guiding sustainable weight-loss and lifestyle transformation without gyms, crash diets, or bots.',
    url: SITE_URL,
  }

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🌿%3C/text%3E%3C/svg%3E" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
        {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />}
      </head>
      <body>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
