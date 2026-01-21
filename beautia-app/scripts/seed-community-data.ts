// 커뮤니티 모의 데이터 생성 스크립트
import connectDB from '../lib/mongodb';
import CommunityPost from '../models/CommunityPost';
import CommunityComment from '../models/CommunityComment';
import CustomerUser from '../models/CustomerUser';

async function seedCommunityData() {
  try {
    await connectDB();
    console.log('MongoDB 연결 완료\n');

    // 기존 데이터 삭제 (선택사항 - 주석 해제하면 모든 데이터 삭제)
    // await CommunityComment.deleteMany({});
    // await CommunityPost.deleteMany({});
    // console.log('기존 커뮤니티 데이터 삭제 완료');

    // 고객 사용자 가져오기
    const customers = await CustomerUser.find().limit(20).lean();
    
    if (customers.length === 0) {
      console.log('⚠️  고객 사용자가 없습니다. 먼저 고객 데이터를 생성해주세요.');
      process.exit(1);
    }

    console.log(`✅ ${customers.length}명의 고객 사용자 찾음\n`);

    const categories: Array<'question' | 'review' | 'tip' | 'free' | 'notice'> = ['question', 'review', 'tip', 'free', 'notice'];
    
    const postTitles = [
      // 질문
      '헤어 컷 추천 받고 싶어요',
      '네일 아트 어떤게 예쁠까요?',
      '스킨케어 제품 추천해주세요',
      '파마 후 관리 방법 알려주세요',
      '색깔 바꾸려는데 조언 부탁드려요',
      
      // 후기
      '미영헤어 다녀왔는데 진짜 만족스러워요!',
      '수진네일 너무 예뻐요! 추천합니다',
      '지현스킨 서비스 정말 좋았어요',
      '영희스파 마사지 최고예요',
      '민수헤어스튜디오 강력 추천!',
      
      // 팁
      '헤어 관리 팁 공유해요',
      '네일 오래 유지하는 방법',
      '홈케어 팩 만드는 법',
      '손상된 머리카락 복구하기',
      '계절별 스킨케어 루틴',
      
      // 자유
      '오늘 날씨 너무 좋아요',
      '맛있는 카페 추천받고 싶어요',
      '패션 스타일 공유해요',
      '일상 이야기 나눠요',
      '다이어트 성공담 공유',
      
      // 공지
      '커뮤니티 이용 규칙 안내',
      '이벤트 공지사항',
      '새로운 기능 안내',
      '시스템 점검 안내',
      '업데이트 공지',
    ];

    const postContents = [
      '안녕하세요! 이번 주말에 헤어 컷 받으려고 하는데 어떤 스타일이 좋을지 추천 부탁드려요.',
      '네일 아트 고민 중이에요. 어떤 디자인이 요즘 유행인가요?',
      '스킨케어 제품 고르는데 도움 필요해요. 건성 피부인데 추천 제품 있을까요?',
      '파마를 받았는데 관리 방법을 모르겠어요. 조언 부탁드립니다!',
      '헤어 컬러를 바꾸려는데 어떤 색이 저랑 잘 어울릴까요?',
      
      '미영헤어에서 컷 받고 왔는데 정말 만족스러워요! 디자이너분이 너무 친절하시고 실력도 좋으세요.',
      '수진네일 다녀왔는데 네일 아트가 정말 예뻐요! 다음에도 또 방문할 예정입니다.',
      '지현스킨에서 피부 관리 받았는데 피부가 정말 좋아졌어요. 추천합니다!',
      '영희스파에서 마사지 받았는데 정말 힐링되었어요. 다음에도 또 갈 거예요.',
      '민수헤어스튜디오에서 컷 받았는데 너무 마음에 들어요! 실력 최고입니다.',
      
      '헤어 관리 팁 공유해요. 샴푸 후 린스와 트리트먼트 꼭 사용하시고, 열 손상 조심하세요!',
      '네일 오래 유지하는 비법 알려드릴게요. 손 세척 후 크림 꼭 바르고, 손끝으로 물건 잡지 마세요.',
      '홈케어 팩 만드는 법 공유합니다. 오이와 요거트 섞어서 바르면 정말 좋아요.',
      '손상된 머리카락 복구하는 방법 알려드릴게요. 정기적으로 트리트먼트하고, 자외선 차단도 중요해요.',
      '계절별 스킨케어 루틴 공유합니다. 봄/여름은 가벼운 제품, 가을/겨울은 수분 충전이 중요해요.',
      
      '오늘 날씨 정말 좋네요! 이런 날에는 산책하는 게 최고인 것 같아요.',
      '맛있는 카페 추천받고 싶어요. 분위기 좋고 커피 맛있는 곳 있으면 알려주세요!',
      '오늘 입은 옷 스타일 공유해요. 어때요?',
      '일상 이야기 나눠요. 오늘 하루 어떻게 보내셨나요?',
      '다이어트 성공담 공유합니다. 3개월 만에 10kg 감량 성공했어요!',
      
      '커뮤니티 이용 규칙을 안내드립니다. 서로 존중하며 소통해주세요.',
      '이벤트 공지사항입니다. 참여하시고 특별한 혜택을 받아가세요!',
      '새로운 기능이 추가되었습니다. 많은 이용 부탁드려요.',
      '시스템 점검 안내입니다. 점검 시간 동안 서비스가 일시 중단될 수 있습니다.',
      '업데이트 공지입니다. 새로운 기능과 개선사항을 확인해주세요.',
    ];

    const commentContents = [
      '좋은 정보 감사합니다!',
      '저도 같은 생각이에요',
      '추천해주신 곳 한번 가볼게요',
      '정말 도움됐어요 감사합니다',
      '다음에도 좋은 정보 부탁드려요',
      '저도 비슷한 경험이 있어요',
      '완전 공감합니다!',
      '좋은 글 감사합니다',
      '유용한 정보네요',
      '도움이 많이 됐어요',
      '저도 한번 해볼게요',
      '정말 좋은 팁이에요',
      '완전 추천합니다',
      '저도 같은 후기 쓸 수 있을 것 같아요',
      '좋은 경험 공유 감사합니다',
    ];

    // 게시글 생성 (30-50개)
    const postCount = Math.floor(Math.random() * 21) + 30; // 30-50개
    const posts = [];

    for (let i = 0; i < postCount; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const category = i < 5 ? 'notice' : // 처음 5개는 공지
                       i < 10 ? 'question' : // 다음 5개는 질문
                       i < 20 ? 'review' : // 다음 10개는 후기
                       i < 25 ? 'tip' : // 다음 5개는 팁
                       'free'; // 나머지는 자유
      
      const titleIndex = Math.floor(Math.random() * postTitles.length);
      const contentIndex = Math.floor(Math.random() * postContents.length);

      // 날짜 생성 (최근 60일 내)
      const daysAgo = Math.floor(Math.random() * 60);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      // 고정 게시글 (공지 중 일부)
      const isPinned = category === 'notice' && Math.random() > 0.7;

      // 이미지 (30% 확률)
      const images = Math.random() > 0.7 ? [
        `https://images.unsplash.com/photo-${Math.floor(Math.random() * 10000000000000)}?q=80&w=800&auto=format&fit=crop`,
      ] : [];

      // 태그 (50% 확률)
      const tags = Math.random() > 0.5 ? ['추천', '만족', '팁'] : [];

      const post = new CommunityPost({
        userId: customer._id.toString(),
        userName: customer.name,
        title: postTitles[titleIndex] || `제목 ${i + 1}`,
        content: postContents[contentIndex] || `내용 ${i + 1}`,
        category,
        images,
        likes: Math.floor(Math.random() * 100),
        views: Math.floor(Math.random() * 500) + 50,
        commentCount: 0, // 나중에 업데이트
        isPinned,
        isDeleted: Math.random() > 0.95, // 5% 확률로 삭제됨
        deletedAt: Math.random() > 0.95 ? new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined,
        reportedCount: Math.random() > 0.9 ? Math.floor(Math.random() * 3) + 1 : 0, // 10% 확률로 신고
        tags,
        createdAt,
      });

      await post.save();
      posts.push(post);
      
      if ((i + 1) % 10 === 0) {
        console.log(`✅ 게시글 ${i + 1}/${postCount} 생성 완료`);
      }
    }

    console.log(`\n✅ 총 ${posts.length}개의 게시글 생성 완료\n`);

    // 댓글 생성 (각 게시글마다 0-10개)
    let totalComments = 0;
    const allComments: any[] = []; // 대댓글용

    for (const post of posts) {
      if (post.isDeleted) continue; // 삭제된 게시글에는 댓글 없음

      const commentCount = Math.floor(Math.random() * 11); // 0-10개
      const postComments: any[] = []; // 이 게시글의 댓글들
      
      for (let i = 0; i < commentCount; i++) {
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const contentIndex = Math.floor(Math.random() * commentContents.length);
        
        // 날짜 생성 (게시글 작성 후)
        const createdAt = new Date(post.createdAt);
        createdAt.setMinutes(createdAt.getMinutes() + Math.floor(Math.random() * 30 * 24 * 60)); // 최대 30일 후

        // 대댓글 (30% 확률, 이 게시글의 이전 댓글에 대댓글)
        const parentCommentId = i > 0 && Math.random() > 0.7 && postComments.length > 0
          ? postComments[Math.floor(Math.random() * postComments.length)]._id.toString()
          : undefined;

        const comment = new CommunityComment({
          postId: post._id.toString(),
          userId: customer._id.toString(),
          userName: customer.name,
          content: commentContents[contentIndex] || `댓글 ${i + 1}`,
          parentCommentId,
          likes: Math.floor(Math.random() * 20),
          isDeleted: Math.random() > 0.95, // 5% 확률로 삭제됨
          deletedAt: Math.random() > 0.95 ? new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : undefined,
          reportedCount: Math.random() > 0.9 ? Math.floor(Math.random() * 2) + 1 : 0, // 10% 확률로 신고
          createdAt,
        });

        await comment.save();
        postComments.push(comment);
        allComments.push(comment);
        totalComments++;
      }

      // 게시글 댓글 수 업데이트 (삭제되지 않은 댓글만 카운트)
      const activeCommentCount = postComments.filter(c => !c.isDeleted).length;
      await CommunityPost.findByIdAndUpdate(post._id, {
        commentCount: activeCommentCount,
      });
    }

    console.log(`✅ 총 ${totalComments}개의 댓글 생성 완료\n`);

    // 최종 통계
    const totalPosts = await CommunityPost.countDocuments({ isDeleted: false });
    const totalCommentsActive = await CommunityComment.countDocuments({ isDeleted: false });
    const reportedPosts = await CommunityPost.countDocuments({ reportedCount: { $gt: 0 } });
    const reportedComments = await CommunityComment.countDocuments({ reportedCount: { $gt: 0 } });

    console.log('📊 커뮤니티 모의 데이터 생성 완료!\n');
    console.log('생성된 데이터 요약:');
    console.log(`- 활성 게시글: ${totalPosts}개`);
    console.log(`- 활성 댓글: ${totalCommentsActive}개`);
    console.log(`- 신고된 게시글: ${reportedPosts}개`);
    console.log(`- 신고된 댓글: ${reportedComments}개`);

    // 카테고리별 통계
    for (const category of categories) {
      const count = await CommunityPost.countDocuments({ 
        category, 
        isDeleted: false 
      });
      console.log(`  - ${category}: ${count}개`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

seedCommunityData();
