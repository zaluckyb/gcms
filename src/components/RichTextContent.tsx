'use client'

import React from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Post } from '@/payload-types'

type Props = {
  content: Post['content'] | null
}

const RichTextContent: React.FC<Props> = ({ content }) => {
  if (!content || (Array.isArray(content) && content.length === 0)) return null
  return <RichText data={content} />
}

export default RichTextContent