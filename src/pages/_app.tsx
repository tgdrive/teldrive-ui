import React, { useEffect, useState } from "react"
import type { AppProps } from "next/app"
import Head from "next/head"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import "@/ui/styles/global.css"

import RootLayout from "@/ui/layouts/RootLayout"
import { CacheProvider } from "@emotion/react"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

import ClientOnly from "@/ui/components/ClientOnly"
import DriveThemeProvider from "@/ui/components/DriveThemeProvider"
import createEmotionCache from "@/ui/utils/createEmotionCache"
import { QueryBoundaries } from "@/ui/components/QueryBoundaries"
import { AxiosError } from "axios"

const clientSideEmotionCache = createEmotionCache()

const MyApp = (props: AppProps) => {
  const { Component, pageProps } = props
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * (60 * 1000),
            cacheTime: 10 * (60 * 1000),
            suspense: true,
            retry(_, error) {
              if ((error as AxiosError).response?.status === 404) {
                return false;
              }
              return true
            },
          },
        },
      })
  )

  return (
    <>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <ClientOnly>
        <QueryClientProvider client={queryClient}>
          <CacheProvider value={clientSideEmotionCache}>
            <DriveThemeProvider>
              <RootLayout>
                <QueryBoundaries>
                  <Component {...pageProps} />
                </QueryBoundaries>
              </RootLayout>
            </DriveThemeProvider>
          </CacheProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ClientOnly>
    </>
  )
}

export default MyApp
