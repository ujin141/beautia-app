/**
 * CEO_Woojin 계정용 통합 모의 데이터 생성 스크립트
 * 실행: npx tsx scripts/seed-ceo-woojin-data.ts
 * 
 * 이 스크립트는:
 * - CEO_Woojin (ceo_woojin@beautia.io) 계정과 연결된 모든 모의 데이터를 생성합니다
 * - 커뮤니티 데이터는 유지됩니다
 * - 기존 모의 데이터는 CEO_Woojin 관련 데이터를 제외하고 삭제됩니다
 */

import connectDB from '../lib/mongodb';
import AdminUser from '../models/AdminUser';
import PartnerUser from '../models/PartnerUser';
import CustomerUser from '../models/CustomerUser';
import Shop from '../models/Shop';
import Booking from '../models/Booking';
import Review from '../models/Review';
import Magazine from '../models/Magazine';
import PartnerApplication from '../models/PartnerApplication';
import Staff from '../models/Staff';
import Message from '../models/Message';
import crypto from 'crypto';

function hashPassword(password: string, type: 'admin' | 'partner' | 'customer' = 'admin'): string {
  const salt = 
    type === 'admin' ? (process.env.ADMIN_PASSWORD_SALT || 'beautia-admin-salt') :
    type === 'partner' ? 'beautia-partner-salt' :
    'beautia-customer-salt';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

async function seedCEOData() {
  try {
    console.log('📦 MongoDB 연결 중...');
    await connectDB();
    console.log('✅ MongoDB 연결 완료\n');

    // CEO_Woojin 계정 찾기 또는 생성
    console.log('👤 CEO_Woojin 계정 확인 중...');
    let ceoUser = await AdminUser.findOne({ email: 'ceo_woojin@beautia.io' });
    
    if (!ceoUser) {
      console.log('⚠️  CEO_Woojin 계정이 없습니다. 생성 중...');
      ceoUser = new AdminUser({
        email: 'ceo_woojin@beautia.io',
        passwordHash: hashPassword('ceo123', 'admin'),
        name: 'CEO Woojin',
        role: 'super_admin',
        isActive: true,
      });
      await ceoUser.save();
      console.log('✅ CEO_Woojin 계정 생성 완료');
    } else {
      console.log('✅ CEO_Woojin 계정 찾음');
    }
    console.log(`   이메일: ${ceoUser.email}`);
    console.log(`   이름: ${ceoUser.name}`);
    console.log(`   역할: ${ceoUser.role}\n`);

    // CEO_Woojin 계정과 연결되지 않은 모의 데이터 삭제 (커뮤니티 제외)
    console.log('🗑️  기존 모의 데이터 정리 중...');
    
    // CEO_Woojin과 연결되지 않은 파트너/매장/예약/리뷰 삭제
    // (커뮤니티 데이터는 유지)
    const deletedCounts = {
      bookings: 0,
      reviews: 0,
      shops: 0,
      partnerUsers: 0,
      magazines: 0,
      partnerApplications: 0,
    };

    // 기존 데이터 삭제 (커뮤니티는 유지)
    deletedCounts.bookings = (await Booking.deleteMany({})).deletedCount || 0;
    deletedCounts.reviews = (await Review.deleteMany({})).deletedCount || 0;
    deletedCounts.shops = (await Shop.deleteMany({})).deletedCount || 0;
    deletedCounts.magazines = (await Magazine.deleteMany({})).deletedCount || 0;
    deletedCounts.partnerApplications = (await PartnerApplication.deleteMany({})).deletedCount || 0;
    
    // CEO_Woojin이 아닌 파트너/고객 사용자 삭제
    const existingPartners = await PartnerUser.find({ email: { $ne: 'ceo_woojin@beautia.io' } });
    deletedCounts.partnerUsers = (await PartnerUser.deleteMany({ email: { $ne: 'ceo_woojin@beautia.io' } })).deletedCount || 0;

    console.log('✅ 기존 데이터 정리 완료');
    console.log(`   - 예약: ${deletedCounts.bookings}개 삭제`);
    console.log(`   - 리뷰: ${deletedCounts.reviews}개 삭제`);
    console.log(`   - 매장: ${deletedCounts.shops}개 삭제`);
    console.log(`   - 매거진: ${deletedCounts.magazines}개 삭제`);
    console.log(`   - 파트너 사용자: ${deletedCounts.partnerUsers}개 삭제`);
    console.log(`   - 파트너 신청: ${deletedCounts.partnerApplications}개 삭제\n`);

    // 고객 사용자 생성 (예약/리뷰용)
    console.log('👥 고객 사용자 생성 중...');
    const customerUsers = [];
    const customerData = [
      { email: 'customer1@example.com', name: '김고객', phone: '010-1111-2222' },
      { email: 'customer2@example.com', name: '이고객', phone: '010-2222-3333' },
      { email: 'customer3@example.com', name: '박고객', phone: '010-3333-4444' },
      { email: 'customer4@example.com', name: '최고객', phone: '010-4444-5555' },
      { email: 'customer5@example.com', name: '정고객', phone: '010-5555-6666' },
    ];

    for (const data of customerData) {
      let customer = await CustomerUser.findOne({ email: data.email });
      if (!customer) {
        customer = new CustomerUser({
          email: data.email,
          passwordHash: hashPassword('customer123', 'customer'),
          name: data.name,
          phone: data.phone,
          joinDate: new Date(),
        });
        await customer.save();
      }
      customerUsers.push(customer);
    }
    console.log(`✅ ${customerUsers.length}명의 고객 사용자 준비 완료\n`);

    // CEO_Woojin 파트너 계정 생성 (매장 운영용)
    console.log('🏪 CEO_Woojin 파트너 계정 및 매장 생성 중...');
    let ceoPartner = await PartnerUser.findOne({ email: 'ceo_woojin@beautia.io' });
    
    if (!ceoPartner) {
      ceoPartner = new PartnerUser({
        email: 'ceo_woojin@beautia.io',
        passwordHash: hashPassword('ceo123', 'partner'),
        name: '우진 원장',
        phone: '010-0000-0000',
        isVerified: true,
      });
      await ceoPartner.save();
      console.log('✅ CEO_Woojin 파트너 계정 생성 완료');
    } else {
      console.log('✅ CEO_Woojin 파트너 계정 찾음');
    }

    // CEO_Woojin 파트너 신청서 생성 (어드민 대시보드에서 보이도록)
    let ceoApplication = await PartnerApplication.findOne({ email: 'ceo_woojin@beautia.io' });
    
    if (!ceoApplication) {
      ceoApplication = new PartnerApplication({
        name: '우진 원장',
        phone: '010-0000-0000',
        email: 'ceo_woojin@beautia.io',
        shopName: '우진헤어살롱',
        address: '서울시 강남구 테헤란로 123',
        category: 'Hair',
        status: 'approved',
        submittedAt: new Date(),
      });
      await ceoApplication.save();
      
      // PartnerUser에 applicationId 연결
      ceoPartner.applicationId = ceoApplication._id.toString();
      await ceoPartner.save();
      
      console.log('✅ CEO_Woojin 파트너 신청서 생성 완료');
    } else {
      console.log('✅ CEO_Woojin 파트너 신청서 찾음');
      
      // applicationId가 없으면 연결
      if (!ceoPartner.applicationId) {
        ceoPartner.applicationId = ceoApplication._id.toString();
        await ceoPartner.save();
      }
    }

    // 매장 생성
    const shops = [];
    const shopData = [
      {
        name: '우진헤어살롱',
        category: 'Hair',
        address: '서울시 강남구 테헤란로 123',
        phone: '02-1234-5678',
        description: '프리미엄 헤어 살롱입니다. 최신 트렌드를 반영한 스타일링을 제공합니다.',
        imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=1000&auto=format&fit=crop',
        services: [
          { name: '컷트', price: 25000, duration: 60 },
          { name: '펌', price: 80000, duration: 180 },
          { name: '염색', price: 100000, duration: 180 },
          { name: '클리닉', price: 150000, duration: 120 },
          { name: '드라이', price: 30000, duration: 30 },
          { name: '업스타일', price: 70000, duration: 90 },
          { name: '트리트먼트', price: 50000, duration: 45 },
          { name: '헤어 에스테틱', price: 120000, duration: 150 },
        ],
      },
      {
        name: '우진네일아트',
        category: 'Nail',
        address: '서울시 서초구 서초대로 456',
        phone: '02-2345-6789',
        description: '아티스틱 네일 아트 전문샵입니다. 개성 있는 디자인을 제공합니다.',
        imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1000&auto=format&fit=crop',
        services: [
          { name: '기본 매니큐어', price: 30000, duration: 60 },
          { name: '젤 네일', price: 50000, duration: 90 },
          { name: '아트 네일', price: 70000, duration: 120 },
          { name: '패디큐어', price: 40000, duration: 70 },
          { name: '젤 제거', price: 20000, duration: 30 },
          { name: '네일 리페어', price: 15000, duration: 20 },
          { name: '프리미엄 네일', price: 100000, duration: 150 },
          { name: '네일 아트 패키지', price: 130000, duration: 180 },
        ],
      },
    ];

    for (const data of shopData) {
      const shopId = crypto.randomBytes(12).toString('hex');
      const shop = new Shop({
        partnerId: ceoPartner._id.toString(),
        name: data.name,
        category: data.category,
        address: data.address,
        phone: data.phone,
        description: data.description,
        imageUrls: [data.imageUrl],
        rating: 4.8,
        reviewCount: 25,
        menus: data.services.map((s, i) => ({
          id: `menu-${shopId}-${i}`,
          name: s.name,
          price: s.price,
          time: s.duration,
          nameTranslations: {
            ko: s.name,
            en: s.name,
            ja: s.name,
            th: s.name,
            zh: s.name,
          },
        })),
        businessHours: {
          openTime: '10:00',
          closeTime: '20:00',
          holidays: [],
        },
      });
      await shop.save();
      shops.push(shop);
    }
    console.log(`✅ ${shops.length}개의 매장 생성 완료\n`);

    // 직원 생성
    console.log('👨‍💼 직원 데이터 생성 중...');
    const staff = new Staff({
      partnerId: ceoPartner._id,
      name: '김스타일',
      role: '디자이너',
      phone: '010-1111-2222',
      email: 'staff1@woojin-salon.com',
      color: '#8B5CF6',
      isActive: true,
    });
    await staff.save();
    console.log(`✅ 직원 1명 생성 완료: ${staff.name}\n`);

    // 예약 생성
    console.log('📅 예약 데이터 생성 중...');
    const bookings = [];
    const today = new Date();
    
    for (let i = 0; i < 20; i++) {
      const shop = shops[Math.floor(Math.random() * shops.length)];
      const customer = customerUsers[Math.floor(Math.random() * customerUsers.length)];
      const menu = shop.menus?.[Math.floor(Math.random() * (shop.menus?.length || 1))] || shop.menus?.[0];
      
      const bookingDate = new Date(today);
      bookingDate.setDate(today.getDate() + Math.floor(Math.random() * 30) - 10); // -10일 ~ +20일
      
      const hours = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
      const time = `${hours[Math.floor(Math.random() * hours.length)]}:00`;

      const booking = new Booking({
        userId: customer._id.toString(),
        userName: customer.name,
        userPhone: customer.phone || '010-0000-0000',
        shopId: shop._id.toString(),
        shopName: shop.name,
        partnerId: ceoPartner._id.toString(),
        serviceId: menu?.id || 'menu1',
        serviceName: menu?.name || '기본 서비스',
        date: bookingDate.toISOString().split('T')[0],
        time: time,
        price: menu?.price || 30000,
        status: ['pending', 'confirmed', 'completed', 'cancelled'][Math.floor(Math.random() * 4)] as any,
        paymentStatus: 'paid',
      });
      await booking.save();
      bookings.push(booking);
    }
    console.log(`✅ ${bookings.length}개의 예약 생성 완료\n`);

    // 리뷰 생성
    console.log('⭐ 리뷰 데이터 생성 중...');
    const reviews = [];
    const reviewTexts = [
      '정말 만족스러운 서비스였습니다!',
      '원장님이 친절하시고 실력도 좋아요.',
      '깔끔하고 세심한 시술이었습니다.',
      '분위기가 좋고 직원분들이 모두 친절해요.',
      '가격 대비 만족도가 높습니다.',
      '김스타일 선생님이 정말 실력이 좋으세요!',
      '다음에도 또 방문하고 싶어요.',
      '시설이 깔끔하고 안전합니다.',
      '예약이 간편하고 서비스가 빠릅니다.',
      '추천 받고 왔는데 만족스러워요!',
    ];

    // 기존 예약에 대한 리뷰 생성
    for (let i = 0; i < 15; i++) {
      const shop = shops[Math.floor(Math.random() * shops.length)];
      const customer = customerUsers[Math.floor(Math.random() * customerUsers.length)];
      const booking = bookings[Math.floor(Math.random() * bookings.length)];

      const reviewDate = new Date(booking.date);
      reviewDate.setDate(reviewDate.getDate() + Math.floor(Math.random() * 7)); // 예약 후 0-7일 후

      const review = new Review({
        userId: customer._id.toString(),
        userName: customer.name,
        shopId: shop._id.toString(),
        shopName: shop.name,
        rating: Math.floor(Math.random() * 2) + 4, // 4-5점
        content: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
        date: reviewDate.toISOString().split('T')[0],
        sentiment: 'positive',
      });
      await review.save();
      reviews.push(review);
    }

    // 추가 리뷰 5개 생성 (예약과 무관하게)
    for (let i = 0; i < 5; i++) {
      const shop = shops[Math.floor(Math.random() * shops.length)];
      const customer = customerUsers[Math.floor(Math.random() * customerUsers.length)];
      const reviewDate = new Date(today);
      reviewDate.setDate(today.getDate() - Math.floor(Math.random() * 30)); // 최근 30일 내

      const review = new Review({
        userId: customer._id.toString(),
        userName: customer.name,
        shopId: shop._id.toString(),
        shopName: shop.name,
        rating: Math.floor(Math.random() * 2) + 4, // 4-5점
        content: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
        date: reviewDate.toISOString().split('T')[0],
        sentiment: 'positive',
      });
      await review.save();
      reviews.push(review);
    }
    console.log(`✅ ${reviews.length}개의 리뷰 생성 완료\n`);

    // 메시지 데이터 생성
    console.log('💬 메시지 데이터 생성 중...');
    const partnerId = ceoPartner._id.toString();
    const firstCustomer = customerUsers[0];

    // 메시지 생성
    const messageData = [
      {
        sender: 'user' as const,
        content: '안녕하세요! 예약 문의드립니다.',
        read: true,
      },
      {
        sender: 'partner' as const,
        content: '안녕하세요! 어떤 서비스를 원하시나요?',
        read: true,
      },
      {
        sender: 'user' as const,
        content: '컷트 서비스 예약하고 싶어요.',
        read: true,
      },
      {
        sender: 'partner' as const,
        content: '네, 가능합니다! 원하시는 날짜와 시간을 알려주세요.',
        read: false,
      },
      {
        sender: 'user' as const,
        content: '다음 주 금요일 오후 2시는 어떠세요?',
        read: false,
      },
    ];

    const createdMessages = [];
    for (let i = 0; i < messageData.length; i++) {
      const msgData = messageData[i];
      const messageDate = new Date();
      messageDate.setMinutes(messageDate.getMinutes() - (messageData.length - i) * 10); // 10분 간격

      const message = new Message({
        partnerId: partnerId,
        userId: firstCustomer._id.toString(),
        userName: firstCustomer.name,
        userPhone: firstCustomer.phone || '010-0000-0000',
        sender: msgData.sender,
        content: msgData.content,
        read: msgData.read,
        createdAt: messageDate,
        updatedAt: messageDate,
      });
      await message.save();
      createdMessages.push(message);
    }

    console.log(`✅ 메시지 ${createdMessages.length}개 생성 완료\n`);

    // 매거진 데이터 생성
    console.log('📰 매거진 데이터 생성 중...');
    const magazines = [
      {
        title: '2026 K-뷰티 트렌드: 글래스 스킨의 모든 것',
        titleTranslations: {
          ko: '2026 K-뷰티 트렌드: 글래스 스킨의 모든 것',
          en: '2026 K-Beauty Trend: Everything About Glass Skin',
          ja: '2026年K-ビューティートレンド：グラススキンのすべて',
          th: 'เทรนด์ K-Beauty 2026: ทุกอย่างเกี่ยวกับ Glass Skin',
          zh: '2026年K-美妆趋势：玻璃肌肤的完美指南',
        },
        description: '2026년을 주도할 K-뷰티 트렌드를 알아보는 시간입니다.',
        category: 'trend',
        content: '글래스 스킨 트렌드에 대한 상세한 내용...',
      },
      {
        title: '헤어 스타일링: 계절별 추천 스타일',
        titleTranslations: {
          ko: '헤어 스타일링: 계절별 추천 스타일',
          en: 'Hair Styling: Seasonal Recommendations',
          ja: 'ヘアスタイリング：季節別おすすめスタイル',
          th: 'การจัดแต่งทรงผม: แนะนำตามฤดูกาล',
          zh: '发型设计：季节性推荐款式',
        },
        description: '봄, 여름, 가을, 겨울에 어울리는 헤어 스타일을 소개합니다.',
        category: 'hair',
        content: '계절별 헤어 스타일 가이드...',
      },
      {
        title: '네일 아트: 트렌디한 디자인 모음',
        titleTranslations: {
          ko: '네일 아트: 트렌디한 디자인 모음',
          en: 'Nail Art: Trendy Design Collection',
          ja: 'ネイルアート：トレンディなデザイン集',
          th: 'เนิลปัง: คอลเลกชันดีไซน์ทันสมัย',
          zh: '美甲艺术：时尚设计合集',
        },
        description: '2026년 인기 네일 아트 디자인을 한눈에 확인하세요.',
        category: 'nail',
        content: '네일 아트 디자인 가이드...',
      },
    ];

    for (const data of magazines) {
      const magazine = new Magazine({
        ...data,
        author: 'CEO Woojin',
        imageUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1000&auto=format&fit=crop',
        date: new Date().toISOString().split('T')[0],
        readTime: '5분',
        views: Math.floor(Math.random() * 1000) + 100,
        likes: Math.floor(Math.random() * 100) + 10,
      });
      await magazine.save();
    }
    console.log(`✅ ${magazines.length}개의 매거진 생성 완료\n`);

    console.log('🎉 CEO_Woojin 모의 데이터 생성 완료!');
    console.log('\n📊 생성된 데이터 요약:');
    console.log(`   - 고객 사용자: ${customerUsers.length}명`);
    console.log(`   - 직원: 1명`);
    console.log(`   - 매장: ${shops.length}개`);
    console.log(`   - 예약: ${bookings.length}개`);
    console.log(`   - 리뷰: ${reviews.length}개`);
    console.log(`   - 메시지: ${createdMessages.length}개`);
    console.log(`   - 매거진: ${magazines.length}개`);
    console.log('\n✅ 커뮤니티 데이터는 유지되었습니다.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

seedCEOData();
