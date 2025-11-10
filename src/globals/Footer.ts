import type { GlobalConfig } from 'payload'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Footer',
  admin: {
    group: 'Settings',
    description: 'Global site footer: navigation and legal links',
  },
  access: {
    read: () => true,
    update: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'copyrightText',
      label: 'Copyright Text',
      type: 'text',
      defaultValue: '© 2025 Web Developer. All rights reserved.',
    },
    {
      name: 'footerLinks',
      type: 'array',
      labels: {
        singular: 'Footer Link',
        plural: 'Footer Links',
      },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
        { name: 'external', type: 'checkbox', defaultValue: false },
      ],
      defaultValue: [
        { label: 'Solutions', href: '/solutions' },
        { label: 'Portfolio', href: '/portfolio' },
        { label: 'Blog', href: '/posts' },
      ],
    },
    {
      name: 'legalLinks',
      type: 'array',
      labels: {
        singular: 'Legal Link',
        plural: 'Legal Links',
      },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
        { name: 'external', type: 'checkbox', defaultValue: false },
      ],
      defaultValue: [
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
      ],
    },
  ],
}

export default Footer