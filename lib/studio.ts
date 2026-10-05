import { readError } from "./catalogue";
import { supabase } from "./supabase";

export type StudioKind = "website" | "shop" | "software";

export type WebsiteSection = {
  id: number;
  type: string;
  title: string;
  description: string;
};

export type WebsitePayload = {
  business: string;
  headline: string;
  introduction: string;
  phone: string;
  email: string;
  whatsapp: string;
  location: string;
  sections: WebsiteSection[];
};

export type ShopProduct = {
  id: number;
  name: string;
  price: string;
  category: string;
  description: string;
  image: string;
  featured: boolean;
  available: boolean;
};

export type ShopPayload = {
  business: string;
  shopName: string;
  headline: string;
  description: string;
  whatsapp: string;
  currency: string;
  products: ShopProduct[];
};

export type SoftwareFeature = {
  id: number;
  title: string;
  detail: string;
};

export type SoftwarePayload = {
  business: string;
  productName: string;
  problem: string;
  features: SoftwareFeature[];
};

export type StudioDocument<T> = {
  id: string;
  projectId: string | null;
  kind: StudioKind;
  title: string;
  payload: T;
};

export type WorkspaceItem = {
  id: string;
  projectId: string | null;
  name: string;
  detail: string;
  type: "catalogue" | StudioKind;
  status: string;
  editHref: string;
  liveHref: string;
};

const LIVE_PATH: Record<StudioKind, string> = {
  website: "/w",
  shop: "/store",
  software: "/brief",
};

