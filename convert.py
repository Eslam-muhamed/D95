import re

with open('gateway.html', 'r') as f:
    html = f.read()

# Extract main tag content
main_match = re.search(r'<main[^>]*>.*?</main>', html, re.DOTALL)
if main_match:
    main_content = main_match.group(0)
    
    # Simple JSX conversions
    main_content = main_content.replace('class="', 'className="')
    main_content = main_content.replace('stroke-width="', 'strokeWidth="')
    main_content = main_content.replace('stroke-linecap="', 'strokeLinecap="')
    main_content = main_content.replace('stroke-linejoin="', 'strokeLinejoin="')
    main_content = main_content.replace('style="animation-duration: 2s;"', 'style={{ animationDuration: "2s" }}')
    main_content = main_content.replace('style="animation-duration: 1.6s;"', 'style={{ animationDuration: "1.6s" }}')
    main_content = main_content.replace('style="animation-duration: 2.3s;"', 'style={{ animationDuration: "2.3s" }}')
    # Change CAFÉ link to Link component
    main_content = re.sub(r'<a[^>]*data-path="cafe-and-fuel"[^>]*>', '<Link to="/menu" className="group relative flex flex-col items-center justify-between p-space-md bg-surface-container/90 border border-outline-variant/30 rounded-lg shadow-xl active:scale-95 transition-all duration-200 hover:border-tertiary cursor-pointer h-56 sm:h-64 hover:shadow-[0_0_24px_rgba(255,181,160,0.3)]">', main_content)
    main_content = re.sub(r'</a>\s*<!-- 3. Bottom Compact Footer', '</Link>\n<!-- 3. Bottom Compact Footer', main_content)
    
    # Remove HTML comments (JSX comments)
    main_content = re.sub(r'<!--(.*?)-->', r'{/* \1 */}', main_content)
    
    jsx = f"""import {{ Link }} from 'react-router-dom';

export default function GatewayPage() {{
    return (
        {main_content}
    );
}}
"""
    with open('src/pages/GatewayPage.tsx', 'w') as f2:
        f2.write(jsx)
    print("Created GatewayPage.tsx")
else:
    print("Failed to find main tag")
