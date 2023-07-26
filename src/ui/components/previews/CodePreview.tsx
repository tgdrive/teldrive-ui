import { FC, memo } from "react"
import Editor from "@monaco-editor/react"
import { Box } from "@mui/material"

import useFileContent from "@/ui/hooks/useFileContent"
import { getMediaUrl } from "@/ui/utils/common"
import { getLanguageByFileName } from "@/ui/utils/getPreviewType"

const CodePreview: FC<{ id: string; name: string }> = ({ id, name }) => {
  const url = getMediaUrl(id, name)

  const { response: content, error, validating } = useFileContent(url)

  return (
    <Box
      sx={{
        maxWidth: "80%",
        width: "100%",
        margin: "auto",
        padding: "1rem",
        position: "relative",
        height: "100vh",
      }}
    >
      {validating ? null : (
        <Editor
          options={{
            readOnly: true,
          }}
          language={getLanguageByFileName(name)}
          theme="vs-dark"
          height="100%"
          value={content}
        />
      )}
    </Box>
  )
}

export default memo(CodePreview)
