import urllib.request
import re
import os

urls = {
    'BookingDetailsPage': "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1YWU2Y2I5YzEzMjQwOTY4OWEyNzRlMDc5N2I4EgsSBxDxp9iGiQcYAZIBIwoKcHJvamVjdF9pZBIVQhMzMzE4NzgwNTUyNjY5NTg4NTA2&filename=&opi=89354086",
    'BookingPaymentPage': "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1YWU2Y2IxODdmOGQwNzc5OWM4NmQ5MDRhNzczEgsSBxDxp9iGiQcYAZIBIwoKcHJvamVjdF9pZBIVQhMzMzE4NzgwNTUyNjY5NTg4NTA2&filename=&opi=89354086",
    'BookingSuccessPage': "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzAwMDY1YWU2Y2I4MzcxMjIwMzgzODZkZjcyMTAxNjI2EgsSBxDxp9iGiQcYAZIBIwoKcHJvamVjdF9pZBIVQhMzMzE4NzgwNTUyNjY5NTg4NTA2&filename=&opi=89354086"
}

replacements = {
    'class="': 'className="',
    'style="font-variation-settings: \'FILL\' 1;"': '',
    '<!--': '{/* ',
    '-->': ' */}',
    # Responsive
    'p-space-md': 'p-4 md:p-8',
    'p-space-sm': 'p-3 md:p-6',
    'pt-space-xs': 'pt-2 md:pt-6',
    'py-space-xs': 'py-2 md:py-6',
    'px-space-sm': 'px-3',
    'py-space-2xs': 'py-1',
    'px-space-xs': 'px-2 md:px-4',
    'gap-space-sm': 'gap-3 md:gap-8',
    'gap-space-xs': 'gap-2 md:gap-4',
    'gap-space-md': 'gap-4 md:gap-8',
    'px-space-md': 'px-4 md:px-8',
    'pb-space-xs': 'pb-2 md:pb-6',
    'gap-space-2xs': 'gap-1 md:gap-2',
    'px-grid-margin-mobile': 'px-4 md:px-8',
    'mb-space-xs': 'mb-2 md:mb-6',
    'mb-space-sm': 'mb-3 md:mb-8',
    'mt-space-xs': 'mt-2 md:mt-6',
    'mt-space-sm': 'mt-3 md:mt-8',
    'my-space-xs': 'my-2 md:my-6',
    'pl-space-xs': 'pl-2',
    
    # Typography
    'font-headline-md': 'font-display',
    'text-headline-md': 'text-xl md:text-3xl',
    'font-headline-lg': 'font-display font-bold',
    'text-headline-lg': 'text-2xl md:text-4xl',
    'font-label-industrial-tag': 'font-body tracking-[0.15em] font-bold',
    'text-label-industrial-tag': 'text-[11px] md:text-xs',
    'font-caption': 'font-body',
    'text-caption': 'text-xs md:text-sm',
    'font-title-sm': 'font-display',
    'text-title-sm': 'text-lg md:text-xl',
    'font-body-md': 'font-body',
    'text-body-md': 'text-sm',
    'font-body-lg': 'font-body',
    'text-body-lg': 'text-base md:text-lg',
    'font-label-numeric-rate': 'font-display font-bold',
    'text-label-numeric-rate': 'text-2xl md:text-4xl',
    
    'max-w-md': 'max-w-md md:max-w-3xl',
}

