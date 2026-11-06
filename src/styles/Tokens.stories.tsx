import { tokens } from "@/styles/tokens";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

/**
 * A living reference for the token layer. It reads the computed values out of
 * the DOM, so it can never fall out of sync with tokens.css the way a
 * hand-maintained table would.
 */
const meta = {
  title: "Design System/Tokens",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Tokens come in two tiers. PRIMITIVES are the raw palette and scales. SEMANTIC tokens say what a value is *for*, and are the only ones components may use. Switch the Theme toolbar to dark and watch the semantic row change while the primitives stay put — that is the whole mechanism behind theming.",
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Everything below is derived from the generated token list rather than
 * hand-maintained. Add a colour to tokens/primitive/color.json, run
 * `npm run tokens:build`, and it appears here — there is no second copy to
 * forget to update.
 */
const SEMANTIC_COLORS = tokens
  .filter((token) => token.tier === "semantic" && token.type === "color")
  .map((token) => token.name);

const PRIMITIVE_RAMPS = tokens
  .filter((token) => token.tier === "primitive" && token.type === "color")
  .reduce<Record<string, { step: string; name: string }[]>>((ramps, token) => {
    const [, ramp, step] = token.name.split("-").slice(1);
    (ramps[ramp] ??= []).push({ step, name: token.name });
    return ramps;
  }, {});

const byPrefix = (prefix: string) =>
  tokens.filter((token) => token.name.startsWith(prefix));

const SPACING = byPrefix("--space-").filter((token) =>
  /^--space-\d+$/.test(token.name),
);
const FONT_SIZES = byPrefix("--font-size-");
const RADII = byPrefix("--radius-");
const SHADOWS = byPrefix("--shadow-");

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: "var(--space-7)" }}>
      <h2
        style={{
          fontSize: "var(--font-size-4)",
          fontWeight: "var(--font-weight-semibold)",
          marginBottom: "var(--space-1)",
        }}
      >
        {title}
      </h2>
      <p
        style={{
          color: "var(--color-text-secondary)",
          fontSize: "var(--font-size-1)",
          marginBottom: "var(--space-4)",
          maxWidth: "48rem",
        }}
      >
        {description}
      </p>
      {children}
    </section>
  );
}

function Swatch({ token }: { token: string }) {
  return (
    <div style={{ minWidth: "11rem" }}>
      <div
        style={{
          height: "3rem",
          borderRadius: "var(--radius-md)",
          background: `var(${token})`,
          border: "1px solid var(--color-border-default)",
        }}
      />
      <code
        style={{
          display: "block",
          marginTop: "var(--space-1)",
          fontSize: "var(--font-size-0)",
          color: "var(--color-text-secondary)",
          wordBreak: "break-all",
        }}
      >
        {token}
      </code>
    </div>
  );
}

const grid: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--space-4)",
};

export const SemanticColors: Story = {
  render: () => (
    <Section
      title="Semantic colours"
      description="The only colours a component is allowed to reference. Each one names a role, not a hue — so redefining them under [data-theme='dark'] re-themes the whole app without touching a single component stylesheet."
    >
      <div style={grid}>
        {SEMANTIC_COLORS.map((token) => (
          <Swatch key={token} token={token} />
        ))}
      </div>
    </Section>
  ),
};

export const PrimitiveColors: Story = {
  render: () => (
    <Section
      title="Primitive colours"
      description="The raw palette. These are context-free and identical in both themes. Components must never reference them directly — only the semantic layer above may."
    >
      {Object.entries(PRIMITIVE_RAMPS).map(([name, steps]) => (
        <div key={name} style={{ marginBottom: "var(--space-5)" }}>
          <h3
            style={{
              fontSize: "var(--font-size-1)",
              fontWeight: "var(--font-weight-semibold)",
              marginBottom: "var(--space-2)",
              textTransform: "capitalize",
            }}
          >
            {name}
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
            {steps.map(({ step, name: tokenName }) => (
              <div key={tokenName} style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: "3.5rem",
                    height: "3.5rem",
                    borderRadius: "var(--radius-md)",
                    background: `var(${tokenName})`,
                    border: "1px solid var(--color-border-default)",
                  }}
                />
                <code
                  style={{
                    fontSize: "var(--font-size-0)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  {step}
                </code>
              </div>
            ))}
          </div>
        </div>
      ))}
    </Section>
  ),
};

export const Spacing: Story = {
  render: () => (
    <Section
      title="Spacing"
      description="A 4px base step. Picking from a scale instead of inventing pixel values is what makes unrelated screens feel like one product."
    >
      <div
        style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}
      >
        {SPACING.map(({ name }) => (
          <div
            key={name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-4)",
            }}
          >
            <code
              style={{
                width: "7rem",
                fontSize: "var(--font-size-0)",
                color: "var(--color-text-secondary)",
              }}
            >
              {name}
            </code>
            <div
              style={{
                height: "1rem",
                width: `var(${name})`,
                background: "var(--color-accent-base)",
                borderRadius: "var(--radius-sm)",
              }}
            />
          </div>
        ))}
      </div>
    </Section>
  ),
};

export const Typography: Story = {
  render: () => (
    <Section
      title="Type scale"
      description="Seven sizes, from captions to page titles. Anything outside this list is a sign the design needs a decision, not a new number."
    >
      {FONT_SIZES.map(({ name }) => (
        <div
          key={name}
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "var(--space-4)",
            marginBottom: "var(--space-3)",
          }}
        >
          <code
            style={{
              width: "8rem",
              flexShrink: 0,
              fontSize: "var(--font-size-0)",
              color: "var(--color-text-secondary)",
            }}
          >
            {name}
          </code>
          <span style={{ fontSize: `var(${name})` }}>
            The quick brown fox
          </span>
        </div>
      ))}
    </Section>
  ),
};

export const RadiiAndShadows: Story = {
  render: () => (
    <Section
      title="Radii and elevation"
      description="Shadows are redefined for the dark theme, because a shadow tuned for a white page disappears on a dark one."
    >
      <div style={{ ...grid, marginBottom: "var(--space-6)" }}>
        {RADII.map(({ name }) => (
          <div key={name} style={{ textAlign: "center" }}>
            <div
              style={{
                width: "5rem",
                height: "5rem",
                borderRadius: `var(${name})`,
                background: "var(--color-accent-subtle)",
                border: "1px solid var(--color-border-accent)",
              }}
            />
            <code
              style={{
                fontSize: "var(--font-size-0)",
                color: "var(--color-text-secondary)",
              }}
            >
              {name.replace("--radius-", "")}
            </code>
          </div>
        ))}
      </div>

      <div style={grid}>
        {SHADOWS.map(({ name }) => (
          <div key={name} style={{ textAlign: "center" }}>
            <div
              style={{
                width: "6rem",
                height: "4rem",
                borderRadius: "var(--radius-lg)",
                background: "var(--color-surface-raised)",
                boxShadow: `var(${name})`,
              }}
            />
            <code
              style={{
                display: "block",
                marginTop: "var(--space-2)",
                fontSize: "var(--font-size-0)",
                color: "var(--color-text-secondary)",
              }}
            >
              {name.replace("--shadow-", "")}
            </code>
          </div>
        ))}
      </div>
    </Section>
  ),
};
