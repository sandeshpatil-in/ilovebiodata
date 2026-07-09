import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'ILoveBiodata.com — मराठी विवाह बायोडाटा तयार करा',
  description: 'फक्त ५ मिनिटांत सुंदर मराठी विवाह परिचय पत्र (बायोडाटा) तयार करा. पारंपरिक डिझाईन, मोफत PDF डाउनलोड.',
  keywords: ['मराठी बायोडाटा', 'विवाह बायोडाटा', 'परिचय पत्र', 'Marathi biodata', 'marriage biodata', 'lagna biodata', 'ILoveBiodata'],
  openGraph: {
    title: 'मराठी विवाह बायोडाटा तयार करा — ILoveBiodata.com',
    description: 'फक्त ५ मिनिटांत सुंदर मराठी विवाह परिचय पत्र तयार करा.',
    type: 'website',
    locale: 'mr_IN',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="mr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700;800&family=Tiro+Devanagari+Marathi&family=Baloo+2:wght@500;600;700&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
