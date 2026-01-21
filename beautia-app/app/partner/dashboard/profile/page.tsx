'use client';

import React, { useState, useEffect } from 'react';
import { User, Save, Loader2, CheckCircle2, Mail, Phone, Calendar, Lock, Eye, EyeOff, Image, X, Upload, Trash2 } from 'lucide-react';
import { getPartnerUser } from '../../../../lib/auth';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState({
    id: '',
    email: '',
    name: '',
    phone: '',
    lastLoginAt: '',
    createdAt: '',
  });
  const [editData, setEditData] = useState({
    name: '',
    phone: '',
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
  const [shopImages, setShopImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImageIndex, setDeletingImageIndex] = useState<number | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    loadProfile();
    loadShopImages();
  }, []);

  const loadShopImages = async () => {
    try {
      const partner = getPartnerUser();
      if (!partner) return;

      const response = await fetch(`/api/partner/shop?partnerId=${partner.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setShopImages(data.data.imageUrls || []);
        }
      }
    } catch (error) {
      console.error('샵 이미지 로드 오류:', error);
    }
  };

  const handleImageUpload = async (file: File, type: 'thumbnail' | 'gallery' = 'gallery', index?: number) => {
    if (!file.type.startsWith('image/')) {
      setError(t('partner_dashboard.profile_shop_images_file_type_error'));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(t('partner_dashboard.profile_shop_images_file_size_error'));
      return;
    }

    setUploadingImage(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      if (index !== undefined) {
        formData.append('index', index.toString());
      }

      const response = await fetch('/api/partner/shop/images', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShopImages(data.data.imageUrls || []);
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        } else {
          setError(data.error || t('partner_dashboard.profile_shop_images_upload_failed'));
        }
      } else {
        const data = await response.json();
        setError(data.error || t('partner_dashboard.profile_shop_images_upload_failed'));
      }
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      setError(t('partner_dashboard.profile_shop_images_upload_failed'));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageDelete = async (index: number) => {
    if (!confirm(t('partner_dashboard.profile_shop_images_delete_confirm'))) return;

    setDeletingImageIndex(index);
    setError('');

    try {
      const response = await fetch(`/api/partner/shop/images?index=${index}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShopImages(data.data.imageUrls || []);
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        } else {
          setError(data.error || t('partner_dashboard.profile_shop_images_delete_failed'));
        }
      } else {
        const data = await response.json();
        setError(data.error || t('partner_dashboard.profile_shop_images_delete_failed'));
      }
    } catch (error) {
      console.error('이미지 삭제 오류:', error);
      setError(t('partner_dashboard.profile_shop_images_delete_failed'));
    } finally {
      setDeletingImageIndex(null);
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const partner = getPartnerUser();
      if (!partner) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/partner/profile?partnerId=${partner.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfile(data.data);
          setEditData({
            name: data.data.name,
            phone: data.data.phone || '',
          });
        } else {
          setError(data.error || '프로필을 불러오는데 실패했습니다.');
        }
      } else {
        const data = await response.json();
        setError(data.error || '프로필을 불러오는데 실패했습니다.');
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

      const partner = getPartnerUser();
      if (!partner) {
        setError('로그인이 필요합니다.');
        setSaving(false);
        return;
      }

      const response = await fetch('/api/partner/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partnerId: partner.id,
          name: editData.name.trim(),
          phone: editData.phone.trim() || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfile(data.data);
          setIsEditing(false);
          
          // localStorage 업데이트
          const updatedUser = {
            ...partner,
            name: data.data.name,
            phone: data.data.phone || '',
          };
          localStorage.setItem('partner_user', JSON.stringify(updatedUser));
          
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
      phone: profile.phone || '',
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
      const partner = getPartnerUser();
      if (!partner) {
        setPasswordError('로그인이 필요합니다.');
        setChangingPassword(false);
        return;
      }

      const response = await fetch('/api/partner/account/change-password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partnerId: partner.id,
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
            {t('partner_dashboard.profile_updated') || '프로필이 업데이트되었습니다.'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold mb-2 flex items-center gap-2">
            <User className="w-7 h-7 text-brand-lilac" />
            {t('partner_dashboard.profile_title') || '프로필 관리'}
          </h1>
          <p className="text-secondary text-[14px]">
            {t('partner_dashboard.profile_desc') || '프로필 정보를 관리하고 업데이트할 수 있습니다.'}
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-brand-lilac hover:text-primary transition-colors"
          >
            {t('common.edit') || '수정'}
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
            {t('partner_dashboard.profile_email') || '이메일'}
          </label>
          <input
            type="email"
            value={profile.email}
            disabled
            className="w-full p-3 bg-surface rounded-xl border border-line text-secondary cursor-not-allowed"
          />
          <p className="text-[12px] text-secondary mt-1">
            {t('partner_dashboard.profile_email_desc') || '이메일은 변경할 수 없습니다.'}
          </p>
        </div>

        {/* Name */}
        <div>
          <label className="block text-[13px] font-bold text-secondary mb-2">
            {t('partner_dashboard.profile_name') || '이름'} *
          </label>
          {isEditing ? (
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              placeholder={t('partner_dashboard.profile_name_placeholder') || '이름을 입력하세요'}
              className="w-full p-3 bg-surface rounded-xl border border-line focus:border-brand-lilac focus:bg-white transition-all outline-none"
            />
          ) : (
            <div className="w-full p-3 bg-surface rounded-xl border border-transparent">
              {profile.name || '-'}
            </div>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-[13px] font-bold text-secondary mb-2 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            {t('partner_dashboard.profile_phone') || '전화번호'}
          </label>
          {isEditing ? (
            <input
              type="tel"
              value={editData.phone}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
              placeholder={t('partner_dashboard.profile_phone_placeholder') || '010-1234-5678'}
              className="w-full p-3 bg-surface rounded-xl border border-line focus:border-brand-lilac focus:bg-white transition-all outline-none"
            />
          ) : (
            <div className="w-full p-3 bg-surface rounded-xl border border-transparent">
              {profile.phone || '-'}
            </div>
          )}
        </div>

        {/* Account Info (Read-only) */}
        <div className="pt-6 border-t border-line space-y-4">
          <div>
            <label className="block text-[13px] font-bold text-secondary mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {t('partner_dashboard.profile_last_login') || '마지막 로그인'}
            </label>
            <div className="w-full p-3 bg-surface rounded-xl border border-transparent text-secondary">
              {formatDate(profile.lastLoginAt)}
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-bold text-secondary mb-2">
              {t('partner_dashboard.profile_join_date') || '가입일'}
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
                  {t('common.saving') || '저장 중...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {t('common.save') || '저장'}
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-6 py-3 bg-surface text-secondary rounded-xl font-bold hover:bg-line transition-colors disabled:opacity-50"
            >
              {t('common.cancel') || '취소'}
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
              {t('partner_dashboard.change_password') || '비밀번호 변경'}
            </h2>
            <p className="text-secondary text-[14px]">
              {t('partner_dashboard.change_password_desc') || '계정 보안을 위해 정기적으로 비밀번호를 변경해주세요.'}
            </p>
          </div>
          {!isChangingPassword && (
            <button
              onClick={() => setIsChangingPassword(true)}
              className="px-6 py-3 bg-surface text-secondary rounded-xl font-bold hover:bg-line transition-colors"
            >
              {t('partner_dashboard.change_password_btn') || '비밀번호 변경'}
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
                {t('partner_dashboard.current_password') || '현재 비밀번호'} *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder={t('partner_dashboard.current_password_placeholder') || '현재 비밀번호를 입력하세요'}
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
                {t('partner_dashboard.new_password') || '새 비밀번호'} *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder={t('partner_dashboard.new_password_placeholder') || '새 비밀번호를 입력하세요 (최소 6자)'}
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
                {t('partner_dashboard.new_password_desc') || '최소 6자 이상 입력해주세요.'}
              </p>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-secondary mb-2">
                {t('partner_dashboard.confirm_password') || '새 비밀번호 확인'} *
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder={t('partner_dashboard.confirm_password_placeholder') || '새 비밀번호를 다시 입력하세요'}
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
                    {t('common.changing') || '변경 중...'}
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    {t('partner_dashboard.change_password_confirm') || '비밀번호 변경'}
                  </>
                )}
              </button>
              <button
                onClick={handleCancelPasswordChange}
                disabled={changingPassword}
                className="px-6 py-3 bg-surface text-secondary rounded-xl font-bold hover:bg-line transition-colors disabled:opacity-50"
              >
                {t('common.cancel') || '취소'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Shop Images Card */}
      <div className="bg-white p-8 rounded-2xl border border-line">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[20px] font-bold mb-2 flex items-center gap-2">
              <Image className="w-5 h-5 text-brand-lilac" />
              {t('partner_dashboard.profile_shop_images_title')}
            </h2>
            <p className="text-secondary text-[14px]">
              {t('partner_dashboard.profile_shop_images_desc')}
            </p>
          </div>
        </div>

        {/* 썸네일 (첫 번째 이미지) */}
        <div className="mb-6">
          <label className="block text-[13px] font-bold text-secondary mb-3">
            {t('partner_dashboard.profile_shop_images_thumbnail')}
          </label>
          <div className="relative">
            {shopImages.length > 0 ? (
              <div className="relative group">
                <img
                  src={shopImages[0]}
                  alt={t('partner_dashboard.profile_shop_images_thumbnail_alt')}
                  className="w-full h-64 object-cover rounded-xl border border-line"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                  <label className="px-4 py-2 bg-white text-primary rounded-lg font-medium cursor-pointer hover:bg-gray-100 transition-colors">
                    <Upload className="w-4 h-4 inline-block mr-1" />
                    {t('partner_dashboard.profile_shop_images_thumbnail_change')}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, 'thumbnail', 0);
                      }}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-line rounded-xl cursor-pointer hover:bg-surface transition-colors">
                <Upload className="w-12 h-12 text-secondary mb-2" />
                <span className="text-secondary font-medium">{t('partner_dashboard.profile_shop_images_thumbnail_upload')}</span>
                <span className="text-[12px] text-secondary mt-1">{t('partner_dashboard.profile_shop_images_format')}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, 'thumbnail');
                  }}
                  disabled={uploadingImage}
                />
              </label>
            )}
          </div>
        </div>

        {/* 갤러리 이미지 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-[13px] font-bold text-secondary">
              {t('partner_dashboard.profile_shop_images_gallery_count').replace('{count}', (shopImages.length > 1 ? shopImages.length - 1 : 0).toString())}
            </label>
            <label className="px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-medium cursor-pointer hover:bg-brand-lilac hover:text-primary transition-colors">
              <Upload className="w-4 h-4 inline-block mr-1" />
              {t('partner_dashboard.profile_shop_images_gallery_add')}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, 'gallery');
                }}
                disabled={uploadingImage}
              />
            </label>
          </div>
          {uploadingImage && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('partner_dashboard.profile_shop_images_uploading')}
            </div>
          )}
          {shopImages.length > 1 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {shopImages.slice(1).map((imageUrl, index) => (
                <div key={index + 1} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`${t('partner_dashboard.profile_shop_images_gallery')} ${index + 1}`}
                    className="w-full h-32 object-cover rounded-xl border border-line"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                    <button
                      onClick={() => handleImageDelete(index + 1)}
                      disabled={deletingImageIndex === index + 1}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {deletingImageIndex === index + 1 ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-secondary text-[14px]">
              {t('partner_dashboard.profile_shop_images_gallery_empty')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
