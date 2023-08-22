import dynamic from "next/dynamic"

import withAuth from "@/ui/components/Auth"

const MyFileBrowser = dynamic(() => import("@/ui/components/FileBrowser"), {
  ssr: false,
})

function FileBrowser() {
  return <MyFileBrowser />
}

export default withAuth(FileBrowser)
