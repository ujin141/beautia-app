'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, Ban, RotateCcw, Loader2 } from 'lucide-react';
import { AdminApi } from '../../../lib/api';
import { User } from '../../../types';

interface UserWithStats extends User {
  bookingCount: number;
  lastBookingDate: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      try {
        let url = '/api/admin/users';
        const params = new URLSearchParams();
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (searchQuery) params.append('search', searchQuery);
        if (params.toString()) url += '?' + params.toString();

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUsers(data.data || []);
          }
        }
      } catch (error) {
        console.error('사용자 목록 로드 오류:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [statusFilter, searchQuery]);

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'banned') => {
    if (!confirm(newStatus === 'banned' ? '이 사용자를 이용 정지시키시겠습니까?' : '이용 정지를 해제하시겠습니까?')) {
      return;
    }

    setProcessingId(userId);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // 목록 새로고침
          const refreshResponse = await fetch('/api/admin/users');
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            if (refreshData.success) {
              setUsers(refreshData.data || []);
            }
          }
          alert('상태가 변경되었습니다.');
        }
      }
    } catch (error) {
      console.error('상태 변경 오류:', error);
      alert('상태 변경에 실패했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return dateString.replace(/-/g, '.');
  };

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      (u as any).phone?.includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-[24px] font-bold">사용자 관리</h2>
         <div className="flex gap-2">
            <button 
              onClick={() => {
                // 필터 모달 (추후 구현)
                alert('필터 기능은 곧 제공될 예정입니다.');
              }}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-[13px] font-medium hover:bg-gray-50 flex items-center gap-2"
            >
               <Filter className="w-4 h-4" /> 필터
            </button>
         </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
         <div className="p-4 border-b border-gray-200 flex gap-4 bg-gray-50">
            <div className="relative flex-1 max-w-[300px]">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="이름, 이메일, 전화번호" 
                 className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
               />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px]"
            >
               <option value="all">전체 상태</option>
               <option value="active">정상</option>
               <option value="banned">이용 정지</option>
               <option value="withdrawal">탈퇴</option>
            </select>
         </div>

         <table className="w-full text-left text-[13px]">
            <thead className="bg-gray-50 text-gray-500 font-medium">
               <tr>
                  <th className="px-6 py-3">사용자 정보</th>
                  <th className="px-6 py-3">가입일</th>
                  <th className="px-6 py-3">최근 접속</th>
                  <th className="px-6 py-3">예약 횟수</th>
                  <th className="px-6 py-3">상태</th>
                  <th className="px-6 py-3 text-right">관리</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {loading ? (
                  <tr>
                     <td colSpan={6} className="px-6 py-12 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                     </td>
                  </tr>
               ) : filteredUsers.length === 0 ? (
                  <tr>
                     <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        {searchQuery ? '검색 결과가 없습니다.' : '사용자가 없습니다.'}
                     </td>
                  </tr>
               ) : (
                  filteredUsers.map((user) => (
                     <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                           <div className="font-bold">{user.name}</div>
                           <div className="text-[12px] text-gray-400">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{formatDate(user.joinDate)}</td>
                        <td className="px-6 py-4 text-gray-500">{(user as any).lastLoginAt ? formatDate((user as any).lastLoginAt) : '-'}</td>
                        <td className="px-6 py-4">{user.bookingCount || 0}회</td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded text-[11px] font-bold ${
                              user.status === 'active' ? 'bg-green-100 text-green-700' : 
                              user.status === 'banned' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-600'
                           }`}>
                              {user.status === 'active' ? '정상' : user.status === 'banned' ? '이용 정지' : '탈퇴'}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           {processingId === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-gray-400 inline-block" />
                           ) : user.status === 'active' ? (
                              <button 
                                 onClick={() => handleStatusChange(user.id, 'banned')}
                                 className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100" 
                                 title="이용 정지"
                              >
                                 <Ban className="w-4 h-4" />
                              </button>
                           ) : user.status === 'banned' ? (
                              <button 
                                 onClick={() => handleStatusChange(user.id, 'active')}
                                 className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100" 
                                 title="정지 해제"
                              >
                                 <RotateCcw className="w-4 h-4" />
                              </button>
                           ) : null}
                        </td>
                     </tr>
                  ))
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
}
