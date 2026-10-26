import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";

describe("Footer component", () => {
  it("renders branding and accessibility/Vercel status tags", () => {
    render(<Footer />);
    expect(screen.getByText(/EventWise AI/i)).toBeInTheDocument();
    expect(screen.getByText(/Vercel Ready/i)).toBeInTheDocument();
    expect(screen.getByText(/WCAG 2.2 AA Accessible/i)).toBeInTheDocument();
  });
});
