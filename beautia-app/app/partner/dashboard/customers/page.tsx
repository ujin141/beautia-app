'use client';

import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, MessageCircle, Loader2, Eye, X, Phone, Mail } from 'lucide-react';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { getPartnerUser } from '../../../../lib/auth';
import { useRouter } from 'next/navigation';

interface Customer {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  profileImage?: string;
  visits: number;
  lastVisit: string;
  totalSpent: number;
  bookingCount: number;
}

export default function CustomersPage() {
  const { t, formatPrice, language } = useLanguage();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const partner = getPartnerUser();
        if (!partner) {
          setLoading(false);
          return;
        }

        const url = searchTerm 
          ? `/api/partner/customers?partnerId=${partner.id}&search=${encodeURIComponent(searchTerm)}`
          : `/api/partner/customers?partnerId=${partner.id}`;
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCustomers(data.data || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch customers', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, [searchTerm]);

  const handleCustomerAction = (action: string, customer: Customer) => {
    setShowActionMenu(null);
    switch (action) {
      case 'message':
        router.push(`/partner/dashboard/inbox?customerId=${customer.userId}`);
        break;
      case 'view':
        // 고객 상세 정보 모달 표시
        setSelectedCustomer(customer);
        break;
      case 'call':
        window.location.href = `tel:${customer.userPhone}`;
        break;
      default:
        break;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-[24px] font-bold">{t('partner_dashboard.customers_management')}</h2>
         <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('partner_dashboard.customers_search_placeholder')} 
              className="pl-10 pr-4 py-2 rounded-xl border border-line bg-white focus:outline-none focus:border-brand-lilac w-[300px]"
            />
         </div>
      </div>

      <div className="bg-white rounded-2xl border border-line overflow-hidden">
         <table className="w-full text-left">
            <thead className="bg-surface border-b border-line text-[13px] text-secondary font-bold uppercase">
               <tr>
                  <th className="px-6 py-4">{t('partner_dashboard.customers_name')}</th>
                  <th className="px-6 py-4">{t('partner_dashboard.customers_visits')}</th>
                  <th className="px-6 py-4">{t('partner_dashboard.customers_last_visit')}</th>
                  <th className="px-6 py-4">{t('partner_dashboard.customers_total_spent')}</th>
                  <th className="px-6 py-4">{t('partner_dashboard.customers_memo')}</th>
                  <th className="px-6 py-4 text-right">{t('partner_dashboard.reservation_manage')}</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-line">
               {loading ? (
                  <tr>
                     <td colSpan={6} className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-brand-lilac mx-auto" />
                     </td>
                  </tr>
               ) : customers.length === 0 ? (
                  <tr>
                     <td colSpan={6} className="text-center py-8 text-secondary">
                        {t('partner_dashboard.reservations_empty')}
                     </td>
                  </tr>
               ) : (
                  customers.map((customer) => (
                     <tr key={customer.userId} className="hover:bg-surface/50 transition-colors">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              {customer.profileImage ? (
                                <img 
                                  src={customer.profileImage} 
                                  alt={customer.userName}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-mint to-brand-lilac flex items-center justify-center text-white font-bold">
                                  {customer.userName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="font-bold">{customer.userName}</div>
                                <div className="text-[12px] text-secondary">{customer.userPhone || customer.userEmail}</div>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="px-2 py-1 bg-surface rounded font-medium">{customer.visits}</span>
                        </td>
                        <td className="px-6 py-4 text-secondary">{customer.lastVisit}</td>
                        <td className="px-6 py-4 font-bold">{formatPrice(customer.totalSpent)}</td>
                        <td className="px-6 py-4 text-[13px] text-secondary truncate max-w-[200px]">
                           {/* 메모는 추후 추가 가능 */}
                        </td>
                        <td className="px-6 py-4 text-right relative">
                           <button 
                             onClick={() => setShowActionMenu(showActionMenu === customer.userId ? null : customer.userId)}
                             className="p-2 hover:bg-surface rounded-full text-secondary relative"
                           >
                              <MoreVertical className="w-4 h-4" />
                           </button>
                           {showActionMenu === customer.userId && (
                              <div className="absolute right-0 top-full mt-2 bg-white border border-line rounded-xl shadow-lg z-10 min-w-[160px] overflow-hidden">
                                 <button 
                                    onClick={() => handleCustomerAction('view', customer)}
                                    className="w-full px-4 py-2 text-left text-[13px] hover:bg-surface flex items-center gap-2"
                                 >
                                    <Eye className="w-4 h-4" /> {t('partner_dashboard.customers_view_detail')}
                                 </button>
                                 <button 
                                    onClick={() => handleCustomerAction('message', customer)}
                                    className="w-full px-4 py-2 text-left text-[13px] hover:bg-surface flex items-center gap-2"
                                 >
                                    <MessageCircle className="w-4 h-4" /> {t('partner_dashboard.customers_send_message')}
                                 </button>
                                 <button 
                                    onClick={() => handleCustomerAction('call', customer)}
                                    className="w-full px-4 py-2 text-left text-[13px] hover:bg-surface flex items-center gap-2"
                                 >
                                    <Phone className="w-4 h-4" /> {t('partner_dashboard.customers_call')}
                                 </button>
                              </div>
                           )}
                        </td>
                     </tr>
                  ))
               )}
            </tbody>
         </table>
      </div>

      {/* 고객 상세 모달 */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelectedCustomer(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-[500px] w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[20px] font-bold">{t('partner_dashboard.customers_detail_title')}</h3>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="p-2 hover:bg-surface rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                {selectedCustomer.profileImage ? (
                  <img 
                    src={selectedCustomer.profileImage} 
                    alt={selectedCustomer.userName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-mint to-brand-lilac flex items-center justify-center text-white font-bold text-[24px]">
                    {selectedCustomer.userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-[20px] font-bold">{selectedCustomer.userName}</div>
                  {selectedCustomer.userEmail && (
                    <div className="text-[13px] text-secondary flex items-center gap-1 mt-1">
                      <Mail className="w-3 h-3" />
                      {selectedCustomer.userEmail}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[12px] text-secondary font-bold uppercase mb-1 block">{t('partner_dashboard.customers_contact')}</label>
                <div className="text-[16px] flex items-center gap-2">
                  {selectedCustomer.userPhone ? (
                    <>
                      <Phone className="w-4 h-4" />
                      {selectedCustomer.userPhone}
                    </>
                  ) : (
                    <span className="text-secondary">{t('partner_dashboard.customers_not_registered')}</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[12px] text-secondary font-bold uppercase mb-1 block">{t('partner_dashboard.customers_visits_label')}</label>
                <div className="text-[16px] font-bold">{selectedCustomer.visits}{language === 'ko' ? '회' : language === 'ja' ? '回' : language === 'zh' ? '次' : ''}</div>
              </div>

              <div>
                <label className="text-[12px] text-secondary font-bold uppercase mb-1 block">{t('partner_dashboard.customers_last_visit_label')}</label>
                <div className="text-[16px]">{selectedCustomer.lastVisit}</div>
              </div>

              <div>
                <label className="text-[12px] text-secondary font-bold uppercase mb-1 block">{t('partner_dashboard.customers_total_spent_label')}</label>
                <div className="text-[16px] font-bold">{formatPrice(selectedCustomer.totalSpent)}</div>
              </div>

              <div>
                <label className="text-[12px] text-secondary font-bold uppercase mb-1 block">{t('partner_dashboard.customers_booking_count_label')}</label>
                <div className="text-[16px] font-bold">{selectedCustomer.bookingCount || selectedCustomer.visits}{language === 'ko' ? '건' : language === 'ja' ? '件' : language === 'zh' ? '次' : ''}</div>
              </div>

              <div className="pt-4 border-t border-line flex gap-2">
                <button 
                  onClick={() => {
                    setSelectedCustomer(null);
                    router.push(`/partner/dashboard/inbox?customerId=${selectedCustomer.userId}`);
                  }}
                  className="flex-1 px-4 py-2 bg-brand-lilac text-white rounded-lg font-medium hover:bg-brand-lilac/90 transition-colors"
                >
                  {t('partner_dashboard.customers_send_message')}
                </button>
                <button 
                  onClick={() => {
                    setSelectedCustomer(null);
                    window.location.href = `tel:${selectedCustomer.userPhone}`;
                  }}
                  className="flex-1 px-4 py-2 bg-white border border-line rounded-lg font-medium hover:bg-surface transition-colors"
                >
                  {t('partner_dashboard.customers_call')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 외부 클릭 시 메뉴 닫기 */}
      {showActionMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowActionMenu(null)}
        />
      )}
    </div>
  );
}
