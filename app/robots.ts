import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/results' },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://soroban-guard.veritas-vaults.network'}/sitemap.xml`,
  }
}
