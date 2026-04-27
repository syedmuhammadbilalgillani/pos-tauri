import { Brand } from "@/lib/tan-stack/brands";
import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ImageWithFallback } from "../ui/image-with-fallback";

type BrandCardProps = Brand & {
  locationsCount?: number;
  locationCount?: number;
  _count?: {
    locations?: number;
  };
};

const BrandCard = ({ brand }: { brand: BrandCardProps }) => {
  console.log(brand, "brand");
 
  return (
    <Link
      href={`/t/brands/id?id=${brand.id}`}
      className={`group block rounded-xl border border-border bg-background p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
          <ImageWithFallback
            src={brand.logoUrl ?? ""}
            alt={brand.name}
            width={36}
            height={36}
            fallbackText={brand.name.charAt(0)}
            className="rounded-md object-cover"
          />
        </div>

        <span
          className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
            brand.isActive
              ? "bg-green-100 text-green-700"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {brand.isActive ? "ACTIVE" : "INACTIVE"}
        </span>
      </div>

      <div className="mt-4 space-y-1">
        <h3 className="line-clamp-1 text-base font-semibold text-foreground">
          {brand.name}
        </h3>

        <p className="line-clamp-4 text-sm text-muted-foreground">
          {brand.description}
          {brand.cuisineType && (
            <>
              <span className="mx-1">•</span>
              {brand.cuisineType}
            </>
          )}
          
        </p>
      </div>

      <div className="mt-5 border-t pt-4">
        <div className="flex items-center justify-end">
        

          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" />
        </div>
      </div>
    </Link>
  );
};

export default BrandCard;
