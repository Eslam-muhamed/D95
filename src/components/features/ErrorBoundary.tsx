import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen w-full bg-[#0a0809] text-white flex items-center justify-center p-4 font-body" dir="rtl">
                    <div className="max-w-md w-full bg-[#140f12] border border-white/10 rounded-3xl p-6 sm:p-8 text-center shadow-2xl backdrop-blur-xl">
                        <div className="w-16 h-16 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center mx-auto mb-5 shadow-[0_0_25px_rgba(220,38,38,0.3)]">
                            <AlertTriangle className="w-8 h-8" />
                        </div>

                        <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="font-bebas text-3xl font-black tracking-wider leading-none">
                                <span className="text-white">D</span><span className="text-red-600">95</span>
                            </span>
                            <span className="text-xs bg-red-950/80 text-red-400 font-bold px-2.5 py-0.5 rounded-full border border-red-500/30">
                                SYSTEM NOTICE
                            </span>
                        </div>

                        <h2 className="text-lg font-bold text-white mb-2">
                            عذراً، حدث خطأ غير متوقع في النظام
                        </h2>
                        <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
                            تم تسجيل المشكلة تلقائياً لمنع تعطل باقي الخدمات. يمكنك تحديث الصفحة أو العودة للصفحة الرئيسية للمتابعة.
                        </p>

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