const EDIT_PATH: Record<StudioKind, string> = {
  website: "/website",
  shop: "/shop",
  software: "/software",
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function normalizeWebsite(value: unknown): WebsitePayload {
  const record = asRecord(value);
  const sections = Array.isArray(record.sections) ? record.sections : [];

  return {
    business: asString(record.business, "Your Business"),
    headline: asString(record.headline, "Your business deserves a digital home."),
    introduction: asString(record.introduction),
    phone: asString(record.phone),
    email: asString(record.email),
    whatsapp: asString(record.whatsapp),
    location: asString(record.location),
    sections: sections.map((section, index) => {
      const item = asRecord(section);
      return {
        id: typeof item.id === "number" ? item.id : index + 1,
        type: asString(item.type, "Section"),
        title: asString(item.title, "Untitled section"),
        description: asString(item.description),
      };
    }),
  };
}

export function normalizeShop(value: unknown): ShopPayload {
  const record = asRecord(value);
  const products = Array.isArray(record.products) ? record.products : [];

  return {
    business: asString(record.business, "Your Business"),
    shopName: asString(record.shopName, "Your Online Shop"),
    headline: asString(record.headline),
    description: asString(record.description),
    whatsapp: asString(record.whatsapp),
    currency: asString(record.currency, "KSh"),
    products: products.map((product, index) => {
      const item = asRecord(product);
      return {
        id: typeof item.id === "number" ? item.id : index + 1,
        name: asString(item.name, "Product"),
        price: asString(item.price, "KSh 0"),
        category: asString(item.category, "General"),
        description: asString(item.description),
        image: asString(item.image),
        featured: Boolean(item.featured),
        available: item.available !== false,
      };
    }),
  };
}

export function normalizeSoftware(value: unknown): SoftwarePayload {
  const record = asRecord(value);
  const features = Array.isArray(record.features) ? record.features : [];

  return {
    business: asString(record.business, "Your Business"),
    productName: asString(record.productName, "Custom software"),
    problem: asString(record.problem),
    features: features.map((feature, index) => {
      const item = asRecord(feature);
      return {
        id: typeof item.id === "number" ? item.id : index + 1,
        title: asString(item.title, "Requirement"),
        detail: asString(item.detail),
      };
    }),
  };
}

export function studioPaths(kind: StudioKind, id: string) {
  return {
    editHref: `${EDIT_PATH[kind]}/${id}`,
    liveHref: `${LIVE_PATH[kind]}/${id}`,
  };
}

export async function saveStudioDocument<T>(input: {
  id?: string | null;
  kind: StudioKind;
  title: string;
  payload: T;
}): Promise<StudioDocument<T>> {
  const title = input.title.trim() || "Untitled";

  if (!input.id) {
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        name: title,
        type: input.kind,
        status: "published",
      })
      .select("id")
      .single();

    if (projectError) throw projectError;
    if (!project) throw new Error("Project was not created.");

    const { data, error } = await supabase
      .from("studio_documents")
      .insert({
        project_id: String(project.id),
        kind: input.kind,
        title,
        payload: input.payload,
      })
      .select("id, project_id, kind, title, payload")
      .single();

    if (error) throw error;
    if (!data) throw new Error("The project was not saved.");

    return {
      id: data.id,
      projectId: data.project_id,
      kind: input.kind,
      title: data.title,
      payload: input.payload,
    };
  }

  const { data, error } = await supabase
    .from("studio_documents")
    .update({
      title,
      payload: input.payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .select("id, project_id, kind, title, payload")
    .single();

  if (error) throw error;
  if (!data) throw new Error("The project was not updated.");

  if (data.project_id) {
    await supabase
      .from("projects")
      .update({ name: title, status: "published" })
      .eq("id", data.project_id);
  }

  return {
    id: data.id,
    projectId: data.project_id,
    kind: input.kind,
    title: data.title,
    payload: input.payload,
  };
}

export async function loadStudioDocument(id: string): Promise<{
  id: string;
  projectId: string | null;
  kind: StudioKind;
  title: string;
  payload: unknown;
}> {
  const { data, error } = await supabase
    .from("studio_documents")
    .select("id, project_id, kind, title, payload")
    .eq("id", id)
    .single();

  if (error) throw error;
  if (!data) throw new Error("This project was not found.");

  const kind = data.kind as StudioKind;
  if (kind !== "website" && kind !== "shop" && kind !== "software") {
    throw new Error("This project type is not supported.");
  }

  return {
    id: data.id,
    projectId: data.project_id,
    kind,
    title: data.title,
    payload: data.payload,
  };
}

function statusFrom(related: unknown): string {
  const project = Array.isArray(related)
    ? (related[0] as { status?: string } | undefined)
    : (related as { status?: string } | null);
  return project?.status || "published";
}

export async function loadWorkspace(): Promise<WorkspaceItem[]> {
  const items: WorkspaceItem[] = [];

  const withStatus = await supabase
    .from("catalogues")
    .select("id, name, business_name, project_id, projects(status)")
    .order("id", { ascending: false });

  const catalogues = withStatus.error
    ? await supabase
        .from("catalogues")
        .select("id, name, business_name")
        .order("id", { ascending: false })
    : withStatus;

  if (catalogues.error) {
    throw catalogues.error;
  }

  for (const catalogue of catalogues.data || []) {
      items.push({
        id: catalogue.id,
        projectId:
          "project_id" in catalogue
            ? ((catalogue as { project_id?: string | null }).project_id ?? null)
            : null,
        name: catalogue.name,
        detail: catalogue.business_name,
        type: "catalogue",
        status: statusFrom((catalogue as { projects?: unknown }).projects),
        editHref: `/catalogue/${catalogue.id}`,
        liveHref: `/c/${catalogue.id}`,
      });
  }

  const documents = await supabase
    .from("studio_documents")
    .select("id, project_id, kind, title, payload")
    .order("created_at", { ascending: false });

  if (!documents.error) {
    for (const document of documents.data || []) {
      const kind = document.kind as StudioKind;
      if (kind !== "website" && kind !== "shop" && kind !== "software") continue;

      const payload = asRecord(document.payload);
      const detail =
        kind === "shop"
          ? asString(payload.business, "Online shop")
          : kind === "software"
            ? asString(payload.business, "Software brief")
            : asString(payload.business, "Website");

      const paths = studioPaths(kind, document.id);

      items.push({
        id: document.id,
        projectId: document.project_id,
        name: document.title,
        detail,
        type: kind,
        status: "published",
        editHref: paths.editHref,
        liveHref: paths.liveHref,
      });
    }
  }

  return items;
}

export async function deleteWorkspaceItem(item: WorkspaceItem) {
  if (item.type === "catalogue") {
    const { error: productsError } = await supabase
      .from("catalogue_products")
      .delete()
      .eq("catalogue_id", item.id);

    if (productsError) throw productsError;

    const { error } = await supabase.from("catalogues").delete().eq("id", item.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("studio_documents").delete().eq("id", item.id);
    if (error) throw error;
  }

  if (item.projectId) {
    await supabase.from("projects").delete().eq("id", item.projectId);
  }
}

export function describeSaveError(error: unknown): string {
  const message = readError(error);

  if (/studio_documents|schema cache|relation/i.test(message)) {
    return "This project could not be saved yet. Run add-studio-documents.sql in your database, then try again.";
  }

  return message;
}
