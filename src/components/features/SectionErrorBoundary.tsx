import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class SectionErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('🚨 Error caught by SectionErrorBoundary:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="w-full bg-red-950/20 border border-red-500/20 rounded-2xl p-6 text-center text-white" dir="rtl">
                    <div className="w-12 h-12 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-2">
                        تعذر تحميل هذا القسم
                    </h3>
                    <p className="text-xs text-neutral-400 mb-4">
                        حدث خطأ غير متوقع أثناء عرض هذا القسم. يرجى المحاولة مرة أخرى.
                    </p>
                    <button
                        type="button"
                        onClick={this.handleReset}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-md shadow-red-600/30"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>إعادة المحاولة</span>
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
