import { Provider } from "@/components/ui/provider";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import DashboardLayout from "@/components/ui/layouts/Dashboard";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isDashboardRoute = router.pathname.startsWith('/dashboard');

  return (
    <Provider>
      {isDashboardRoute ? (
        <DashboardLayout>
          <Component {...pageProps} />
        </DashboardLayout>
      ) : (
        <Component {...pageProps} />
      )}
    </Provider>
  )
}
