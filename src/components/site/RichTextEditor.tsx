import * as React from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { toast } from "sonner";
import {
  Bold,
  ImagePlus,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Minus,
  Redo2,
  Strikethrough,
  Undo2,
  Unlink,
} from "lucide-react";
import { useLocale, type TranslateFn } from "@/i18n";
import { errorClass, labelClass } from "@/lib/forms";
import Image from "@tiptap/extension-image";
import { uploadArticleImage } from "@/lib/portal.functions";
import { cn } from "@/lib/utils";

/**
 * Rich text editor for blog content. Emits sanitized-on-save HTML.
 * Direction follows the active locale.
 */

const IMAGE_ACCEPT = "image/*";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type Props = {
  label: string;
  value: string;
  onChange: (html: string) => void;
  hint?: string | undefined;
  error?: string | undefined;
};

function ToolbarButton({
  onClick,
  active,
  title,
  children,
  disabled,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={Boolean(active)}
      disabled={disabled ?? false}
      onClick={onClick}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg border text-muted-foreground transition",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-background hover:bg-muted",
        "disabled:opacity-40",
      )}
    >
      {children}
    </button>
  );
}

function isImageFile(file: File) {
  return file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(file.name);
}

async function insertUploadedImage(editor: Editor, file: File, t: TranslateFn) {
  if (!isImageFile(file)) {
    toast.error(t("editor.imageOnly"));
    return;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    toast.error(t("editor.imageTooLarge"));
    return;
  }

  const result = await uploadArticleImage(file);
  const url = result.ok ? result.data?.url : "";
  if (!url) {
    toast.error(!result.ok ? result.message : t("editor.uploadFailed"));
    return;
  }
  editor.chain().focus().setImage({ src: url }).run();
}

function collectImageFiles(list: FileList | null | undefined) {
  return [...(list ?? [])].filter(isImageFile);
}

function Toolbar({
  editor,
  uploading,
  onPickImage,
}: {
  editor: Editor;
  uploading: boolean;
  onPickImage: () => void;
}) {
  const { t } = useLocale();

  const setLink = () => {
    const previous = editor.getAttributes("link")["href"] as string | undefined;
    const url = window.prompt(t("editor.linkPrompt"), previous ?? "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-border bg-muted/40 p-2">
      <ToolbarButton
        title={t("editor.bold")}
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        title={t("editor.italic")}
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        title={t("editor.strike")}
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="size-4" />
      </ToolbarButton>
      <span className="mx-1 h-6 w-px bg-border" />
      <ToolbarButton
        title={t("editor.headingLarge")}
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        title={t("editor.headingSmall")}
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="size-4" />
      </ToolbarButton>
      <span className="mx-1 h-6 w-px bg-border" />
      <ToolbarButton
        title={t("editor.bulletList")}
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        title={t("editor.orderedList")}
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        title={t("editor.blockquote")}
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        title={t("editor.horizontalRule")}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="size-4" />
      </ToolbarButton>
      <span className="mx-1 h-6 w-px bg-border" />
      <ToolbarButton title={t("editor.addLink")} active={editor.isActive("link")} onClick={setLink}>
        <LinkIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        title={t("editor.removeLink")}
        disabled={!editor.isActive("link")}
        onClick={() => editor.chain().focus().unsetLink().run()}
      >
        <Unlink className="size-4" />
      </ToolbarButton>
      <ToolbarButton title={t("editor.uploadImage")} disabled={uploading} onClick={onPickImage}>
        <ImagePlus className="size-4" />
      </ToolbarButton>
      <span className="mx-1 h-6 w-px bg-border" />
      <ToolbarButton
        title={t("editor.undo")}
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        title={t("editor.redo")}
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo2 className="size-4" />
      </ToolbarButton>
    </div>
  );
}

export function RichTextEditor({ label, value, onChange, hint, error }: Props) {
  const { t, dir } = useLocale();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const editorRef = React.useRef<Editor | null>(null);
  const skipSyncRef = React.useRef(false);
  const tRef = React.useRef(t);
  const [uploading, setUploading] = React.useState(false);

  React.useEffect(() => {
    tRef.current = t;
  }, [t]);

  const uploadFiles = React.useCallback(async (instance: Editor, files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        await insertUploadedImage(instance, file, tRef.current);
      }
    } finally {
      setUploading(false);
    }
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: "rich-text-image max-w-full rounded-lg",
        },
      }),
    ],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        dir,
        class: "article-content min-h-64 px-4 py-3 outline-none",
      },
      handlePaste: (_view, event) => {
        const instance = editorRef.current;
        const files = collectImageFiles(event.clipboardData?.files);
        if (files.length === 0 || !instance) return false;
        event.preventDefault();
        void uploadFiles(instance, files);
        return true;
      },
      handleDrop: (_view, event) => {
        const instance = editorRef.current;
        const files = collectImageFiles(event.dataTransfer?.files);
        if (files.length === 0 || !instance) return false;
        event.preventDefault();
        void uploadFiles(instance, files);
        return true;
      },
    },
    onUpdate: ({ editor: instance }) => {
      skipSyncRef.current = true;
      onChange(instance.getHTML());
    },
  });

  React.useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  React.useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.view.dom.setAttribute("dir", dir);
  }, [editor, dir]);

  // Same as Khawar: only replace content when the form loads a different article.
  React.useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    const next = value || "<p></p>";
    if (next === editor.getHTML()) return;
    editor.commands.setContent(next, { emitUpdate: false });
  }, [value, editor]);

  return (
    <div className="text-start">
      <span className={labelClass}>{label}</span>
      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const files = collectImageFiles(event.target.files);
          event.target.value = "";
          if (editor) void uploadFiles(editor, files);
        }}
      />
      <div
        className={cn(
          "overflow-hidden rounded-xl border bg-background",
          error ? "border-destructive" : "border-input",
        )}
      >
        {editor && (
          <Toolbar
            editor={editor}
            uploading={uploading}
            onPickImage={() => fileInputRef.current?.click()}
          />
        )}
        <EditorContent editor={editor} />
      </div>
      {error ? (
        <span className={errorClass} role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="form-hint mt-1 block">{hint}</span>
      ) : null}
    </div>
  );
}
