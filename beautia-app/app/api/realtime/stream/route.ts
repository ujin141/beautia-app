import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyCustomerToken } from '@/lib/customer-token-verifier';
import { verifyPartnerToken } from '@/lib/partner-token-verifier';
import ChatMessage from '@/models/ChatMessage';
import Booking from '@/models/Booking';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 실시간 이벤트 스트림 (SSE)
 * 채팅 메시지, 예약 상태, 알림 등을 실시간으로 전송
 */
export async function GET(request: NextRequest) {
  // SSE 연결 설정
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await connectDB();
        
        // 인증 확인
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '') || 
                     request.cookies.get('customer_token')?.value ||
                     request.cookies.get('partner_token')?.value;

        if (!token) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: '인증이 필요합니다.' })}\n\n`));
          controller.close();
          return;
        }

        let userId: string | null = null;
        let userType: 'customer' | 'partner' | null = null;

        // 고객 토큰 확인
        const customer = await verifyCustomerToken(token);
        if (customer) {
          userId = customer._id.toString();
          userType = 'customer';
        } else {
          // 파트너 토큰 확인
          const verification = await verifyPartnerToken(token);
          if (verification.valid && verification.partnerId) {
            userId = verification.partnerId.toString();
            userType = 'partner';
          }
        }

        if (!userId || !userType) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: '유효하지 않은 토큰입니다.' })}\n\n`));
          controller.close();
          return;
        }

        // 연결 확인 메시지 전송
        const sendEvent = (event: string, data: any) => {
          controller.enqueue(encoder.encode(`event: ${event}\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        sendEvent('connected', { message: '실시간 연결이 설정되었습니다.', userId, userType });

        // MongoDB Change Streams 설정
        const collections: any[] = [];

        // 채팅 메시지 실시간 감지
        // mongoose.connection.db가 정의되어 있는지 확인
        if (!mongoose.connection.db) {
          throw new Error('MongoDB 데이터베이스 연결이 설정되지 않았습니다.');
        }

        const messageCollection = mongoose.connection.db.collection('chatmessages');
        const messageChangeStream = messageCollection.watch([
          { $match: { 
            $or: userType === 'customer' 
              ? [{ senderId: userId }, { 'fullDocument.roomId': { $exists: true } }]
              : [{ senderId: userId }, { 'fullDocument.roomId': { $exists: true } }]
          }}
        ]);

        messageChangeStream.on('change', async (change: any) => {
          try {
            if (change.operationType === 'insert') {
              const message = change.fullDocument;
              // mongoose.connection.db 확인
              if (!mongoose.connection.db) return;

              // 채팅방 확인 (고객은 자신의 채팅방, 파트너는 자신의 채팅방)
              const room = await mongoose.connection.db.collection('chatrooms').findOne({
                _id: new mongoose.Types.ObjectId(message.roomId)
              });

              if (room) {
                const shouldNotify = 
                  (userType === 'customer' && room.customerId === userId) ||
                  (userType === 'partner' && room.partnerId === userId);

                if (shouldNotify) {
                  sendEvent('message', {
                    id: message._id.toString(),
                    roomId: message.roomId,
                    senderId: message.senderId,
                    senderType: message.senderType,
                    senderName: message.senderName,
                    message: message.message,
                    messageType: message.messageType,
                    imageUrl: message.imageUrl,
                    createdAt: message.createdAt,
                  });
                }
              }
            }
          } catch (error) {
            console.error('메시지 변경 스트림 오류:', error);
          }
        });

        collections.push(messageChangeStream);

        // 예약 상태 실시간 감지
        // mongoose.connection.db가 정의되어 있는지 확인
        if (!mongoose.connection.db) {
          throw new Error('MongoDB 데이터베이스 연결이 설정되지 않았습니다.');
        }
        
        const bookingCollection = mongoose.connection.db.collection('bookings');
        const bookingChangeStream = bookingCollection.watch([
          { $match: {} }
        ]);

        bookingChangeStream.on('change', (change: any) => {
          try {
            if (change.operationType === 'update' || change.operationType === 'replace') {
              const booking = change.fullDocument;
              if (!booking) return;

              const shouldNotify = 
                (userType === 'customer' && booking.userId === userId) ||
                (userType === 'partner' && booking.partnerId === userId);

              if (shouldNotify) {
                sendEvent('booking', {
                  id: booking._id.toString(),
                  bookingId: booking._id.toString(),
                  status: booking.status,
                  paymentStatus: booking.paymentStatus,
                  shopId: booking.shopId,
                  shopName: booking.shopName,
                  updatedAt: booking.updatedAt,
                });
              }
            } else if (change.operationType === 'insert') {
              const booking = change.fullDocument;
              if (!booking) return;

              const shouldNotify = 
                (userType === 'customer' && booking.userId === userId) ||
                (userType === 'partner' && booking.partnerId === userId);

              if (shouldNotify) {
                sendEvent('booking', {
                  id: booking._id.toString(),
                  bookingId: booking._id.toString(),
                  status: booking.status,
                  paymentStatus: booking.paymentStatus,
                  shopId: booking.shopId,
                  shopName: booking.shopName,
                  createdAt: booking.createdAt,
                });
              }
            }
          } catch (error) {
            console.error('예약 변경 스트림 오류:', error);
          }
        });

        collections.push(bookingChangeStream);

        // 알림 실시간 감지
        // mongoose.connection.db가 정의되어 있는지 확인
        if (!mongoose.connection.db) {
          throw new Error('MongoDB 데이터베이스 연결이 설정되지 않았습니다.');
        }

        const notificationCollection = mongoose.connection.db.collection('notifications');
        const notificationChangeStream = notificationCollection.watch([
          { $match: { userId: userId } }
        ]);

        notificationChangeStream.on('change', (change: any) => {
          try {
            if (change.operationType === 'insert') {
              const notification = change.fullDocument;
              sendEvent('notification', {
                id: notification._id.toString(),
                type: notification.type,
                title: notification.title,
                message: notification.message,
                data: notification.data,
                isRead: notification.isRead,
                createdAt: notification.createdAt,
              });
            }
          } catch (error) {
            console.error('알림 변경 스트림 오류:', error);
          }
        });

        collections.push(notificationChangeStream);

        // 연결 종료 시 정리
        request.signal.addEventListener('abort', () => {
          collections.forEach(stream => stream.close());
          controller.close();
        });

        // Heartbeat (30초마다 연결 유지)
        const heartbeatInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: heartbeat\n\n`));
          } catch (error) {
            clearInterval(heartbeatInterval);
            collections.forEach(stream => stream.close());
            controller.close();
          }
        }, 30000);

        // 클라이언트 연결 종료 감지
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeatInterval);
          collections.forEach(stream => stream.close());
        });

      } catch (error) {
        console.error('실시간 스트림 오류:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: '스트림 오류가 발생했습니다.' })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
