import re

with open("src/pages/CustomerDashboardPage.tsx", "r") as f:
    content = f.read()

# 1. Remove Tabs UI and just keep renderHistory
tabs_section = """                                <div className="flex bg-[var(--c-card)] p-1 rounded-xl border border-[var(--c-border)]">
                                    <button 
                                        onClick={() => setActiveTab('history')}
                                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'history' ? 'bg-[var(--bg-main)] text-[var(--text-1)] shadow-sm border border-[var(--c-border)]' : 'text-[var(--text-3)] hover:text-[var(--text-2)]'}`}
                                    >
                                        <History size={16} />
                                        سجل النقاط
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('orders')}
                                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'orders' ? 'bg-[var(--bg-main)] text-[var(--text-1)] shadow-sm border border-[var(--c-border)]' : 'text-[var(--text-3)] hover:text-[var(--text-2)]'}`}
                                    >
                                        <ShoppingBag size={16} />
                                        الكافيه
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('bookings')}
                                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeTab === 'bookings' ? 'bg-[var(--bg-main)] text-[var(--text-1)] shadow-sm border border-[var(--c-border)]' : 'text-[var(--text-3)] hover:text-[var(--text-2)]'}`}
                                    >
                                        <Gamepad2 size={16} />
                                        الغرف
                                    </button>
                                </div>
                                
                                <div className="min-h-[300px]">
                                    {activeTab === 'history' 
                                        ? renderHistory(authHistory, fetchingAuthData) 
                                        : activeTab === 'orders' 
                                        ? renderOrders(authOrders, fetchingAuthData)
                                        : renderBookings(authBookings, fetchingAuthData)
                                    }
                                </div>"""

history_only = """                                <div className="pt-2">
                                    <h3 className="font-bold text-sm text-[var(--text-1)] mb-3 flex items-center gap-2">
                                        <History className="w-4 h-4 text-[var(--text-3)]" />
                                        سجل النقاط
                                    </h3>
                                    {renderHistory(authHistory, fetchingAuthData)}
                                </div>"""

content = content.replace(tabs_section, history_only)

with open("src/pages/CustomerDashboardPage.tsx", "w") as f:
    f.write(content)
