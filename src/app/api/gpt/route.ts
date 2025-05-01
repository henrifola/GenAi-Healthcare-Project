import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { nextAuthOptions } from '@/lib/auth/nextAuthOptions';

// OpenAI API URL 및 키
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// GPT 모델 및 매개변수 설정
const GPT_MODEL = process.env.OPENAI_MODEL || 'gpt-4-turbo'; // 환경변수에서 모델을 가져오거나 기본값 사용
const MAX_TOKENS = 800;
const TEMPERATURE = 0.7;

export async function POST(request: NextRequest) {
  try {
    // 사용자 세션 확인
    const session: any = await getServerSession(nextAuthOptions);
    
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    
    // 요청 본문에서 건강 데이터 추출
    const { healthData } = await request.json();
    
    if (!healthData) {
      return NextResponse.json({ error: '건강 데이터가 필요합니다.' }, { status: 400 });
    }
    
    // OpenAI API 키 확인
    if (!OPENAI_API_KEY) {
      console.error('OpenAI API 키가 설정되지 않았습니다.');
      return NextResponse.json({ error: 'API 구성이 올바르지 않습니다.' }, { status: 500 });
    }
    
    // GPT 프롬프트 생성
    const gptPrompt = createHealthInsightPrompt(healthData);
    
    // OpenAI API 호출
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: GPT_MODEL,
        messages: [
          {
            role: 'system',
            content: '당신은 개인 건강 데이터를 분석하고 통찰력 있는 조언과 추천을 제공하는 전문 건강 어시스턴트입니다. 의학적 증거를 기반으로 항상 정확하고 유용한 정보를 친근하고 도움이 되는 방식으로 제공하세요.'
          },
          { 
            role: 'user', 
            content: gptPrompt 
          }
        ],
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API 오류: ${response.status} ${response.statusText} ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    const insightText = data.choices[0]?.message?.content;
    
    if (!insightText) {
      throw new Error('AI 응답을 받을 수 없습니다.');
    }
    
    // 성공적인 응답 반환
    return NextResponse.json({ 
      success: true, 
      insight: insightText,
      // 응답을 구조화된 형식으로 파싱
      insights: parseInsights(insightText)
    });
    
  } catch (error: any) {
    console.error('GPT 건강 인사이트 생성 오류:', error);
    return NextResponse.json({ 
      error: '건강 인사이트를 생성하는 중 오류가 발생했습니다.', 
      message: error.message 
    }, { status: 500 });
  }
}

// GPT에 전송할 건강 데이터 프롬프트 생성
function createHealthInsightPrompt(healthData: any) {
  const { 
    steps, 
    sleep, 
    restingHeartRate, 
    hrvValue,
    calories,
    activeMinutes 
  } = healthData;
  
  return `
사용자의 다음 건강 데이터를 분석하여 개인화된 건강 인사이트와 추천사항을 제공해주세요:

- 걸음 수: ${steps.toLocaleString()}걸음
- 수면 시간: ${sleep}시간
- 안정시 심박수: ${restingHeartRate}bpm
- HRV(심박 변이도): ${hrvValue}ms
- 소모 칼로리: ${calories.toLocaleString()}kcal
- 활동 시간: ${activeMinutes}분

다음 형식으로 응답해주세요:

1. 건강 요약: 현재 사용자의 건강 상태에 대한 종합적인 평가를 2-3문장으로 요약
2. 활동 분석: 걸음 수와 활동 시간 데이터를 바탕으로 분석 (목표 10,000걸음 기준)
3. 수면 분석: 수면 시간에 대한 분석 (최적 수면 7-9시간 기준)
4. 심혈관 건강: 안정시 심박수와 HRV를 바탕으로 분석
5. 추천사항: 구체적이고 실행 가능한 3가지 추천사항 (활동, HRV 개선, 수면 개선 관련)

응답은 전문적이지만 이해하기 쉽게, 그리고 긍정적이고 동기부여가 되는 톤으로 작성해주세요. 의학 용어는 간단히 설명해주세요.
`;
}

// GPT 응답을 구조화된 형식으로 파싱
function parseInsights(insightText: string) {
  // 섹션별로 파싱하는 로직 구현
  const sections = {
    summary: '',
    activity: '',
    sleep: '',
    cardioHealth: '',
    recommendations: [] as string[]
  };
  
  // 건강 요약 섹션 추출
  const summaryMatch = insightText.match(/건강 요약:(.*?)(?=\d+\.\s|$)/s);
  if (summaryMatch && summaryMatch[1]) {
    sections.summary = summaryMatch[1].trim();
  }
  
  // 활동 분석 섹션 추출
  const activityMatch = insightText.match(/활동 분석:(.*?)(?=\d+\.\s|$)/s);
  if (activityMatch && activityMatch[1]) {
    sections.activity = activityMatch[1].trim();
  }
  
  // 수면 분석 섹션 추출
  const sleepMatch = insightText.match(/수면 분석:(.*?)(?=\d+\.\s|$)/s);
  if (sleepMatch && sleepMatch[1]) {
    sections.sleep = sleepMatch[1].trim();
  }
  
  // 심혈관 건강 섹션 추출
  const cardioMatch = insightText.match(/심혈관 건강:(.*?)(?=\d+\.\s|$)/s);
  if (cardioMatch && cardioMatch[1]) {
    sections.cardioHealth = cardioMatch[1].trim();
  }
  
  // 추천사항 추출 - 각 추천사항을 리스트로 추출
  const recommendationsMatch = insightText.match(/추천사항:(.*?)(?=$)/s);
  if (recommendationsMatch && recommendationsMatch[1]) {
    const recText = recommendationsMatch[1].trim();
    // 번호 매기기 형식으로 추천사항 추출
    const recommendations = recText.split(/\n-|\n\d+\./).filter(item => item.trim().length > 0);
    sections.recommendations = recommendations.map(rec => rec.trim());
  }
  
  return sections;
}