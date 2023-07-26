import * as React from "react"
import { DocumentProps, Head, Html, Main, NextScript } from "next/document"

interface MyDocumentProps extends DocumentProps {
  emotionStyleTags: JSX.Element[]
}

export default function MyDocument({ emotionStyleTags }: MyDocumentProps) {
  return (
    <Html lang="en">
      <Head>
        <link
          rel="mask-icon"
          href="https://github.githubassets.com/pinned-octocat.svg"
          color="#000000"
        />
        <link
          rel="alternate icon"
          type="image/png"
          href="https://github.githubassets.com/favicons/favicon.png"
        />
        <link
          rel="icon"
          type="image/svg+xml"
          href="https://github.githubassets.com/favicons/favicon.svg"
        />
        <meta name="emotion-insertion-point" content="" />
        {emotionStyleTags}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="description" content="Git Drive" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
