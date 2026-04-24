import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/ui/layouts/Dashboard";
import { Provider } from "@/components/ui/provider";
import { Toaster } from "@/components/ui/toaster";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isDashboardRoute = router.pathname.startsWith("/dashboard");

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
      <SpeedInsights />
    </Provider>
  );
}
