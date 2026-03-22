import { notFound } from "next/navigation";
import { ImageIcon, Layers3, Package2, WalletCards } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import { ProductEditorForm } from "@/components/admin/catalog/ProductEditorForm";
import { WorkspaceContextPanel } from "@/components/shell/WorkspaceContextPanel";
import { formatNgn } from "@/lib/commerce";
import {
  getAdminCatalogProductDetail,
  getAdminCatalogProductDeleteGuard,
  listAdminCatalogProductMedia,
  listAdminCatalogCategories,
  listAdminCatalogIngredients,
  listAdminCatalogVariantIngredientIds,
} from "@/lib/db/repositories/catalog-admin-repository";

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const [product, categories, media, ingredients, deleteGuard] = await Promise.all([
    getAdminCatalogProductDetail(productId),
    listAdminCatalogCategories(),
    listAdminCatalogProductMedia(productId),
    listAdminCatalogIngredients(),
    getAdminCatalogProductDeleteGuard(productId),
  ]);

  if (!product) {
    notFound();
  }

  const selectedIngredientIds = await listAdminCatalogVariantIngredientIds(product.variantId);

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <div className="space-y-3 md:hidden">
        <section className="rounded-[24px] bg-system-fill/40 px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                Product
              </div>
              <div className="mt-1 truncate text-lg font-semibold tracking-tight text-label">
                {product.productMarketingName || product.productName}
              </div>
              <div className="mt-1 text-sm text-secondary-label">
                {product.variantName}
              </div>
            </div>
            <div className="rounded-full bg-[color:var(--surface)] px-3 py-1 text-[10px] font-semibold uppercase tracking-headline text-label">
              {product.isAvailable ? "Live" : "Hidden"}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <CompactCatalogStat label="Price" value={formatNgn(product.priceNgn)} />
            <CompactCatalogStat label="Stock" value={`${product.inventoryOnHand ?? 0}`} />
            <CompactCatalogStat label="Media" value={`${product.mediaCount}`} />
            <CompactCatalogStat label="Ingredients" value={`${product.ingredientCount}`} />
          </div>
        </section>
      </div>

      <div className="hidden md:block">
        <WorkspaceContextPanel
          title={product.productMarketingName || product.productName}
          detail={product.productTagline || undefined}
          tags={[
            { label: product.status },
            { label: product.isAvailable ? "Live" : "Hidden" },
            ...(product.merchandisingState === "featured"
              ? [{ label: "Featured", tone: "success" as const }]
              : []),
          ]}
          meta={[
            { label: "SKU", value: product.sku },
            { label: "Category", value: product.categoryName ?? "Unsorted" },
            { label: "Variant", value: product.variantName },
          ]}
        />
      </div>

      <div className="hidden md:block">
        <MetricRail
          items={[
            {
              label: "Price",
              value: formatNgn(product.priceNgn),
              detail: product.compareAtPriceNgn
                ? `From ${formatNgn(product.compareAtPriceNgn)}`
                : "Base",
              icon: WalletCards,
            },
            {
              label: "Stock",
              value: `${product.inventoryOnHand ?? 0}`,
              detail: product.reorderThreshold
                ? `Alert ${product.reorderThreshold}`
                : "Open",
              icon: Package2,
            },
            {
              label: "Ingredients",
              value: `${product.ingredientCount}`,
              detail: "Linked",
              icon: Layers3,
              tone: "success",
            },
            {
              label: "Media",
              value: `${product.mediaCount}`,
              detail: "Assets",
              icon: ImageIcon,
            },
          ]}
          columns={4}
        />
      </div>

      <ProductEditorForm
        product={product}
        categories={categories}
        ingredients={ingredients}
        selectedIngredientIds={selectedIngredientIds}
        deleteGuard={deleteGuard}
        media={media}
        variantTarget={{
          variantId: product.variantId,
          variantName: product.variantName,
        }}
      />
    </div>
  );
}

function CompactCatalogStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] bg-[color:var(--surface)]/88 px-3 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-label">{value}</div>
    </div>
  );
}
