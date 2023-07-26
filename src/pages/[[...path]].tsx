import dynamic from "next/dynamic"

import withAuth from "@/ui/components/Auth"
import Loader from "@/ui/components/Loader"

const MyFileBrowser = dynamic(() => import("@/ui/components/FileBrowser"), {
  ssr: false,
  loading: () => <Loader />,
})

function FileBrowser() {
  return <MyFileBrowser />
}

export default withAuth(FileBrowser)
