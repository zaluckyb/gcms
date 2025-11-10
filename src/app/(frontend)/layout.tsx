import React from 'react'
import Script from 'next/script'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { getSiteConfigSafely } from '@/lib/fallback-handler'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import './styles.css'

// Import performance fix for client-side
import '@/lib/performance-fix'

export async function generateMetadata() {
  try {
    const payload = await getPayload({ config: await config })
    const siteConfig = await getSiteConfigSafely(payload)

    return {
      title: {
        template: `%s | ${siteConfig.siteName}`,
        default: siteConfig.siteName || 'My Site',
      },
      description: siteConfig.siteDescription || 'A modern website built with Payload CMS',
      metadataBase: new URL(siteConfig.siteUrl || 'https://example.com'),
      alternates: {
        canonical: '/',
      },
      robots: {
        index: true,
        follow: true,
      },
      openGraph: {
        title: siteConfig.siteName || 'My Site',
        description: siteConfig.siteDescription || 'A modern website built with Payload CMS',
        url: siteConfig.siteUrl || 'https://example.com',
        siteName: siteConfig.siteName || 'My Site',
        locale: siteConfig.openGraphDefaults?.ogLocale || 'en_ZA',
        type: 'website',
      },
      twitter: {
        card: siteConfig.twitterDefaults?.twitterCard || 'summary_large_image',
        site: siteConfig.twitterDefaults?.twitterSite,
        creator: siteConfig.twitterDefaults?.twitterCreator,
      },
    }
  } catch (error) {
    console.error('Error generating site metadata:', error)
    return {
      title: 'My Site',
      description: 'A modern website built with Payload CMS',
    }
  }
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  let siteConfig
  try {
    const payload = await getPayload({ config: await config })
    siteConfig = await getSiteConfigSafely(payload)
  } catch (error) {
    console.error('Error loading site config:', error)
    siteConfig = { seoDefaults: { language: 'en' } }
  }

  return (
    <html lang={siteConfig.seoDefaults?.language || 'en'}>
      <head>
        {siteConfig.seoDefaults?.charset && (
          <meta charSet={siteConfig.seoDefaults.charset} />
        )}
        {siteConfig.seoDefaults?.viewport && (
          <meta name="viewport" content={siteConfig.seoDefaults.viewport} />
        )}
        {siteConfig.seoDefaults?.themeColor && (
          <meta name="theme-color" content={siteConfig.seoDefaults.themeColor} />
        )}
        {siteConfig.seoDefaults?.revisitAfter && (
          <meta name="revisit-after" content={siteConfig.seoDefaults.revisitAfter} />
        )}
        {siteConfig.gtmID && (
          <Script id="gtm-init" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${siteConfig.gtmID}');`}
          </Script>
        )}
        {siteConfig.gaMeasurementID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${siteConfig.gaMeasurementID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${siteConfig.gaMeasurementID}');
              `}
            </Script>
          </>
        )}
        {siteConfig.facebookPixelID && (
          <Script id="fbp-init" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${siteConfig.facebookPixelID}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
      </head>
      <body>
        {siteConfig.gtmID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${siteConfig.gtmID}`}
              height={0}
              width={0}
              className="hidden invisible"
            />
          </noscript>
        )}
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
