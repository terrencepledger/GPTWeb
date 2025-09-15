import Image from "next/image";
import { productsAll } from "@/lib/queries";

export default async function Page() {
  const products = await productsAll();

  if (!products.length) {
    return (
      <div className="rounded border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 text-center text-[var(--brand-surface-contrast)]">
        <h2 className="text-xl font-semibold">Store coming soon</h2>
        <p className="mt-2 text-[var(--brand-accent)]">
          We&apos;re adding new items to our store. Please check back again shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
      {products.map((product) => {
        const priceLabel =
          typeof product.price === "number"
            ? `$${product.price.toFixed(2)}`
            : "Contact for pricing";

        return (
          <div
            key={product._id}
            className="flex flex-col items-center rounded border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4 text-center"
          >
            {product.image ? (
              <Image
                src={product.image}
                alt={product.title}
                width={300}
                height={300}
                className="mb-4 h-72 w-full rounded object-cover"
              />
            ) : (
              <div className="mb-4 flex h-72 w-full items-center justify-center rounded bg-[var(--brand-border)]/20 text-sm text-[var(--brand-accent)]">
                Image coming soon
              </div>
            )}
            <h3 className="text-lg font-semibold text-[var(--brand-surface-contrast)]">
              {product.title}
            </h3>
            <p className="mt-2 text-[var(--brand-accent)]">{priceLabel}</p>
            <button className="btn-primary mt-4">Add to Cart</button>
          </div>
        );
      })}
    </div>
  );
}
