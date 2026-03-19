"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { Leaf } from "lucide-react";
import { SectionContainer } from "@/components/ui/SectionContainer";
import { HeroEyebrow } from "@/components/ui/HeroEyebrow";
import {
  INGREDIENTS,
  PRODUCTS,
  type IngredientProfile,
  type ProductId,
} from "@/lib/data";
import { cn } from "@/lib/utils";

type IngredientFilter = "all" | ProductId;

type IngredientCard = {
  profile: IngredientProfile;
  relatedProductIds: ProductId[];
  matchesActive: boolean;
};

const PRODUCT_KEYS = Object.keys(PRODUCTS) as ProductId[];

function normalizeIngredientLabel(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function getProductLabel(productId: ProductId) {
  return PRODUCTS[productId].name;
}

function getRelatedProductIds(profile: IngredientProfile) {
  return PRODUCT_KEYS.filter((productId) => {
    const productIngredients = PRODUCTS[productId].ingredients.map(
      normalizeIngredientLabel
    );

    return profile.aliases.some((alias) =>
      productIngredients.includes(normalizeIngredientLabel(alias))
    );
  });
}

function isIngredientProfiled(ingredientName: string) {
  const normalizedIngredient = normalizeIngredientLabel(ingredientName);

  return INGREDIENTS.some((profile) =>
    profile.aliases.some(
      (alias) => normalizeIngredientLabel(alias) === normalizedIngredient
    )
  );
}

function getFeaturedIngredientCard(
  cards: IngredientCard[],
  activeProductId: ProductId | null
) {
  if (cards.length === 0) {
    return null;
  }

  if (activeProductId) {
    const orderedIngredients = PRODUCTS[activeProductId].ingredients.map(
      normalizeIngredientLabel
    );

    for (const ingredient of orderedIngredients) {
      const match = cards.find((card) =>
        card.profile.aliases.some(
          (alias) => normalizeIngredientLabel(alias) === ingredient
        )
      );

      if (match) {
        return match;
      }
    }
  }

  return [...cards].sort((left, right) => {
    if (right.relatedProductIds.length !== left.relatedProductIds.length) {
      return right.relatedProductIds.length - left.relatedProductIds.length;
    }

    return INGREDIENTS.findIndex((profile) => profile.id === left.profile.id) -
      INGREDIENTS.findIndex((profile) => profile.id === right.profile.id);
  })[0];
}

function IngredientCardOverlay({
  profile,
  relatedProductIds,
  activeFilter,
  featured = false,
}: {
  profile: IngredientProfile;
  relatedProductIds: ProductId[];
  activeFilter: IngredientFilter;
  featured?: boolean;
}) {
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-white/72 px-3 py-2 text-[10px] font-semibold uppercase tracking-headline text-label backdrop-blur-md dark:bg-black/18 dark:text-white">
          {featured
            ? "Featured Ingredient"
            : relatedProductIds.length > 1
              ? "Shared Ingredient"
              : "Formula Profile"}
        </span>

        <span className="rounded-full bg-white/58 px-3 py-2 text-[10px] font-semibold uppercase tracking-headline text-label backdrop-blur-md dark:bg-white/14 dark:text-white">
          {relatedProductIds.length} Formula{relatedProductIds.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="max-w-[34rem]">
        <h3
          className={cn(
            "font-headline font-bold tracking-display text-label dark:text-white",
            featured ? "text-3xl sm:text-4xl" : "text-2xl"
          )}
        >
          {profile.name}
        </h3>

        <p
          className={cn(
            "mt-3 max-w-2xl leading-relaxed tracking-body text-secondary-label dark:text-white/82",
            featured ? "text-base sm:text-lg" : "text-sm sm:text-[15px]"
          )}
        >
          {profile.detail}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {relatedProductIds.map((productId) => (
              <span
                key={productId}
                className={cn(
                  "rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-headline backdrop-blur-md transition-colors",
                  activeFilter !== "all" && productId === activeFilter
                    ? "bg-label text-system-background"
                    : "bg-white/58 text-label dark:bg-white/14 dark:text-white"
                )}
              >
                {getProductLabel(productId)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function IngredientSection() {
  const [activeFilter, setActiveFilter] = useState<IngredientFilter>("all");

  const activeProductId = activeFilter === "all" ? null : activeFilter;
  const activeProduct = activeProductId ? PRODUCTS[activeProductId] : null;

  const ingredientCards = useMemo(() => {
    return INGREDIENTS.map((profile) => {
      const relatedProductIds = getRelatedProductIds(profile);
      const matchesActive =
        activeProductId === null || relatedProductIds.includes(activeProductId);

      return {
        profile,
        relatedProductIds,
        matchesActive,
      };
    }).sort((left, right) => {
      if (activeProductId === null || left.matchesActive === right.matchesActive) {
        return 0;
      }

      return left.matchesActive ? -1 : 1;
    });
  }, [activeProductId]);

  const featuredCard = getFeaturedIngredientCard(ingredientCards, activeProductId);
  const supportingCards = ingredientCards.filter(
    (card) => card.profile.id !== featuredCard?.profile.id
  );
  const profiledIngredientCount = activeProductId
    ? ingredientCards.filter((card) =>
        card.relatedProductIds.includes(activeProductId)
      ).length
    : ingredientCards.length;
  const sharedIngredientCount = ingredientCards.filter(
    (card) => card.relatedProductIds.length > 1
  ).length;

  return (
    <SectionContainer variant="white" id="ingredients">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center">
        <div className="max-w-3xl text-center">
          <HeroEyebrow position="center" animated>
            <Leaf className="mr-3 h-3.5 w-3.5 text-label" />
            Transparency
          </HeroEyebrow>

          <h2
            data-aos="fade-up"
            data-aos-duration="800"
            data-aos-delay="200"
            className="mt-12 text-4xl font-headline font-bold leading-tight tracking-display text-label md:text-5xl lg:text-6xl"
          >
            Nothing Hidden. <br /> Nothing Fake.
          </h2>

          <p
            data-aos="fade-up"
            data-aos-duration="700"
            data-aos-delay="300"
            className="mt-10 text-lg italic leading-relaxed tracking-body text-secondary-label sm:text-xl"
          >
            We believe in complete transparency. Every ingredient in House of Prax is meticulously selected for its purity and performance benefits.
          </p>
        </div>

        <div className="card-soft glass-morphism squircle mt-12 w-full p-3">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={cn(
                "rounded-full px-5 py-3 text-[10px] font-semibold uppercase tracking-headline transition-all duration-500",
                activeFilter === "all"
                  ? "bg-label text-system-background shadow-[0_16px_36px_rgba(15,23,42,0.16)]"
                  : "text-secondary-label hover:bg-system-fill hover:text-label"
              )}
            >
              All Formulas
            </button>

            {PRODUCT_KEYS.map((productId) => (
              <button
                key={productId}
                type="button"
                onClick={() => setActiveFilter(productId)}
                className={cn(
                  "rounded-full px-5 py-3 text-[10px] font-semibold uppercase tracking-headline transition-all duration-500",
                  activeFilter === productId
                    ? "bg-label text-system-background shadow-[0_16px_36px_rgba(15,23,42,0.16)]"
                    : "text-secondary-label hover:bg-system-fill hover:text-label"
                )}
              >
                {getProductLabel(productId)}
              </button>
            ))}
          </div>
        </div>

        <div className="card-soft glass-morphism squircle mt-6 w-full overflow-hidden p-6 sm:p-8">
          {activeProduct ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div>
                <span className="inline-flex rounded-full bg-accent/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-headline text-accent dark:bg-accent/15">
                  Formula Lens
                </span>

                <h3 className="mt-5 text-3xl font-headline font-bold tracking-display text-label sm:text-4xl">
                  {activeProduct.name}
                </h3>

                <p className="mt-4 max-w-2xl text-base leading-relaxed tracking-body text-secondary-label sm:text-lg">
                  {activeProduct.description}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-2">
                <div className="card-soft squircle p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                    Total Ingredients
                  </div>
                  <div className="mt-2 text-2xl font-bold tracking-tight text-label">
                    {activeProduct.ingredients.length}
                  </div>
                </div>

                <div className="card-soft squircle p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                    Profiled Here
                  </div>
                  <div className="mt-2 text-2xl font-bold tracking-tight text-label">
                    {profiledIngredientCount}
                  </div>
                </div>

                <div className="card-soft squircle p-4 sm:col-span-3 lg:col-span-2">
                  <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                    Complete Ingredient List
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeProduct.ingredients.map((ingredient) => (
                      <span
                        key={ingredient}
                        className={cn(
                          "rounded-full px-3 py-2 text-[11px] font-medium tracking-body",
                          isIngredientProfiled(ingredient)
                            ? "bg-label text-system-background"
                            : "bg-system-background text-secondary-label"
                        )}
                      >
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div>
                <span className="inline-flex rounded-full bg-accent/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-headline text-accent dark:bg-accent/15">
                  Formula Lens
                </span>

                <h3 className="mt-5 text-3xl font-headline font-bold tracking-display text-label sm:text-4xl">
                  Trace every ingredient back to a real product.
                </h3>

                <p className="mt-4 max-w-3xl text-base leading-relaxed tracking-body text-secondary-label sm:text-lg">
                  Select a formula to isolate the ingredient profiles tied to it. Featured and supporting cards below stay grounded in the current product data, while each formula keeps its full raw ingredient list when selected.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="card-soft squircle p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                    Active Formulas
                  </div>
                  <div className="mt-2 text-2xl font-bold tracking-tight text-label">
                    {PRODUCT_KEYS.length}
                  </div>
                </div>

                <div className="card-soft squircle p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                    Profiled Ingredients
                  </div>
                  <div className="mt-2 text-2xl font-bold tracking-tight text-label">
                    {ingredientCards.length}
                  </div>
                </div>

                <div className="card-soft squircle p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-headline text-secondary-label">
                    Shared Ingredients
                  </div>
                  <div className="mt-2 text-2xl font-bold tracking-tight text-label">
                    {sharedIngredientCount}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 grid w-full auto-rows-[220px] gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featuredCard ? (
            <article
              data-aos="fade-up"
              data-aos-duration="700"
              className={cn(
                "group relative min-h-[320px] overflow-hidden squircle shadow-card transition-shadow duration-700 hover:shadow-float md:col-span-2 md:row-span-2 lg:col-span-2 lg:row-span-2",
                activeFilter !== "all" &&
                  !featuredCard.matchesActive &&
                  "opacity-40 saturate-50"
              )}
            >
              <div className="relative h-full w-full">
                <Image
                  src={featuredCard.profile.image}
                  alt={featuredCard.profile.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="mask-white object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.18)_28%,rgba(255,255,255,0.88)_100%)] dark:bg-[linear-gradient(180deg,rgba(8,9,10,0.08)_0%,rgba(8,9,10,0.18)_32%,rgba(8,9,10,0.72)_100%)]" />
                <IngredientCardOverlay
                  profile={featuredCard.profile}
                  relatedProductIds={featuredCard.relatedProductIds}
                  activeFilter={activeFilter}
                  featured
                />
              </div>
            </article>
          ) : null}

          {supportingCards.map(({ profile, relatedProductIds, matchesActive }, index) => (
            <article
              key={profile.id}
              data-aos="fade-up"
              data-aos-duration="700"
              data-aos-delay={120 + index * 80}
              className={cn(
                "group relative min-h-[220px] overflow-hidden squircle shadow-card transition-shadow duration-700 hover:shadow-float md:min-h-[260px] lg:min-h-[220px]",
                activeFilter !== "all" && !matchesActive && "opacity-40 saturate-50",
                featuredCard ? "" : "lg:col-span-1"
              )}
            >
              <div className="relative h-full w-full">
                <Image
                  src={profile.image}
                  alt={profile.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="mask-white object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.18)_24%,rgba(255,255,255,0.9)_100%)] dark:bg-[linear-gradient(180deg,rgba(8,9,10,0.10)_0%,rgba(8,9,10,0.18)_28%,rgba(8,9,10,0.74)_100%)]" />
                <IngredientCardOverlay
                  profile={profile}
                  relatedProductIds={relatedProductIds}
                  activeFilter={activeFilter}
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </SectionContainer>
  );
}
