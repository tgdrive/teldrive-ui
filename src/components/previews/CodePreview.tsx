import { memo } from "react";
import Editor from "@monaco-editor/react";
import { Spinner } from "@tw-material/react";

import useFileContent from "@/hooks/useFileContent";
import { getLanguageByFileName } from "@/utils/getPreviewType";

interface CodePreviewProps {
  name: string;
  assetUrl: string;
}
const CodePreview = ({ name, assetUrl }: CodePreviewProps) => {
  const { response: content, validating } = useFileContent(assetUrl);

  return (
    <>
      {validating ? null : (
        <Editor
          options={{
            readOnly: true,
          }}
          loading={<Spinner />}
          defaultLanguage={getLanguageByFileName(name)}
          theme="vs-dark"
          height="100%"
          defaultValue={content}
        />
      )}
    </>
  );
};

export default memo(CodePreview);
