// 어드민 사용자 생성 스크립트
// 사용법: tsx scripts/create-admin-user.ts

import connectDB from '../lib/mongodb';
import AdminUser from '../models/AdminUser';
import crypto from 'crypto';

async function createAdminUser() {
  try {
    await connectDB();

    const email = process.argv[2] || 'admin@beautia.com';
    const password = process.argv[3] || 'admin123';
    const name = process.argv[4] || 'Super Admin';
    const role = (process.argv[5] as 'super_admin' | 'admin' | 'moderator') || 'super_admin';

    // 비밀번호 해시 생성
    const passwordHash = crypto
      .createHash('sha256')
      .update(password + (process.env.ADMIN_PASSWORD_SALT || 'beautia-admin-salt'))
      .digest('hex');

    // 기존 사용자 확인
    const existing = await AdminUser.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.log('❌ 이미 존재하는 이메일입니다.');
      console.log(`   이메일: ${existing.email}`);
      console.log(`   이름: ${existing.name}`);
      console.log(`   역할: ${existing.role}`);
      process.exit(1);
    }

    // 새 어드민 사용자 생성
    const admin = new AdminUser({
      email: email.toLowerCase(),
      passwordHash,
      name,
      role,
      isActive: true,
    });

    await admin.save();

    console.log('✅ 어드민 사용자가 생성되었습니다!');
    console.log(`   이메일: ${email}`);
    console.log(`   이름: ${name}`);
    console.log(`   역할: ${role}`);
    console.log(`   비밀번호: ${password}`);
    console.log('\n⚠️  비밀번호를 안전하게 보관하세요!');

    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

createAdminUser();
