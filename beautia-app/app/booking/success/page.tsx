'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';

function BookingSuccessPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, formatPrice } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingData, setBookingData] = useState<any>(null);

  useEffect(() => {
    async function verifyPayment() {
      const sessionId = searchParams.get('session_id');
      const bookingId = searchParams.get('booking_id');

      if (!sessionId || !bookingId) {
        setError('결제 정보가 올바르지 않습니다.');
        setLoading(false);
        return;
      }

      try {
        // 결제 확인 API 호출
        const response = await fetch(`/api/bookings/${bookingId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setBookingData(data.data);
            
            // 결제 상태 확인
            if (data.data.paymentStatus === 'paid') {
              setError('');
            } else {
              setError('결제가 완료되지 않았습니다.');
            }
          }
        }
      } catch (err) {
        console.error('결제 확인 오류:', err);
        setError('결제 확인 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }

    verifyPayment();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">결제를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4 bg-white rounded-xl shadow-lg p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">결제 확인 실패</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/booking')}
            className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-opacity-90"
          >
            예약 페이지로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4 bg-white rounded-xl shadow-lg p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">결제가 완료되었습니다!</h2>
        <p className="text-gray-600 mb-6">
          예약이 성공적으로 확정되었습니다.
        </p>

        {bookingData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">예약번호</span>
              <span className="font-mono text-sm">{bookingData.id.slice(-8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">매장</span>
              <span className="font-medium">{bookingData.shopName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">시술</span>
              <span className="font-medium">{bookingData.serviceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">예약일시</span>
              <span className="font-medium">{bookingData.date} {bookingData.time}</span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="text-gray-600 font-bold">결제금액</span>
              <span className="font-bold text-lg text-primary">{formatPrice(bookingData.price)}</span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/customer/profile')}
            className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-opacity-90"
          >
            내 예약 보기
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
          >
            홈으로
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <BookingSuccessPageContent />
    </Suspense>
  );
}
