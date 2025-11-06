'use client'

import React from 'react'

interface ContentPlanItem {
  content_plan_id: string
  title: string
  slug: string
  description: string
  keywords: string[]
}

interface ContentPlanItemsDisplayProps {
  value?: any
  readOnly?: boolean
}

export const ContentPlanItemsDisplay: React.FC<ContentPlanItemsDisplayProps> = ({
  value,
  readOnly = false,
}) => {
  // Parse the JSON data
  let contentPlanItems: ContentPlanItem[] = []
  
  try {
    if (value && typeof value === 'string') {
      contentPlanItems = JSON.parse(value)
    } else if (Array.isArray(value)) {
      contentPlanItems = value
    }
  } catch (error) {
    console.error('Error parsing content plan JSON:', error)
  }

  // Handle empty or invalid data
  if (!contentPlanItems || !Array.isArray(contentPlanItems) || contentPlanItems.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-500 text-sm italic">
          No content plan items found. Add JSON data to the Content Plan Description field to see grouped content items here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Content Plan Items ({contentPlanItems.length})
        </h3>
        <p className="text-sm text-gray-600">
          Dynamically generated from the Content Plan Description JSON data
        </p>
      </div>
      
      {contentPlanItems.map((item, index) => (
        <div
          key={item.content_plan_id || index}
          className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
        >
          {/* Group Header */}
          <div className="bg-blue-50 border-b border-blue-100 px-4 py-3">
            <h4 className="text-base font-semibold text-blue-900">
              Content Plan ID: {item.content_plan_id}
            </h4>
          </div>
          
          {/* Content Details */}
          <div className="p-4 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <p className="text-gray-900 font-medium">
                {item.title || 'No title provided'}
              </p>
            </div>
            
            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug
              </label>
              <p className="text-gray-600 font-mono text-sm bg-gray-50 px-2 py-1 rounded">
                {item.slug || 'No slug provided'}
              </p>
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <p className="text-gray-800 leading-relaxed">
                {item.description || 'No description provided'}
              </p>
            </div>
            
            {/* Keywords */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keywords
              </label>
              {item.keywords && Array.isArray(item.keywords) && item.keywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {item.keywords.map((keyword, keywordIndex) => (
                    <span
                      key={keywordIndex}
                      className="inline-block bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">No keywords provided</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ContentPlanItemsDisplay