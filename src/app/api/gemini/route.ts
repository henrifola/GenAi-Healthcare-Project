import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { nextAuthOptions } from '@/lib/auth/nextAuthOptions';
import { GoogleGenerativeAI } from '@google/generative-ai';
import HealthInsight from '@/lib/db/models/health-insight.model'; // Import the new model
import connectMongoDB from '@/lib/db/mongoose'; // Import DB connection
import crypto from 'crypto'; // For hashing

// Helper function to generate a SHA256 hash of an object
function generateHash(data: any): string {
  const dataString = JSON.stringify(data);
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

// Gemini API 키 및 모델 설정
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-pro';

// Gemini 모델 초기화
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');

// Gemini 모델 및 매개변수 설정
const MAX_TOKENS = 10000;
const TEMPERATURE = 0.7;

export async function POST(request: NextRequest) {
  try {
    await connectMongoDB(); // Ensure DB connection

    // 사용자 세션 확인
    const session: any = await getServerSession(nextAuthOptions);
    
    if (!session) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    
    // 요청 본문에서 건강 데이터 추출
    const { healthData, date: requestDate } = await request.json(); // Get date from request
    
    if (!healthData) {
      return NextResponse.json({ error: '건강 데이터가 필요합니다.' }, { status: 400 });
    }

    const userId = session.user.id;
    const date = requestDate || new Date().toISOString().split('T')[0]; // Use request date or current date
    const healthDataHash = generateHash(healthData);

    // 1. 캐시된 인사이트 확인
    const cachedInsight = await HealthInsight.findOne({
      userId: userId,
      date: date,
      healthDataHash: healthDataHash,
    });

    if (cachedInsight) {
      console.log('Returning cached Gemini insight for user:', userId, 'date:', date);
      return NextResponse.json({
        success: true,
        insight: cachedInsight.insights.summary, // Return summary as main insight text
        insights: cachedInsight.insights,
      });
    }
    
    // Gemini API 키 확인
    if (!GEMINI_API_KEY) {
      console.error('Gemini API 키가 설정되지 않았습니다.');
      return NextResponse.json({ error: 'API 구성이 올바르지 않습니다.' }, { status: 500 });
    }
    
    // Gemini 프롬프트 생성
    const geminiPrompt = createHealthInsightPrompt(healthData);
    
    // Gemini API 호출
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: geminiPrompt }] }],
      generationConfig: {
        maxOutputTokens: MAX_TOKENS,
        temperature: TEMPERATURE,
      },
    });

    const response = result.response;
    let insightText = '';

    // Try to get text directly from candidates first
    if (response.candidates && response.candidates.length > 0 && response.candidates[0].content && response.candidates[0].content.parts && response.candidates[0].content.parts.length > 0) {
      insightText = response.candidates[0].content.parts[0].text || '';
    }

    // Fallback to response.text() if direct access is empty
    if (!insightText) {
      insightText = response.text();
    }
    
    console.log('Gemini API Generated Insight Text:', insightText); // Log the actual text

    if (!insightText) {
      console.error('Gemini API returned empty text response after all attempts.'); // More specific error
      throw new Error('AI 응답을 받을 수 없습니다.');
    }
    
    // 응답을 구조화된 형식으로 파싱
    const parsedInsights = parseInsights(insightText);

    // 2. 새로 생성된 인사이트를 DB에 저장/업데이트
    await HealthInsight.findOneAndUpdate(
      { userId: userId, date: date }, // Find by user and date
      {
        userId: userId,
        date: date,
        healthDataHash: healthDataHash,
        insights: parsedInsights,
      },
      { upsert: true, new: true } // Create if not exists, return new doc
    );
    console.log('Gemini insight saved/updated to DB for user:', userId, 'date:', date);

    // 성공적인 응답 반환
    return NextResponse.json({ 
      success: true, 
      insight: insightText, // Still return full insight text for display
      insights: parsedInsights,
    });
    
  } catch (error: any) {
    console.error('Gemini 건강 인사이트 생성 오류:', error);
    return NextResponse.json({ 
      error: '건강 인사이트를 생성하는 중 오류가 발생했습니다.', 
      message: error.message 
    }, { status: 500 });
  }
}

// Gemini에 전송할 건강 데이터 프롬프트 생성
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
응답은 반드시 다음 JSON 형식으로만 제공해야 합니다. 추가적인 설명이나 마크다운은 포함하지 마세요.
${JSON.stringify({
  summary: "현재 사용자의 건강 상태에 대한 종합적인 평가 (2-3문장)",
  activity: "걸음 수와 활동 시간 데이터를 바탕으로 분석",
  sleep: "수면 시간에 대한 분석",
  cardioHealth: "안정시 심박수와 HRV를 바탕으로 분석",
  recommendations: [
    "구체적이고 실행 가능한 첫 번째 추천사항",
    "구체적이고 실행 가능한 두 번째 추천사항",
    "구체적이고 실행 가능한 세 번째 추천사항"
  ]
}, null, 2)}
`;
}

// Gemini 응답을 구조화된 형식으로 파싱
function parseInsights(insightText: string) {
  // Remove leading/trailing markdown code block delimiters if present
  let cleanedText = insightText.trim();
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.substring('```json'.length);
  }
  if (cleanedText.endsWith('```')) {
    cleanedText = cleanedText.substring(0, cleanedText.length - '```'.length);
  }
  cleanedText = cleanedText.trim(); // Trim again after removing delimiters

  try {
    const parsed = JSON.parse(cleanedText);
    // Validate the structure to ensure it matches IHealthInsights
    if (
      typeof parsed.summary === 'string' &&
      typeof parsed.activity === 'string' &&
      typeof parsed.sleep === 'string' &&
      typeof parsed.cardioHealth === 'string' &&
      Array.isArray(parsed.recommendations) &&
      parsed.recommendations.every((rec: any) => typeof rec === 'string')
    ) {
      return parsed;
    } else {
      console.error('Parsed JSON does not match expected HealthInsights structure:', parsed);
      throw new Error('AI 응답 파싱 실패: 예상치 못한 JSON 구조');
    }
  } catch (error) {
    console.error('AI 응답 JSON 파싱 오류:', error);
    // Fallback to a default empty structure or re-throw
    return {
      summary: 'AI 인사이트를 파싱하는 데 실패했습니다.',
      activity: '',
      sleep: '',
      cardioHealth: '',
      recommendations: []
    };
  }
}
