/// <reference types="@welldone-software/why-did-you-render" />

import React from "react"

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const whyDidYouRender = require("@welldone-software/why-did-you-render")

  // eslint-disable-next-line no-console
  console.debug(
    "Applying whyDidYouRender, to help you locate unnecessary re-renders during development. See https://github.com/welldone-software/why-did-you-render"
  )

  whyDidYouRender(React, {
    trackAllPureComponents: true,
    logOwnerReasons: true,
    collapseGroups: true,
  })
}
