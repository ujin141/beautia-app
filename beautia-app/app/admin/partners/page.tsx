'use client';

import React, { useEffect, useState } from 'react';
import { Search, Filter, MoreHorizontal, Check, X, FileText, RefreshCw, Edit2, Save, Key, Settings, ShieldCheck, ShieldX, Trash2, Eye, Calendar, Star, DollarSign, Store, Users, TrendingUp } from 'lucide-react';

interface PartnerApplication {
  id: string;
  name: string;
  phone: string;
  email: string;
  shopName: string;
  address?: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  isVerified?: boolean;
}

export default function AdminPartnersPage() {
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PartnerApplication>>({});
  const [passwordChangeId, setPasswordChangeId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [partnerDetail, setPartnerDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: '',
    phone: '',
    email: '',
    shopName: '',
    address: '',
    category: '',
    autoApprove: true,
    autoCreateAccount: true,
  });
  const [registering, setRegistering] = useState(false);

  // 파트너 등록
  const handleRegisterPartner = async () => {
    if (!registerForm.name || !registerForm.phone || !registerForm.email || !registerForm.shopName || !registerForm.category) {
      alert('필수 필드를 모두 입력해주세요.');
      return;
    }

    setRegistering(true);
    try {
      // 인증 토큰 가져오기
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
      
      const response = await fetch('/api/admin/partner-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(registerForm),
      });
      
      // 401 응답 시 로그아웃 처리
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          window.location.replace('/admin/login');
        }
        return;
      }

      const data = await response.json();

      if (data.success) {
        if (data.accountCreated && data.tempPassword) {
          alert(`파트너가 등록되었습니다!\n\n파트너 계정이 생성되었습니다.\n임시 비밀번호: ${data.tempPassword}\n\n(이메일로 전송하는 기능은 추후 구현 예정)`);
        } else if (data.accountCreated) {
          alert('파트너가 등록되었습니다! 파트너 계정이 생성되었습니다.');
        } else {
          alert('파트너가 등록되었습니다.');
        }
        
        setShowRegisterModal(false);
        setRegisterForm({
          name: '',
          phone: '',
          email: '',
          shopName: '',
          address: '',
          category: '',
          autoApprove: true,
          autoCreateAccount: true,
        });
        await fetchApplications();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('파트너 등록 오류:', error);
      alert(error instanceof Error ? error.message : '파트너 등록 중 오류가 발생했습니다.');
    } finally {
      setRegistering(false);
    }
  };

  // 데이터 로드
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const url = statusFilter === 'all' 
        ? '/api/admin/partner-applications'
        : `/api/admin/partner-applications?status=${statusFilter}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setApplications(data.data || []);
      }
    } catch (error) {
      console.error('신청 목록 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 편집 모드 시작
  const startEdit = (app: PartnerApplication) => {
    setEditingId(app.id);
    setEditForm({
      name: app.name,
      phone: app.phone,
      email: app.email,
      shopName: app.shopName,
      address: app.address || '',
      category: app.category,
    });
  };

  // 편집 취소
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // 비밀번호 변경
  const changePassword = async (email: string) => {
    if (!newPassword || newPassword.length < 6) {
      alert('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (!confirm('비밀번호를 변경하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch('/api/partner/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        setPasswordChangeId(null);
        setNewPassword('');
        alert('비밀번호가 변경되었습니다.');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      alert('비밀번호 변경 중 오류가 발생했습니다.');
    }
  };

  // 파트너 정보 수정
  const updatePartner = async (id: string) => {
    try {
      const response = await fetch('/api/admin/partner-applications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...editForm }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchApplications(); // 목록 새로고침
        setEditingId(null);
        setEditForm({});
        alert('파트너 정보가 수정되었습니다.');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('파트너 정보 수정 오류:', error);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  // 검증된 파트너 설정
  const toggleVerified = async (email: string, currentVerified: boolean) => {
    if (!confirm(currentVerified ? '검증 상태를 해제하시겠습니까?' : '이 파트너를 검증된 파트너로 설정하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/partners/verify', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, isVerified: !currentVerified }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `서버 오류: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        await fetchApplications(); // 목록 새로고침
        setMenuOpenId(null);
        alert(currentVerified ? '검증이 해제되었습니다.' : '검증된 파트너로 설정되었습니다.');
      } else {
        console.error('검증 상태 변경 실패:', data);
        alert(data.error || '검증 상태 변경에 실패했습니다. 파트너 계정이 생성되지 않았을 수 있습니다.');
      }
    } catch (error) {
      console.error('검증 상태 변경 오류:', error);
      alert(error instanceof Error ? error.message : '검증 상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 파트너 상세보기
  const viewPartnerDetail = async (email: string) => {
    setLoadingDetail(true);
    setSelectedPartnerId(email);
    try {
      const response = await fetch(`/api/admin/partners/${email}`);
      const data = await response.json();

      if (data.success) {
        setPartnerDetail(data.data);
      } else {
        alert(data.error || '파트너 상세 정보를 불러올 수 없습니다.');
        setSelectedPartnerId(null);
      }
    } catch (error) {
      console.error('파트너 상세 조회 오류:', error);
      alert('파트너 상세 정보 조회 중 오류가 발생했습니다.');
      setSelectedPartnerId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  // 파트너 삭제
  const deletePartner = async (id: string, shopName: string) => {
    if (!confirm(`정말로 "${shopName}" 파트너를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 관련된 모든 데이터(계정, 매장 등)가 삭제됩니다.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/partner-applications?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `서버 오류: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        await fetchApplications(); // 목록 새로고침
        setMenuOpenId(null);
        alert('파트너가 삭제되었습니다.');
      } else {
        console.error('파트너 삭제 실패:', data);
        alert(data.error || '파트너 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('파트너 삭제 오류:', error);
      alert(error instanceof Error ? error.message : '파트너 삭제 중 오류가 발생했습니다.');
    }
  };

  // 상태 업데이트 (승인/반려)
  const updateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    if (!confirm(newStatus === 'approved' ? '이 신청을 승인하시겠습니까?' : '이 신청을 반려하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/partner-applications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchApplications(); // 목록 새로고침
        
        if (newStatus === 'approved') {
          if (data.accountCreated && data.tempPassword) {
            alert(`승인되었습니다!\n\n파트너 계정이 생성되었습니다.\n임시 비밀번호: ${data.tempPassword}\n\n(이메일로 전송하는 기능은 추후 구현 예정)`);
          } else if (data.accountCreated) {
            alert('승인되었습니다! 파트너 계정이 생성되었습니다.');
          } else {
            alert('승인되었습니다. (계정 생성 중 오류가 발생했을 수 있습니다.)');
          }
        } else {
          alert('반려되었습니다.');
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('상태 업데이트 오류:', error);
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\./g, '.').replace(/\s/g, '');
  };

  // 상태 라벨
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '심사중';
      case 'approved': return '승인됨';
      case 'rejected': return '반려됨';
      default: return status;
    }
  };

  // 검색 필터
  const filteredApplications = applications.filter(app => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      app.shopName.toLowerCase().includes(query) ||
      app.name.toLowerCase().includes(query) ||
      app.email.toLowerCase().includes(query) ||
      app.phone.includes(query)
    );
  });
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-[24px] font-bold">파트너 신청 관리</h2>
         <div className="flex gap-2">
            <button 
              onClick={fetchApplications}
              disabled={loading}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-[13px] font-medium hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
            >
               <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 새로고침
            </button>
            <button 
              onClick={() => setShowRegisterModal(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-bold hover:bg-opacity-90"
            >
               + 파트너 등록
            </button>
         </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
         <div className="p-4 border-b border-gray-200 flex gap-4">
            <div className="relative flex-1 max-w-[400px]">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input 
                 type="text" 
                 placeholder="매장명, 이름, 이메일, 전화번호 검색" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
               />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] focus:outline-none"
            >
               <option value="all">전체 상태</option>
               <option value="pending">심사중</option>
               <option value="approved">승인됨</option>
               <option value="rejected">반려됨</option>
            </select>
         </div>

         <table className="w-full text-left text-[13px]">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
               <tr>
                  <th className="px-6 py-3 w-[50px]"><input type="checkbox" /></th>
                  <th className="px-6 py-3">파트너 정보</th>
                  <th className="px-6 py-3">카테고리</th>
                  <th className="px-6 py-3">등록일</th>
                  <th className="px-6 py-3">상태</th>
                  <th className="px-6 py-3 text-right">관리</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {loading ? (
                  <tr>
                     <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        로딩 중...
                     </td>
                  </tr>
               ) : filteredApplications.length === 0 ? (
                  <tr>
                     <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        {searchQuery ? '검색 결과가 없습니다.' : '신청 내역이 없습니다.'}
                     </td>
                  </tr>
               ) : (
                  filteredApplications.map((app) => (
                     <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4"><input type="checkbox" /></td>
                        <td className="px-6 py-4">
                           {editingId === app.id ? (
                              <div className="space-y-2 min-w-[300px]">
                                 <input
                                    type="text"
                                    value={editForm.shopName || ''}
                                    onChange={(e) => setEditForm({...editForm, shopName: e.target.value})}
                                    placeholder="매장명"
                                    className="w-full px-3 py-1.5 text-[13px] border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                 />
                                 <input
                                    type="text"
                                    value={editForm.name || ''}
                                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                    placeholder="이름"
                                    className="w-full px-3 py-1.5 text-[12px] border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                 />
                                 <input
                                    type="text"
                                    value={editForm.phone || ''}
                                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                                    placeholder="전화번호"
                                    className="w-full px-3 py-1.5 text-[12px] border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                 />
                                 <input
                                    type="email"
                                    value={editForm.email || ''}
                                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                    placeholder="이메일"
                                    className="w-full px-3 py-1.5 text-[11px] border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                 />
                                 <input
                                    type="text"
                                    value={editForm.address || ''}
                                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                                    placeholder="주소"
                                    className="w-full px-3 py-1.5 text-[11px] border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                 />
                              </div>
                           ) : (
                              <>
                                 <div className="font-bold text-[14px]">{app.shopName}</div>
                                 <div className="text-[12px] text-gray-400">{app.name} · {app.phone}</div>
                                 <div className="text-[11px] text-gray-400 mt-1">{app.email}</div>
                                 {app.address && <div className="text-[11px] text-gray-400">{app.address}</div>}
                              </>
                           )}
                        </td>
                        <td className="px-6 py-4">
                           {editingId === app.id ? (
                              <input
                                 type="text"
                                 value={editForm.category || ''}
                                 onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                                 placeholder="카테고리"
                                 className="w-full px-3 py-1.5 text-[13px] border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                              />
                           ) : (
                              app.category
                           )}
                        </td>
                        <td className="px-6 py-4 text-gray-500">{formatDate(app.submittedAt)}</td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col gap-1 items-start">
                              <span className={`px-2 py-1 rounded text-[11px] font-bold inline-block ${
                                 app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                 app.status === 'approved' ? 'bg-green-100 text-green-700' :
                                 'bg-red-100 text-red-700'
                              }`}>
                                 {getStatusLabel(app.status)}
                              </span>
                              {app.status === 'approved' && app.isVerified && (
                                 <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 flex items-center gap-1 w-fit">
                                    <ShieldCheck className="w-3 h-3" /> 검증됨
                                 </span>
                              )}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           {editingId === app.id ? (
                              <div className="flex justify-end gap-2">
                                 <button 
                                    onClick={() => updatePartner(app.id)}
                                    className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100" 
                                    title="저장"
                                 >
                                    <Save className="w-4 h-4" />
                                 </button>
                                 <button 
                                    onClick={cancelEdit}
                                    className="p-1.5 bg-gray-50 text-gray-600 rounded hover:bg-gray-100" 
                                    title="취소"
                                 >
                                    <X className="w-4 h-4" />
                                 </button>
                              </div>
                           ) : app.status === 'pending' ? (
                              <div className="flex justify-end gap-2">
                                 <button 
                                    onClick={() => startEdit(app)}
                                    className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100" 
                                    title="수정"
                                 >
                                    <Edit2 className="w-4 h-4" />
                                 </button>
                                 <button 
                                    onClick={() => updateStatus(app.id, 'approved')}
                                    className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100" 
                                    title="승인"
                                 >
                                    <Check className="w-4 h-4" />
                                 </button>
                                 <button 
                                    onClick={() => updateStatus(app.id, 'rejected')}
                                    className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100" 
                                    title="반려"
                                 >
                                    <X className="w-4 h-4" />
                                 </button>
                              </div>
                           ) : (
                              <div className="flex justify-end gap-2">
                                 {app.status === 'approved' && (
                                    <button 
                                       onClick={() => setPasswordChangeId(app.id)}
                                       className="p-1.5 bg-purple-50 text-purple-600 rounded hover:bg-purple-100" 
                                       title="비밀번호 변경"
                                    >
                                       <Key className="w-4 h-4" />
                                    </button>
                                 )}
                                 <button 
                                    onClick={() => startEdit(app)}
                                    className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100" 
                                    title="수정"
                                 >
                                    <Edit2 className="w-4 h-4" />
                                 </button>
                                 <div className="relative">
                                    <button 
                                       onClick={() => setMenuOpenId(menuOpenId === app.id ? null : app.id)}
                                       className="p-1.5 hover:bg-gray-100 rounded text-gray-500 relative"
                                    >
                                       <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                    {menuOpenId === app.id && (
                                       <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[180px]">
                                          <button
                                             onClick={() => {
                                                viewPartnerDetail(app.email);
                                                setMenuOpenId(null);
                                             }}
                                             className="w-full px-4 py-2 text-left text-[13px] hover:bg-gray-50 flex items-center gap-2"
                                          >
                                             <Eye className="w-4 h-4 text-blue-600" />
                                             상세보기
                                          </button>
                                          {app.status === 'approved' && (
                                             <button
                                                onClick={() => toggleVerified(app.email, app.isVerified || false)}
                                                className="w-full px-4 py-2 text-left text-[13px] hover:bg-gray-50 flex items-center gap-2"
                                             >
                                                {app.isVerified ? (
                                                   <>
                                                      <ShieldX className="w-4 h-4 text-gray-600" />
                                                      검증 해제
                                                   </>
                                                ) : (
                                                   <>
                                                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                                                      검증된 파트너로 설정
                                                   </>
                                                )}
                                             </button>
                                          )}
                                          <button
                                             onClick={() => deletePartner(app.id, app.shopName)}
                                             className="w-full px-4 py-2 text-left text-[13px] hover:bg-red-50 flex items-center gap-2 text-red-600"
                                          >
                                             <Trash2 className="w-4 h-4" />
                                             삭제
                                          </button>
                                       </div>
                                    )}
                                 </div>
                              </div>
                           )}
                        </td>
                     </tr>
                  ))
               )}
            </tbody>
         </table>
         
         {/* 메뉴 외부 클릭 시 닫기 */}
         {menuOpenId && (
            <div 
               className="fixed inset-0 z-5" 
               onClick={() => setMenuOpenId(null)}
            />
         )}
         
         {!loading && filteredApplications.length > 0 && (
            <div className="p-4 border-t border-gray-200 text-center text-[12px] text-gray-500">
               총 {filteredApplications.length}건
            </div>
         )}
      </div>

      {/* 파트너 등록 모달 */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-[18px] font-bold mb-4">파트너 등록</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  placeholder="파트너 이름"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">
                  전화번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  placeholder="010-1234-5678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  placeholder="partner@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">
                  매장명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={registerForm.shopName}
                  onChange={(e) => setRegisterForm({ ...registerForm, shopName: e.target.value })}
                  placeholder="매장명"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">
                  카테고리 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={registerForm.category}
                  onChange={(e) => setRegisterForm({ ...registerForm, category: e.target.value })}
                  placeholder="예: Hair, Nail, Skin 등"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">
                  주소
                </label>
                <input
                  type="text"
                  value={registerForm.address}
                  onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                  placeholder="매장 주소 (선택사항)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={registerForm.autoApprove}
                    onChange={(e) => setRegisterForm({ ...registerForm, autoApprove: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-[13px] text-gray-700">자동 승인</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={registerForm.autoCreateAccount}
                    onChange={(e) => setRegisterForm({ ...registerForm, autoCreateAccount: e.target.checked })}
                    disabled={!registerForm.autoApprove}
                    className="w-4 h-4 disabled:opacity-50"
                  />
                  <span className="text-[13px] text-gray-700">자동 계정 생성 (승인 시)</span>
                </label>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <button
                  onClick={() => {
                    setShowRegisterModal(false);
                    setRegisterForm({
                      name: '',
                      phone: '',
                      email: '',
                      shopName: '',
                      address: '',
                      category: '',
                      autoApprove: true,
                      autoCreateAccount: true,
                    });
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-[13px] font-medium hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  onClick={handleRegisterPartner}
                  disabled={registering}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-bold hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registering ? '등록 중...' : '등록'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 비밀번호 변경 모달 */}
      {passwordChangeId && (() => {
        const app = applications.find(a => a.id === passwordChangeId);
        if (!app) return null;
        
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-[18px] font-bold mb-4">비밀번호 변경</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-2">
                    파트너: {app.shopName} ({app.email})
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="새 비밀번호 (최소 6자)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                  <p className="text-[11px] text-gray-500 mt-1">비밀번호는 최소 6자 이상이어야 합니다.</p>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setPasswordChangeId(null);
                      setNewPassword('');
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-[13px] font-medium hover:bg-gray-200"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => changePassword(app.email)}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-bold hover:bg-opacity-90"
                  >
                    변경
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 파트너 상세보기 모달 */}
      {selectedPartnerId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPartnerId(null)}>
          <div 
            className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {loadingDetail ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 text-[14px]">파트너 정보를 불러오는 중...</p>
              </div>
            ) : partnerDetail ? (
              <div className="p-6">
                {/* 헤더 */}
                <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-200">
                  <div>
                    <h3 className="text-[20px] font-bold mb-2">{partnerDetail.partner.name}</h3>
                    <div className="flex items-center gap-3 text-[13px] text-gray-500">
                      <span>{partnerDetail.partner.email}</span>
                      {partnerDetail.partner.isVerified && (
                        <span className="px-2 py-1 rounded text-[11px] font-bold bg-blue-100 text-blue-700 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> 검증됨
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPartnerId(null);
                      setPartnerDetail(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* 통계 카드 */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-[12px] text-gray-600 font-medium">총 예약</span>
                    </div>
                    <div className="text-[20px] font-bold text-blue-900">{partnerDetail.stats.totalBookings}건</div>
                    <div className="text-[11px] text-gray-500 mt-1">이번 달: {partnerDetail.stats.thisMonthBookings}건</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-[12px] text-gray-600 font-medium">총 매출</span>
                    </div>
                    <div className="text-[20px] font-bold text-green-900">{partnerDetail.stats.totalSales.toLocaleString()}원</div>
                    <div className="text-[11px] text-gray-500 mt-1">이번 달: {partnerDetail.stats.thisMonthSales.toLocaleString()}원</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-yellow-600" />
                      <span className="text-[12px] text-gray-600 font-medium">평균 평점</span>
                    </div>
                    <div className="text-[20px] font-bold text-yellow-900">{partnerDetail.stats.avgRating}</div>
                    <div className="text-[11px] text-gray-500 mt-1">리뷰 {partnerDetail.stats.totalReviews}개</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Store className="w-4 h-4 text-purple-600" />
                      <span className="text-[12px] text-gray-600 font-medium">매장 수</span>
                    </div>
                    <div className="text-[20px] font-bold text-purple-900">{partnerDetail.shops.length}개</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* 기본 정보 */}
                  <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                    <h4 className="font-bold text-[14px] mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4" /> 기본 정보
                    </h4>
                    <div className="space-y-3 text-[13px]">
                      <div>
                        <span className="text-gray-500 block mb-1">이름</span>
                        <span className="font-medium">{partnerDetail.partner.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1">이메일</span>
                        <span className="font-medium">{partnerDetail.partner.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1">전화번호</span>
                        <span className="font-medium">{partnerDetail.partner.phone || '-'}</span>
                      </div>
                      {partnerDetail.application && (
                        <>
                          <div>
                            <span className="text-gray-500 block mb-1">매장명</span>
                            <span className="font-medium">{partnerDetail.application.shopName}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block mb-1">카테고리</span>
                            <span className="font-medium">{partnerDetail.application.category}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block mb-1">주소</span>
                            <span className="font-medium">{partnerDetail.application.address || '-'}</span>
                          </div>
                        </>
                      )}
                      <div>
                        <span className="text-gray-500 block mb-1">가입일</span>
                        <span className="font-medium">{new Date(partnerDetail.partner.createdAt).toLocaleDateString('ko-KR')}</span>
                      </div>
                      {partnerDetail.partner.lastLoginAt && (
                        <div>
                          <span className="text-gray-500 block mb-1">마지막 로그인</span>
                          <span className="font-medium">{new Date(partnerDetail.partner.lastLoginAt).toLocaleDateString('ko-KR')}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500 block mb-1">Stripe Connect 상태</span>
                        <span className={`px-2 py-1 rounded text-[11px] font-bold ${
                          partnerDetail.partner.stripeConnectAccountStatus === 'enabled' ? 'bg-green-100 text-green-700' :
                          partnerDetail.partner.stripeConnectAccountStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {partnerDetail.partner.stripeConnectAccountStatus === 'enabled' ? '연결됨' :
                           partnerDetail.partner.stripeConnectAccountStatus === 'pending' ? '대기중' :
                           '연결 안됨'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1">마케팅 포인트</span>
                        <span className="font-medium">{partnerDetail.partner.marketingPoints?.toLocaleString() || 0}P</span>
                      </div>
                    </div>
                  </div>

                  {/* 매장 목록 */}
                  <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                    <h4 className="font-bold text-[14px] mb-4 flex items-center gap-2">
                      <Store className="w-4 h-4" /> 매장 목록
                    </h4>
                    {partnerDetail.shops.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-[13px]">매장이 없습니다.</div>
                    ) : (
                      <div className="space-y-3">
                        {partnerDetail.shops.map((shop: any) => (
                          <div key={shop.id} className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="font-medium text-[13px] mb-1">{shop.name}</div>
                            <div className="flex items-center gap-4 text-[11px] text-gray-500">
                              <span>{shop.category}</span>
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                {shop.rating}
                              </span>
                              <span>리뷰 {shop.reviewCount}개</span>
                            </div>
                            {shop.address && (
                              <div className="text-[11px] text-gray-400 mt-1">{shop.address}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 최근 예약 */}
                <div className="mt-6 bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <h4 className="font-bold text-[14px] mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> 최근 예약 (최대 10개)
                  </h4>
                  {partnerDetail.recentBookings.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-[13px]">예약이 없습니다.</div>
                  ) : (
                    <div className="space-y-2">
                      {partnerDetail.recentBookings.map((booking: any) => (
                        <div key={booking.id} className="bg-white rounded-lg p-3 border border-gray-200 flex justify-between items-center">
                          <div className="flex-1">
                            <div className="font-medium text-[13px] mb-1">{booking.userName} · {booking.shopName}</div>
                            <div className="text-[12px] text-gray-500">{booking.serviceName} · {booking.date} {booking.time}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-[13px] mb-1">{booking.price.toLocaleString()}원</div>
                            <div className="flex gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                                booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {booking.status === 'completed' ? '완료' :
                                 booking.status === 'confirmed' ? '확정' :
                                 booking.status === 'pending' ? '대기' : '취소'}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {booking.paymentStatus === 'paid' ? '결제완료' : '미결제'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 최근 리뷰 */}
                <div className="mt-6 bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <h4 className="font-bold text-[14px] mb-4 flex items-center gap-2">
                    <Star className="w-4 h-4" /> 최근 리뷰 (최대 10개)
                  </h4>
                  {partnerDetail.recentReviews.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-[13px]">리뷰가 없습니다.</div>
                  ) : (
                    <div className="space-y-3">
                      {partnerDetail.recentReviews.map((review: any) => (
                        <div key={review.id} className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[13px]">{review.userName}</span>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3 h-3 ${
                                      star <= review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-[11px] text-gray-400">
                                {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                              </span>
                            </div>
                          </div>
                          <p className="text-[13px] text-gray-700 mb-2">{review.content}</p>
                          {review.reply && (
                            <div className="bg-blue-50 rounded-lg p-2 mt-2 border-l-4 border-blue-400">
                              <div className="text-[11px] text-blue-700 font-medium mb-1">사장님 답글</div>
                              <div className="text-[12px] text-blue-900">{review.reply}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-gray-500 text-[14px]">파트너 정보를 불러올 수 없습니다.</p>
                <button
                  onClick={() => setSelectedPartnerId(null)}
                  className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-[13px] font-medium hover:bg-gray-200"
                >
                  닫기
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
