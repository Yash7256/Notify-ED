import { useState } from "react";

import { cn } from "@/lib/utils";

export const Component = () => {
  const [count, setCount] = useState(0);

  return (
    <div className={cn("flex flex-col items-center gap-4 p-4 rounded-lg border bg-card text-card-foreground")}>
      <h1 className="text-2xl font-bold mb-2">Component Example</h1>
      <h2 className="text-xl font-semibold">{count}</h2>
      <div className="flex gap-2">
        <button
          className="rounded-md bg-secondary px-3 py-1 text-sm font-semibold text-secondary-foreground hover:bg-secondary/80"
          onClick={() => setCount((prev) => prev - 1)}
        >
          -
        </button>
        <button
          className="rounded-md bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground hover:bg-primary/80"
          onClick={() => setCount((prev) => prev + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
};
