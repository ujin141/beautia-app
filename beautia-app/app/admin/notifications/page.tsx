'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Plus, Edit2, Trash2, X, Save, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  target: 'all' | 'partners' | 'users';
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
  link?: string;
}

export default function AdminNotificationsPage() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'error',
    target: 'all' as 'all' | 'partners' | 'users',
    isActive: true,
    expiresAt: '',
    link: '',
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // 어드민 토큰 가져오기
      const adminToken = localStorage.getItem('admin_token');
      if (!adminToken) {
        console.error('어드민 토큰이 없습니다.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/notifications', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.data || []);
        }
      } else if (response.status === 401) {
        alert('로그인이 필요합니다.');
        window.location.href = '/admin/login';
      }
    } catch (error) {
      console.error('알림 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    try {
      const url = editingId 
        ? `/api/admin/notifications/${editingId}`
        : '/api/admin/notifications';
      const method = editingId ? 'PUT' : 'POST';

      // 어드민 토큰 가져오기
      const adminToken = localStorage.getItem('admin_token');
      if (!adminToken) {
        alert('로그인이 필요합니다.');
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(editingId ? '알림이 수정되었습니다.' : '알림이 생성되었습니다.');
          setShowModal(false);
          setEditingId(null);
          setFormData({
            title: '',
            content: '',
            type: 'info',
            target: 'all',
            isActive: true,
            expiresAt: '',
            link: '',
          });
          fetchNotifications();
        } else {
          throw new Error(data.error || '저장에 실패했습니다.');
        }
      } else {
        const data = await response.json();
        throw new Error(data.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('알림 저장 오류:', error);
      alert(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) {
      alert('알림 ID가 없습니다.');
      return;
    }

    if (!confirm('이 알림을 삭제하시겠습니까?')) return;

    try {
      // 어드민 토큰 가져오기
      const adminToken = localStorage.getItem('admin_token');
      if (!adminToken) {
        alert('로그인이 필요합니다.');
        window.location.href = '/admin/login';
        return;
      }

      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('알림이 삭제되었습니다.');
        fetchNotifications();
      } else {
        throw new Error(data.error || '삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('알림 삭제 오류:', error);
      alert(error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다.');
    }
  };

  const handleEdit = (notification: Notification) => {
    setEditingId(notification.id);
    setFormData({
      title: notification.title,
      content: notification.content,
      type: notification.type,
      target: notification.target,
      isActive: notification.isActive,
      expiresAt: notification.expiresAt || '',
      link: notification.link || '',
    });
    setShowModal(true);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4" />;
      case 'warning': return <AlertCircle className="w-4 h-4" />;
      case 'error': return <X className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-700 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-[24px] font-bold">알림/공지 관리</h2>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              title: '',
              content: '',
              type: 'info',
              target: 'all',
              isActive: true,
              expiresAt: '',
              link: '',
            });
            setShowModal(true);
          }}
          className="px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-bold hover:bg-opacity-90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> 공지 생성
        </button>
      </div>

      {/* 알림 목록 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">로딩 중...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-500">등록된 알림이 없습니다.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div key={notification.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg border ${getTypeColor(notification.type)}`}>
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="font-bold text-[16px]">{notification.title}</div>
                      <span className={`px-2 py-1 rounded text-[11px] font-bold ${
                        notification.target === 'all' ? 'bg-gray-100 text-gray-700' :
                        notification.target === 'partners' ? 'bg-purple-100 text-purple-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {notification.target === 'all' ? '전체' : notification.target === 'partners' ? '파트너' : '사용자'}
                      </span>
                      {notification.isActive ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[11px] font-bold">활성</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-[11px] font-bold">비활성</span>
                      )}
                    </div>
                    <p className="text-[14px] text-gray-700 mb-2">{notification.content}</p>
                    <div className="text-[12px] text-gray-500">
                      생성일: {new Date(notification.createdAt).toLocaleDateString('ko-KR')}
                      {notification.expiresAt && ` · 만료일: ${new Date(notification.expiresAt).toLocaleDateString('ko-KR')}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(notification)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="수정"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 생성/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[18px] font-bold">{editingId ? '알림 수정' : '알림 생성'}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-2">제목 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="알림 제목을 입력하세요"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-2">내용 *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="알림 내용을 입력하세요"
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-2">타입</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                  >
                    <option value="info">정보</option>
                    <option value="success">성공</option>
                    <option value="warning">경고</option>
                    <option value="error">오류</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-2">대상</label>
                  <select
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">전체</option>
                    <option value="partners">파트너</option>
                    <option value="users">사용자</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-2">만료일 (선택)</label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="pt-4 flex gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-[13px] font-medium hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-bold hover:bg-opacity-90 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> 저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
