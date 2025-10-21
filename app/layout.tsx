import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  title: "ManageWise",
  description: "Plataforma de gestión de proyectos con IA",
}

// Component to suppress hydration warnings for body
function NoSSR({ children }: { children: React.ReactNode }) {
  return (
    <body suppressHydrationWarning={true}>
      {children}
    </body>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${poppins.variable} antialiased`}>
      <NoSSR>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </NoSSR>
    </html>
  )
}