"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({ value, onChange, placeholder, className = "" }: RichTextEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: [
        ["bold", "italic", "underline"],
        [{ list: "bullet" }],
      ],
    }),
    []
  );

  return (
    <div className={`rich-text-editor-container ${className}`}>
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
      />
      <style jsx global>{`
        .rich-text-editor-container .quill {
          display: flex;
          flex-direction: column;
        }
        .rich-text-editor-container .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          border-color: #d1d5db; /* border-gray-300 */
          background-color: #f9fafb; /* bg-gray-50 */
        }
        .rich-text-editor-container .ql-container {
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          border-color: #d1d5db; /* border-gray-300 */
          font-family: inherit;
          font-size: 0.875rem;
          min-height: 120px;
        }
        .rich-text-editor-container .ql-editor {
          min-height: 120px;
        }
        /* Add focus-within styles by overriding the border color */
        .rich-text-editor-container:focus-within .ql-toolbar,
        .rich-text-editor-container:focus-within .ql-container {
          border-color: #6366f1; /* border-indigo-500 */
        }
        /* Add some basic spacing to the ul inside editor */
        .rich-text-editor-container .ql-editor ul {
          padding-left: 1.5em;
        }
      `}</style>
    </div>
  );
}
