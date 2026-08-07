export default function robots() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://chinmaywellnessclub.in'
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin'] },
    sitemap: `${base}/sitemap.xml`,
  }
}
