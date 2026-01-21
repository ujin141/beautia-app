'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Plus, Image as ImageIcon, Trash2, Mail, Filter, X, Upload, Loader2 } from 'lucide-react';

interface ContactMessage {
  id: string;
  type: string;
  email: string;
  message: string;
  status: 'open' | 'resolved' | 'archived';
  createdAt: string;
}

export default function AdminContentsPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved' | 'archived'>('all');
  const [error, setError] = useState('');
  const [banners, setBanners] = useState<any[]>([]);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [bannerFormData, setBannerFormData] = useState({
    title: '',
    imageUrl: '',
    linkUrl: '',
    position: 'main_hero',
    startDate: '',
    endDate: '',
    order: 0,
    isActive: true,
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cities, setCities] = useState<any[]>([]);
  const [editingCity, setEditingCity] = useState<any | null>(null);
  const [showCityModal, setShowCityModal] = useState(false);
  const [cityImagePreview, setCityImagePreview] = useState<string | null>(null);
  const cityFileInputRef = useRef<HTMLInputElement>(null);
  const [showBannerModalForCity, setShowBannerModalForCity] = useState<string | null>(null);
  const [cityBanners, setCityBanners] = useState<any[]>([]);
  const [showRecommendedShopsModal, setShowRecommendedShopsModal] = useState<string | null>(null);
  const [recommendedShops, setRecommendedShops] = useState<any[]>([]);
  const [allShops, setAllShops] = useState<any[]>([]);

  const fetchMessages = async () => {
    setLoading(true);
    setError('');
    try {
      const url =
        statusFilter === 'all'
          ? '/api/admin/contact-messages'
          : `/api/admin/contact-messages?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '문의 목록을 불러오지 못했습니다.');
      }
      setMessages(data.data || []);
    } catch (err) {
      console.error('문의 목록 로드 오류:', err);
      setError(
        err instanceof Error
          ? err.message
          : '문의 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: ContactMessage['status']) => {
    try {
      const res = await fetch('/api/admin/contact-messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '상태 변경에 실패했습니다.');
      }
      await fetchMessages();
    } catch (err) {
      console.error('문의 상태 변경 오류:', err);
      alert('상태 변경에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/admin/contents');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBanners(data.data || []);
        }
      }
    } catch (error) {
      console.error('배너 목록 로드 오류:', error);
    }
  };

  const getCityDefaultImage = (cityId: string) => {
    const defaultImages: { [key: string]: string } = {
      seoul: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=400&h=400&fit=crop',
      tokyo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=400&fit=crop',
      bangkok: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=400&fit=crop',
      singapore: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&h=400&fit=crop',
    };
    return defaultImages[cityId.toLowerCase()] || '';
  };

  const fetchCities = async () => {
    try {
      const response = await fetch('/api/admin/cities');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // 기본 이미지가 없으면 키워드에 맞는 기본 이미지 설정
          const citiesWithDefaults = data.data.map((city: any) => ({
            ...city,
            imageUrl: city.imageUrl || getCityDefaultImage(city.id),
          }));
          setCities(citiesWithDefaults);
        }
      }
    } catch (error) {
      console.error('도시 목록 로드 오류:', error);
      // 오류 시 기본값 사용 (기본 이미지 포함)
      setCities([
        { id: 'seoul', name: 'SEOUL', imageUrl: getCityDefaultImage('seoul'), isActive: true },
        { id: 'tokyo', name: 'TOKYO', imageUrl: getCityDefaultImage('tokyo'), isActive: true },
        { id: 'bangkok', name: 'BANGKOK', imageUrl: getCityDefaultImage('bangkok'), isActive: true },
        { id: 'singapore', name: 'SINGAPORE', imageUrl: getCityDefaultImage('singapore'), isActive: true },
      ]);
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchBanners();
    fetchCities();
  }, [statusFilter]);

  useEffect(() => {
    // 이미지 프리뷰 설정
    if (bannerFormData.imageUrl) {
      setImagePreview(bannerFormData.imageUrl);
    } else {
      setImagePreview(null);
    }
  }, [bannerFormData.imageUrl]);

  const handleSaveBanner = async () => {
    if (!bannerFormData.title) {
      alert('배너 제목을 입력해주세요.');
      return;
    }

    try {
      const url = editingBanner 
        ? `/api/admin/contents/${editingBanner.id}`
        : '/api/admin/contents';
      const method = editingBanner ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bannerFormData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(editingBanner ? '배너가 수정되었습니다.' : '배너가 생성되었습니다.');
          setShowBannerModal(false);
          setEditingBanner(null);
          setImagePreview(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          setBannerFormData({
            title: '',
            imageUrl: '',
            linkUrl: '',
            position: 'main_hero',
            startDate: '',
            endDate: '',
            order: 0,
            isActive: true,
          });
          fetchBanners();
        } else {
          throw new Error(data.error || '저장에 실패했습니다.');
        }
      } else {
        const data = await response.json();
        throw new Error(data.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('배너 저장 오류:', error);
      alert(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if (!bannerId) {
      alert('배너 ID가 없습니다.');
      return;
    }

    if (!confirm('이 배너를 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/contents/${bannerId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('배너가 삭제되었습니다.');
        fetchBanners();
      } else {
        throw new Error(data.error || '삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('배너 삭제 오류:', error);
      alert(error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다.');
    }
  };

  const handleEditBanner = (banner: any) => {
    setEditingBanner(banner);
    setBannerFormData({
      title: banner.title,
      imageUrl: banner.imageUrl || '',
      linkUrl: banner.linkUrl || '',
      position: banner.position || 'main_hero',
      startDate: banner.startDate ? banner.startDate.split('T')[0] : '',
      endDate: banner.endDate ? banner.endDate.split('T')[0] : '',
      order: banner.order || 0,
      isActive: banner.isActive !== false,
    });
    setShowBannerModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setBannerFormData({ ...bannerFormData, imageUrl: data.url });
          alert('이미지가 업로드되었습니다.');
        } else {
          throw new Error(data.error || '업로드에 실패했습니다.');
        }
      } else {
        const data = await response.json();
        throw new Error(data.error || '업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      alert(error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCityImageUpload = async (cityId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // 도시 이미지 업데이트
          await handleUpdateCity(cityId, { imageUrl: data.url });
        } else {
          throw new Error(data.error || '업로드에 실패했습니다.');
        }
      } else {
        const data = await response.json();
        throw new Error(data.error || '업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('도시 이미지 업로드 오류:', error);
      alert(error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.');
    }
  };

  const handleUpdateCity = async (cityId: string, updateData: { name?: string; imageUrl?: string; isActive?: boolean }) => {
    try {
      const response = await fetch('/api/admin/cities', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityId, ...updateData }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          fetchCities();
          if (showCityModal && editingCity?.id === cityId) {
            setEditingCity(data.data);
            if (updateData.imageUrl) {
              setCityImagePreview(updateData.imageUrl);
            }
          }
        } else {
          throw new Error(data.error || '업데이트에 실패했습니다.');
        }
      } else {
        const data = await response.json();
        throw new Error(data.error || '업데이트에 실패했습니다.');
      }
    } catch (error) {
      console.error('도시 정보 업데이트 오류:', error);
      alert(error instanceof Error ? error.message : '업데이트에 실패했습니다.');
    }
  };

  const handleEditCity = (city: any) => {
    setEditingCity(city);
    setCityImagePreview(city.imageUrl || null);
    setShowCityModal(true);
  };

  const handleManageCityBanners = async (cityId: string) => {
    setShowBannerModalForCity(cityId);
    try {
      const response = await fetch(`/api/admin/cities/banners?cityId=${cityId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCityBanners(data.data || []);
        }
      }
    } catch (error) {
      console.error('도시 배너 로드 오류:', error);
      setCityBanners([]);
    }
  };

  const handleManageRecommendedShops = async (cityId: string) => {
    setShowRecommendedShopsModal(cityId);
    try {
      // 추천 샵 조회
      const recommendedResponse = await fetch(`/api/admin/cities/recommended-shops?cityId=${cityId}&recommended=true`);
      if (recommendedResponse.ok) {
        const recommendedData = await recommendedResponse.json();
        if (recommendedData.success) {
          setRecommendedShops(recommendedData.data || []);
        }
      }

      // 모든 샵 조회 (해당 도시)
      const allShopsResponse = await fetch(`/api/admin/cities/recommended-shops?cityId=${cityId}`);
      if (allShopsResponse.ok) {
        const allShopsData = await allShopsResponse.json();
        if (allShopsData.success) {
          setAllShops(allShopsData.data || []);
        }
      }
    } catch (error) {
      console.error('추천 샵 로드 오류:', error);
      setRecommendedShops([]);
      setAllShops([]);
    }
  };

  const handleToggleShopRecommendation = async (shopId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/cities/recommended-shops', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          isRecommended: !currentStatus,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // 목록 새로고침
          if (showRecommendedShopsModal) {
            handleManageRecommendedShops(showRecommendedShopsModal);
          }
        } else {
          throw new Error(data.error || '설정 변경에 실패했습니다.');
        }
      } else {
        const data = await response.json();
        throw new Error(data.error || '설정 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('추천 샵 설정 변경 오류:', error);
      alert(error instanceof Error ? error.message : '설정 변경에 실패했습니다.');
    }
  };

  const handleCreateCityBanner = () => {
    if (!showBannerModalForCity) return;
    
    setEditingBanner(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setBannerFormData({
      title: '',
      imageUrl: '',
      linkUrl: showBannerModalForCity,
      position: 'city',
      startDate: '',
      endDate: '',
      order: 0,
      isActive: true,
    });
    setShowBannerModal(true);
  };

  const handleToggleBannerActive = async (bannerId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/contents/${bannerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          fetchBanners();
        } else {
          throw new Error(data.error || '상태 변경에 실패했습니다.');
        }
      } else {
        const data = await response.json();
        throw new Error(data.error || '상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('배너 상태 변경 오류:', error);
      alert(error instanceof Error ? error.message : '상태 변경에 실패했습니다.');
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString('ko-KR', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusLabel = (s: ContactMessage['status']) => {
    if (s === 'open') return '열림';
    if (s === 'resolved') return '답변 완료';
    return '보관됨';
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
         <h2 className="text-[24px] font-bold">콘텐츠 및 문의 관리</h2>
         <button 
           onClick={() => {
             setEditingBanner(null);
             setImagePreview(null);
             if (fileInputRef.current) fileInputRef.current.value = '';
             setBannerFormData({
               title: '',
               imageUrl: '',
               linkUrl: '',
               position: 'main_hero',
               startDate: '',
               endDate: '',
               order: 0,
               isActive: true,
             });
             setShowBannerModal(true);
           }}
           className="px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-bold hover:bg-opacity-90 flex items-center gap-2"
         >
            <Plus className="w-4 h-4" /> 새 배너 등록
         </button>
      </div>

      {/* 기존 배너 관리 섹션 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
         <h3 className="font-bold text-[16px] mb-6">메인 홈 배너 (Main Hero)</h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {banners.filter(b => b.position === 'main_hero').length === 0 ? (
               <div className="col-span-3 text-center py-8 text-gray-500 text-[13px]">
                  등록된 배너가 없습니다.
               </div>
            ) : (
               banners.filter(b => b.position === 'main_hero').map((banner) => {
                  const period = banner.startDate && banner.endDate
                     ? `${new Date(banner.startDate).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })} ~ ${new Date(banner.endDate).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}`
                     : '상시';
                  
                  return (
                     <div key={banner.id} className="border border-gray-200 rounded-xl overflow-hidden group">
                        <div className="aspect-[2/1] bg-gray-100 flex items-center justify-center relative">
                           {banner.imageUrl ? (
                              <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                           ) : (
                              <ImageIcon className="w-8 h-8 text-gray-300" />
                           )}
                           <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditBanner(banner);
                                }}
                                className="px-3 py-1 bg-white text-black rounded text-[12px] font-bold"
                              >
                                 수정
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteBanner(banner.id);
                                }}
                                className="p-1.5 bg-red-500 text-white rounded"
                              >
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                        <div className="p-4">
                           <div className="flex justify-between items-start mb-2">
                              <div className="font-bold text-[14px]">{banner.title}</div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleBannerActive(banner.id, banner.isActive);
                                }}
                                className={`text-[11px] px-2 py-0.5 rounded font-bold transition-colors ${
                                  banner.isActive 
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {banner.isActive ? '게시중' : '비활성'}
                              </button>
                           </div>
                           <div className="text-[12px] text-gray-500 mb-2">{period}</div>
                           {banner.linkUrl && (
                              <div className="text-[11px] text-blue-500 truncate">
                                링크: {banner.linkUrl}
                              </div>
                           )}
                        </div>
                     </div>
                  );
               })
            )}
         </div>
      </div>

      {/* 카테고리 상단 배너 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
         <h3 className="font-bold text-[16px] mb-6">카테고리 상단 배너</h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {banners.filter(b => b.position === 'category_top').length === 0 ? (
               <div className="col-span-3 text-center py-8 text-gray-500 text-[13px]">
                  등록된 배너가 없습니다.
               </div>
            ) : (
               banners.filter(b => b.position === 'category_top').map((banner) => {
                  const period = banner.startDate && banner.endDate
                     ? `${new Date(banner.startDate).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })} ~ ${new Date(banner.endDate).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}`
                     : '상시';
                  
                  return (
                     <div key={banner.id} className="border border-gray-200 rounded-xl overflow-hidden group">
                        <div className="aspect-[2/1] bg-gray-100 flex items-center justify-center relative">
                           {banner.imageUrl ? (
                              <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                           ) : (
                              <ImageIcon className="w-8 h-8 text-gray-300" />
                           )}
                           <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditBanner(banner);
                                }}
                                className="px-3 py-1 bg-white text-black rounded text-[12px] font-bold"
                              >
                                 수정
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteBanner(banner.id);
                                }}
                                className="p-1.5 bg-red-500 text-white rounded"
                              >
                                 <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                        <div className="p-4">
                           <div className="flex justify-between items-start mb-2">
                              <div className="font-bold text-[14px]">{banner.title}</div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleBannerActive(banner.id, banner.isActive);
                                }}
                                className={`text-[11px] px-2 py-0.5 rounded font-bold transition-colors ${
                                  banner.isActive 
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {banner.isActive ? '게시중' : '비활성'}
                              </button>
                           </div>
                           <div className="text-[12px] text-gray-500 mb-2">{period}</div>
                           {banner.linkUrl && (
                              <div className="text-[11px] text-blue-500 truncate">
                                링크: {banner.linkUrl}
                              </div>
                           )}
                        </div>
                     </div>
                  );
               })
            )}
         </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
         <h3 className="font-bold text-[16px] mb-6">도시(City) 관리</h3>
         <div className="space-y-2">
            {cities.map((city) => (
               <div key={city.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 group">
                  <div className="flex items-center gap-4">
                     <div className="relative">
                        <img 
                          src={city.imageUrl || getCityDefaultImage(city.id)} 
                          alt={city.name} 
                          className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                          onError={(e) => {
                            // 이미지 로드 실패 시 기본 아이콘 표시
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            if (target.nextElementSibling) {
                              (target.nextElementSibling as HTMLElement).style.display = 'flex';
                            }
                          }}
                        />
                        <div className="w-16 h-16 bg-gray-200 rounded-lg items-center justify-center border border-gray-200 hidden">
                           <ImageIcon className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                           <label className="cursor-pointer p-2 bg-white rounded text-[11px] font-bold hover:bg-gray-100">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleCityImageUpload(city.id, e)}
                                className="hidden"
                              />
                              <Upload className="w-4 h-4" />
                           </label>
                        </div>
                     </div>
                     <div>
                        <span className="font-bold text-[14px] block">{city.name}</span>
                        <span className={`text-[11px] ${city.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                           {city.isActive ? '활성' : '비활성'}
                        </span>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <button 
                       onClick={() => handleEditCity(city)}
                       className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[12px] font-medium hover:bg-blue-100"
                     >
                        수정
                     </button>
                     <button 
                       onClick={() => {
                         // 도시 배너 관리
                         const cityBanners = banners.filter(b => b.position === 'city' && b.linkUrl?.includes(city.id));
                         alert(`${city.name} 도시 관련 배너 ${cityBanners.length}개 (추후 상세 관리 기능 추가 예정)`);
                       }}
                       className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-[12px] font-medium hover:bg-gray-100"
                     >
                        배너 관리
                     </button>
                     <button 
                       onClick={() => {
                         // 추천 샵 관리
                         alert(`${city.name} 추천 샵 관리 기능은 곧 제공될 예정입니다.`);
                       }}
                       className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-[12px] font-medium hover:bg-gray-100"
                     >
                        추천 샵
                     </button>
                     <button 
                       onClick={() => {
                         if (confirm(`${city.name}를 ${city.isActive ? '숨기' : '표시'}시겠습니까?`)) {
                           handleUpdateCity(city.id, { isActive: !city.isActive });
                         }
                       }}
                       className={`px-3 py-1.5 rounded-lg text-[12px] font-medium ${
                         city.isActive 
                           ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                           : 'bg-green-50 text-green-600 hover:bg-green-100'
                       }`}
                     >
                        {city.isActive ? '숨김' : '표시'}
                     </button>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* 도시 수정 모달 */}
      {showCityModal && editingCity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => {
          setShowCityModal(false);
          setEditingCity(null);
          setCityImagePreview(null);
        }}>
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[18px] font-bold">도시 수정: {editingCity.name}</h3>
              <button
                onClick={() => {
                  setShowCityModal(false);
                  setEditingCity(null);
                  setCityImagePreview(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {/* 이미지 프리뷰 */}
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-2">도시 이미지</label>
                {cityImagePreview && (
                  <div className="mb-3 relative">
                    <img 
                      src={cityImagePreview} 
                      alt="도시 미리보기" 
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateCity(editingCity.id, { imageUrl: '' });
                        setCityImagePreview(null);
                        if (cityFileInputRef.current) cityFileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* 파일 업로드 버튼 */}
                <div className="space-y-2">
                  <input
                    ref={cityFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCityImageUpload(editingCity.id, e)}
                    className="hidden"
                    id="city-image-upload"
                  />
                  <label
                    htmlFor="city-image-upload"
                    className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors bg-gray-50 border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                  >
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-[13px] text-gray-600">
                      {cityImagePreview ? '이미지 변경' : '이미지 업로드'}
                    </span>
                  </label>
                  
                  {/* URL 직접 입력 */}
                  <input
                    type="url"
                    value={cityImagePreview || ''}
                    onChange={(e) => {
                      const url = e.target.value;
                      setCityImagePreview(url);
                      if (url) {
                        handleUpdateCity(editingCity.id, { imageUrl: url });
                      }
                    }}
                    placeholder="또는 이미지 URL을 직접 입력하세요"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* 도시 이름 */}
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-2">도시 이름</label>
                <input
                  type="text"
                  value={editingCity.name}
                  onChange={(e) => {
                    const updatedCity = { ...editingCity, name: e.target.value };
                    setEditingCity(updatedCity);
                    handleUpdateCity(editingCity.id, { name: e.target.value });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 활성화 상태 */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCity.isActive}
                    onChange={(e) => {
                      const updatedCity = { ...editingCity, isActive: e.target.checked };
                      setEditingCity(updatedCity);
                      handleUpdateCity(editingCity.id, { isActive: e.target.checked });
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-[13px] font-bold text-gray-700">활성화</span>
                </label>
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  onClick={() => {
                    setShowCityModal(false);
                    setEditingCity(null);
                    setCityImagePreview(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-[13px] font-medium hover:bg-gray-200"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 문의 리스트 섹션 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-[16px]">1:1 문의 내역</h3>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-[12px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">전체</option>
              <option value="open">열림</option>
              <option value="resolved">답변 완료</option>
              <option value="archived">보관됨</option>
            </select>
            <button
              onClick={fetchMessages}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-[12px] flex items-center gap-1 hover:bg-gray-50"
            >
              <Filter className="w-3 h-3" /> 새로고침
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-10 text-center text-[13px] text-gray-500">불러오는 중...</div>
        ) : messages.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-gray-500">
            문의 내역이 없습니다.
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {messages.map((m) => (
              <div
                key={m.id}
                className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-[12px] text-gray-500 mb-1">
                      {formatDate(m.createdAt)} · {m.email}
                    </div>
                    <div className="inline-flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[11px] font-medium">
                        {m.type}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          m.status === 'open'
                            ? 'bg-yellow-100 text-yellow-700'
                            : m.status === 'resolved'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {statusLabel(m.status)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {m.status !== 'open' && (
                      <button
                        onClick={() => updateStatus(m.id, 'open')}
                        className="px-2 py-1 rounded text-[11px] border border-gray-200 hover:bg-gray-100"
                      >
                        다시 열기
                      </button>
                    )}
                    {m.status !== 'resolved' && (
                      <button
                        onClick={() => updateStatus(m.id, 'resolved')}
                        className="px-2 py-1 rounded text-[11px] border border-green-200 text-green-700 hover:bg-green-50"
                      >
                        답변 완료
                      </button>
                    )}
                    {m.status !== 'archived' && (
                      <button
                        onClick={() => updateStatus(m.id, 'archived')}
                        className="px-2 py-1 rounded text-[11px] border border-gray-200 text-gray-500 hover:bg-gray-100"
                      >
                        보관
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[13px] text-gray-800 whitespace-pre-line">
                  {m.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 배너 생성/수정 모달 */}
      {showBannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowBannerModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[18px] font-bold">{editingBanner ? '배너 수정' : '배너 생성'}</h3>
              <button
                onClick={() => {
                  setShowBannerModal(false);
                  setEditingBanner(null);
                  setImagePreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
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
                  value={bannerFormData.title}
                  onChange={(e) => setBannerFormData({ ...bannerFormData, title: e.target.value })}
                  placeholder="배너 제목"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-2">이미지</label>
                
                {/* 이미지 프리뷰 */}
                {imagePreview && (
                  <div className="mb-3 relative">
                    <img 
                      src={imagePreview} 
                      alt="미리보기" 
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setBannerFormData({ ...bannerFormData, imageUrl: '' });
                        setImagePreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* 파일 업로드 버튼 */}
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="banner-image-upload"
                  />
                  <label
                    htmlFor="banner-image-upload"
                    className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      uploadingImage 
                        ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                        : 'bg-gray-50 border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                        <span className="text-[13px] text-gray-500">업로드 중...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-[13px] text-gray-600">이미지 업로드 (또는 URL 입력)</span>
                      </>
                    )}
                  </label>
                  
                  {/* URL 직접 입력 */}
                  <input
                    type="url"
                    value={bannerFormData.imageUrl}
                    onChange={(e) => setBannerFormData({ ...bannerFormData, imageUrl: e.target.value })}
                    placeholder="또는 이미지 URL을 직접 입력하세요 (https://example.com/image.jpg)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-2">링크 URL</label>
                <input
                  type="url"
                  value={bannerFormData.linkUrl}
                  onChange={(e) => setBannerFormData({ ...bannerFormData, linkUrl: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-2">위치</label>
                  <select
                    value={bannerFormData.position}
                    onChange={(e) => setBannerFormData({ ...bannerFormData, position: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                  >
                    <option value="main_hero">메인 홈 배너</option>
                    <option value="category_top">카테고리 상단</option>
                    <option value="city">도시</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-2">순서</label>
                  <input
                    type="number"
                    value={bannerFormData.order}
                    onChange={(e) => setBannerFormData({ ...bannerFormData, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-2">시작일</label>
                  <input
                    type="date"
                    value={bannerFormData.startDate}
                    onChange={(e) => setBannerFormData({ ...bannerFormData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-gray-700 mb-2">종료일</label>
                  <input
                    type="date"
                    value={bannerFormData.endDate}
                    onChange={(e) => setBannerFormData({ ...bannerFormData, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-[13px] focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bannerFormData.isActive}
                    onChange={(e) => setBannerFormData({ ...bannerFormData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-[13px] font-bold text-gray-700">게시 활성화</span>
                </label>
              </div>
              <div className="pt-4 flex gap-2">
                <button
                  onClick={() => {
                    setShowBannerModal(false);
                    setEditingBanner(null);
                    setImagePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-[13px] font-medium hover:bg-gray-200"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveBanner}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-bold hover:bg-opacity-90"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 도시 배너 관리 모달 */}
      {showBannerModalForCity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowBannerModalForCity(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[18px] font-bold">
                {cities.find(c => c.id === showBannerModalForCity)?.name} 도시 배너 관리
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateCityBanner}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-bold hover:bg-opacity-90 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> 배너 추가
                </button>
                <button
                  onClick={() => setShowBannerModalForCity(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cityBanners.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-gray-500 text-[13px]">
                  등록된 배너가 없습니다.
                </div>
              ) : (
                cityBanners.map((banner) => (
                  <div key={banner.id} className="border border-gray-200 rounded-xl overflow-hidden group">
                    <div className="aspect-[2/1] bg-gray-100 flex items-center justify-center relative">
                      {banner.imageUrl ? (
                        <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-gray-300" />
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditBanner(banner);
                            setShowBannerModalForCity(null);
                          }}
                          className="px-3 py-1 bg-white text-black rounded text-[12px] font-bold"
                        >
                          수정
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBanner(banner.id);
                            setTimeout(() => handleManageCityBanners(showBannerModalForCity!), 500);
                          }}
                          className="p-1.5 bg-red-500 text-white rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-bold text-[13px]">{banner.title}</div>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          banner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {banner.isActive ? '활성' : '비활성'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 추천 샵 관리 모달 */}
      {showRecommendedShopsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowRecommendedShopsModal(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[18px] font-bold">
                {cities.find(c => c.id === showRecommendedShopsModal)?.name} 추천 샵 관리
              </h3>
              <button
                onClick={() => setShowRecommendedShopsModal(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-[14px] font-bold mb-3">추천 샵 목록 ({recommendedShops.length}개)</h4>
                {recommendedShops.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-[13px] border border-gray-200 rounded-lg">
                    추천 샵이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recommendedShops.map((shop) => (
                      <div key={shop.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          {shop.imageUrl ? (
                            <img src={shop.imageUrl} alt={shop.name} className="w-12 h-12 rounded-lg object-cover" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-[13px]">{shop.name}</div>
                            <div className="text-[11px] text-gray-500">{shop.address}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleShopRecommendation(shop.id, shop.isRecommended)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[12px] font-medium hover:bg-red-100"
                        >
                          추천 해제
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-[14px] font-bold mb-3">
                  모든 샵 목록 ({allShops.filter(s => !s.isRecommended).length}개)
                </h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {allShops.filter(s => !s.isRecommended).length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-[13px]">
                      추가 가능한 샵이 없습니다.
                    </div>
                  ) : (
                    allShops.filter(s => !s.isRecommended).map((shop) => (
                      <div key={shop.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          {shop.imageUrl ? (
                            <img src={shop.imageUrl} alt={shop.name} className="w-12 h-12 rounded-lg object-cover" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-[13px]">{shop.name}</div>
                            <div className="text-[11px] text-gray-500">{shop.address}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleShopRecommendation(shop.id, shop.isRecommended)}
                          className="px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-[12px] font-medium hover:bg-green-100"
                        >
                          추천 추가
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

