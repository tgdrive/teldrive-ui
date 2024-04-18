import { memo, useState } from "react"
import { Rendition } from "epubjs"
import { ReactReader } from "react-reader"

const EpubPreview = ({ assetUrl }: { assetUrl: string }) => {
  const [location, setLocation] = useState<string>()

  const onLocationChange = (cfiStr: string) => setLocation(cfiStr)

  const fixEpub = (rendition: Rendition) => {
    const spineGet = rendition.book.spine.get.bind(rendition.book.spine)
    rendition.book.spine.get = function (target) {
      const targetStr = target as string
      let t = spineGet(target)
      while (t == null && targetStr.startsWith("../")) {
        target = targetStr.substring(3)
        t = spineGet(target)
      }
      return t
    }
  }

  return (
    <ReactReader
      url={assetUrl}
      getRendition={(rendition) => fixEpub(rendition)}
      location={location as string}
      locationChanged={onLocationChange}
      epubInitOptions={{ openAs: "epub" }}
      epubOptions={{ flow: "scrolled", allowPopups: true }}
    />
  )
}

export default memo(EpubPreview)
