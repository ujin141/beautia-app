'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Clock, User, Plus, X, Loader2, Trash2, Edit2, Users, Upload, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { PartnerApi } from '../../../../lib/api';
import { getPartnerUser } from '../../../../lib/auth';

interface Schedule {
  _id: string;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
  notes?: string;
}

interface Staff {
  _id: string;
  name: string;
  role?: string;
  specialty?: string;
  phone?: string;
  email?: string;
  color?: string;
  profileImage?: string;
  isActive: boolean;
}

export default function SchedulePage() {
  const { t } = useLanguage();
  const [selectedStaffIndex, setSelectedStaffIndex] = useState<number | null>(null);
  const [showAddShiftModal, setShowAddShiftModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingStaff, setIsSavingStaff] = useState(false);
  
  // 스케줄 모달 폼 상태
  const [formData, setFormData] = useState({
    staffName: '',
    date: '',
    startTime: '',
    endTime: '',
    breakStartTime: '',
    breakEndTime: '',
    notes: '',
  });
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // 직원 모달 폼 상태
  const [staffFormData, setStaffFormData] = useState({
    name: '',
    role: '',
    specialty: '',
    phone: '',
    email: '',
    color: '#8B5CF6',
    profileImage: '',
  });
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // 현재 주의 시작일과 종료일 계산
  const getWeekRange = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // 월요일로 조정
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { start: monday, end: sunday };
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const partner = getPartnerUser();
      if (!partner) {
        setLoading(false);
        return;
      }

      const [schedulesData, staffsData] = await Promise.all([
        (async () => {
          const { start, end } = getWeekRange();
          return PartnerApi.getSchedules(partner.id, {
            startDate: start.toISOString(),
            endDate: end.toISOString(),
          });
        })(),
        PartnerApi.getStaffs(partner.id),
      ]);

      setSchedules(schedulesData || []);
      setStaffs(staffsData || []);
      
      // 직원이 있고 선택된 직원이 없으면 첫 번째 직원 선택
      if (staffsData && staffsData.length > 0 && selectedStaffIndex === null) {
        setSelectedStaffIndex(0);
      }
    } catch (error) {
      console.error('데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const partner = getPartnerUser();
      if (!partner) return;

      const { start, end } = getWeekRange();
      const data = await PartnerApi.getSchedules(partner.id, {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });
      console.log('조회된 스케줄:', data);
      console.log('조회 기간:', start.toISOString(), '~', end.toISOString());
      setSchedules(data || []);
    } catch (error) {
      console.error('스케줄 조회 실패:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const partner = getPartnerUser();
    if (!partner) {
      alert(t('partner_dashboard.schedule_login_required'));
      return;
    }

    if (!formData.staffName || !formData.date || !formData.startTime || !formData.endTime) {
      alert(t('partner_dashboard.schedule_required_fields'));
      return;
    }

    setIsSaving(true);
    try {
      if (editingSchedule) {
        // 수정
        await PartnerApi.updateSchedule({
          scheduleId: editingSchedule._id,
          partnerId: partner.id,
          ...formData,
        });
        alert(t('partner_dashboard.schedule_shift_updated'));
      } else {
        // 추가
        await PartnerApi.addSchedule({
          partnerId: partner.id,
          ...formData,
        });
        alert(t('partner_dashboard.schedule_shift_added'));
      }
      setShowAddShiftModal(false);
      setEditingSchedule(null);
      setFormData({
        staffName: '',
        date: '',
        startTime: '',
        endTime: '',
        breakStartTime: '',
        breakEndTime: '',
        notes: '',
      });
      fetchSchedules();
    } catch (error) {
      console.error('스케줄 저장 실패:', error);
      alert(error instanceof Error ? error.message : t('partner_dashboard.schedule_shift_save_failed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (scheduleId: string) => {
    if (!confirm(t('partner_dashboard.schedule_shift_delete_confirm'))) return;

    const partner = getPartnerUser();
    if (!partner) return;

    try {
      await PartnerApi.deleteSchedule(scheduleId, partner.id);
      alert(t('partner_dashboard.schedule_shift_deleted'));
      fetchSchedules();
    } catch (error) {
      console.error('스케줄 삭제 실패:', error);
      alert(error instanceof Error ? error.message : t('partner_dashboard.schedule_shift_delete_failed'));
    }
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      staffName: schedule.staffName,
      date: schedule.date.split('T')[0],
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      breakStartTime: schedule.breakStartTime || '',
      breakEndTime: schedule.breakEndTime || '',
      notes: schedule.notes || '',
    });
    setShowAddShiftModal(true);
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const partner = getPartnerUser();
    if (!partner) {
      alert(t('partner_dashboard.schedule_login_required'));
      return;
    }

    if (!staffFormData.name) {
      alert(t('partner_dashboard.schedule_staff_name_required'));
      return;
    }

    setIsSavingStaff(true);
    try {
      // 이미지 업로드
      const imageUrl = await handleImageUpload();
      
      const staffData = {
        ...staffFormData,
        profileImage: imageUrl || staffFormData.profileImage,
      };

      if (editingStaff) {
        // 수정
        await PartnerApi.updateStaff({
          staffId: editingStaff._id,
          partnerId: partner.id,
          ...staffData,
        });
        alert(t('partner_dashboard.schedule_staff_updated'));
      } else {
        // 추가
        await PartnerApi.addStaff({
          partnerId: partner.id,
          ...staffData,
        });
        alert(t('partner_dashboard.schedule_staff_added'));
      }
      setShowStaffModal(false);
      setEditingStaff(null);
      setProfileImageFile(null);
      setProfileImagePreview(null);
      setStaffFormData({
        name: '',
        role: '',
        specialty: '',
        phone: '',
        email: '',
        color: '#8B5CF6',
        profileImage: '',
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchData();
    } catch (error) {
      console.error('직원 저장 실패:', error);
      alert(error instanceof Error ? error.message : t('partner_dashboard.schedule_staff_save_failed'));
    } finally {
      setIsSavingStaff(false);
    }
  };

  const handleStaffDelete = async (staffId: string) => {
    if (!confirm(t('partner_dashboard.schedule_staff_delete_confirm'))) return;

    const partner = getPartnerUser();
    if (!partner) return;

    try {
      await PartnerApi.deleteStaff(staffId, partner.id);
      alert(t('partner_dashboard.schedule_staff_deleted'));
      fetchData();
    } catch (error) {
      console.error('직원 삭제 실패:', error);
      alert(error instanceof Error ? error.message : t('partner_dashboard.schedule_staff_delete_failed'));
    }
  };

  const handleStaffEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setStaffFormData({
      name: staff.name,
      role: staff.role || '',
      specialty: staff.specialty || '',
      phone: staff.phone || '',
      email: staff.email || '',
      color: staff.color || '#8B5CF6',
      profileImage: staff.profileImage || '',
    });
    setProfileImagePreview(staff.profileImage || null);
    setProfileImageFile(null);
    setShowStaffModal(true);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(t('partner_dashboard.schedule_staff_image_size_error'));
        return;
      }
      
      // 파일 타입 체크
      if (!file.type.startsWith('image/')) {
        alert(t('partner_dashboard.schedule_staff_image_type_error'));
        return;
      }

      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async (): Promise<string | null> => {
    if (!profileImageFile) {
      return staffFormData.profileImage || null;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', profileImageFile);
      formData.append('type', 'staff-profile');

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(t('partner_dashboard.schedule_staff_image_upload_failed'));
      }

      const data = await response.json();
      return data.url || data.imageUrl || null;
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      alert(error instanceof Error ? error.message : t('partner_dashboard.schedule_staff_image_upload_failed'));
      return null;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const getDayIndex = (date: string) => {
    const d = new Date(date);
    const day = d.getDay();
    return day === 0 ? 6 : day - 1; // 월요일 = 0, 일요일 = 6
  };

  const getHourIndex = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    return hour - 10; // 10시부터 시작
  };

  const getSchedulesForCell = (dayIndex: number, hour: number) => {
    const { start } = getWeekRange();
    const cellDate = new Date(start);
    cellDate.setDate(start.getDate() + dayIndex);
    const cellDateStr = cellDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식
    
    return schedules.filter(schedule => {
      // 날짜 비교: schedule.date가 문자열이면 그대로 비교, Date 객체면 변환
      let scheduleDateStr: string;
      if (typeof schedule.date === 'string') {
        // ISO 형식이거나 YYYY-MM-DD 형식인지 확인
        scheduleDateStr = schedule.date.split('T')[0];
      } else {
        scheduleDateStr = new Date(schedule.date).toISOString().split('T')[0];
      }
      
      // 날짜가 일치하는지 확인
      if (scheduleDateStr !== cellDateStr) {
        return false;
      }
      
      // 시간 범위 확인
      const scheduleStartHour = parseInt(schedule.startTime.split(':')[0]);
      const scheduleEndHour = parseInt(schedule.endTime.split(':')[0]);
      
      return scheduleStartHour <= hour && scheduleEndHour > hour;
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-[24px] font-bold">{t('partner_dashboard.schedule_title')}</h2>
         <div className="flex gap-2">
          <button 
            onClick={() => {
              setEditingStaff(null);
              setStaffFormData({
                name: '',
                role: '',
                specialty: '',
                phone: '',
                email: '',
                color: '#8B5CF6',
                profileImage: '',
              });
              setShowStaffModal(true);
            }}
             className="flex items-center gap-2 px-4 py-2 bg-white border border-line text-secondary rounded-xl font-bold text-[14px] hover:bg-surface"
           >
             <Users className="w-4 h-4" /> {t('partner_dashboard.schedule_staff_management')}
           </button>
           <button 
             onClick={() => setShowAddShiftModal(true)}
             className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold text-[14px]"
           >
             <Plus className="w-4 h-4" /> {t('partner_dashboard.schedule_add_shift')}
           </button>
         </div>
      </div>

      <div className="bg-white rounded-2xl border border-line p-6">
         <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
            {loading ? (
              <div className="flex items-center gap-2 text-secondary">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('partner_dashboard.schedule_staff_list_loading')}
              </div>
            ) : staffs.length === 0 ? (
              <div className="text-secondary text-[14px]">
                {t('partner_dashboard.schedule_no_staff')}
              </div>
            ) : (
              staffs.map((staff, i) => (
                <button 
                  key={staff._id || `staff-${i}`}
                  onClick={() => setSelectedStaffIndex(i)}
                  className={`px-4 py-2 rounded-xl text-[14px] font-bold whitespace-nowrap transition-colors ${
                    i === selectedStaffIndex ? 'bg-primary text-white' : 'bg-surface text-secondary hover:bg-line'
                  }`}
                  style={i === selectedStaffIndex && staff.color ? { backgroundColor: staff.color } : {}}
                >
                  <div className="flex items-center gap-2">
                    {staff.profileImage ? (
                      <img 
                        src={staff.profileImage} 
                        alt={staff.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        i === selectedStaffIndex ? 'bg-white/20' : 'bg-line'
                      }`}>
                        {staff.name[0]}
                      </div>
                    )}
                    <span>{staff.name} {staff.role && `(${staff.role})`}</span>
                  </div>
                </button>
              ))
            )}
         </div>

         {/* Weekly Schedule Grid */}
         <div className="grid grid-cols-8 border-l border-t border-line">
            {/* Header */}
            <div className="p-3 border-r border-b border-line bg-surface text-center font-bold text-[13px] text-secondary">{t('partner_dashboard.schedule_time')}</div>
            {['월', '화', '수', '목', '금', '토', '일'].map(day => (
               <div key={day} className="p-3 border-r border-b border-line text-center font-bold text-[14px]">{day}</div>
            ))}

            {/* Time Slots */}
            {loading ? (
              <div className="col-span-8 p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-brand-lilac mx-auto" />
              </div>
            ) : (
              [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((hour) => (
                <React.Fragment key={hour}>
                  <div className="p-3 border-r border-b border-line text-center text-[12px] text-secondary font-mono">
                    {hour}:00
                  </div>
                  {[...Array(7)].map((_, dayIndex) => {
                    const cellSchedules = getSchedulesForCell(dayIndex, hour);
                    const { start, end } = getWeekRange();
                    const cellDate = new Date(start);
                    cellDate.setDate(start.getDate() + dayIndex);
                    const dateStr = cellDate.toISOString().split('T')[0];
                    
                    return (
                      <div 
                        key={dayIndex} 
                        className="border-r border-b border-line h-16 relative group hover:bg-surface/30 cursor-pointer"
                        onClick={() => {
                          // 셀 클릭 시 해당 날짜/시간으로 새 스케줄 추가
                          setFormData(prev => ({
                            ...prev,
                            date: dateStr,
                            startTime: `${hour.toString().padStart(2, '0')}:00`,
                            endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
                          }));
                          setEditingSchedule(null);
                          setShowAddShiftModal(true);
                        }}
                      >
                        {cellSchedules.map((schedule) => {
                          const startHour = parseInt(schedule.startTime.split(':')[0]);
                          const isStart = startHour === hour;
                          const spanHours = parseInt(schedule.endTime.split(':')[0]) - startHour;
                          
                          return (
                            <div
                              key={schedule._id}
                              className={`absolute top-1 left-1 right-1 ${isStart ? 'bottom-1' : 'bottom-0'} bg-brand-lilac/20 border-l-4 border-brand-lilac rounded px-2 py-1 text-[11px] font-bold text-brand-lilac group-hover:bg-brand-lilac/30 transition-colors`}
                              style={{ height: isStart ? 'calc(100% - 8px)' : '100%' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(schedule);
                              }}
                            >
                              {isStart && (
                                <div className="flex items-center justify-between">
                                  <span className="truncate">{schedule.staffName}</span>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(schedule);
                                      }}
                                      className="p-0.5 hover:bg-brand-lilac/20 rounded"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(schedule._id);
                                      }}
                                      className="p-0.5 hover:bg-red-200 rounded"
                                    >
                                      <Trash2 className="w-3 h-3 text-red-600" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {/* 휴게 시간 표시 */}
                        {cellSchedules.some(s => {
                          if (!s.breakStartTime || !s.breakEndTime) return false;
                          const breakStart = parseInt(s.breakStartTime.split(':')[0]);
                          return breakStart === hour;
                        }) && (
                          <div className="absolute top-0 left-0 w-full h-full bg-gray-100/50 flex items-center justify-center text-[10px] text-secondary/50 font-medium pointer-events-none">
                            {t('partner_dashboard.schedule_lunch')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))
            )}
         </div>
      </div>

      {/* 근무 추가/수정 모달 */}
      {showAddShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => {
          if (!isSaving) {
            setShowAddShiftModal(false);
            setEditingSchedule(null);
            setFormData({
              staffName: '',
              date: '',
              startTime: '',
              endTime: '',
              breakStartTime: '',
              breakEndTime: '',
              notes: '',
            });
          }
        }}>
          <div className="bg-white rounded-2xl p-8 max-w-[500px] w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[20px] font-bold">{editingSchedule ? t('partner_dashboard.schedule_shift_edit') : t('partner_dashboard.schedule_shift_add')}</h3>
              <button 
                onClick={() => {
                  if (!isSaving) {
                    setShowAddShiftModal(false);
                    setEditingSchedule(null);
                    setFormData({
                      staffName: '',
                      date: '',
                      startTime: '',
                      endTime: '',
                      breakStartTime: '',
                      breakEndTime: '',
                      notes: '',
                    });
                  }
                }}
                className="p-2 hover:bg-surface rounded-lg transition-colors"
                disabled={isSaving}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.schedule_staff_select')}</label>
                <select 
                  value={formData.staffName}
                  onChange={(e) => setFormData({ ...formData, staffName: e.target.value })}
                  className="w-full p-3 bg-surface rounded-xl border-transparent outline-none focus:ring-1 focus:ring-brand-lilac"
                  required
                  disabled={isSaving}
                >
                  <option value="">{t('partner_dashboard.schedule_staff_select_placeholder')}</option>
                  {staffs.map((staff, index) => (
                    <option key={staff._id || `staff-option-${index}`} value={staff.name}>
                      {staff.name} {staff.role && `(${staff.role})`}
                    </option>
                  ))}
                </select>
                {staffs.length === 0 && (
                  <p className="text-[12px] text-secondary mt-2">
                    {t('partner_dashboard.schedule_no_staff')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.schedule_date')}</label>
                <input 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-3 bg-surface rounded-xl border-transparent outline-none focus:ring-1 focus:ring-brand-lilac"
                  required
                  disabled={isSaving}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.schedule_start_time')}</label>
                  <input 
                    type="time" 
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full p-3 bg-surface rounded-xl border-transparent outline-none focus:ring-1 focus:ring-brand-lilac"
                    required
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.schedule_end_time')}</label>
                  <input 
                    type="time" 
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full p-3 bg-surface rounded-xl border-transparent outline-none focus:ring-1 focus:ring-brand-lilac"
                    required
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.schedule_break_start')}</label>
                  <input 
                    type="time" 
                    value={formData.breakStartTime}
                    onChange={(e) => setFormData({ ...formData, breakStartTime: e.target.value })}
                    className="w-full p-3 bg-surface rounded-xl border-transparent outline-none focus:ring-1 focus:ring-brand-lilac"
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.schedule_break_end')}</label>
                  <input 
                    type="time" 
                    value={formData.breakEndTime}
                    onChange={(e) => setFormData({ ...formData, breakEndTime: e.target.value })}
                    className="w-full p-3 bg-surface rounded-xl border-transparent outline-none focus:ring-1 focus:ring-brand-lilac"
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.schedule_memo')}</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-3 bg-surface rounded-xl border-transparent outline-none focus:ring-1 focus:ring-brand-lilac resize-none"
                  rows={3}
                  disabled={isSaving}
                />
              </div>

              <div className="pt-4 flex gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    if (!isSaving) {
                      setShowAddShiftModal(false);
                      setEditingSchedule(null);
                      setFormData({
                        staffName: '',
                        date: '',
                        startTime: '',
                        endTime: '',
                        breakStartTime: '',
                        breakEndTime: '',
                        notes: '',
                      });
                    }
                  }}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-white border border-line rounded-lg font-medium hover:bg-surface transition-colors disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-brand-lilac transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('partner_dashboard.schedule_saving')}
                    </>
                  ) : (
                    editingSchedule ? t('partner_dashboard.schedule_edit') : t('partner_dashboard.schedule_add')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 직원 관리 모달 */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => {
          if (!isSavingStaff) {
            setShowStaffModal(false);
            setEditingStaff(null);
            setStaffFormData({
              name: '',
              role: '',
              specialty: '',
              phone: '',
              email: '',
              color: '#8B5CF6',
              profileImage: '',
            });
          }
        }}>
          <div className="bg-white rounded-2xl p-8 max-w-[500px] w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[20px] font-bold">{editingStaff ? t('partner_dashboard.schedule_staff_edit') : t('partner_dashboard.schedule_staff_add')}</h3>
              <button 
                onClick={() => {
                  if (!isSavingStaff) {
                    setShowStaffModal(false);
                    setEditingStaff(null);
                    setStaffFormData({
                      name: '',
                      role: '',
                      specialty: '',
                      phone: '',
                      email: '',
                      color: '#8B5CF6',
                      profileImage: '',
                    });
                  }
                }}
                className="p-2 hover:bg-surface rounded-lg transition-colors"
                disabled={isSavingStaff}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStaffSubmit} className="space-y-4">
              {/* 프로필 이미지 업로드 */}
              <div>
                <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.schedule_staff_profile_image')}</label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-surface border-2 border-line flex items-center justify-center overflow-hidden">
                      {profileImagePreview ? (
                        <img 
                          src={profileImagePreview} 
                          alt={t('partner_dashboard.schedule_staff_profile_preview')} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-secondary" />
                      )}
                    </div>
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={isSavingStaff || isUploadingImage}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSavingStaff || isUploadingImage}
                      className="px-4 py-2 bg-surface border border-line rounded-lg text-[13px] font-medium hover:bg-line transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {profileImagePreview ? t('partner_dashboard.schedule_staff_image_change') : t('partner_dashboard.schedule_staff_image_select')}
                    </button>
                    <p className="text-[11px] text-secondary mt-1">
                      {t('partner_dashboard.schedule_staff_image_format')}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.schedule_staff_name')} *</label>
                <input 
                  type="text"
                  value={staffFormData.name || ''}
                  onChange={(e) => setStaffFormData({ ...staffFormData, name: e.target.value })}
                  placeholder={t('partner_dashboard.schedule_staff_name_placeholder')}
                  className="w-full p-3 bg-surface rounded-xl border-transparent outline-none focus:ring-1 focus:ring-brand-lilac"
                  required
                  disabled={isSavingStaff}
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.schedule_staff_role')}</label>
                <input 
                  type="text"
                  value={staffFormData.role || ''}
                  onChange={(e) => setStaffFormData({ ...staffFormData, role: e.target.value })}
                  placeholder={t('partner_dashboard.schedule_staff_role_placeholder')}
                  className="w-full p-3 bg-surface rounded-xl border-transparent outline-none focus:ring-1 focus:ring-brand-lilac"
                  disabled={isSavingStaff}
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.schedule_staff_specialty')}</label>
                <input 
                  type="text"
                  value={staffFormData.specialty || ''}
                  onChange={(e) => setStaffFormData({ ...staffFormData, specialty: e.target.value })}
                  placeholder={t('partner_dashboard.schedule_staff_specialty_placeholder')}
                  className="w-full p-3 bg-surface rounded-xl border-transparent outline-none focus:ring-1 focus:ring-brand-lilac"
                  disabled={isSavingStaff}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.schedule_staff_contact')}</label>
                  <input 
                    type="tel"
                    value={staffFormData.phone || ''}
                    onChange={(e) => setStaffFormData({ ...staffFormData, phone: e.target.value })}
                    placeholder={t('partner_dashboard.schedule_staff_contact_placeholder')}
                    className="w-full p-3 bg-surface rounded-xl border-transparent outline-none focus:ring-1 focus:ring-brand-lilac"
                    disabled={isSavingStaff}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.schedule_staff_email')}</label>
                  <input 
                    type="email"
                    value={staffFormData.email || ''}
                    onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                    placeholder={t('partner_dashboard.schedule_staff_email_placeholder')}
                    className="w-full p-3 bg-surface rounded-xl border-transparent outline-none focus:ring-1 focus:ring-brand-lilac"
                    disabled={isSavingStaff}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-secondary mb-2">{t('partner_dashboard.schedule_staff_color')}</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color"
                    value={staffFormData.color || '#8B5CF6'}
                    onChange={(e) => setStaffFormData({ ...staffFormData, color: e.target.value })}
                    className="w-16 h-10 rounded-lg border border-line cursor-pointer"
                    disabled={isSavingStaff}
                  />
                  <input 
                    type="text"
                    value={staffFormData.color || '#8B5CF6'}
                    onChange={(e) => setStaffFormData({ ...staffFormData, color: e.target.value })}
                    className="flex-1 p-3 bg-surface rounded-xl border-transparent outline-none focus:ring-1 focus:ring-brand-lilac font-mono text-[12px]"
                    placeholder="#8B5CF6"
                    disabled={isSavingStaff}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    if (!isSavingStaff) {
                      setShowStaffModal(false);
                      setEditingStaff(null);
                      setProfileImageFile(null);
                      setProfileImagePreview(null);
                      setStaffFormData({
                        name: '',
                        role: '',
                        specialty: '',
                        phone: '',
                        email: '',
                        color: '#8B5CF6',
                        profileImage: '',
                      });
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }
                  }}
                  disabled={isSavingStaff}
                  className="flex-1 px-4 py-2 bg-white border border-line rounded-lg font-medium hover:bg-surface transition-colors disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
                {editingStaff && (
                  <button
                    type="button"
                    onClick={() => handleStaffDelete(editingStaff._id)}
                    disabled={isSavingStaff}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('common.delete')}
                  </button>
                )}
                <button 
                  type="submit"
                  disabled={isSavingStaff}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-brand-lilac transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSavingStaff ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('partner_dashboard.schedule_saving')}
                    </>
                  ) : (
                    editingStaff ? t('partner_dashboard.schedule_edit') : t('partner_dashboard.schedule_add')
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
