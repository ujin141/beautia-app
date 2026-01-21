'use client';

import React, { useState, useEffect } from 'react';
import { User, Save, Loader2, CheckCircle2, Mail, Phone, Calendar, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { getAdminUser, isAdminLoggedIn } from '../../../lib/auth';
import { useLanguage } from '../../../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminAccountPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState({
    id: '',
    email: '',
    name: '',
    role: '',
    lastLoginAt: '',
    createdAt: '',
  });
  const [editData, setEditData] = useState({
    name: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (!isAdminLoggedIn()) {
      window.location.href = '/admin/login';
      return;
    }
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const admin = getAdminUser();
      if (!admin) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      // 기본 정보는 localStorage에서 가져오고, 서버에서 최신 정보 가져오기
      setProfile({
        id: admin.id || admin._id || '',
        email: admin.email || '',
        name: admin.name || '',
        role: admin.role || '',
        lastLoginAt: admin.lastLoginAt || '',
        createdAt: admin.createdAt || '',
      });
      setEditData({
        name: admin.name || '',
      });

      // 서버에서 최신 정보 가져오기
      try {
        const response = await fetch(`/api/admin/profile?adminId=${admin.id || admin._id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setProfile(data.data);
            setEditData({
              name: data.data.name || '',
            });
          }
        }
      } catch (err) {
        console.error('서버 프로필 로드 오류:', err);
        // 서버 오류는 무시하고 localStorage 정보 사용
      }
    } catch (error) {
      console.error('프로필 로드 오류:', error);
      setError('프로필을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      if (!editData.name.trim()) {
        setError('이름을 입력해주세요.');
        setSaving(false);
        return;
      }

      const admin = getAdminUser();
      if (!admin) {
        setError('로그인이 필요합니다.');
        setSaving(false);
        return;
      }

      const response = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId: admin.id || admin._id,
          name: editData.name.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfile(data.data);
          setIsEditing(false);
          
          // localStorage 업데이트
          const updatedUser = {
            ...admin,
            name: data.data.name,
          };
          localStorage.setItem('admin_user', JSON.stringify(updatedUser));
          
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        } else {
          setError(data.error || '프로필 업데이트에 실패했습니다.');
        }
      } else {
        const data = await response.json();
        setError(data.error || '프로필 업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('프로필 저장 오류:', error);
      setError('프로필 업데이트에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      name: profile.name,
    });
    setIsEditing(false);
    setError('');
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('모든 필드를 입력해주세요.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('새 비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError('새 비밀번호는 현재 비밀번호와 달라야 합니다.');
      return;
    }

    setChangingPassword(true);
    try {
      const admin = getAdminUser();
      if (!admin) {
        setPasswordError('로그인이 필요합니다.');
        setChangingPassword(false);
        return;
      }

      const response = await fetch('/api/admin/account/change-password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId: admin.id || admin._id,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setIsChangingPassword(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setPasswordError(data.error || '비밀번호 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      setPasswordError('비밀번호 변경에 실패했습니다.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setIsChangingPassword(false);
    setPasswordError('');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      super_admin: '최고 관리자',
      admin: '관리자',
      moderator: '모더레이터',
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-gray-900 rounded-full shadow-xl flex items-center gap-2 font-bold text-white"
          >
            <CheckCircle2 className="w-5 h-5 text-brand-mint" />
            변경사항이 저장되었습니다.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold mb-2 flex items-center gap-2">
            <User className="w-7 h-7 text-brand-lilac" />
            계정 관리
          </h1>
          <p className="text-secondary text-[14px]">
            계정 정보를 관리하고 비밀번호를 변경할 수 있습니다.
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-brand-lilac hover:text-primary transition-colors"
          >
            수정
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[14px]">
          {error}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white p-8 rounded-2xl border border-line space-y-6">
        {/* Email (Read-only) */}
        <div className="pb-6 border-b border-line">
          <label className="block text-[13px] font-bold text-secondary mb-2 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            이메일
          </label>
          <input
            type="email"
            value={profile.email}
            disabled
            className="w-full p-3 bg-surface rounded-xl border border-line text-secondary cursor-not-allowed"
          />
          <p className="text-[12px] text-secondary mt-1">
            이메일은 변경할 수 없습니다.
          </p>
        </div>

        {/* Role */}
        <div>
          <label className="block text-[13px] font-bold text-secondary mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            역할
          </label>
          <div className="w-full p-3 bg-surface rounded-xl border border-transparent">
            <span className="px-3 py-1 bg-brand-lilac/10 text-brand-lilac rounded-lg text-[13px] font-bold">
              {getRoleLabel(profile.role)}
            </span>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-[13px] font-bold text-secondary mb-2">
            이름 *
          </label>
          {isEditing ? (
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              placeholder="이름을 입력하세요"
              className="w-full p-3 bg-surface rounded-xl border border-line focus:border-brand-lilac focus:bg-white transition-all outline-none"
            />
          ) : (
            <div className="w-full p-3 bg-surface rounded-xl border border-transparent">
              {profile.name || '-'}
            </div>
          )}
        </div>

        {/* Account Info (Read-only) */}
        <div className="pt-6 border-t border-line space-y-4">
          <div>
            <label className="block text-[13px] font-bold text-secondary mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              마지막 로그인
            </label>
            <div className="w-full p-3 bg-surface rounded-xl border border-transparent text-secondary">
              {formatDate(profile.lastLoginAt)}
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-bold text-secondary mb-2">
              가입일
            </label>
            <div className="w-full p-3 bg-surface rounded-xl border border-transparent text-secondary">
              {formatDate(profile.createdAt)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-3 pt-4 border-t border-line">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-brand-lilac hover:text-primary transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  저장
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-6 py-3 bg-surface text-secondary rounded-xl font-bold hover:bg-line transition-colors disabled:opacity-50"
            >
              취소
            </button>
          </div>
        )}
      </div>

      {/* Password Change Card */}
      <div className="bg-white p-8 rounded-2xl border border-line">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[20px] font-bold mb-2 flex items-center gap-2">
              <Lock className="w-5 h-5 text-brand-lilac" />
              비밀번호 변경
            </h2>
            <p className="text-secondary text-[14px]">
              계정 보안을 위해 정기적으로 비밀번호를 변경해주세요.
            </p>
          </div>
          {!isChangingPassword && (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="px-6 py-3 bg-surface text-secondary rounded-xl font-bold hover:bg-line transition-colors"
            >
              비밀번호 변경
            </button>
          )}
        </div>

        {passwordError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[14px]">
            {passwordError}
          </div>
        )}

        {isChangingPassword && (
          <div className="space-y-4">
            <div>
              <label className="block text-[13px] font-bold text-secondary mb-2">
                현재 비밀번호 *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="현재 비밀번호를 입력하세요"
                  className="w-full p-3 pr-12 bg-surface rounded-xl border border-line focus:border-brand-lilac focus:bg-white transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
                >
                  {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-secondary mb-2">
                새 비밀번호 *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="새 비밀번호를 입력하세요 (최소 6자)"
                  className="w-full p-3 pr-12 bg-surface rounded-xl border border-line focus:border-brand-lilac focus:bg-white transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
                >
                  {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-[12px] text-secondary mt-1">
                최소 6자 이상 입력해주세요.
              </p>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-secondary mb-2">
                새 비밀번호 확인 *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="새 비밀번호를 다시 입력하세요"
                  className="w-full p-3 pr-12 bg-surface rounded-xl border border-line focus:border-brand-lilac focus:bg-white transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-primary"
                >
                  {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-line">
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-brand-lilac hover:text-primary transition-colors disabled:opacity-50"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    변경 중...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    비밀번호 변경
                  </>
                )}
              </button>
              <button
                onClick={handleCancelPasswordChange}
                disabled={changingPassword}
                className="px-6 py-3 bg-surface text-secondary rounded-xl font-bold hover:bg-line transition-colors disabled:opacity-50"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
