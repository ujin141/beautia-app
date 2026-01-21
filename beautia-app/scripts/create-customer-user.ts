/**
 * 고객 사용자 생성 스크립트
 * 실행: npx tsx scripts/create-customer-user.ts
 */

import mongoose from 'mongoose';
import crypto from 'crypto';
import connectDB from '../lib/mongodb';
import CustomerUser from '../models/CustomerUser';

// 비밀번호 해시 생성
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'beautia-customer-salt').digest('hex');
}

async function createCustomerUser() {
  try {
    console.log('📦 MongoDB 연결 중...');
    await connectDB();
    console.log('✅ MongoDB 연결 완료\n');

    // 테스트 계정 정보
    const testEmail = 'test@test.com';
    const testPassword = 'test123';
    const testName = '테스트 사용자';

    // 기존 사용자 확인
    const existingUser = await CustomerUser.findOne({ email: testEmail });
    if (existingUser) {
      console.log('⚠️  이미 존재하는 사용자입니다.');
      console.log(`이메일: ${testEmail}`);
      console.log(`이름: ${existingUser.name}`);
      console.log(`비밀번호: ${testPassword}`);
      console.log('\n이 계정으로 로그인해주세요.');
      process.exit(0);
    }

    // 새 사용자 생성
    console.log('👤 고객 사용자 생성 중...');
    const newUser = new CustomerUser({
      email: testEmail,
      passwordHash: hashPassword(testPassword),
      name: testName,
      phone: '010-1234-5678',
    });

    await newUser.save();
    console.log('✅ 고객 사용자 생성 완료!\n');
    console.log('📝 로그인 정보:');
    console.log(`이메일: ${testEmail}`);
    console.log(`비밀번호: ${testPassword}`);
    console.log(`이름: ${testName}`);
    console.log('\n이제 로그인 페이지에서 이 정보로 로그인할 수 있습니다.');

    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

createCustomerUser();
