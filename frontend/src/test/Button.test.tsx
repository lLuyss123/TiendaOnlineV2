import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renders its label", () => {
    render(<Button>Comprar ahora</Button>);

    expect(screen.getByRole("button", { name: "Comprar ahora" })).toBeInTheDocument();
  });
});
