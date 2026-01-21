export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { withPostHandler } from '@/lib/api-handler';
import { successResponse, validationErrorResponse } from '@/lib/api-response';
import { validateRequestBody, required, email, minLength } from '@/lib/api-validator';
import CustomerUser from '@/models/CustomerUser';

// 비밀번호 해시 생성
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'beautia-customer-salt').digest('hex');
}

// POST: 고객 회원가입
async function handlePost(request: NextRequest) {
  const body = await request.json();
  const { email: emailInput, password, name, phone } = body;

  // 유효성 검사
  const validation = validateRequestBody(body, [
    required('email', '이메일을 입력해주세요.'),
    email('email', '올바른 이메일 형식이어야 합니다.'),
    required('password', '비밀번호를 입력해주세요.'),
    minLength('password', 6, '비밀번호는 최소 6자 이상이어야 합니다.'),
    required('name', '이름을 입력해주세요.'),
  ]);

  if (!validation.valid) {
    return validationErrorResponse(validation.error!, validation.details);
  }

  // 이미 존재하는 이메일인지 확인
  const existingUser = await CustomerUser.findOne({ email: emailInput.toLowerCase() });
  if (existingUser) {
    return validationErrorResponse('이미 등록된 이메일입니다.');
  }

  // 새 사용자 생성
  const newUser = new CustomerUser({
    email: emailInput.toLowerCase(),
    passwordHash: hashPassword(password),
    name,
    phone: phone || '',
  });

  await newUser.save();

  // 비밀번호 해시는 제외하고 반환
  const userObj = newUser.toObject();
  const { passwordHash, __v, ...userWithoutPassword } = userObj;

  return successResponse(
    {
      id: userWithoutPassword._id.toString(),
      ...userWithoutPassword,
      _id: undefined,
      joinDate: userWithoutPassword.joinDate.toISOString(),
      createdAt: userWithoutPassword.createdAt.toISOString(),
      updatedAt: userWithoutPassword.updatedAt.toISOString(),
    },
    '회원가입이 완료되었습니다.',
    201
  );
}

export const POST = withPostHandler(handlePost);
