import { auth, db } from './firebase.js';

// DOM Elements
const joinExamBtn = document.getElementById('join-exam');
const aiExamBtn = document.getElementById('ai-exam');
const joinContent = document.getElementById('join-content');
const linkJoin = document.getElementById('link-join');
const aiJoin = document.getElementById('ai-join');
const examUrl = document.getElementById('exam-url');
const qrScanner = document.getElementById('qr-scanner');
const startScan = document.getElementById('start-scan');
const joinExamBtnFinal = document.getElementById('join-exam-btn');
const aiTopic = document.getElementById('ai-topic');
const aiQuestionCount = document.getElementById('ai-question-count');
const aiDuration = document.getElementById('ai-duration');
const startAiExam = document.getElementById('start-ai-exam');
const examModal = document.getElementById('exam-modal');
const closeExam = document.getElementById('close-exam');
const examModalTitle = document.getElementById('exam-modal-title');
const examTimer = document.getElementById('exam-timer');
const studentName = document.getElementById('student-name');
const timeLeft = document.getElementById('time-left');
const examContent = document.getElementById('exam-content');
const prevQuestionBtn = document.getElementById('prev-question');
const nextQuestionBtn = document.getElementById('next-question');
const submitExamBtn = document.getElementById('submit-exam');
const currentQuestionDisplay = document.getElementById('current-question');
const totalQuestionsDisplay = document.getElementById('total-questions');
const resultModal = document.getElementById('result-modal');
const closeResult = document.getElementById('close-result');
const resultContent = document.getElementById('result-content');
const resultScore = document.getElementById('result-score');
const correctAnswers = document.getElementById('correct-answers');
const wrongAnswers = document.getElementById('wrong-answers');
const aiFeedback = document.getElementById('ai-feedback');
const feedbackText = document.getElementById('feedback-text');
const resultCloseBtn = document.getElementById('result-close-btn');

// State
let currentExam = null;
let currentQuestionIndex = 0;
let studentAnswers = [];
let timerInterval = null;
let timeRemaining = 0;
let isAiExam = false;
let videoStream = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if there's an exam ID in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('examId');
    
    if (examId) {
        joinExam(examId);
    }
    
    // Setup event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Exam type selection
    joinExamBtn.addEventListener('click', () => {
        joinContent.classList.remove('hidden');
        linkJoin.classList.remove('hidden');
        aiJoin.classList.add('hidden');
    });
    
    aiExamBtn.addEventListener('click', () => {
        joinContent.classList.remove('hidden');
        aiJoin.classList.remove('hidden');
        linkJoin.classList.add('hidden');
    });
    
    // Join exam
    joinExamBtnFinal.addEventListener('click', joinExamFromLink);
    startAiExam.addEventListener('click', startAiExamHandler);
    
    // Exam navigation
    prevQuestionBtn.addEventListener('click', goToPreviousQuestion);
    nextQuestionBtn.addEventListener('click', goToNextQuestion);
    submitExamBtn.addEventListener('click', submitExam);
    
    // Modals
    closeExam.addEventListener('click', () => examModal.classList.add('hidden'));
    closeResult.addEventListener('click', () => resultModal.classList.add('hidden'));
    resultCloseBtn.addEventListener('click', () => resultModal.classList.add('hidden'));
    
    // QR scanning
    startScan.addEventListener('click', startQRScanner);
}

function joinExamFromLink() {
    const url = examUrl.value.trim();
    
    if (!url) {
        alert('Vui lòng nhập link bài thi');
        return;
    }
    
    // Extract exam ID from URL
    let examId = '';
    try {
        const urlObj = new URL(url);
        examId = urlObj.searchParams.get('examId');
    } catch (e) {
        // If it's not a full URL, maybe it's just the ID
        examId = url;
    }
    
    if (!examId) {
        alert('Link bài thi không hợp lệ');
        return;
    }
    
    joinExam(examId);
}

async function joinExam(examId) {
    try {
        // Get exam data from Firestore
        const examDoc = await db.collection('exams').doc(examId).get();
        
        if (!examDoc.exists) {
            alert('Không tìm thấy bài thi. Vui lòng kiểm tra lại link.');
            return;
        }
        
        currentExam = examDoc.data();
        isAiExam = false;
        
        // Prepare student answers
        studentAnswers = currentExam.questions.map(question => ({
            questionId: question.id,
            answer: '',
            isCorrect: null
        }));
        
        // Show exam modal
        showExamModal();
    } catch (error) {
        console.error('Error joining exam:', error);
        alert('Có lỗi xảy ra khi tham gia bài thi. Vui lòng thử lại.');
    }
}

