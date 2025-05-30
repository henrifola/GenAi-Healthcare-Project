// GPT API를 호출하여 건강 데이터 인사이트를 가져오는 유틸리티 함수

interface HealthData {
  steps: number;
  sleep: number;
  restingHeartRate: number;
  hrvValue: number;
  calories: number;
  activeMinutes: number;
  analysisContext?: string; // 선택한 날짜 기준 최근 1주일 데이터를 기반으로 분석 중임을 명시하는 필드
}

interface HealthInsights {
  summary: string;
  activity: string;
  sleep: string;
  cardioHealth: string;
  recommendations: string[];
}

interface GPTResponse {
  success: boolean;
  insight: string;
  insights: HealthInsights;
}

/**
 * GPT API를 호출하여 건강 데이터 분석 및 인사이트를 요청합니다.
 * @param healthData 분석할 건강 데이터
 * @returns 건강 인사이트 분석 결과
 */
export const fetchHealthInsights = async (healthData: HealthData): Promise<GPTResponse | null> => {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ healthData }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('GPT 인사이트 요청 실패:', errorData);
      throw new Error('건강 인사이트를 생성하는 중 오류가 발생했습니다.');
    }

    const data = await response.json();
    return data as GPTResponse;
  } catch (error) {
    console.error('건강 인사이트 요청 오류:', error);
    return null;
  }
};

/**
 * 하드코딩된 규칙 기반 건강 인사이트를 생성합니다.
 * GPT API가 실패하거나 사용할 수 없는 경우 폴백으로 사용됩니다.
 * @param healthData 분석할 건강 데이터
 * @returns 하드코딩된 건강 인사이트
 */
export const generateFallbackInsights = (healthData: HealthData): HealthInsights => {
  const { steps, sleep, restingHeartRate, hrvValue, activeMinutes } = healthData;
  
  // 활동 분석
  let activity = '';
  if (steps >= 10000) {
    activity = `걸음 수가 ${steps.toLocaleString()}걸음으로 일일 권장량인 10,000걸음을 달성하셨습니다! 꾸준한 활동은 심혈관 건강과 전반적인 웰빙을 크게 향상시킵니다.`;
  } else if (steps >= 7500) {
    activity = `걸음 수가 ${steps.toLocaleString()}걸음으로 괜찮은 수준이지만, 일일 권장량인 10,000걸음까지는 ${(10000 - steps).toLocaleString()}걸음이 더 필요합니다. 조금만 더 활동해보세요.`;
  } else {
    activity = `걸음 수가 ${steps.toLocaleString()}걸음으로 일일 권장량인 10,000걸음에 비해 다소 적습니다. 건강한 생활을 위해 일상에서 더 많이 걷는 것을 고려해보세요.`;
  }
  
  // 수면 분석
  let sleepAnalysis = '';
  if (sleep >= 7 && sleep <= 9) {
    sleepAnalysis = `수면 시간이 ${sleep}시간으로 성인을 위한 이상적인 범위(7-9시간) 안에 있습니다. 좋은 수면 습관을 유지하세요.`;
  } else if (sleep < 7) {
    sleepAnalysis = `수면 시간이 ${sleep}시간으로 권장 범위(7-9시간)보다 짧습니다. 수면 부족은 장기적으로 건강 문제를 일으킬 수 있으니 수면 시간을 늘려보세요.`;
  } else {
    sleepAnalysis = `수면 시간이 ${sleep}시간으로 권장 범위(7-9시간)보다 깁니다. 때로는 더 긴 수면이 필요할 수 있지만, 지속적으로 과도한 수면은 건강 문제를 나타낼 수 있습니다.`;
  }
  
  // 심혈관 건강 분석
  let cardioHealth = '';
  if (restingHeartRate <= 60) {
    cardioHealth = `안정시 심박수가 ${restingHeartRate}bpm으로 매우 좋은 수준입니다. 이는 뛰어난 심혈관 건강을 나타냅니다.`;
  } else if (restingHeartRate <= 70) {
    cardioHealth = `안정시 심박수가 ${restingHeartRate}bpm으로 건강한 범위 내에 있습니다.`;
  } else if (restingHeartRate <= 80) {
    cardioHealth = `안정시 심박수가 ${restingHeartRate}bpm으로 보통 수준입니다. 규칙적인 심장 강화 운동으로 개선할 수 있습니다.`;
  } else {
    cardioHealth = `안정시 심박수가 ${restingHeartRate}bpm으로 다소 높습니다. 규칙적인 유산소 운동과 스트레스 관리를 통해 이를 개선할 수 있습니다.`;
  }
  
  // HRV 분석을 심혈관 건강에 추가
  if (hrvValue >= 50) {
    cardioHealth += ` HRV가 ${hrvValue}ms로 우수한 자율신경계 건강을 나타냅니다. 스트레스 대처 능력이 좋은 상태입니다.`;
  } else if (hrvValue >= 40) {
    cardioHealth += ` HRV가 ${hrvValue}ms로 양호한 수준입니다. 명상이나 호흡 운동을 통해 더 향상시킬 수 있습니다.`;
  } else {
    cardioHealth += ` HRV가 ${hrvValue}ms로 개선의 여지가 있습니다. 휴식, 수면 개선, 스트레스 관리를 통해 자율신경계 건강을 높일 수 있습니다.`;
  }
  
  // 종합 요약
  let summary = '';
  if (steps >= 7500 && sleep >= 7 && sleep <= 9 && restingHeartRate <= 70 && hrvValue >= 40) {
    summary = `전반적인 건강 상태가 좋은 편입니다. 균형 잡힌 활동량과 수면으로 심혈관 건강을 잘 유지하고 있습니다.`;
  } else if ((steps < 5000) || (sleep < 6) || (restingHeartRate > 80) || (hrvValue < 30)) {
    summary = `일부 건강 지표에서 개선이 필요합니다. 아래 추천사항을 통해 점진적으로 건강 상태를 향상시키는 것이 좋겠습니다.`;
  } else {
    summary = `건강 상태가 보통 수준입니다. 몇 가지 지표를 개선하여 더 나은 건강 상태로 나아갈 수 있는 잠재력이 있습니다.`;
  }
  
  // 추천사항
  const recommendations = [
    steps < 10000 
      ? `하루에 ${Math.min(3000, 10000 - steps).toLocaleString()}걸음 더 걸어 활동량을 늘려보세요.` 
      : '현재 걸음 수 수준을 꾸준히 유지하세요.',
    hrvValue < 45 
      ? '취침 전 10분 동안 심호흡 또는 명상으로 HRV를 개선하세요.' 
      : '규칙적인 휴식과 스트레스 관리로 HRV 수준을 유지하세요.',
    sleep < 7 
      ? `수면 시간을 최소 ${(7 - sleep).toFixed(1)}시간 늘려 7시간 이상 취하세요.` 
      : '수면의 질을 높이기 위해 일관된 수면 스케줄을 유지하세요.'
  ];
  
  return {
    summary,
    activity,
    sleep: sleepAnalysis,
    cardioHealth,
    recommendations
  };
};

export type { HealthData, HealthInsights, GPTResponse };
