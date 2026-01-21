// 파트너 토큰 검증 유틸리티
// 데이터베이스에서 토큰을 검증합니다.

import connectDB from './mongodb';
import PartnerUser from '@/models/PartnerUser';

/**
 * 파트너 토큰 검증
 * 데이터베이스에서 토큰이 유효한지 확인합니다.
 */
export async function verifyPartnerToken(token: string): Promise<{
  valid: boolean;
  partnerId?: string;
  partnerEmail?: string;
  error?: string;
}> {
  if (!token || token.length < 10) {
    return {
      valid: false,
      error: '유효하지 않은 토큰 형식입니다.',
    };
  }

  try {
    await connectDB();

    // 모든 파트너 사용자에서 토큰 찾기
    const partner = await PartnerUser.findOne({
      'activeTokens.token': token,
    }).select('_id email activeTokens');

    if (!partner) {
      return {
        valid: false,
        error: '유효하지 않은 토큰입니다.',
      };
    }

    // 토큰 정보 찾기
    const tokenInfo = partner.activeTokens?.find((t: { token: string; createdAt: Date; expiresAt: Date; lastUsedAt?: Date }) => t.token === token);

    if (!tokenInfo) {
      return {
        valid: false,
        error: '토큰을 찾을 수 없습니다.',
      };
    }

    // 토큰 만료 확인
    if (new Date() > tokenInfo.expiresAt) {
      // 만료된 토큰 제거
      await PartnerUser.findByIdAndUpdate(
        partner._id,
        {
          $pull: { activeTokens: { token } },
        }
      );
      return {
        valid: false,
        error: '토큰이 만료되었습니다.',
      };
    }

    // 마지막 사용 시간 업데이트
    await PartnerUser.findOneAndUpdate(
      {
        _id: partner._id,
        'activeTokens.token': token,
      },
      {
        $set: {
          'activeTokens.$.lastUsedAt': new Date(),
        },
      }
    );

    return {
      valid: true,
      partnerId: partner._id.toString(),
      partnerEmail: partner.email,
    };
  } catch (error) {
    console.error('토큰 검증 오류:', error);
    return {
      valid: false,
      error: '토큰 검증 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 파트너 토큰 제거 (로그아웃 시 사용)
 */
export async function removePartnerToken(token: string): Promise<boolean> {
  try {
    await connectDB();

    const result = await PartnerUser.updateOne(
      { 'activeTokens.token': token },
      {
        $pull: { activeTokens: { token } },
      }
    );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error('토큰 제거 오류:', error);
    return false;
  }
}

/**
 * 만료된 토큰 정리
 */
export async function cleanupExpiredPartnerTokens(): Promise<number> {
  try {
    await connectDB();

    const result = await PartnerUser.updateMany(
      {},
      {
        $pull: {
          activeTokens: {
            expiresAt: { $lt: new Date() },
          },
        },
      }
    );

    return result.modifiedCount;
  } catch (error) {
    console.error('만료 토큰 정리 오류:', error);
    return 0;
  }
}
