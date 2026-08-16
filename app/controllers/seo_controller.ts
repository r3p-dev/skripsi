import { appUrl } from '#config/app'
import type { HttpContext } from '@adonisjs/core/http'

const DISALLOWED = [
  '/admin',
  '/staff',
  '/order',
  '/profile',
  '/address',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
]

export default class SeoController {
  robots({ response }: HttpContext) {
    const lines = [
      'User-agent: *',
      ...DISALLOWED.map((path) => `Disallow: ${path}`),
      '',
      `Sitemap: ${appUrl}/sitemap.xml`,
    ]

    return response.type('text/plain').send(lines.join('\n'))
  }

  sitemap({ response }: HttpContext) {
    const lines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      '  <url>',
      `    <loc>${appUrl}/</loc>`,
      '    <changefreq>weekly</changefreq>',
      '    <priority>1.0</priority>',
      '  </url>',
      '</urlset>',
    ]

    return response.type('application/xml').send(lines.join('\n'))
  }
}
