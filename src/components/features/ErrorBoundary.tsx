import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Copy, Check, ChevronDown, ChevronUp, Terminal } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    showDetails: boolean;
    copied: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
        showDetails: false,
        copied: false,
    };

    public static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('🚨 Uncaught error caught by ErrorBoundary:', error, errorInfo);
        this.setState({ errorInfo });

        // If it's a stale chunk error after a new deployment, auto-reload once cleanly
        const message = error?.message || '';
        if (
            message.includes('Failed to fetch dynamically imported module') ||
            message.includes('Importing a module script failed') ||
            message.includes('dynamically imported module')
        ) {
            const hasReloaded = sessionStorage.getItem('d95_chunk_reload_attempted');
            if (!hasReloaded) {
                sessionStorage.setItem('d95_chunk_reload_attempted', 'true');
                window.location.reload();
            }
        }
    }

    private handleReset = () => {
        sessionStorage.removeItem('d95_chunk_reload_attempted');
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    private handleCopyError = () => {
        const errText = `D95 Error Report:
Message: ${this.state.error?.message || 'Unknown Error'}
Stack: ${this.state.error?.stack || 'No stack available'}
ComponentStack: ${this.state.errorInfo?.componentStack || 'No component stack'}`;
        navigator.clipboard.writeText(errText).then(() => {
            this.setState({ copied: true });
            setTimeout(() => this.setState({ copied: false }), 3000);
        }).catch(() => {
            // Ignore clipboard errors
        });
    };

    public render() {
        if (this.state.hasError) {
            const errorMessage = this.state.error?.message || 'خطأ غير محدد';

            return (
                <div className="min-h-screen w-full bg-[#0a0809] text-white flex items-center justify-center p-4 font-body" dir="rtl">
                    <div className="max-w-lg w-full bg-[#140f12] border border-white/10 rounded-3xl p-6 sm:p-8 text-center shadow-2xl backdrop-blur-xl">
                        <div className="w-16 h-16 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center mx-auto mb-5 shadow-[0_0_25px_rgba(220,38,38,0.3)]">
                            <AlertTriangle className="w-8 h-8" />
                        </div>

                        <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="font-bebas text-3xl text-red-500 font-black tracking-wider">D95</span>
                            <span className="text-xs bg-red-950/80 text-red-400 font-bold px-2.5 py-0.5 rounded-full border border-red-500/30">
                                SYSTEM NOTICE
                            </span>
                        </div>

                        <h2 className="text-lg font-bold text-white mb-2">
                            عذراً، حدث خطأ غير متوقع في النظام
                        </h2>
                        <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
                            تم تسجيل المشكلة تلقائياً لمنع تعطل باقي الخدمات. يمكنك نسخ تفاصيل الخطأ وإرسالها أو إعادة تحميل الصفحة.
                        </p>

                        {/* Error Summary Box */}
                        <div className="bg-red-950/40 border border-red-800/40 rounded-xl p-3 text-right mb-4">
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-[11px] font-mono text-red-300 font-bold flex items-center gap-1.5">
                                    <Terminal className="w-3.5 h-3.5 text-red-400" />
                                    <span>نص الخطأ (Error Message):</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={this.handleCopyError}
                                    className="text-[11px] flex items-center gap-1 text-neutral-300 hover:text-white bg-white/10 hover:bg-white/15 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                                >
                                    {this.state.copied ? (
                                        <>
                                            <Check className="w-3 h-3 text-emerald-400" />
                                            <span className="text-emerald-400 font-bold">تم النسخ!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3 h-3" />
                                            <span>نسخ الخطأ</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            <p className="font-mono text-xs text-red-200 break-all select-all dir-ltr text-left bg-black/40 p-2 rounded-lg">
                                {errorMessage}
                            </p>
                        </div>

                        {/* Expandable Technical Details */}
                        <div className="mb-6 text-right">
                            <button
                                type="button"
                                onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                                className="text-[11px] text-neutral-400 hover:text-neutral-200 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                                {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                <span>{this.state.showDetails ? 'إخفاء التفاصيل الفنية الكاملة' : 'عرض التفاصيل الفنية والـ Stack Trace'}</span>
                            </button>

                            {this.state.showDetails && (
                                <div className="mt-2 p-3 bg-black/70 border border-neutral-800 rounded-xl text-left dir-ltr max-h-48 overflow-y-auto font-mono text-[10px] text-neutral-400 select-all space-y-2">
                                    <div>
                                        <p className="text-red-400 font-bold">Stack:</p>
                                        <pre className="whitespace-pre-wrap">{this.state.error?.stack || 'No stack'}</pre>
                                    </div>
                                    {this.state.errorInfo?.componentStack && (
                                        <div>
                                            <p className="text-amber-400 font-bold">Component Stack:</p>
                                            <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <button
                                type="button"
                                onClick={this.handleReset}
                                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-red-600/30 active:scale-95"
                            >
                                <RefreshCw className="w-4 h-4" />
                                <span>إعادة تحميل الصفحة</span>
                            </button>
                            <a
                                href="/"
                                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/10 active:scale-95"
                            >
                                <Home className="w-4 h-4" />
                                <span>الصفحة الرئيسية</span>
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