function startAiExamHandler() {
    // In a real app, this would generate an exam using AI
    // For now, we'll create a mock exam
    
    currentExam = {
        title: `Bài thi AI - ${aiTopic.options[aiTopic.selectedIndex].text}`,
        duration: parseInt(aiDuration.value) || 60,
        description: 'Bài thi được tạo tự động bởi AI',
        questions: [],
        antiCheat: false,
        isAiExam: true
    };
    
    // Generate mock questions
    const questionCount = parseInt(aiQuestionCount.value) || 20;
    for (let i = 0; i < questionCount; i++) {
        const type = Math.random() > 0.5 ? 'multiple-choice' : 'true-false';
        
        if (type === 'multiple-choice') {
            currentExam.questions.push({
                id: `ai-q-${i}`,
                content: `Câu hỏi trắc nghiệm ${i + 1} về văn học`,
                type: 'multiple-choice',
                options: [
                    { option: 'a', value: 'Đáp án A' },
                    { option: 'b', value: 'Đáp án B' },
                    { option: 'c', value: 'Đáp án C' },
                    { option: 'd', value: 'Đáp án D' }
                ],
                correctAnswer: ['a', 'b', 'c', 'd'][Math.floor(Math.random() * 4)]
            });
        } else {
            currentExam.questions.push({
                id: `ai-q-${i}`,
                content: `Câu hỏi đúng/sai ${i + 1} về văn học`,
                type: 'true-false',
                correctAnswer: Math.random() > 0.5 ? 'true' : 'false'
            });
        }
    }
    
    isAiExam = true;
    
    // Prepare student answers
    studentAnswers = currentExam.questions.map(question => ({
        questionId: question.id,
        answer: '',
        isCorrect: null
    }));
    
    // Show exam modal
    showExamModal();
}

function showExamModal() {
    examModalTitle.textContent = currentExam.title;
    examTimer.textContent = `Thời gian: ${currentExam.duration} phút`;
    timeRemaining = currentExam.duration * 60; // Convert to seconds
    
    // Start timer
    updateTimerDisplay();
    timerInterval = setInterval(updateTimer, 1000);
    
    // Show first question
    currentQuestionIndex = 0;
    showQuestion();
    
    // Show modal
    examModal.classList.remove('hidden');
}

function updateTimer() {
    timeRemaining--;
    updateTimerDisplay();
    
    if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        submitExam();
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timeLeft.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function showQuestion() {
    const question = currentExam.questions[currentQuestionIndex];
    const studentAnswer = studentAnswers.find(a => a.questionId === question.id);
    
    // Update navigation display
    currentQuestionDisplay.textContent = currentQuestionIndex + 1;
    totalQuestionsDisplay.textContent = currentExam.questions.length;
    
    // Show/hide navigation buttons
    prevQuestionBtn.classList.toggle('hidden', currentQuestionIndex === 0);
    nextQuestionBtn.classList.toggle('hidden', currentQuestionIndex === currentExam.questions.length - 1);
    submitExamBtn.classList.toggle('hidden', currentQuestionIndex !== currentExam.questions.length - 1);
    
    // Generate question HTML
    let questionHtml = `
        <div class="border-b pb-4 mb-4">
            <h4 class="font-medium text-lg">Câu ${currentQuestionIndex + 1}: ${question.content}</h4>
    `;
    
    if (question.type === 'multiple-choice') {
        questionHtml += `<div class="space-y-2 mt-4">`;
        question.options.forEach(opt => {
            questionHtml += `
                <label class="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                    <input type="radio" name="answer-${question.id}" value="${opt.option}" 
                        ${studentAnswer.answer === opt.option ? 'checked' : ''}
                        class="answer-radio" data-question-id="${question.id}">
                    <span class="font-medium">${opt.option.toUpperCase()}:</span>
                    <span>${opt.value}</span>
                </label>
            `;
        });
        questionHtml += `</div>`;
    }
    else if (question.type === 'true-false') {
        questionHtml += `
            <div class="space-y-2 mt-4">
                <label class="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                    <input type="radio" name="answer-${question.id}" value="true" 
                        ${studentAnswer.answer === 'true' ? 'checked' : ''}
                        class="answer-radio" data-question-id="${question.id}">
                    <span>Đúng</span>
                </label>
                <label class="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                    <input type="radio" name="answer-${question.id}" value="false" 
                        ${studentAnswer.answer === 'false' ? 'checked' : ''}
                        class="answer-radio" data-question-id="${question.id}">
                    <span>Sai</span>
                </label>
            </div>
        `;
    }
    else if (question.type === 'short-answer') {
        questionHtml += `
            <div class="mt-4">
                <textarea class="w-full px-3 py-2 border rounded answer-text" 
                    data-question-id="${question.id}" 
                    placeholder="Nhập câu trả lời ngắn của bạn">${studentAnswer.answer}</textarea>
            </div>
        `;
    }
    else if (question.type === 'essay') {
        questionHtml += `
            <div class="mt-4">
                <textarea class="w-full px-3 py-2 border rounded answer-text" rows="6"
                    data-question-id="${question.id}" 
                    placeholder="Nhập bài làm của bạn">${studentAnswer.answer}</textarea>
            </div>
        `;
    }
    
    questionHtml += `</div>`;
    examContent.innerHTML = questionHtml;
    
    // Add event listeners for answer inputs
    const answerRadios = examContent.querySelectorAll('.answer-radio');
    const answerTexts = examContent.querySelectorAll('.answer-text');
    
    answerRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const questionId = e.target.dataset.questionId;
            const answer = e.target.value;
            updateStudentAnswer(questionId, answer);
        });
    });
    
    answerTexts.forEach(text => {
        text.addEventListener('input', (e) => {
            const questionId = e.target.dataset.questionId;
            const answer = e.target.value;
            updateStudentAnswer(questionId, answer);
        });
    });
}

