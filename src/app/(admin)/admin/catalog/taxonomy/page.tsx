import Link from "next/link";
import { Boxes, FlaskConical, PackageSearch } from "lucide-react";
import { MetricRail } from "@/components/admin/MetricRail";
import { CatalogTaxonomyManager } from "@/components/admin/catalog/CatalogTaxonomyManager";
import { requireAdminSession } from "@/lib/auth/guards";
import { listAdminCatalogCategoryDetails, listAdminCatalogIngredients } from "@/lib/db/repositories/catalog-admin-repository";

export default async function AdminCatalogTaxonomyPage() {
  await requireAdminSession("/admin/catalog/taxonomy");
  const [categories, ingredients] = await Promise.all([
    listAdminCatalogCategoryDetails(),
    listAdminCatalogIngredients(),
  ]);

  const linkedIngredients = ingredients.filter((ingredient) => ingredient.variantCount > 0).length;

  return (
    <div className="space-y-8 pb-20 md:space-y-10">
      <div className="rounded-[24px] bg-system-fill/42 p-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] md:inline-flex">
        <div className="grid grid-cols-2 gap-1.5">
          <QuickLink href="/admin/catalog/products" label="Products" icon={PackageSearch} />
          <QuickLink href="/admin/catalog/taxonomy" label="Taxonomy" icon={Boxes} />
        </div>
      </div>

      <MetricRail
        items={[
          {
            label: "Categories",
            value: `${categories.length}`,
            detail: "Store groups",
            icon: Boxes,
          },
          {
            label: "Ingredients",
            value: `${ingredients.length}`,
            detail: `${linkedIngredients} linked`,
            icon: FlaskConical,
            tone: "success",
          },
        ]}
        columns={2}
      />

      <CatalogTaxonomyManager categories={categories} ingredients={ingredients} />
    </div>
  );
}

function QuickLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: typeof PackageSearch;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[40px] items-center justify-center gap-2 rounded-[18px] px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-label transition-colors duration-200 hover:bg-[color:var(--surface)] hover:shadow-soft"
    >
      <Icon size={15} />
      <span>{label}</span>
    </Link>
  );
}
