"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { useEffect } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "开始编辑文章...",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-indigo-500 underline",
        },
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-lg max-w-none min-h-[500px] focus:outline-none px-8 py-6",
      },
    },
    immediatelyRender: false, // 禁用立即渲染以避免 SSR 水合不匹配
  });

  // 当外部内容变化时更新编辑器
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* 工具栏 */}
      <div className="bg-gray-50 border-b-2 border-gray-200 p-3 flex flex-wrap items-center gap-2">
        {/* 标题 */}
        <div className="flex items-center gap-1 border-r pr-3">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              editor.isActive("heading", { level: 2 })
                ? "bg-purple-500 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
            title="标题2"
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              editor.isActive("heading", { level: 3 })
                ? "bg-purple-500 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
            title="标题3"
          >
            H3
          </button>
        </div>

        {/* 文本格式 */}
        <div className="flex items-center gap-1 border-r pr-3">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
              editor.isActive("bold")
                ? "bg-purple-500 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
            title="粗体"
          >
            B
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-3 py-1.5 rounded-lg text-sm italic transition-all ${
              editor.isActive("italic")
                ? "bg-purple-500 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
            title="斜体"
          >
            I
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`px-3 py-1.5 rounded-lg text-sm line-through transition-all ${
              editor.isActive("strike")
                ? "bg-purple-500 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
            title="删除线"
          >
            S
          </button>
        </div>

        {/* 列表 */}
        <div className="flex items-center gap-1 border-r pr-3">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              editor.isActive("bulletList")
                ? "bg-purple-500 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
            title="无序列表"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              editor.isActive("orderedList")
                ? "bg-purple-500 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
            title="有序列表"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 8a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 12a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
            </svg>
          </button>
        </div>

        {/* 引用 */}
        <div className="flex items-center gap-1 border-r pr-3">
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              editor.isActive("blockquote")
                ? "bg-purple-500 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
            title="引用"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M6 3a1 1 0 011 1v10a1 1 0 01-2 0V4a1 1 0 011-1zm4 0a1 1 0 011 1v10a1 1 0 01-2 0V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* 撤销/重做 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              editor.can().undo()
                ? "bg-white text-gray-700 hover:bg-gray-100"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            title="撤销"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              editor.can().redo()
                ? "bg-white text-gray-700 hover:bg-gray-100"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            title="重做"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 编辑区域 */}
      <EditorContent editor={editor} />
    </div>
  );
}
