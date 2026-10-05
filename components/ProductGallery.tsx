"use client";

import Image from "next/image";
import { ChangeEvent } from "react";

type ProductGalleryProps = {
  name: string;
  images: string[];
  uploading: boolean;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onMakePrimary: (imageIndex: number) => void;
  onRemoveImage: (imageIndex: number) => void;
};

export default function ProductGallery({
  name,
  images,
  uploading,
  onUpload,
  onMakePrimary,
  onRemoveImage,
}: ProductGalleryProps) {
  if (images.length === 0) {
    return (
      <label className={`upload-box ${uploading ? "is-uploading" : ""}`}>
        <span>{uploading ? "…" : "+"}</span>
        <strong>{uploading ? "Uploading photos" : "Upload product photos"}</strong>
        <small>
          {uploading
            ? "Please wait while the photos upload."
            : "Up to 5 photos · JPG, PNG or WEBP · 5MB each"}
        </small>
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={onUpload}
        />
      </label>
    );
  }

  return (
    <>
      <div className="product-gallery-main">
        <Image
          src={images[0]}
          unoptimized
          alt={name || "Product image"}
          width={800}
          height={800}
          className="uploaded-product-image"
        />
        <span className="primary-image-badge">PRIMARY</span>
      </div>

      <div className="product-gallery-thumbnails">
        {images.map((image, imageIndex) => (
          <div
            className={`product-gallery-thumbnail ${imageIndex === 0 ? "active" : ""}`}
            key={`${image}-${imageIndex}`}
          >
            <button
              type="button"
              className="thumbnail-select"
              onClick={() => onMakePrimary(imageIndex)}
              aria-label={
                imageIndex === 0
                  ? "Primary photo"
                  : `Make photo ${imageIndex + 1} the primary photo`
              }
            >
              <Image
                src={image}
                unoptimized
                alt=""
                width={160}
                height={160}
              />
            </button>
            <button
              type="button"
              className="thumbnail-remove"
              onClick={() => onRemoveImage(imageIndex)}
              aria-label={`Remove photo ${imageIndex + 1}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="gallery-upload-footer">
        <span>
          {images.length}/5 photos
        </span>
        {images.length < 5 ? (
          <label className="gallery-add-button">
            {uploading ? "Uploading..." : "Add photos"}
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading}
              onChange={onUpload}
            />
          </label>
        ) : null}
      </div>
    </>
  );
}
