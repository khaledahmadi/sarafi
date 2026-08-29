import { useEffect, useId, useRef, useState } from "react";
import { ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { uploadArticleImage } from "@/lib/portal.functions";
import { errorClass, labelClass } from "@/lib/forms";
import { cn } from "@/lib/utils";

const IMAGE_ACCEPT = "image/png,image/jpeg,image/jpg,image/webp";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function isCoverImageFile(file: File) {
  return file.type.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(file.name);
}

type CoverImageFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  error?: string;
};

export function CoverImageField({ label, value, onChange, error }: CoverImageFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadGeneration = useRef(0);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const preview = localPreview || value || null;

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  useEffect(() => {
    if (value) {
      setFileName("");
      return;
    }
    uploadGeneration.current += 1;
    setUploading(false);
    setFileName("");
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [value]);

  async function assignFile(file: File) {
    if (!isCoverImageFile(file)) {
      toast.error("یک فایل تصویر انتخاب کنید.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("حجم تصویر باید حداکثر ۵ مگابایت باشد.");
      return;
    }

    if (localPreview) URL.revokeObjectURL(localPreview);
    const objectUrl = URL.createObjectURL(file);
    const generation = uploadGeneration.current + 1;
    uploadGeneration.current = generation;
    setLocalPreview(objectUrl);
    setFileName(file.name);
    setUploading(true);

    const result = await uploadArticleImage(file);
    if (generation !== uploadGeneration.current) return;
    setUploading(false);

    if (!result.ok || !result.data?.url) {
      toast.error(result.message ?? "بارگذاری تصویر ممکن نشد");
      URL.revokeObjectURL(objectUrl);
      setLocalPreview(null);
      setFileName("");
      return;
    }

    onChange(result.data.url);
    URL.revokeObjectURL(objectUrl);
    setLocalPreview(null);
  }

  function clearImage() {
    uploadGeneration.current += 1;
    setUploading(false);
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    setFileName("");
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function openPicker() {
    if (uploading) return;
    inputRef.current?.click();
  }

  return (
    <div className="text-start">
      <label className={labelClass} htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void assignFile(file);
        }}
      />
      <div
        role="button"
        tabIndex={0}
        className={cn(
          "relative flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-input bg-muted/30 p-3 transition-all duration-200 outline-none sm:min-h-36",
          dragActive ? "scale-[1.01] border-primary bg-primary/10" : "hover:border-muted-foreground/40 hover:bg-muted/50",
          uploading && "pointer-events-none opacity-70",
        )}
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openPicker();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setDragActive(false);
          const file = event.dataTransfer.files?.[0];
          if (file) void assignFile(file);
        }}
      >
        {preview ? (
          <div className="flex w-full flex-col items-center gap-2">
            <div className="relative">
              <img
                src={preview}
                alt=""
                className="max-h-28 max-w-full rounded-lg object-contain shadow-sm"
              />
              <button
                type="button"
                className="absolute -top-2 -end-2 rounded-full bg-destructive p-1.5 text-destructive-foreground shadow-md transition hover:bg-destructive/90"
                aria-label="حذف تصویر شاخص"
                onClick={(event) => {
                  event.stopPropagation();
                  clearImage();
                }}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            {fileName ? (
              <p className="text-center text-xs font-medium text-foreground">{fileName}</p>
            ) : null}
            {uploading ? (
              <p className="text-xs text-muted-foreground">در حال بارگذاری…</p>
            ) : null}
          </div>
        ) : (
          <div className="pointer-events-none flex flex-col items-center text-center">
            <div className="mb-2 rounded-lg bg-primary/15 p-2">
              <ImageIcon className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <p className="mb-0.5 text-xs font-semibold text-foreground">
              برای بارگذاری کلیک کنید یا تصویر را اینجا بکشید
            </p>
            <p className="text-[11px] text-muted-foreground">PNG، JPEG، WebP · حداکثر ۵ مگابایت</p>
          </div>
        )}
      </div>
      {error ? (
        <span className={errorClass} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
