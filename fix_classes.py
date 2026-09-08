import re

with open('src/pages/GatewayPage.tsx', 'r') as f:
    content = f.read()

replacements = {
    # Spacing
    'p-space-md': 'p-4 md:p-8',
    'pt-space-xs': 'pt-2 md:pt-6',
    'py-space-xs': 'py-2 md:py-6',
    'px-space-sm': 'px-3',
    'py-space-2xs': 'py-1',
    'px-space-xs': 'px-2',
    'gap-space-sm': 'gap-3 md:gap-8',
    'gap-space-xs': 'gap-2',
    'px-space-md': 'px-4',
    'pb-space-xs': 'pb-2 md:pb-6',
    
    # Fonts
    'font-headline-md': 'font-display',
    'text-headline-md': 'text-2xl md:text-4xl',
    'font-label-industrial-tag': 'font-body tracking-[0.15em] font-bold',
    'text-label-industrial-tag': 'text-[11px] md:text-xs',
    'font-caption': 'font-body',
    'text-caption': 'text-xs md:text-sm',
    'font-title-sm': 'font-display',
    'text-title-sm': 'text-lg md:text-2xl',
    'font-body-md': 'font-body',
    'text-body-md': 'text-sm',
    
    # Layout adjustments for desktop
    'max-w-md': 'max-w-md md:max-w-3xl',
    'h-56': 'h-56 md:h-72',
    'sm:h-64': 'sm:h-64 md:h-80',
    'w-24 h-16 sm:w-28 sm:h-20': 'w-24 h-16 sm:w-28 sm:h-20 md:w-32 md:h-24',
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Also fix the grid to be more spaced out on desktop and cards a bit wider
# max-w-md -> max-w-2xl
content = content.replace('max-w-md md:max-w-3xl', 'max-w-md md:max-w-2xl')

with open('src/pages/GatewayPage.tsx', 'w') as f:
    f.write(content)

print("Replaced classes")
