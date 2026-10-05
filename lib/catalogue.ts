import { supabase } from "./supabase";

export type CatalogueTheme = "editorial" | "modern" | "boutique";
export type CatalogueLayout = "grid" | "large" | "compact";
export type CatalogueRadius = "sharp" | "soft" | "round";

export type CatalogueDesign = {
  theme: CatalogueTheme;
  layout: CatalogueLayout;
  accent: string;
  radius: CatalogueRadius;
};

export const defaultDesign: CatalogueDesign = {
  theme: "editorial",
  layout: "grid",
  accent: "#111111",
  radius: "soft",
};

export const themeOptions: {
  id: CatalogueTheme;
  title: string;
  description: string;
}[] = [
  {
    id: "editorial",
    title: "Editorial",
    description: "Quiet type, generous space, and a gallery-like grid.",
  },
  {
    id: "modern",
    title: "Modern",
    description: "Crisp contrast and a left-aligned, contemporary storefront.",
  },
  {
    id: "boutique",
    title: "Boutique",
    description: "Warm paper tones and serif headlines for a refined shop.",
  },
];

export const layoutOptions: {
  id: CatalogueLayout;
  title: string;
  description: string;
}[] = [
  {
    id: "grid",
    title: "Product grid",
    description: "Three balanced columns. The right default for most shops.",
  },
  {
    id: "large",
    title: "Large feature",
    description: "Fewer products, larger photography, more presence.",
  },
  {
    id: "compact",
    title: "Compact",
    description: "A denser grid for catalogues with many products.",
  },
];

export const radiusOptions: { id: CatalogueRadius; title: string }[] = [
  { id: "sharp", title: "Sharp" },
  { id: "soft", title: "Soft" },
  { id: "round", title: "Round" },
];

export const accentOptions = [
  { name: "Ink", value: "#111111" },
  { name: "Navy", value: "#1c2c4a" },
  { name: "Forest", value: "#1f3d32" },
  { name: "Burgundy", value: "#6b2d3c" },
  { name: "Espresso", value: "#3d2b1f" },
  { name: "Bronze", value: "#8a5a2b" },
];

export type CatalogueDetails = {
  name: string;
  business_name: string;
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  website: string | null;
  location: string | null;
};

export type CatalogueRecord = CatalogueDetails & {
  id: string;
  project_id?: string | null;
  design: CatalogueDesign;
};

export type DraftProduct = {
  id: number;
  name: string;
  price: string;
  description: string;
  image: string;
  images: string[];
};

const CORE_COLUMNS =
  "id, project_id, name, business_name, whatsapp, phone, instagram, facebook, tiktok, website, location";

const OPTIONAL_COLUMNS = ["email", "theme", "layout", "accent", "radius"] as const;

function rawError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }

  return "Something went wrong. Please try again.";
}

export function publicError(error: unknown): string {
  const normalized = rawError(error).toLowerCase();

  if (/pgrst116|0 rows|cannot coerce|multiple \(or no\) rows|not found/.test(normalized)) {
    return "This link does not match a published page.";
  }

  return "This page cannot be opened right now. Please try again shortly.";
}

export function readError(error: unknown): string {
  const message = rawError(error);
  const normalized = message.toLowerCase();

  if (/invalid api key|jwt|apikey|unauthorized/.test(normalized)) {
    return "The workspace could not connect. Check the Supabase keys for this project.";
  }

  if (/failed to fetch|network|fetch failed|enotfound/.test(normalized)) {
    return "The workspace could not be reached. Check your connection and try again.";
  }

  if (/studio_documents/.test(normalized) && /schema cache|relation|does not exist|could not find/.test(normalized)) {
    return "This project could not be saved yet. Run the studio update in your database, then try again.";
  }

  if (/catalogue_product_images/.test(normalized) && /schema cache|relation|does not exist|could not find/.test(normalized)) {
    return "Extra photos could not be stored yet. Run the catalogue design update in your database.";
  }

  return message;
}

function missingColumn(error: unknown): boolean {
  const message = rawError(error).toLowerCase();
  return (
    message.includes("column") ||
    message.includes("schema cache") ||
    message.includes("could not find")
  );
}

export function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function normalizeDesign(value: Partial<CatalogueDesign> | null | undefined): CatalogueDesign {
  const theme = themeOptions.some((option) => option.id === value?.theme)
    ? (value?.theme as CatalogueTheme)
    : defaultDesign.theme;

  const layout = layoutOptions.some((option) => option.id === value?.layout)
    ? (value?.layout as CatalogueLayout)
    : defaultDesign.layout;

  const radius = radiusOptions.some((option) => option.id === value?.radius)
    ? (value?.radius as CatalogueRadius)
    : defaultDesign.radius;

  const accent = accentOptions.some((option) => option.value === value?.accent)
    ? (value?.accent as string)
    : defaultDesign.accent;

  return { theme, layout, accent, radius };
}

