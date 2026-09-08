import re

with open('tailwind.config.ts', 'r') as f:
    config = f.read()

new_colors = {
  "on-error": "#690005",
  "secondary-container": "#920703",
  "inverse-primary": "#b22926",
  "secondary-fixed": "#ffdad4",
  "surface-variant": "#353534",
  "tertiary-fixed": "#ffdbd1",
  "surface-dim": "#131313",
  "surface-container-low": "#1c1b1b",
  "outline-variant": "#5a413e",
  "on-secondary-fixed": "#410000",
  "on-primary-container": "#ffb6ae",
  "outline": "#a98986",
  "surface-container-highest": "#353534",
  "on-tertiary": "#601400",
  "surface-container-high": "#2a2a2a",
  "on-secondary-fixed-variant": "#920703",
  "primary-fixed-dim": "#ffb4ac",
  "on-secondary": "#690000",
  "on-secondary-container": "#ff9a8a",
  "background": "#131313",
  "secondary-fixed-dim": "#ffb4a8",
  "primary": "#ffb4ac",
  "on-surface-variant": "#e2beba",
  "on-primary": "#690007",
  "tertiary-fixed-dim": "#ffb5a0",
  "tertiary": "#ffb5a0",
  "error": "#ffb4ab",
  "on-primary-fixed": "#410002",
  "tertiary-container": "#9e2700",
  "on-tertiary-fixed-variant": "#872000",
  "error-container": "#93000a",
  "on-surface": "#e5e2e1",
  "on-background": "#e5e2e1",
  "on-tertiary-fixed": "#3b0900",
  "on-primary-fixed-variant": "#900c12",
  "on-error-container": "#ffdad6",
  "inverse-surface": "#e5e2e1",
  "surface-container": "#201f1f",
  "surface": "#131313",
  "surface-container-lowest": "#0e0e0e",
  "surface-bright": "#393939",
  "on-tertiary-container": "#ffb6a3",
  "primary-container": "#a31d1d",
  "inverse-on-surface": "#313030",
  "secondary": "#ffb4a8",
  "surface-tint": "#ffb4ac",
  "primary-fixed": "#ffdad6"
}

colors_str = "            colors: {\n"
for k, v in new_colors.items():
    colors_str += f"                '{k}': '{v}',\n"

config = config.replace('colors: {', colors_str, 1)

with open('tailwind.config.ts', 'w') as f:
    f.write(config)

print("Updated tailwind.config.ts")
