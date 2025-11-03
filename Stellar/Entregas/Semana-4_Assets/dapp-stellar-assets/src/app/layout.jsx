export const metadata = {
  title: 'dApp Stellar Assets',
  description: 'Manage Stellar assets',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  )
}