export function whatsAppHref(rawPhone: string | null | undefined, text: string): string {
  const encoded = encodeURIComponent(text);

  if (!rawPhone?.trim()) {
    return `https://wa.me/?text=${encoded}`;
  }

  let phone = rawPhone.replace(/\D/g, "");

  if (phone.startsWith("0")) {
    phone = `254${phone.slice(1)}`;
  }

  return `https://wa.me/${phone}?text=${encoded}`;
}

export function externalHref(
  kind: "instagram" | "facebook" | "tiktok" | "website" | "email" | "phone",
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  if (kind === "email") return `mailto:${trimmed}`;
  if (kind === "phone") return `tel:${trimmed.replace(/\s/g, "")}`;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  if (kind === "instagram") {
    return `https://instagram.com/${trimmed.replace(/^@/, "")}`;
  }

  if (kind === "tiktok") {
    return `https://www.tiktok.com/@${trimmed.replace(/^@/, "")}`;
  }

  if (kind === "facebook") {
    return trimmed.includes("facebook.com")
      ? `https://${trimmed.replace(/^https?:\/\//, "")}`
      : `https://facebook.com/${trimmed.replace(/^@/, "")}`;
  }

  return `https://${trimmed}`;
}

type CatalogueRow = Partial<CatalogueDetails> & {
  id: string;
  project_id?: string | null;
  theme?: string | null;
  layout?: string | null;
  accent?: string | null;
  radius?: string | null;
};

function toRecord(row: CatalogueRow): CatalogueRecord {
  return {
    id: row.id,
    project_id: row.project_id ?? null,
    name: row.name || "Untitled catalogue",
    business_name: row.business_name || "Your business",
    whatsapp: row.whatsapp ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    instagram: row.instagram ?? null,
    facebook: row.facebook ?? null,
    tiktok: row.tiktok ?? null,
    website: row.website ?? null,
    location: row.location ?? null,
    design: normalizeDesign({
      theme: row.theme as CatalogueTheme | undefined,
      layout: row.layout as CatalogueLayout | undefined,
      accent: row.accent || undefined,
      radius: row.radius as CatalogueRadius | undefined,
    }),
  };
}

export async function fetchCatalogue(id: string): Promise<CatalogueRecord> {
  const columns = [...CORE_COLUMNS.split(", ").map((column) => column.trim()), ...OPTIONAL_COLUMNS];

  for (let attempt = 0; attempt < OPTIONAL_COLUMNS.length + 1; attempt += 1) {
    const result = await supabase
      .from("catalogues")
      .select(columns.join(", "))
      .eq("id", id)
      .single();

    if (!result.error && result.data) {
      return toRecord(result.data as unknown as CatalogueRow);
    }

    if (!missingColumn(result.error)) {
      throw result.error;
    }

    const column = columnFromError(result.error);
    const removable = OPTIONAL_COLUMNS.find(
      (field) => field === column || columns.includes(field),
    );

    if (!column || !columns.includes(column)) {
      const fallback = columns.find((field) =>
        (OPTIONAL_COLUMNS as readonly string[]).includes(field),
      );

      if (!fallback) throw result.error;
      columns.splice(columns.indexOf(fallback), 1);
      continue;
    }

    columns.splice(columns.indexOf(column), 1);

    if (!removable) throw result.error;
  }

  throw new Error("Catalogue was not found.");
}

export async function fetchProductGalleries(
  productIds: Array<string | number>,
): Promise<Record<string, string[]> | null> {
  if (productIds.length === 0) return {};

  const { data, error } = await supabase
    .from("catalogue_product_images")
    .select("product_id, image_url, sort_order")
    .in("product_id", productIds)
    .order("sort_order", { ascending: true });

  if (error) {
    if (missingColumn(error) || /relation|does not exist|schema cache/i.test(readError(error))) {
      return null;
    }

    console.error("Gallery load error:", error);
    return null;
  }

  const galleries: Record<string, string[]> = {};

  for (const row of data || []) {
    const productId = String(row.product_id);
    const imageUrl = typeof row.image_url === "string" ? row.image_url.trim() : "";

    if (!imageUrl) continue;

    galleries[productId] = galleries[productId] || [];
    galleries[productId].push(imageUrl);
  }

  return galleries;
}

type ContactInput = {
  name: string;
  business: string;
  whatsapp: string;
  phone: string;
  email: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  website: string;
  location: string;
};

const OPTIONAL_WRITE_FIELDS = ["email", "theme", "layout", "accent", "radius"];

