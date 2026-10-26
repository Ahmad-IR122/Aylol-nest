"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { productErrorCode, productRequest } from "@/lib/products/client";
import { ImageUploadError, validateProductImageFile } from "@/lib/products/image-upload";
import type { ProductImage } from "@/types/product";

type UploadStatus = { pending: boolean; uploading: boolean };
type UploadCoordinator = {
  report: (id: string, status: UploadStatus | null) => void;
  acquire: () => boolean;
  release: () => void;
};
export const ProductUploadContext = createContext<UploadCoordinator | null>(null);

export function useProductUploadCoordinator() {
  const statuses = useRef(new Map<string, UploadStatus>());
  const locked = useRef(false);
  const [state, setState] = useState<UploadStatus>({ pending: false, uploading: false });
  const report = useCallback((id: string, status: UploadStatus | null) => {
    if (status) statuses.current.set(id, status);
    else statuses.current.delete(id);
    const values = [...statuses.current.values()];
    setState({
      pending: values.some((value) => value.pending),
      uploading: values.some((value) => value.uploading),
    });
  }, []);
  const acquire = useCallback(() => {
    if (locked.current) return false;
    locked.current = true;
    return true;
  }, []);
  const release = useCallback(() => {
    locked.current = false;
  }, []);
  const isPending = useCallback(
    () => [...statuses.current.values()].some((value) => value.pending),
    [],
  );
  return { state, context: { report, acquire, release }, isPending };
}

export type PendingProductImage = {
  key: string;
  file: File;
  preview: string;
  replaceIndex?: number;
  error?: string;
};

export function useProductImageUploads(
  images: ProductImage[],
  onChange: (images: ProductImage[]) => void,
) {
  const id = useId();
  const coordinator = useContext(ProductUploadContext);
  const report = coordinator?.report;
  const [queue, setQueue] = useState<PendingProductImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const pending = useRef<PendingProductImage[]>([]);
  const previews = useRef(new Set<string>());
  const active = useRef(false);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    const urls = previews.current;
    return () => {
      controller.current?.abort();
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
      report?.(id, null);
    };
  }, [id, report]);

  function publish(next: PendingProductImage[], busy = active.current) {
    pending.current = next;
    setQueue(next);
    report?.(id, { pending: next.length > 0, uploading: busy });
  }
  function revoke(item: PendingProductImage) {
    URL.revokeObjectURL(item.preview);
    previews.current.delete(item.preview);
  }

  function select(files: FileList | File[], replaceIndex?: number) {
    if (active.current) return;
    setError("");
    setSuccess(false);
    const next = [...pending.current];
    for (const file of Array.from(files)) {
      try {
        validateProductImageFile(file);
      } catch (error) {
        setError(error instanceof ImageUploadError ? error.code : "imageInvalid");
        continue;
      }
      if (replaceIndex !== undefined) {
        const previous = next.findIndex((item) => item.replaceIndex === replaceIndex);
        if (previous !== -1) {
          revoke(next[previous]);
          next.splice(previous, 1);
        }
      }
      const preview = URL.createObjectURL(file);
      previews.current.add(preview);
      next.push({ key: crypto.randomUUID(), file, preview, replaceIndex });
      if (replaceIndex !== undefined) break;
    }
    publish(next);
  }
  function removePending(key: string) {
    if (active.current) return;
    const item = pending.current.find((item) => item.key === key);
    if (item) revoke(item);
    publish(pending.current.filter((item) => item.key !== key));
  }

  async function upload() {
    if (active.current || !pending.current.length || (coordinator && !coordinator.acquire()))
      return;
    active.current = true;
    setUploading(true);
    setError("");
    setSuccess(false);
    controller.current = new AbortController();
    const signal = controller.current.signal;
    const batch = [...pending.current];
    publish(batch, true);
    let currentImages = [...images];
    let completed = 0;
    try {
      // One file per request limits memory and makes failed items individually retryable.
      for (const item of batch) {
        if (signal.aborted) break;
        try {
          const data = new FormData();
          data.append("file", item.file);
          const result = await productRequest<{ image: Pick<ProductImage, "url" | "publicId"> }>(
            "/api/admin/uploads/products",
            { method: "POST", body: data, signal },
          );
          if (signal.aborted) break;
          if (!result.image?.url?.startsWith("https://") || !result.image.publicId)
            throw new Error("Invalid upload response");
          if (item.replaceIndex === undefined)
            currentImages = [...currentImages, { ...result.image, alt: { ar: "", en: "" } }];
          else
            currentImages = currentImages.map((image, index) =>
              index === item.replaceIndex ? { ...result.image, alt: image.alt } : image,
            );
          onChange(currentImages);
          revoke(item);
          completed++;
          publish(
            pending.current.filter((entry) => entry.key !== item.key),
            true,
          );
        } catch (error) {
          if (signal.aborted) break;
          publish(
            pending.current.map((entry) =>
              entry.key === item.key ? { ...entry, error: productErrorCode(error) } : entry,
            ),
            true,
          );
        }
      }
    } finally {
      active.current = false;
      coordinator?.release();
      if (!signal.aborted) {
        setUploading(false);
        setSuccess(completed > 0);
        publish(pending.current, false);
      }
    }
  }
  return { queue, uploading, error, success, select, removePending, upload };
}
