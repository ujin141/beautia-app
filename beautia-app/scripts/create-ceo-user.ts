/**
 * CEO 사용자 생성 스크립트 (앱용 고객 계정)
 * 실행: npx tsx scripts/create-ceo-user.ts
 */

import mongoose from 'mongoose';
import crypto from 'crypto';
import connectDB from '../lib/mongodb';
import CustomerUser from '../models/CustomerUser';

// 비밀번호 해시 생성
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'beautia-customer-salt').digest('hex');
}

async function createCEOUser() {
  try {
    console.log('📦 MongoDB 연결 중...');
    await connectDB();
    console.log('✅ MongoDB 연결 완료\n');

    // CEO 계정 정보
    const email = 'ceo_woojin@beatutia.io';
    const password = 'ceo123456'; // 기본 비밀번호 (변경 권장)
    const name = '송우진';
    const phone = '010-0000-0000'; // 필요시 수정

    // 기존 사용자 확인
    const existingUser = await CustomerUser.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('⚠️  이미 존재하는 사용자입니다.');
      console.log(`이메일: ${existingUser.email}`);
      console.log(`이름: ${existingUser.name}`);
      console.log(`생성일: ${existingUser.createdAt}`);
      console.log(`\n비밀번호를 재설정하려면 기존 계정을 삭제하거나 비밀번호 변경 API를 사용하세요.`);
      process.exit(0);
    }

    // 새 사용자 생성
    console.log('👤 CEO 사용자 생성 중...');
    const newUser = new CustomerUser({
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      name,
      phone,
      emailVerified: true, // CEO 계정이므로 이메일 인증 완료로 설정
    });

    await newUser.save();
    console.log('✅ CEO 사용자 생성 완료!\n');
    console.log('📝 로그인 정보:');
    console.log(`이메일: ${email}`);
    console.log(`비밀번호: ${password}`);
    console.log(`이름: ${name}`);
    console.log(`전화번호: ${phone}`);
    console.log('\n⚠️  보안을 위해 로그인 후 비밀번호를 변경하세요!');
    console.log('\n이제 앱에서 이 정보로 로그인할 수 있습니다.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createCEOUser();
