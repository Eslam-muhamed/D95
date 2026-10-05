import fs from 'fs';
const path = 'src/features/admin/components/BulkDiscountModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace standard variables
content = content.replace(
    /const \[saving, setSaving\] = useState\(false\);\n    const \[removing, setRemoving\] = useState\(false\);/,
    "const [saving, setSaving] = useState(false);\n    const [removing, setRemoving] = useState(false);\n    const [progress, setProgress] = useState(0);"
);

// Replace handleApply to use onProgress
content = content.replace(
    /await applyGlobalDiscount\(percent\);/,
    "await applyGlobalDiscount(percent, setProgress);"
);

// Replace handleRemoveAll to use onProgress
content = content.replace(
    /await applyGlobalDiscount\(null\);/,
    "await applyGlobalDiscount(null, setProgress);"
);

// Add progress bar JSX after the <form> 
const targetFormEnd = `</form>`;
const progressBarBlock = `</form>

                {(saving || removing) && (
                    <div className="mt-5 space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                            <span>جاري تحديث الأصناف...</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                                className="bg-red-600 h-1.5 rounded-full transition-all duration-300 ease-out" 
                                style={{ width: \`\${progress}%\` }}
                            ></div>
                        </div>
                    </div>
                )}`;

content = content.replace(targetFormEnd, progressBarBlock);
fs.writeFileSync(path, content);
console.log("Added progress bar to modal");
