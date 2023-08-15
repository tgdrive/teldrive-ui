import React, { useRef, useState } from "react"

interface FileInputProps {
  type: "file"
  multiple?: boolean
  onChange: React.ChangeEventHandler<HTMLInputElement>
  ref: React.RefObject<HTMLInputElement>
  style: React.CSSProperties
}

interface MultiFileSelectorHook {
  selectedFiles: File[]
  fileInputProps: FileInputProps
  openFileSelector: () => void
}
function useMultiFileSelector(onClose?: () => void): MultiFileSelectorHook {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = () => {
    if (fileInputRef.current) {
      const fileList = fileInputRef.current.files
      if (fileList) {
        const filesArray = Array.from(fileList)
        setSelectedFiles(filesArray)
      }
    }
  }

  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
      window.addEventListener(
        "focus",
        () => {
          
          if (selectedFiles.length == 0 && onClose) onClose()
        },
        { once: true }
      )
    }
  }

  const fileInputProps: FileInputProps = {
    type: "file",
    multiple: true,
    onChange: handleFileChange,
    ref: fileInputRef,
    style: { display: "none" },
  }

  return {
    selectedFiles,
    fileInputProps,
    openFileSelector,
  }
}

export default useMultiFileSelector
