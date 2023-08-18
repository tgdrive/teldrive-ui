import { FC, memo } from "react"
import Editor from "@monaco-editor/react"
import { Box } from "@mui/material"

import useFileContent from "@/ui/hooks/useFileContent"
import { getLanguageByFileName } from "@/ui/utils/getPreviewType"

const CodePreview: FC<{ name: string; mediaUrl: string }> = ({
  name,
  mediaUrl,
}) => {
  const { response: content, error, validating } = useFileContent(mediaUrl)

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
