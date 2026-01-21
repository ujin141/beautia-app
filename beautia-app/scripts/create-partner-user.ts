// 파트너 사용자 생성 스크립트
// 사용법: tsx scripts/create-partner-user.ts

import connectDB from '../lib/mongodb';
import PartnerUser from '../models/PartnerUser';
import Shop from '../models/Shop';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'beautia-salt').digest('hex');
}

async function createPartnerUser() {
  try {
    await connectDB();

    const email = process.argv[2] || 'partner@beautia.com';
    const password = process.argv[3] || 'partner123';
    const name = process.argv[4] || 'Test Partner';
    const phone = process.argv[5] || '010-1234-5678';
    const shopName = process.argv[6] || 'Test Shop';
    const category = process.argv[7] || 'Hair';

    // 비밀번호 해시 생성
    const passwordHash = hashPassword(password);

    // 기존 사용자 확인
    const existing = await PartnerUser.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.log('❌ 이미 존재하는 이메일입니다.');
      console.log(`   이메일: ${existing.email}`);
      console.log(`   이름: ${existing.name}`);
      process.exit(1);
    }

    // 새 파트너 사용자 생성
    const partner = new PartnerUser({
      email: email.toLowerCase(),
      passwordHash,
      name,
      phone,
    });

    await partner.save();

    // 매장 정보 생성
    const shop = new Shop({
      partnerId: partner._id.toString(),
      name: shopName,
      category,
      address: '서울시 강남구',
      rating: 0,
      reviewCount: 0,
      imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=1000&auto=format&fit=crop',
      description: 'Test Shop Description',
      services: [],
    });

    await shop.save();

    console.log('✅ 파트너 사용자가 생성되었습니다!');
    console.log(`   이메일: ${email}`);
    console.log(`   이름: ${name}`);
    console.log(`   전화번호: ${phone}`);
    console.log(`   매장명: ${shopName}`);
    console.log(`   카테고리: ${category}`);
    console.log(`   비밀번호: ${password}`);
    console.log('\n⚠️  비밀번호를 안전하게 보관하세요!');

    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

createPartnerUser();
