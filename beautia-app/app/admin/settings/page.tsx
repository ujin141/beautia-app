'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Plus, Lock, X } from 'lucide-react';

export default function AdminSettingsPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [ipRestriction, setIpRestriction] = useState(true);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminFormData, setAdminFormData] = useState({
    name: '',
    email: '',
    role: 'admin',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMaintenanceMode(data.data.maintenanceMode || false);
          setIpRestriction(data.data.ipRestriction !== false);
        }
      }
    } catch (error) {
      console.error('설정 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMaintenanceModeToggle = async () => {
    const newValue = !maintenanceMode;
    setMaintenanceMode(newValue);
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenanceMode: newValue }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(`점검 모드가 ${newValue ? '활성화' : '비활성화'}되었습니다.`);
        } else {
          throw new Error(data.error || '설정 변경에 실패했습니다.');
        }
      } else {
        throw new Error('설정 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('설정 변경 오류:', error);
      setMaintenanceMode(!newValue); // 롤백
      alert(error instanceof Error ? error.message : '설정 변경에 실패했습니다.');
    }
  };

  const handleIpRestrictionToggle = async () => {
    const newValue = !ipRestriction;
    setIpRestriction(newValue);
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipRestriction: newValue }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(`IP 보안 접속 제한이 ${newValue ? '활성화' : '비활성화'}되었습니다.`);
        } else {
          throw new Error(data.error || '설정 변경에 실패했습니다.');
        }
      } else {
        throw new Error('설정 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('설정 변경 오류:', error);
      setIpRestriction(!newValue); // 롤백
      alert(error instanceof Error ? error.message : '설정 변경에 실패했습니다.');
    }
  };

  const handleAddAdmin = async () => {
    if (!adminFormData.name || !adminFormData.email) {
      alert('이름과 이메일을 입력해주세요.');
      return;
    }

    try {
      // 관리자 추가 API (추후 구현)
      alert('관리자 계정이 추가되었습니다. (실제로는 API 호출 필요)');
      setShowAddAdminModal(false);
      setAdminFormData({
        name: '',
        email: '',
        role: 'admin',
      });
    } catch (error) {
      console.error('관리자 추가 오류:', error);
      alert('관리자 추가에 실패했습니다.');
    }
  };

  return (
    <div className="max-w-[800px] space-y-8">
      <div className="flex justify-between items-center">
         <h2 className="text-[24px] font-bold">설정 및 권한</h2>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
         <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-[16px]">관리자 계정 (Admin Accounts)</h3>
            <button 
              onClick={() => setShowAddAdminModal(true)}
              className="text-[13px] font-bold text-blue-500 flex items-center gap-1 hover:underline"
            >
               <Plus className="w-4 h-4" /> 계정 추가
            </button>
         </div>
         
         <div className="space-y-4">
            {[
               { name: 'Kim Woojin', email: 'ceo@beautia.com', role: 'Super Admin', last: 'Now' },
               { name: 'Sarah Lee', email: 'sarah@beautia.com', role: 'Operation Manager', last: '2h ago' },
               { name: 'David Park', email: 'david@beautia.com', role: 'Finance', last: '1d ago' },
            ].map((admin, i) => (
               <div key={i} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <Shield className="w-5 h-5 text-gray-400" />
                     </div>
                     <div>
                        <div className="font-bold text-[14px]">{admin.name}</div>
                        <div className="text-[12px] text-gray-500">{admin.email}</div>
                     </div>
                  </div>
                  <div className="text-right">
                     <span className={`inline-block px-2 py-1 rounded text-[11px] font-bold mb-1 ${
                        admin.role === 'Super Admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                     }`}>
                        {admin.role}
                     </span>
                     <div className="text-[11px] text-gray-400">Last login: {admin.last}</div>
                  </div>
               </div>
            ))}
         </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
         <h3 className="font-bold text-[16px] mb-6">시스템 설정</h3>
         <div className="space-y-4">
            <div className="flex items-center justify-between p-3">
               <div>
                  <div className="font-medium text-[14px]">점검 모드 (Maintenance Mode)</div>
                  <div className="text-[12px] text-gray-500">활성화 시 사용자 접속이 제한됩니다.</div>
               </div>
               <button
                 onClick={handleMaintenanceModeToggle}
                 disabled={loading}
                 className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors disabled:opacity-50 ${
                   maintenanceMode ? 'bg-gray-900' : 'bg-gray-200'
                 }`}
               >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                     maintenanceMode ? 'right-0.5' : 'left-0.5'
                  }`} />
               </button>
            </div>
            <div className="flex items-center justify-between p-3 border-t border-gray-100">
               <div>
                  <div className="font-medium text-[14px]">IP 보안 접속 제한</div>
                  <div className="text-[12px] text-gray-500">허용된 IP에서만 어드민 접속 가능</div>
               </div>
               <button
                 onClick={handleIpRestrictionToggle}
                 disabled={loading}
                 className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors disabled:opacity-50 ${
                   ipRestriction ? 'bg-green-500' : 'bg-gray-200'
                 }`}
               >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                     ipRestriction ? 'right-0.5' : 'left-0.5'
                  }`} />
               </button>
            </div>
         </div>
      </div>

      {/* 관리자 계정 추가 모달 */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddAdminModal(false)}>
          <div className="bg-white rounded-xl p-8 max-w-[500px] w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[20px] font-bold">관리자 계정 추가</h3>
              <button 
                onClick={() => setShowAddAdminModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-2">이름</label>
                <input 
                  type="text"
                  value={adminFormData.name}
                  onChange={(e) => setAdminFormData({ ...adminFormData, name: e.target.value })}
                  placeholder="관리자 이름"
                  className="w-full p-3 bg-gray-50 rounded-xl border-transparent outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-2">이메일</label>
                <input 
                  type="email"
                  value={adminFormData.email}
                  onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                  placeholder="admin@beautia.com"
                  className="w-full p-3 bg-gray-50 rounded-xl border-transparent outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-2">역할</label>
                <select 
                  value={adminFormData.role}
                  onChange={(e) => setAdminFormData({ ...adminFormData, role: e.target.value })}
                  className="w-full p-3 bg-gray-50 rounded-xl border-transparent outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="admin">Admin</option>
                  <option value="super">Super Admin</option>
                  <option value="operation">Operation Manager</option>
                  <option value="finance">Finance</option>
                </select>
              </div>

              <div className="pt-4 flex gap-2">
                <button 
                  onClick={() => {
                    setShowAddAdminModal(false);
                    setAdminFormData({
                      name: '',
                      email: '',
                      role: 'admin',
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button 
                  onClick={handleAddAdmin}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  추가하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
