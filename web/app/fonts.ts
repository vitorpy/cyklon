import localFont from 'next/font/local'

export const helveticaNeue = localFont({
  src: [
    {
      path: '../public/fonts/HelveticaNeueRoman.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/HelveticaNeueItalic.ttf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../public/fonts/HelveticaNeueBold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-helvetica-neue',
})

export const helveticaNeueLight = localFont({
  src: [
    {
      path: '../public/fonts/HelveticaNeueLight.otf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/HelveticaNeueLightItalic.otf',
      weight: '300',
      style: 'italic',
    },
  ],
  variable: '--font-helvetica-neue-light',
})