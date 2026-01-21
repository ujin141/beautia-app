import { NextRequest, NextResponse } from 'next/server';
import { DICTIONARY } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';

// 브로슈어 데이터 가져오기
function getBrochureData(lang: Language = 'ko') {
  const dict = DICTIONARY[lang] || DICTIONARY.ko;
  const partner = dict.partner_landing || DICTIONARY.ko.partner_landing;
  
  return {
    title: partner.title || "BEAUTIA 파트너 프로그램",
    subtitle: partner.subtitle || "글로벌 고객을 자동으로 만나는 방법",
    sections: [
      {
        title: lang === 'ko' ? "왜 BEAUTIA인가?" : 
               lang === 'en' ? "Why BEAUTIA?" :
               lang === 'ja' ? "なぜBEAUTIAなのか？" :
               lang === 'th' ? "ทำไมต้อง BEAUTIA?" :
               "为什么选择BEAUTIA?",
        items: [
          partner.val1_desc || "전 세계 100만 명의 글로벌 사용자",
          lang === 'ko' ? "자동 번역 시스템으로 언어 장벽 해소" :
          lang === 'en' ? "Automatic translation system eliminates language barriers" :
          lang === 'ja' ? "自動翻訳システムで言語の壁を解消" :
          lang === 'th' ? "ระบบแปลภาษาอัตโนมัติขจัดอุปสรรคด้านภาษา" :
          "自动翻译系统消除语言障碍",
          lang === 'ko' ? "선결제 시스템으로 노쇼(No-Show) 제로" :
          lang === 'en' ? "Pre-payment system eliminates No-Shows" :
          lang === 'ja' ? "事前決済システムでノーショーゼロ" :
          lang === 'th' ? "ระบบชำระเงินล่วงหน้าขจัด No-Show" :
          "预付款系统消除 No-Show",
          lang === 'ko' ? "매주 자동 정산 시스템" :
          lang === 'en' ? "Weekly automatic settlement system" :
          lang === 'ja' ? "毎週自動精算システム" :
          lang === 'th' ? "ระบบชำระเงินอัตโนมัติรายสัปดาห์" :
          "每周自动结算系统"
        ]
      },
      {
        title: lang === 'ko' ? "파트너 혜택" :
               lang === 'en' ? "Partner Benefits" :
               lang === 'ja' ? "パートナー特典" :
               lang === 'th' ? "สิทธิประโยชน์ของพาร์ทเนอร์" :
               "合作伙伴福利",
        items: [
          lang === 'ko' ? "초기 가입비 0원" :
          lang === 'en' ? "Zero initial registration fee" :
          lang === 'ja' ? "初期登録費0円" :
          lang === 'th' ? "ค่าลงทะเบียนเริ่มต้น 0 บาท" :
          "初始注册费 0元",
          lang === 'ko' ? "첫 달 수수료 면제" :
          lang === 'en' ? "First month fee waived" :
          lang === 'ja' ? "初月手数料無料" :
          lang === 'th' ? "ยกเว้นค่าธรรมเนียมเดือนแรก" :
          "首月费用免除",
          lang === 'ko' ? "전용 대시보드 제공" :
          lang === 'en' ? "Dedicated dashboard provided" :
          lang === 'ja' ? "専用ダッシュボード提供" :
          lang === 'th' ? "แดชบอร์ดเฉพาะ" :
          "提供专用仪表板",
          lang === 'ko' ? "24/7 고객 지원" :
          lang === 'en' ? "24/7 customer support" :
          lang === 'ja' ? "24時間365日カスタマーサポート" :
          lang === 'th' ? "บริการลูกค้า 24/7" :
          "24/7 客户支持"
        ]
      },
      {
        title: partner.process_title || "단순한 프로세스",
        steps: [
          { 
            step: "1", 
            title: partner.process_step1_title || "신청", 
            desc: partner.process_step1_desc || "기본 정보 입력" 
          },
          { 
            step: "2", 
            title: partner.process_step2_title || "심사", 
            desc: partner.process_step2_desc || "서류 검토 (1-2일)" 
          },
          { 
            step: "3", 
            title: partner.process_step3_title || "프로필", 
            desc: partner.process_step3_desc || "메뉴/사진 업로드" 
          },
          { 
            step: "4", 
            title: partner.process_step4_title || "시작", 
            desc: partner.process_step4_desc || "글로벌 고객 만나기" 
          }
        ]
      },
      {
        title: lang === 'ko' ? "통계" :
               lang === 'en' ? "Statistics" :
               lang === 'ja' ? "統計" :
               lang === 'th' ? "สถิติ" :
               "统计数据",
        stats: [
          { 
            label: partner.stat_avg_revenue || "평균 월 추가 매출", 
            value: "+35%" 
          },
          { 
            label: partner.stat_revisit_rate || "외국인 재방문율", 
            value: "68%" 
          },
          { 
            label: partner.stat_satisfaction || "파트너 만족도", 
            value: "4.8/5" 
          }
        ]
      },
      {
        title: lang === 'ko' ? "연락처" :
               lang === 'en' ? "Contact" :
               lang === 'ja' ? "連絡先" :
               lang === 'th' ? "ติดต่อ" :
               "联系方式",
        contact: {
          email: "partners@beautia.com",
          phone: lang === 'ko' ? "02-1234-5678" :
                 lang === 'en' ? "+82-2-1234-5678" :
                 lang === 'ja' ? "+82-2-1234-5678" :
                 lang === 'th' ? "+82-2-1234-5678" :
                 "+82-2-1234-5678",
          website: "www.beautia.com",
          emailLabel: lang === 'ko' ? "이메일:" :
                     lang === 'en' ? "Email:" :
                     lang === 'ja' ? "メール:" :
                     lang === 'th' ? "อีเมล:" :
                     "电子邮件:",
          phoneLabel: lang === 'ko' ? "전화:" :
                     lang === 'en' ? "Phone:" :
                     lang === 'ja' ? "電話:" :
                     lang === 'th' ? "โทรศัพท์:" :
                     "电话:",
          websiteLabel: lang === 'ko' ? "웹사이트:" :
                       lang === 'en' ? "Website:" :
                       lang === 'ja' ? "ウェブサイト:" :
                       lang === 'th' ? "เว็บไซต์:" :
                       "网站:"
        }
      }
    ]
  };
}

