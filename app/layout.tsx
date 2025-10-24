import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { ClientOnly } from "@/components/ui/client-only"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  title: "ManageWise",
  description: "Plataforma de gestión de proyectos con IA",
}

// Component to suppress hydration warnings for body and prevent extension conflicts
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
    <html lang="es" className={`${poppins.variable} antialiased`} suppressHydrationWarning={true}>
      <NoSSR>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <ClientOnly>
              <Toaster />
            </ClientOnly>
          </AuthProvider>
        </ThemeProvider>
      </NoSSR>
    </html>
  )
}