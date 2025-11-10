import type { GlobalConfig } from 'payload'

export const Header: GlobalConfig = {
  slug: 'header',
  label: 'Header',
  admin: {
    group: 'Settings',
    description: 'Global site header: logo and navigation links',
  },
  access: {
    read: () => true,
    update: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'logoWidth',
      label: 'Logo width (px)',
      type: 'number',
      defaultValue: 400,
      min: 1,
      admin: {
        condition: (data) => Boolean(data?.logo),
        description: 'Shown only when a logo is selected. Defaults to 400px.',
      },
    },
    {
      name: 'logoHeight',
      label: 'Logo height (px)',
      type: 'number',
      defaultValue: 200,
      min: 1,
      admin: {
        condition: (data) => Boolean(data?.logo),
        description: 'Shown only when a logo is selected. Defaults to 200px.',
      },
    },
    {
      name: 'navLinks',
      type: 'array',
      labels: {
        singular: 'Navigation Link',
        plural: 'Navigation Links',
      },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
        { name: 'external', type: 'checkbox', defaultValue: false },
        { name: 'highlight', type: 'checkbox', defaultValue: false },
      ],
      defaultValue: [
        { label: 'Solutions', href: '/solutions' },
        { label: 'Portfolio', href: '/portfolio' },
        { label: 'Blog', href: '/posts' },
        { label: 'Sign In', href: '/admin', highlight: true },
      ],
    },
  ],
}

export default Header