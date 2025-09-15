import Image from "next/image";
import { productsAll } from "@/lib/queries";

export default async function Page() {
  const products = await productsAll();

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
      {products.map((product) => (
        <div
          key={product._id}
          className="flex flex-col items-center rounded border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4 text-center"
        >
          {product.image && (
            <Image
              src={product.image}
              alt={product.title}
              width={300}
              height={300}
              className="mb-4 object-cover"
            />
          )}
          <h3 className="text-lg font-semibold text-[var(--brand-surface-contrast)]">
            {product.title}
          </h3>
          <p className="mt-2 text-[var(--brand-accent)]">${product.price.toFixed(2)}</p>
          <button className="btn-primary mt-4">Add to Cart</button>
        </div>
      ))}
    </div>
  );
}