function columnFromError(error: unknown): string | null {
  const message = readError(error);
  const quoted = message.match(/['"`]([a-z_]+)['"`]/i);
  return quoted?.[1] ?? null;
}

function contactPayload(input: ContactInput, design: CatalogueDesign) {
  return {
    name: input.name.trim(),
    business_name: input.business.trim(),
    whatsapp: emptyToNull(input.whatsapp),
    phone: emptyToNull(input.phone),
    email: emptyToNull(input.email),
    instagram: emptyToNull(input.instagram),
    facebook: emptyToNull(input.facebook),
    tiktok: emptyToNull(input.tiktok),
    website: emptyToNull(input.website),
    location: emptyToNull(input.location),
    theme: design.theme,
    layout: design.layout,
    accent: design.accent,
    radius: design.radius,
  };
}

async function writeCatalogue(
  mode: "insert" | "update",
  id: string | null,
  input: ContactInput,
  design: CatalogueDesign,
  projectId?: string,
): Promise<{ id: string; designSaved: boolean }> {
  const payload: Record<string, string | null> = {
    ...contactPayload(input, design),
  };

  let lastError: unknown = null;

  for (let attempt = 0; attempt < OPTIONAL_WRITE_FIELDS.length + 1; attempt += 1) {
    const designSaved = ["theme", "layout", "accent", "radius"].every(
      (field) => field in payload,
    );

    if (mode === "insert") {
      const { data, error } = await supabase
        .from("catalogues")
        .insert({
          ...payload,
          project_id: projectId,
        })
        .select("id")
        .single();

      if (!error && data) {
        return { id: data.id, designSaved };
      }

      lastError = error;

      if (!missingColumn(error)) throw error;
    } else {
      const { error } = await supabase.from("catalogues").update(payload).eq("id", id);

      if (!error) {
        return { id: id as string, designSaved };
      }

      lastError = error;

      if (!missingColumn(error)) throw error;
    }

    const column = columnFromError(lastError);

    if (column && OPTIONAL_WRITE_FIELDS.includes(column) && column in payload) {
      delete payload[column];
      continue;
    }

    const removable = OPTIONAL_WRITE_FIELDS.find((field) => field in payload);

    if (!removable) break;

    delete payload[removable];
  }

  throw lastError || new Error("Unable to save catalogue.");
}

export async function createCatalogue(
  input: ContactInput,
  design: CatalogueDesign,
): Promise<{ id: string; designSaved: boolean }> {
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      name: input.name.trim(),
      type: "catalogue",
      status: "draft",
    })
    .select("id")
    .single();

  if (projectError) throw projectError;
  if (!project) throw new Error("Project was not created.");

  return writeCatalogue("insert", null, input, design, project.id);
}

export async function updateCatalogue(
  id: string,
  input: ContactInput,
  design: CatalogueDesign,
): Promise<{ designSaved: boolean }> {
  const result = await writeCatalogue("update", id, input, design);
  return { designSaved: result.designSaved };
}

export async function markProjectPublished(catalogueId: string) {
  const { data, error } = await supabase
    .from("catalogues")
    .select("project_id")
    .eq("id", catalogueId)
    .single();

  if (error || !data?.project_id) return;

  await supabase
    .from("projects")
    .update({ status: "published" })
    .eq("id", data.project_id);
}

export async function replaceCatalogueProducts(
  catalogueId: string,
  products: DraftProduct[],
): Promise<string | null> {
  const { error: deleteError } = await supabase
    .from("catalogue_products")
    .delete()
    .eq("catalogue_id", catalogueId);

  if (deleteError) throw deleteError;

  if (products.length === 0) return null;

  const rows = products.map((product) => ({
    catalogue_id: catalogueId,
    name: product.name.trim(),
    price: product.price.trim(),
    description: product.description.trim(),
    image: product.images?.[0] || product.image || null,
  }));

  const { data, error } = await supabase
    .from("catalogue_products")
    .insert(rows)
    .select("id");

  if (error) throw error;

  const imageRows = (data || []).flatMap((row, index) => {
    const images = (products[index]?.images || [])
      .map((image) => image.trim())
      .filter(Boolean)
      .slice(0, 5);

    return images.map((imageUrl, sortOrder) => ({
      product_id: row.id,
      image_url: imageUrl,
      sort_order: sortOrder,
    }));
  });

  if (imageRows.length === 0) return null;

  const { error: imageError } = await supabase
    .from("catalogue_product_images")
    .insert(imageRows);

  if (imageError) {
    console.error("Gallery save error:", imageError);
    return "Catalogue saved. Extra photos need the product gallery update in your database before they can be stored.";
  }

  return null;
}
