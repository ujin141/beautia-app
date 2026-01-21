// 어드민 토큰 검증 유틸리티
// 데이터베이스에서 토큰을 검증합니다.

import connectDB from './mongodb';
import AdminUser from '@/models/AdminUser';

/**
 * 어드민 토큰 검증
 * 데이터베이스에서 토큰이 유효한지 확인합니다.
 */
export async function verifyAdminToken(token: string): Promise<{
  valid: boolean;
  adminId?: string;
  adminEmail?: string;
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

    // 모든 활성 어드민 사용자에서 토큰 찾기 (인덱스 최적화)
    const admin = await AdminUser.findOne({
      isActive: true,
      'activeTokens.token': token,
    }).select('_id email activeTokens');

    if (!admin) {
      return {
        valid: false,
        error: '유효하지 않은 토큰입니다.',
      };
    }

    // 토큰 정보 찾기
    const tokenInfo = admin.activeTokens?.find((t: { token: string; createdAt: Date; expiresAt: Date; lastUsedAt?: Date }) => t.token === token);

    if (!tokenInfo) {
      return {
        valid: false,
        error: '토큰을 찾을 수 없습니다.',
      };
    }

    // 토큰 만료 확인
    if (new Date() > tokenInfo.expiresAt) {
      // 만료된 토큰 제거
      await AdminUser.findByIdAndUpdate(
        admin._id,
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
    await AdminUser.findOneAndUpdate(
      {
        _id: admin._id,
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
      adminId: admin._id.toString(),
      adminEmail: admin.email,
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
 * 어드민 토큰 제거 (로그아웃 시 사용)
 */
export async function removeAdminToken(token: string): Promise<boolean> {
  try {
    await connectDB();

    const result = await AdminUser.updateOne(
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
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    await connectDB();

    const result = await AdminUser.updateMany(
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
