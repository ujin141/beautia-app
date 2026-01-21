// 고객 토큰 검증 유틸리티
// 데이터베이스에서 토큰을 검증합니다.

import connectDB from './mongodb';
import CustomerUser from '@/models/CustomerUser';

/**
 * 고객 토큰 검증
 * 데이터베이스에서 토큰이 유효한지 확인합니다.
 */
export async function verifyCustomerToken(token: string): Promise<{
  id: string;
  email: string;
  name: string;
  _id?: any;
} | null> {
  if (!token || token.length < 10) {
    return null;
  }

  try {
    await connectDB();

    // 모든 고객 사용자에서 토큰 찾기
    const customer = await CustomerUser.findOne({
      'activeTokens.token': token,
    }).select('_id email name activeTokens');

    if (!customer) {
      return null;
    }

    // 토큰 정보 찾기
    const tokenInfo = customer.activeTokens?.find((t: { token: string; createdAt: Date; expiresAt: Date; lastUsedAt?: Date }) => t.token === token);

    if (!tokenInfo) {
      return null;
    }

    // 토큰 만료 확인
    if (new Date() > tokenInfo.expiresAt) {
      // 만료된 토큰 제거
      await CustomerUser.findByIdAndUpdate(
        customer._id,
        {
          $pull: { activeTokens: { token } },
        }
      );
      return null;
    }

    // 마지막 사용 시간 업데이트
    await CustomerUser.findOneAndUpdate(
      {
        _id: customer._id,
        'activeTokens.token': token,
      },
      {
        $set: {
          'activeTokens.$.lastUsedAt': new Date(),
        },
      }
    );

    return {
      id: customer._id.toString(),
      email: customer.email,
      name: customer.name,
      _id: customer._id,
    };
  } catch (error) {
    console.error('고객 토큰 검증 오류:', error);
    return null;
  }
}
