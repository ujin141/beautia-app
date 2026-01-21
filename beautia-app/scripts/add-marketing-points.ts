// 파트너 계정에 마케팅 포인트 추가 스크립트
import mongoose from 'mongoose';
import PartnerUser from '../models/PartnerUser';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/beautia';

async function addMarketingPoints() {
  try {
    // MongoDB 연결
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB 연결 성공');

    // ceo_woojin@beautia.io 파트너 찾기
    const partner = await PartnerUser.findOne({ email: 'ceo_woojin@beautia.io' });
    
    if (!partner) {
      console.error('파트너를 찾을 수 없습니다: ceo_woojin@beautia.io');
      process.exit(1);
    }

    // 마케팅 포인트 추가 (10만 포인트)
    const pointsToAdd = 100000;
    partner.marketingPoints = (partner.marketingPoints || 0) + pointsToAdd;
    await partner.save();

    console.log(`✅ 성공: ${partner.email} 계정에 ${pointsToAdd.toLocaleString()} 포인트가 추가되었습니다.`);
    console.log(`현재 총 포인트: ${partner.marketingPoints.toLocaleString()} P`);

    await mongoose.disconnect();
    console.log('MongoDB 연결 종료');
    process.exit(0);
  } catch (error) {
    console.error('오류 발생:', error);
    process.exit(1);
  }
}

addMarketingPoints();