// GET: 파트너 브로슈어 PDF 생성 및 다운로드
export async function GET(request: NextRequest) {
  try {
    // 언어 파라미터 가져오기
    const searchParams = request.nextUrl.searchParams;
    const lang = (searchParams.get('lang') || 'ko') as Language;
    
    // 브로슈어 데이터 가져오기
    const brochureData = getBrochureData(lang);
    
    // 언어별 HTML lang 속성
    const htmlLang = lang === 'ko' ? 'ko' :
                     lang === 'en' ? 'en' :
                     lang === 'ja' ? 'ja' :
                     lang === 'th' ? 'th' :
                     'zh';

    // HTML 브로슈어 생성
    const html = `
<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${brochureData.title}</title>
    <style>
        @page {
            margin: 20mm;
            size: A4;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            color: #333;
            line-height: 1.6;
            margin: 0;
            padding: 0;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
            margin-bottom: 40px;
            border-radius: 8px;
        }
        .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: bold;
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 18px;
            opacity: 0.9;
        }
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .section-title {
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 15px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        .items-list {
            list-style: none;
            padding: 0;
        }
        .items-list li {
            padding: 10px 0;
            padding-left: 30px;
            position: relative;
        }
        .items-list li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #667eea;
            font-weight: bold;
            font-size: 20px;
        }
        .steps {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-top: 20px;
        }
        .step-card {
            border: 2px solid #667eea;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        .step-number {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
        }
        .step-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .step-desc {
            font-size: 14px;
            color: #666;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-top: 20px;
        }
        .stat-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 14px;
            color: #666;
        }
        .contact {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
        }
        .contact-item {
            margin: 10px 0;
            font-size: 16px;
        }
        .contact-item strong {
            color: #667eea;
            margin-right: 10px;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            padding: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${brochureData.title}</h1>
        <p>${brochureData.subtitle}</p>
    </div>

    ${brochureData.sections.map(section => {
        if (section.items) {
            return `
                <div class="section">
                    <div class="section-title">${section.title}</div>
                    <ul class="items-list">
                        ${section.items.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            `;
        } else if (section.steps) {
            return `
                <div class="section">
                    <div class="section-title">${section.title}</div>
                    <div class="steps">
                        ${section.steps.map(step => `
                            <div class="step-card">
                                <div class="step-number">${step.step}</div>
                                <div class="step-title">${step.title}</div>
                                <div class="step-desc">${step.desc}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else if (section.stats) {
            return `
                <div class="section">
                    <div class="section-title">${section.title}</div>
                    <div class="stats">
                        ${section.stats.map(stat => `
                            <div class="stat-card">
                                <div class="stat-value">${stat.value}</div>
                                <div class="stat-label">${stat.label}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else if (section.contact) {
            return `
                <div class="section">
                    <div class="section-title">${section.title}</div>
                    <div class="contact">
                        <div class="contact-item"><strong>${section.contact.emailLabel}</strong>${section.contact.email}</div>
                        <div class="contact-item"><strong>${section.contact.phoneLabel}</strong>${section.contact.phone}</div>
                        <div class="contact-item"><strong>${section.contact.websiteLabel}</strong>${section.contact.website}</div>
                    </div>
                </div>
            `;
        }
        return '';
    }).join('')}

    <div class="footer">
        <p>© 2026 BEAUTIA. All rights reserved.</p>
        <p>${lang === 'ko' ? '더 자세한 정보는 www.beautia.com/partner 를 방문하세요.' :
           lang === 'en' ? 'For more information, visit www.beautia.com/partner' :
           lang === 'ja' ? '詳細情報は www.beautia.com/partner をご覧ください。' :
           lang === 'th' ? 'สำหรับข้อมูลเพิ่มเติม กรุณาเยี่ยมชม www.beautia.com/partner' :
           '更多信息，请访问 www.beautia.com/partner'}</p>
    </div>
</body>
</html>
    `;

    // HTML을 PDF로 변환 (실제로는 puppeteer나 다른 라이브러리 사용)
    // 현재는 HTML을 반환하고, 클라이언트에서 PDF로 변환하거나
    // 다른 방법으로 처리해야 합니다.
    
    // 간단한 방법: HTML 파일로 반환
    const filename = lang === 'ko' ? 'beautia-partner-brochure.html' :
                     lang === 'en' ? 'beautia-partner-brochure-en.html' :
                     lang === 'ja' ? 'beautia-partner-brochure-ja.html' :
                     lang === 'th' ? 'beautia-partner-brochure-th.html' :
                     'beautia-partner-brochure-zh.html';
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('브로슈어 생성 오류:', error);
    return NextResponse.json(
      { error: '브로슈어 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
