import { colord } from "colord";

export function applyTheme(primaryColor) {
  const base = colord(primaryColor);

  document.documentElement.style.setProperty(
    "--primary",
    base.toHex()
  );

  document.documentElement.style.setProperty(
    "--primary-hover",
    base.darken(0.07).toHex()
  );

  document.documentElement.style.setProperty(
    "--primary-active",
    base.darken(0.14).toHex()
  );

  document.documentElement.style.setProperty(
    "--on-primary",
    base.isLight() ? "#000000" : "#ffffff"
  );

  document.documentElement.style.setProperty(
    "--accent",
    base.alpha(0.10).toRgbString()
  );

  document.documentElement.style.setProperty(
    "--accent-hover",
    base.alpha(0.16).toRgbString()
  );

  document.documentElement.style.setProperty(
    "--primary-soft",
    base.alpha(0.12).toRgbString()
  );

  document.documentElement.style.setProperty(
    "--bg-muted",
    base.alpha(0.05).toRgbString()
  );

  document.documentElement.style.setProperty(
    "--border-subtle",
    base.alpha(0.16).toRgbString()
  );

  document.documentElement.style.setProperty(
    "--border-strong",
    base.alpha(0.28).toRgbString()
  );

  document.documentElement.style.setProperty(
    "--card-shadow-hover",
    base.alpha(0.20).toRgbString()
  );

  document.documentElement.style.setProperty(
    "--text-inverse",
    "#ffffff"
  );

  document.documentElement.style.setProperty(
    "--overlay",
    "rgba(15, 23, 42, 0.48)"
  );

  document.documentElement.style.setProperty(
    "--hero-grad-start",
    base.alpha(0.08).toRgbString()
  );

  document.documentElement.style.setProperty(
    "--hero-grad-end",
    "#ffffff"
  );

  /* ================= Focus ring ================= */
  document.documentElement.style.setProperty(
    "--ring",
    base.alpha(0.35).toRgbString()
  );
}
