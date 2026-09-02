import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { useLocale } from "@/i18n";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  title: string;
  description: string;
  itemName?: string | undefined;
  confirmLabel?: string | undefined;
  pending?: boolean | undefined;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function ConfirmDeleteDialog({
  open,
  title,
  description,
  itemName,
  confirmLabel,
  pending = false,
  onOpenChange,
  onConfirm,
}: Props) {
  const { t, dir } = useLocale();
  const label = confirmLabel ?? t("common.delete");

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        dir={dir}
        className="max-w-[26rem] gap-0 overflow-hidden rounded-2xl border-border p-0 shadow-xl sm:rounded-2xl"
      >
        <AlertDialogHeader className="space-y-0 px-6 pb-0 pt-6 text-start">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
              <Trash2 className="size-5" />
            </span>
            <div className="min-w-0 space-y-1">
              <AlertDialogTitle className="text-base font-bold leading-7">{title}</AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-7">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        {itemName ? (
          <div className="px-6 pt-4">
            <p className="truncate rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground">
              {itemName}
            </p>
          </div>
        ) : null}
        <AlertDialogFooter className="flex-row justify-end gap-2 space-x-0 px-6 py-5 sm:flex-row-reverse sm:justify-start">
          <AlertDialogAction
            disabled={pending}
            className={cn(
              buttonVariants({ variant: "destructive" }),
              "min-h-11 rounded-xl px-5 font-bold",
            )}
            onClick={onConfirm}
          >
            {pending ? t("common.deleting") : label}
          </AlertDialogAction>
          <AlertDialogCancel
            disabled={pending}
            className="mt-0 min-h-11 rounded-xl px-5 font-semibold"
          >
            {t("common.cancel")}
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
