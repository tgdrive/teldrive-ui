import { memo } from "react"

const DocPreview = ({ assetUrl }: { assetUrl: string }) => {
  const url = `https://view.officeapps.live.com/op/view.aspx?src=${assetUrl}`

  return (
    <iframe
      title="DocView"
      className="relative border-none z-[100] size-full"
      src={url}
      allowFullScreen
    />
  )
}

export default memo(DocPreview)
