import { Provider } from "@/components/ui/provider";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/ui/layouts/Dashboard";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isDashboardRoute = router.pathname.startsWith('/dashboard');

  return (
    <Provider>
      <Toaster />
      {isDashboardRoute ? (
        <DashboardLayout>
          <Component {...pageProps} />
        </DashboardLayout>
      ) : (
        <Component {...pageProps} />
      )}
      <Analytics />
    </Provider>
  )
}