function updateStudentAnswer(questionId, answer) {
    const answerIndex = studentAnswers.findIndex(a => a.questionId === questionId);
    if (answerIndex !== -1) {
        studentAnswers[answerIndex].answer = answer;
    }
}

function goToPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion();
    }
}

function goToNextQuestion() {
    if (currentQuestionIndex < currentExam.questions.length - 1) {
        currentQuestionIndex++;
        showQuestion();
    }
}

async function submitExam() {
    clearInterval(timerInterval);
    
    // Check if student name is provided
    const name = studentName.value.trim();
    if (!name) {
        alert('Vui lòng nhập tên của bạn');
        return;
    }
    
    // For AI exams, we can grade immediately
    if (isAiExam) {
        gradeAiExam();
    } 
    // For regular exams, save to Firestore
    else {
        try {
            await db.collection('exam_results').add({
                examId: currentExam.examId,
                studentName: name,
                answers: studentAnswers,
                submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
                graded: false,
                score: null
            });
            
            showResult(false);
        } catch (error) {
            console.error('Error submitting exam:', error);
            alert('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
        }
    }
}

function gradeAiExam() {
    // Grade the exam (simple comparison for demo)
    let correctCount = 0;
    
    studentAnswers.forEach((studentAnswer, index) => {
        const question = currentExam.questions[index];
        
        if (question.type === 'multiple-choice' || question.type === 'true-false') {
            studentAnswer.isCorrect = studentAnswer.answer === question.correctAnswer;
            if (studentAnswer.isCorrect) correctCount++;
        }
        // For open-ended questions, we can't auto-grade in this demo
    });
    
    const score = Math.round((correctCount / currentExam.questions.length) * 100);
    
    // Show result
    resultScore.textContent = score;
    correctAnswers.textContent = correctCount;
    wrongAnswers.textContent = currentExam.questions.length - correctCount;
    
    // Generate AI feedback
    feedbackText.textContent = getAiFeedback(score);
    aiFeedback.classList.remove('hidden');
    
    showResult(true);
}

function getAiFeedback(score) {
    if (score >= 90) {
        return "Bạn có kiến thức văn học rất tốt! Tiếp tục phát huy nhé.";
    } else if (score >= 70) {
        return "Bạn có hiểu biết khá về văn học. Cần ôn tập thêm một số tác phẩm quan trọng.";
    } else if (score >= 50) {
        return "Kiến thức văn học của bạn ở mức trung bình. Nên dành nhiều thời gian ôn tập hơn.";
    } else {
        return "Bạn cần dành nhiều thời gian hơn để nghiên cứu và ôn tập văn học.";
    }
}

function showResult(isAiExam) {
    examModal.classList.add('hidden');
    resultModal.classList.remove('hidden');
    
    if (isAiExam) {
        resultContent.querySelector('.text-center').classList.remove('hidden');
        resultContent.querySelector('.grid').classList.remove('hidden');
        aiFeedback.classList.remove('hidden');
    } else {
        resultContent.querySelector('.text-center').classList.add('hidden');
        resultContent.querySelector('.grid').classList.add('hidden');
        aiFeedback.classList.add('hidden');
        
        const message = document.createElement('div');
        message.className = 'text-center p-4 bg-blue-50 rounded-lg';
        message.innerHTML = `
            <h4 class="font-bold text-blue-700 mb-2">Bài thi đã được nộp</h4>
            <p class="text-blue-800">Kết quả sẽ được gửi đến bạn sau khi giáo viên chấm bài.</p>
        `;
        resultContent.insertBefore(message, resultContent.firstChild);
    }
}

function startQRScanner() {
    // In a real app, this would access the camera and scan QR codes
    alert('Tính năng quét mã QR đang được phát triển. Vui lòng nhập link bài thi trực tiếp.');
    
    // Here's how it would work in a real implementation:
    // 1. Request camera access
    // 2. Set up video stream to qrScanner element
    // 3. Use jsQR library to detect and decode QR codes
    // 4. When found, extract exam ID and call joinExam()
}