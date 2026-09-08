import re

with open('playstation.html', 'r') as f:
    html = f.read()

# Extract the body content (header, main, nav)
body_match = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL)
if body_match:
    body_content = body_match.group(1)
    
    # Remove the script block
    body_content = re.sub(r'<script>.*?</script>', '', body_content, flags=re.DOTALL)
    
    # Replace attributes
    body_content = body_content.replace('class="', 'className="')
    body_content = body_content.replace('style="font-variation-settings: \'FILL\' 1;"', '')
    body_content = body_content.replace('onclick="handleBooking(\'Room 01\')"', 'onClick={() => handleBooking("Room 01")}')
    body_content = body_content.replace('onclick="handleBooking(\'Room 02\')"', 'onClick={() => handleBooking("Room 02")}')
    body_content = body_content.replace('<!--', '{/*')
    body_content = body_content.replace('-->', '*/}')
    
    # Fix self-closing tags
    body_content = re.sub(r'<img([^>]*)>', r'<img\1 />', body_content)
    
    # Replace spacing and typography classes
    replacements = {
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
        'gap-space-2xs': 'gap-1',
        'px-grid-margin-mobile': 'px-4 md:px-8',
        'mb-space-xs': 'mb-2 md:mb-6',
        'mt-space-xs': 'mt-2 md:mt-6',
        'mt-space-sm': 'mt-3 md:mt-8',
        'my-space-xs': 'my-2 md:my-6',
        'pl-space-xs': 'pl-2',
        
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
        'font-label-numeric-rate': 'font-display font-bold',
        'text-label-numeric-rate': 'text-3xl md:text-5xl',
        
        # Responsive Layout
        'max-w-md': 'max-w-md md:max-w-3xl',
    }
    for old, new in replacements.items():
        body_content = body_content.replace(old, new)
        
    # Fix the anchor tags
    body_content = body_content.replace('<a aria-label="Portal Hub" className="w-11 h-11 flex items-center justify-center text-on-surface hover:text-primary transition-colors active:scale-95" href="#">', '<Link to="/" aria-label="Portal Hub" className="w-11 h-11 flex items-center justify-center text-on-surface hover:text-primary transition-colors active:scale-95">')
    body_content = body_content.replace('<span className="material-symbols-outlined text-[24px]">arrow_back</span></a>', '<ArrowLeft className="w-6 h-6" /></Link>')
    
    # Replace icons
    # sports_esports (header)
    body_content = re.sub(r'<span className="material-symbols-outlined[^>]*>sports_esports</span>', '<Gamepad2 className="w-5 h-5" />', body_content)
    # tv
    body_content = re.sub(r'<span className="material-symbols-outlined[^>]*>tv</span>', '<Tv className="w-4 h-4 text-primary" />', body_content)
    # videogame_asset
    body_content = re.sub(r'<span className="material-symbols-outlined[^>]*>videogame_asset</span>', '<Gamepad2 className="w-4 h-4 text-primary" />', body_content)
    # headset_mic
    body_content = re.sub(r'<span className="material-symbols-outlined[^>]*>headset_mic</span>', '<Headphones className="w-4 h-4 text-secondary" />', body_content)
    # check_circle
    body_content = re.sub(r'<span className="material-symbols-outlined[^>]*>check_circle</span>', '<CheckCircle2 className="w-4 h-4 text-primary" />', body_content)
    # arrow_forward
    body_content = re.sub(r'<span className="material-symbols-outlined[^>]*>arrow_forward</span>', '<ArrowRight className="w-5 h-5" />', body_content)
    # weekend
    body_content = re.sub(r'<span className="material-symbols-outlined[^>]*>weekend</span>', '<Armchair className="w-5 h-5" />', body_content)
    # chair
    body_content = re.sub(r'<span className="material-symbols-outlined[^>]*>chair</span>', '<Armchair className="w-4 h-4 text-secondary" />', body_content)
    # monitor
    body_content = re.sub(r'<span className="material-symbols-outlined[^>]*>monitor</span>', '<Monitor className="w-4 h-4 text-secondary" />', body_content)
    # group
    body_content = re.sub(r'<span className="material-symbols-outlined[^>]*>group</span>', '<Users className="w-4 h-4 text-secondary" />', body_content)
    # verified
    body_content = re.sub(r'<span className="material-symbols-outlined[^>]*>verified</span>', '<ShieldCheck className="w-4 h-4 text-primary" />', body_content)
    # payments
    body_content = re.sub(r'<span className="material-symbols-outlined[^>]*>payments</span>', '<Banknote className="w-5 h-5 text-primary" />', body_content)
    # local_cafe
    body_content = re.sub(r'<span className="material-symbols-outlined[^>]*>local_cafe</span>', '<Coffee className="w-6 h-6" />', body_content)
    # shopping_bag
    body_content = re.sub(r'<span className="material-symbols-outlined[^>]*>shopping_bag</span>', '<ShoppingBag className="w-6 h-6" />', body_content)

    # Change nav anchors to Links
    body_content = body_content.replace('<a className="flex flex-col', '<Link to="#" className="flex flex-col')
    body_content = body_content.replace('<span className="font-body tracking-[0.15em] font-bold text-[11px] md:text-xs tracking-wider uppercase">Stations</span></a>', '<span className="font-body tracking-[0.15em] font-bold text-[11px] md:text-xs tracking-wider uppercase">Stations</span></Link>')
    body_content = body_content.replace('<span className="font-body tracking-[0.15em] font-bold text-[11px] md:text-xs tracking-wider uppercase">Café</span></a>', '<span className="font-body tracking-[0.15em] font-bold text-[11px] md:text-xs tracking-wider uppercase">Café</span></Link>')
    body_content = body_content.replace('<span className="font-body tracking-[0.15em] font-bold text-[11px] md:text-xs tracking-wider uppercase">Cart/Pass</span></a>', '<span className="font-body tracking-[0.15em] font-bold text-[11px] md:text-xs tracking-wider uppercase">Cart/Pass</span></Link>')

    # Update actual links for nav
    body_content = body_content.replace('<Link to="#" className="flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] px-2 text-on-surface-variant hover:text-on-surface transition-all" data-path="cafe-and-menu">', '<Link to="/menu" className="flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] px-2 text-on-surface-variant hover:text-on-surface transition-all">')
    
    jsx = f"""import {{ useState }} from 'react';
import {{ Link }} from 'react-router-dom';
import {{ ArrowLeft, Gamepad2, Tv, Headphones, CheckCircle2, ArrowRight, Armchair, Monitor, Users, ShieldCheck, Banknote, Coffee, ShoppingBag }} from 'lucide-react';
import {{ toast }} from 'sonner';

export default function PlaystationPage() {{
    const handleBooking = (roomName: string) => {{
        toast.success(`تم اختيار ${{roomName}} (١٠٠ ج.م/ساعة) - جاري تجهيز الحجز...`);
    }};

    return (
        <div className="bg-surface-container-lowest text-on-surface font-body text-sm flex flex-col min-h-screen">
            {body_content}
        </div>
    );
}}
"""
    with open('src/pages/PlaystationPage.tsx', 'w') as f2:
        f2.write(jsx)
    print("Created PlaystationPage.tsx")
else:
    print("Failed to extract body")
