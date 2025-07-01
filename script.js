// 전역 변수
let currentImageData = null;
let currentAnalysisResult = null;

// CONFIG 객체 정의 (안전한 방법)
window.CONFIG = window.CONFIG || {
    GEMINI_API_KEY: 'AIzaSyD1JEQmYQTl1xb4ZOtfd9YnlOx2rq4-LQM'
};

// DOM 요소들
const imageInput = document.getElementById('imageInput');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const analyzeBtn = document.getElementById('analyzeBtn');
const loadingSection = document.getElementById('loadingSection');
const resultSection = document.getElementById('resultSection');
const sampleSection = document.getElementById('sampleSection');

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
});

// 이벤트 리스너 설정
function setupEventListeners() {
    const imageInput = document.getElementById('imageInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const copyBtn = document.getElementById('copyBtn');
    const retryBtn = document.getElementById('retryBtn');
    
    imageInput.addEventListener('change', handleImageSelect);
    analyzeBtn.addEventListener('click', analyzeImage);
    copyBtn.addEventListener('click', copyResult);
    retryBtn.addEventListener('click', resetApp);
    
    setupSampleImageEvents();
}

// 샘플 이미지 이벤트 설정
function setupSampleImageEvents() {
    const sampleItems = document.querySelectorAll('.sample-item');
    sampleItems.forEach(item => {
        item.addEventListener('click', () => {
            const sampleName = item.getAttribute('data-sample');
            analyzeSampleImage(sampleName);
        });
    });
}

// 이미지 선택 처리
function handleImageSelect(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            alert('이미지 크기가 너무 큽니다. 5MB 이하의 이미지를 선택해주세요.');
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 선택할 수 있습니다.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            currentImageData = e.target.result;
            displayPreview(e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

// 미리보기 표시
function displayPreview(imageSrc) {
    const previewImage = document.getElementById('previewImage');
    const previewContainer = document.getElementById('previewContainer');
    const resultSection = document.getElementById('resultSection');
    
    previewImage.src = imageSrc;
    previewContainer.style.display = 'block';
    resultSection.style.display = 'none';
}

// 샘플 이미지 분석
function analyzeSampleImage(sampleName) {
    const sampleData = {
        menu1: {
            name: '김치찌개',
            calories: 320,
            analysis: [
                '김치찌개 1인분으로 추정',
                '두부 50g (약 30kcal)',
                '돼지고기 30g (약 80kcal)',
                '김치 100g (약 20kcal)',
                '국물 및 기타 재료 (약 190kcal)'
            ]
        },
        menu2: {
            name: '스파게티',
            calories: 580,
            analysis: [
                '토마토 스파게티 1인분으로 추정',
                '파스타 면 100g (약 350kcal)',
                '토마토 소스 (약 80kcal)',
                '올리브오일 1큰술 (약 120kcal)',
                '치즈 및 기타 재료 (약 30kcal)'
            ]
        },
        menu3: {
            name: '햄버거',
            calories: 650,
            analysis: [
                '일반 햄버거 1개로 추정',
                '번 (빵) (약 250kcal)',
                '패티 (쇠고기) (약 280kcal)',
                '치즈 1장 (약 80kcal)',
                '야채 및 소스 (약 40kcal)'
            ]
        },
        menu4: {
            name: '샌드위치',
            calories: 420,
            analysis: [
                '클럽 샌드위치 1개로 추정',
                '식빵 2장 (약 160kcal)',
                '햄/치킨 (약 120kcal)',
                '치즈 1장 (약 80kcal)',
                '야채 및 마요네즈 (약 60kcal)'
            ]
        }
    };
    
    const data = sampleData[sampleName];
    if (data) {
        currentAnalysisResult = data;
        showLoadingAndAnalyze(() => {
            displayResult(data.name, data.calories, data.analysis);
        });
    }
}

// 이미지 분석 시작
function analyzeImage() {
    if (!currentImageData) {
        alert('이미지를 선택해주세요.');
        return;
    }
    
    showLoadingAndAnalyze(() => {
        callGeminiAPI(currentImageData);
    });
}

// 로딩 표시 및 분석 실행
function showLoadingAndAnalyze(callback) {
    const sampleSection = document.getElementById('sampleSection');
    const previewContainer = document.getElementById('previewContainer');
    const loadingSection = document.getElementById('loadingSection');
    const resultSection = document.getElementById('resultSection');
    
    sampleSection.style.display = 'none';
    previewContainer.style.display = 'none';
    loadingSection.style.display = 'block';
    resultSection.style.display = 'none';
    
    setTimeout(callback, 1500);
}

// Gemini API 호출
async function callGeminiAPI(imageData) {
    try {
        // CONFIG 객체 체크
        if (typeof window.CONFIG === 'undefined' || !window.CONFIG.GEMINI_API_KEY) {
            throw new Error('API 키가 설정되지 않았습니다. config.js 파일을 확인해주세요.');
        }

        const base64Data = imageData.split(',')[1];
        
        const payload = {
            contents: [{
                parts: [
                    {
                        text: `이 음식 이미지를 분석하여 다음 정보를 JSON 형태로 제공해주세요:
{
  "foodName": "음식명",
  "calories": 예상_칼로리_숫자,
  "analysis": [
    "분석과정1",
    "분석과정2",
    "분석과정3",
    "분석과정4"
  ]
}

한국 음식을 중심으로 분석하고, 일반적인 1인분 기준으로 칼로리를 계산해주세요. 분석과정에는 주요 재료별 칼로리를 포함해주세요.`
                    },
                    {
                        inline_data: {
                            mime_type: "image/jpeg",
                            data: base64Data
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.4,
                topK: 32,
                topP: 1,
                maxOutputTokens: 1024,
            }
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${window.CONFIG.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API 호출 실패: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            const textContent = data.candidates[0].content.parts[0].text;
            parseAndDisplayResult(textContent);
        } else {
            throw new Error('API 응답 형식이 올바르지 않습니다.');
        }
        
    } catch (error) {
        console.error('API 호출 오류:', error);
        handleAPIError(error);
    }
}

// API 응답 파싱 및 결과 표시
function parseAndDisplayResult(textContent) {
    try {
        let jsonMatch = textContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            currentAnalysisResult = result;
            displayResult(result.foodName, result.calories, result.analysis);
        } else {
            parseTextResult(textContent);
        }
    } catch (error) {
        console.error('결과 파싱 오류:', error);
        displayDefaultResult();
    }
}

// 텍스트 결과 파싱 (JSON 파싱 실패시)
function parseTextResult(text) {
    let foodName = '분석된 음식';
    let calories = 400;
    let analysis = ['AI가 음식을 분석했습니다.', '칼로리가 계산되었습니다.'];
    
    const calorieMatch = text.match(/(\d+)\s*(?:kcal|칼로리|cal)/i);
    if (calorieMatch) {
        calories = parseInt(calorieMatch[1]);
    }
    
    currentAnalysisResult = { foodName, calories, analysis };
    displayResult(foodName, calories, analysis);
}

// 기본 결과 표시 (모든 파싱 실패시)
function displayDefaultResult() {
    const defaultResult = {
        foodName: '분석된 음식',
        calories: 400,
        analysis: [
            '이미지를 기반으로 분석했습니다.',
            '일반적인 1인분 기준입니다.',
            '실제 칼로리는 조리법에 따라 달라질 수 있습니다.',
            '참고용으로만 사용해주세요.'
        ]
    };
    
    currentAnalysisResult = defaultResult;
    displayResult(defaultResult.foodName, defaultResult.calories, defaultResult.analysis);
}

// API 오류 처리
function handleAPIError(error) {
    console.error('API 오류:', error);
    
    const loadingSection = document.getElementById('loadingSection');
    const sampleSection = document.getElementById('sampleSection');
    const previewContainer = document.getElementById('previewContainer');
    
    loadingSection.style.display = 'none';
    alert('음식 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.\n\n오류 내용: ' + error.message);
    
    sampleSection.style.display = 'block';
    if (currentImageData) {
        previewContainer.style.display = 'block';
    }
}

// 결과 표시
function displayResult(foodName, calories, analysisSteps) {
    const loadingSection = document.getElementById('loadingSection');
    const resultSection = document.getElementById('resultSection');
    
    loadingSection.style.display = 'none';
    resultSection.style.display = 'block';
    
    document.getElementById('foodName').textContent = foodName;
    document.getElementById('calorieNumber').textContent = calories;
    
    const analysisList = document.getElementById('analysisList');
    analysisList.innerHTML = '';
    analysisSteps.forEach(step => {
        const li = document.createElement('li');
        li.textContent = step;
        analysisList.appendChild(li);
    });
    
    displayExerciseInfo(calories);
}

// 운동량 정보 표시
function displayExerciseInfo(calories) {
    const exerciseData = calculateExercise(calories);
    const exerciseGrid = document.getElementById('exerciseGrid');
    
    exerciseGrid.innerHTML = '';
    
    exerciseData.forEach(exercise => {
        const exerciseItem = document.createElement('div');
        exerciseItem.className = 'exercise-item';
        exerciseItem.innerHTML = `
            <span class="exercise-icon">${exercise.icon}</span>
            <div class="exercise-name">${exercise.name}</div>
            <div class="exercise-amount">${exercise.amount}</div>
        `;
        exerciseGrid.appendChild(exerciseItem);
    });
}

// 운동량 계산
function calculateExercise(calories) {
    const exerciseRates = {
        running: 12,
        walking: 4,
        cycling: 8,
        swimming: 11
    };
    
    return [
        {
            icon: '🏃‍♂️',
            name: '달리기',
            amount: `${Math.ceil(calories / exerciseRates.running)}분`
        },
        {
            icon: '🚶‍♂️',
            name: '걷기',
            amount: `${Math.ceil(calories / exerciseRates.walking)}분`
        },
        {
            icon: '🚴‍♂️',
            name: '자전거',
            amount: `${Math.ceil(calories / exerciseRates.cycling)}분`
        },
        {
            icon: '🏊‍♂️',
            name: '수영',
            amount: `${Math.ceil(calories / exerciseRates.swimming)}분`
        }
    ];
}

// 결과 복사
function copyResult() {
    if (!currentAnalysisResult) {
        alert('복사할 결과가 없습니다.');
        return;
    }
    
    const result = currentAnalysisResult;
    const exerciseData = calculateExercise(result.calories);
    
    const copyText = `🍽️ 칼로리 측정 결과
    
음식명: ${result.foodName}
칼로리: ${result.calories}kcal

📋 분석 과정:
${result.analysis.map(step => `• ${step}`).join('\n')}

🏃‍♂️ 소모 운동량:
${exerciseData.map(ex => `${ex.icon} ${ex.name}: ${ex.amount}`).join('\n')}

---
칼로리 측정기로 분석된 결과입니다.`;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(copyText).then(() => {
            showCopySuccess();
        }).catch(() => {
            fallbackCopy(copyText);
        });
    } else {
        fallbackCopy(copyText);
    }
}

// 복사 성공 메시지
function showCopySuccess() {
    const copyBtn = document.getElementById('copyBtn');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✅ 복사됨!';
    copyBtn.style.background = 'linear-gradient(135deg, #20bf6b, #26d0ce)';
    
    setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.background = 'linear-gradient(135deg, #48cae4, #0077b6)';
    }, 2000);
}

// 폴백 복사 방법
function fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '-1000px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        document.execCommand('copy');
        showCopySuccess();
    } catch (err) {
        console.error('복사 실패:', err);
        alert('복사에 실패했습니다. 수동으로 복사해주세요.');
    }
    
    document.body.removeChild(textArea);
}

// 앱 초기화
function resetApp() {
    currentImageData = null;
    currentAnalysisResult = null;
    
    const sampleSection = document.getElementById('sampleSection');
    const previewContainer = document.getElementById('previewContainer');
    const loadingSection = document.getElementById('loadingSection');
    const resultSection = document.getElementById('resultSection');
    const imageInput = document.getElementById('imageInput');
    
    sampleSection.style.display = 'block';
    previewContainer.style.display = 'none';
    loadingSection.style.display = 'none';
    resultSection.style.display = 'none';
    
    imageInput.value = '';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 이미지 압축 (모바일 최적화)
function compressImage(file, maxSize = 800, quality = 0.8) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            // 비율 유지하면서 크기 조정
            let { width, height } = img;
            if (width > height) {
                if (width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // 이미지 그리기
            ctx.drawImage(img, 0, 0, width, height);
            
            // Base64로 변환
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedDataUrl);
        };
        
        img.src = URL.createObjectURL(file);
    });
} 