icons = {
    'arrow_back': '<ArrowLeft className="w-6 h-6" />',
    'sports_esports': '<Gamepad2 className="w-5 h-5 text-primary" />',
    'calendar_today': '<Calendar className="w-4 h-4" />',
    'calendar_month': '<Calendar className="w-4 h-4 text-primary" />',
    'edit_calendar': '<Calendar className="w-4 h-4" />',
    'play_arrow': '<Play className="w-4 h-4" />',
    'sync_alt': '<RefreshCcw className="w-4 h-4" />',
    'radio_button_checked': '<CircleDot className="w-4 h-4" />',
    'radio_button_unchecked': '<Circle className="w-4 h-4" />',
    'check_circle': '<CheckCircle2 className="w-4 h-4" />',
    'lock': '<Lock className="w-4 h-4" />',
    'info': '<Info className="w-4 h-4" />',
    'receipt_long': '<Receipt className="w-5 h-5 text-primary" />',
    'schedule': '<Clock className="w-4 h-4 text-primary" />',
    'arrow_forward': '<ArrowRight className="w-5 h-5" />',
    
    'payments': '<Banknote className="w-5 h-5" />',
    'account_balance_wallet': '<Wallet className="w-5 h-5" />',
    'qr_code_scanner': '<QrCode className="w-5 h-5" />',
    'confirmation_number': '<Ticket className="w-5 h-5 text-primary" />',
    'content_copy': '<Copy className="w-4 h-4" />',
    
    'local_cafe': '<Coffee className="w-6 h-6" />',
    'shopping_bag': '<ShoppingBag className="w-6 h-6" />',
    
    'check': '<Check className="w-4 h-4 text-on-primary" />',
    'local_atm': '<Banknote className="w-5 h-5" />',
    'bolt': '<Zap className="w-4 h-4" />',
    'badge': '<Badge className="w-4 h-4 text-outline" />',
    'phone_iphone': '<Smartphone className="w-4 h-4 text-outline" />',
    'chat': '<MessageCircle className="w-5 h-5" />',
    'verified': '<CheckCircle2 className="w-4 h-4" />',
    'event': '<Calendar className="w-4 h-4 text-primary" />',
    'timer': '<Clock className="w-4 h-4 text-primary" />'
}

def clean_html(html):
    # Extract body content
    body_match = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL)
    if not body_match: return ""
    body_content = body_match.group(1)
    
    # Remove script tags
    body_content = re.sub(r'<script.*?</script>', '', body_content, flags=re.DOTALL)
    
    # Replace anchor tags with React Router Links manually for back buttons
    body_content = re.sub(r'<a[^>]*href="#"[^>]*>.*?arrow_back.*?</a>', '<Link to="/playstation" aria-label="Back" className="w-11 h-11 flex items-center justify-center text-on-surface hover:text-primary transition-colors active:scale-95"><ArrowLeft className="w-6 h-6" /></Link>', body_content, flags=re.DOTALL)
    
    # Handle self closing tags (img, input, hr)
    body_content = re.sub(r'<img([^>]*)>', r'<img\1 />', body_content)
    body_content = re.sub(r'<input([^>]*)>', r'<input\1 />', body_content)
    body_content = re.sub(r'<hr([^>]*)>', r'<hr\1 />', body_content)
    
    # Handle specific onClicks
    body_content = body_content.replace('onclick="proceedToPayment()"', 'onClick={() => navigate(\'/playstation/payment\')}')
    body_content = body_content.replace('onclick="proceedWhatsApp()"', 'onClick={() => navigate(\'/playstation/success\')}')
    body_content = re.sub(r'onclick="[^"]+"', 'onClick={() => {}}', body_content)
    
    # Do replacements
    for old, new in replacements.items():
        body_content = body_content.replace(old, new)
        
    # ONLY replace material symbols inside the spans
    for old, new in icons.items():
        body_content = re.sub(fr'<span[^>]*material-symbols-outlined[^>]*>{old}</span>', new, body_content)
        
    # Any leftovers
    body_content = re.sub(r'<span className="material-symbols-outlined[^>]*>(<[A-Za-z0-9]+[^>]*>)</span>', r'\1', body_content)
    
    # fix for
    body_content = body_content.replace('for="', 'htmlFor="')
    
    # fix disabled
    body_content = body_content.replace('disabled=""', 'disabled')
    
    return body_content

for name, url in urls.items():
    print(f"Downloading {name}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        
    jsx_content = clean_html(html)
    
    # Write file
    file_content = f"""import {{ useState }} from 'react';
import {{ Link, useNavigate, useLocation }} from 'react-router-dom';
import {{ ArrowLeft, Gamepad2, Calendar, Play, RefreshCcw, CircleDot, Circle, CheckCircle2, Lock, Info, Receipt, Clock, ArrowRight, Banknote, Wallet, QrCode, Ticket, Copy, Coffee, ShoppingBag, Check, Zap, Badge, Smartphone, MessageCircle }} from 'lucide-react';
import {{ toast }} from 'sonner';

export default function {name}() {{
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="bg-surface-container-lowest text-on-surface font-body text-sm flex flex-col min-h-screen">
            {jsx_content}
        </div>
    );
}}
"""
    with open(f"src/pages/{name}.tsx", "w") as f:
        f.write(file_content)

print("Done.")
