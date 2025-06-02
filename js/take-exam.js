// DOM Elements
const joinExamCard = document.getElementById('join-exam-card');
const aiExamCard = document.getElementById('ai-exam-card');
const joinExamForm = document.getElementById('join-exam-form');
const aiExamForm = document.getElementById('ai-exam-form');
const backToOptionsBtn = document.getElementById('back-to-options-btn');
const backToOptionsBtnAi = document.getElementById('back-to-options-btn-ai');
const examInterface = document.getElementById('exam-interface');
const examResults = document.getElementById('exam-results');
const joinByLinkBtn = document.getElementById('join-by-link-btn');
const generateAIExamBtn = document.getElementById('generate-ai-exam-btn');
const startExamBtn = document.getElementById('start-exam-btn');
const submitExamBtn = document.getElementById('submit-exam-btn');
const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');
const qrMethod = document.getElementById('qr-method');
const linkMethod = document.getElementById('link-method');
const stopScanBtn = document.getElementById('stop-scan-btn');
const examLinkInput = document.getElementById('exam-link-input');

// Exam data
let currentExam = null;
let examTimer = null;
let timeLeft = 0;
let userAnswers = {};
let studentName = '';

// Event Listeners
joinExamCard.addEventListener('click', () => {
    document.querySelector('.exam-options-container').classList.add('hidden');
    joinExamForm.classList.remove('hidden');
});

aiExamCard.addEventListener('click', () => {
    document.querySelector('.exam-options-container').classList.add('hidden');
    aiExamForm.classList.remove('hidden');
});

backToOptionsBtn.addEventListener('click', backToOptions);
backToOptionsBtnAi.addEventListener('click', backToOptions);
joinByLinkBtn.addEventListener('click', joinExamByLink);
generateAIExamBtn.addEventListener('click', generateAIExamForStudent);
startExamBtn.addEventListener('click', startExam);
submitExamBtn.addEventListener('click', submitExam);
backToDashboardBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
});
stopScanBtn.addEventListener('click', stopQRScan);

// QR Code Scanner
let qrScanner = null;

function initQRScanner() {
    qrScanner = new Html5QrcodeScanner('qr-scanner', {
        fps: 10,
        qrbox: 250
    }, false);
    
    qrScanner.render((decodedText) => {
        handleExamLink(decodedText);
    });
}

function stopQRScan() {
    if (qrScanner) {
        qrScanner.clear();
        qrScanner = null;
    }
}

// Navigation functions
function backToOptions() {
    joinExamForm.classList.add('hidden');
    aiExamForm.classList.add('hidden');
    examInterface.classList.add('hidden');
    examResults.classList.add('hidden');
    document.querySelector('.exam-options-container').classList.remove('hidden');
    
    // Stop QR scanner if active
    stopQRScan();
}

// Exam joining functions
function joinExamByLink() {
    const examLink = examLinkInput.value.trim();
    
    if (!examLink) {
        alert('Vui lòng nhập liên kết đề thi');
        return;
    }
    
    handleExamLink(examLink);
}

function handleExamLink(link) {
    // Extract exam ID from link
    let examId = '';
    
    // Check if it's a full URL
    if (link.includes('examId=')) {
        const url = new URL(link);
        examId = url.searchParams.get('examId');
    } else {
        // Assume it's just the ID
        examId = link;
    }
    
    if (!examId) {
        alert('Liên kết không hợp lệ. Vui lòng kiểm tra lại.');
        return;
    }
    
    // Load exam data
    loadExam(examId);
}

function loadExam(examId) {
    db.collection('exams').doc(examId).get()
        .then((doc) => {
            if (doc.exists) {
                currentExam = doc.data();
                currentExam.id = doc.id;
                
                // Show exam interface
                showExamInterface();
            } else {
                alert('Không tìm thấy đề thi. Vui lòng kiểm tra lại liên kết.');
            }
        })
        .catch((error) => {
            console.error("Error loading exam: ", error);
            alert('Có lỗi xảy ra khi tải đề thi. Vui lòng thử lại.');
        });
}

function showExamInterface() {
    joinExamForm.classList.add('hidden');
    aiExamForm.classList.add('hidden');
    examInterface.classList.remove('hidden');
    examResults.classList.add('hidden');
    
    // Set exam info
    document.getElementById('exam-taking-title').textContent = currentExam.title;
    document.getElementById('exam-taking-description').textContent = currentExam.description;
    
    // Initialize timer display
    timeLeft = currentExam.duration * 60; // Convert to seconds
    updateTimerDisplay();
    
    // Initialize empty answers object
    userAnswers = {};
    
    // Stop QR scanner if active
    stopQRScan();
}

// AI Exam Generation for student
function generateAIExamForStudent() {
    const topic = document.getElementById('ai-exam-topic').value.trim();
    const duration = parseInt(document.getElementById('ai-exam-duration').value);
    
    if (!topic) {
        alert('Vui lòng nhập chủ đề bạn muốn thi');
        return;
    }
    
    if (isNaN(duration) || duration < 5 || duration > 120) {
        alert('Thời gian làm bài phải từ 5 đến 120 phút');
        return;
    }
    
    const aiLoading = document.getElementById('ai-exam-loading');
    aiLoading.classList.remove('hidden');
    generateAIExamBtn.disabled = true;
    
    // Simulate AI generation (in a real app, this would call an API)
    setTimeout(() => {
        // This is a mock implementation
        currentExam = {
            title: `Đề thi AI về: ${topic}`,
            description: `Đề thi được tạo tự động bởi AI về chủ đề "${topic}"`,
            duration: duration,
            questions: generateMockQuestionsFromTopic(topic),
            isAIExam: true
        };
        
        // Show exam interface
        showExamInterface();
        
        aiLoading.classList.add('hidden');
        generateAIExamBtn.disabled = false;
    }, 2000);
}

function generateMockQuestionsFromTopic(topic) {
    // This is a simplified mock implementation
    // In a real app, you would call an AI API here
    
    const questions = [];
    const questionTypes = ['multiple-choice', 'true-false', 'short-answer', 'essay'];
    
    // Generate 5-10 questions based on topic
    const questionCount = 5 + Math.floor(Math.random() * 6);
    
    for (let i = 0; i < questionCount; i++) {
        const type = questionTypes[Math.floor(Math.random() * questionTypes.length)];
        const question = {
            id: Date.now().toString() + i,
            type,
            content: `Câu hỏi ${i + 1} về "${topic.substring(0, 20)}..."`,
            points: Math.floor(Math.random() * 3) + 1 // 1-3 points
        };
        
        switch (type) {
            case 'multiple-choice':
                question.options = {
                    A: `Lựa chọn A cho câu hỏi ${i + 1}`,
                    B: `Lựa chọn B cho câu hỏi ${i + 1}`,
                    C: `Lựa chọn C cho câu hỏi ${i + 1}`,
                    D: `Lựa chọn D cho câu hỏi ${i + 1}`
                };
                question.correctAnswer = ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)];
                break;
            case 'true-false':
                question.correctAnswer = Math.random() > 0.5;
                break;
            case 'short-answer':
            case 'essay':
                question.sampleAnswer = `Đây là câu trả lời mẫu cho câu hỏi ${i + 1}`;
                break;
        }
        
        questions.push(question);
    }
    
    return questions;
}

// Exam taking functions
function startExam() {
    studentName = document.getElementById('student-name').value.trim();
    
    if (!studentName) {
        alert('Vui lòng nhập họ và tên');
        return;
    }
    
    // Hide student info form
    document.getElementById('student-info-form').classList.add('hidden');
    
    // Show questions
    loadExamQuestions();
    
    // Start timer
    startTimer();
}

function loadExamQuestions() {
    const questionsContainer = document.getElementById('exam-questions');
    questionsContainer.innerHTML = '';
    
    currentExam.questions.forEach((question, index) => {
        const questionElement = document.createElement('div');
        questionElement.className = 'exam-question';
        questionElement.dataset.questionId = question.id;
        
        let questionHTML = `
            <div class="exam-question-header">
                <span class="exam-question-number">Câu ${index + 1}</span>
                <span class="exam-question-points">(${question.points} điểm)</span>
            </div>
            <div class="exam-question-content">${question.content}</div>
        `;
        
        // Add answer input based on question type
        switch (question.type) {
            case 'multiple-choice':
                questionHTML += `
                    <div class="exam-question-options">
                        <div class="exam-option">
                            <input type="radio" name="q-${question.id}" id="q-${question.id}-a" value="A">
                            <label for="q-${question.id}-a">A. ${question.options.A}</label>
                        </div>
                        <div class="exam-option">
                            <input type="radio" name="q-${question.id}" id="q-${question.id}-b" value="B">
                            <label for="q-${question.id}-b">B. ${question.options.B}</label>
                        </div>
                        <div class="exam-option">
                            <input type="radio" name="q-${question.id}" id="q-${question.id}-c" value="C">
                            <label for="q-${question.id}-c">C. ${question.options.C}</label>
                        </div>
                        <div class="exam-option">
                            <input type="radio" name="q-${question.id}" id="q-${question.id}-d" value="D">
                            <label for="q-${question.id}-d">D. ${question.options.D}</label>
                        </div>
                    </div>
                `;
                break;
            case 'true-false':
                questionHTML += `
                    <div class="exam-question-options">
                        <div class="exam-option">
                            <input type="radio" name="q-${question.id}" id="q-${question.id}-true" value="true">
                            <label for="q-${question.id}-true">Đúng</label>
                        </div>
                        <div class="exam-option">
                            <input type="radio" name="q-${question.id}" id="q-${question.id}-false" value="false">
                            <label for="q-${question.id}-false">Sai</label>
                        </div>
                    </div>
                `;
                break;
            case 'short-answer':
                questionHTML += `
                    <div class="exam-question-input">
                        <textarea id="q-${question.id}-text" rows="3" placeholder="Nhập câu trả lời ngắn"></textarea>
                    </div>
                `;
                break;
            case 'essay':
                questionHTML += `
                    <div class="exam-question-input">
                        <textarea id="q-${question.id}-text" rows="5" placeholder="Nhập bài làm"></textarea>
                    </div>
                `;
                break;
        }
        
        questionElement.innerHTML = questionHTML;
        questionsContainer.appendChild(questionElement);
        
        // Add event listeners to capture answers
        if (question.type === 'multiple-choice' || question.type === 'true-false') {
            const radioInputs = questionElement.querySelectorAll('input[type="radio"]');
            radioInputs.forEach(input => {
                input.addEventListener('change', (e) => {
                    userAnswers[question.id] = e.target.value;
                    updateAnsweredCount();
                });
            });
        } else {
            const textInput = questionElement.querySelector('textarea');
            textInput.addEventListener('input', (e) => {
                userAnswers[question.id] = e.target.value;
                updateAnsweredCount();
            });
        }
    });
    
    // Show exam footer
    document.getElementById('exam-footer').classList.remove('hidden');
    
    // Update answered count
    updateAnsweredCount();
}

function updateAnsweredCount() {
    const answered = Object.keys(userAnswers).length;
    document.getElementById('answered-count').textContent = answered;
    document.getElementById('total-questions').textContent = currentExam.questions.length;
}

// Timer functions
function startTimer() {
    updateTimerDisplay();
    
    examTimer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(examTimer);
            submitExam();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;
    
    document.getElementById('time-display').textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Change color when time is running out
    if (timeLeft <= 300) { // 5 minutes left
        document.getElementById('exam-timer').style.color = '#ef4444';
    }
}

// Exam submission
function submitExam() {
    clearInterval(examTimer);
    
    // Collect all answers (in case some were skipped)
    currentExam.questions.forEach(question => {
        if (!userAnswers[question.id]) {
            if (question.type === 'multiple-choice' || question.type === 'true-false') {
                userAnswers[question.id] = ''; // Empty for unanswered
            } else {
                userAnswers[question.id] = ''; // Empty text answer
            }
        }
    });
    
    // Hide exam interface
    examInterface.classList.add('hidden');
    
    // Process results
    processResults();
}

function processResults() {
    // For AI exams, we can auto-grade
    if (currentExam.isAIExam) {
        autoGradeExam();
    } else {
        // For regular exams, just show the answers were submitted
        showSubmissionConfirmation();
    }
}

function autoGradeExam() {
    let totalPoints = 0;
    let maxPoints = 0;
    const results = [];
    
    currentExam.questions.forEach(question => {
        maxPoints += question.points;
        
        const userAnswer = userAnswers[question.id];
        let isCorrect = false;
        let pointsEarned = 0;
        
        // Check answer based on question type
        switch (question.type) {
            case 'multiple-choice':
                isCorrect = userAnswer === question.correctAnswer;
                pointsEarned = isCorrect ? question.points : 0;
                break;
            case 'true-false':
                isCorrect = userAnswer === question.correctAnswer.toString();
                pointsEarned = isCorrect ? question.points : 0;
                break;
            case 'short-answer':
            case 'essay':
                // For text answers, we can't auto-grade in this simple implementation
                // In a real app, you might use AI to evaluate the answer
                pointsEarned = question.points * 0.5; // Give half points by default
                break;
        }
        
        totalPoints += pointsEarned;
        
        results.push({
            question,
            userAnswer,
            isCorrect,
            pointsEarned
        });
    });
    
    // Calculate percentage
    const percentage = Math.round((totalPoints / maxPoints) * 100);
    
    // Show results
    showExamResults(totalPoints, maxPoints, percentage, results);
}

function showSubmissionConfirmation() {
    // For regular exams, just confirm submission
    examResults.classList.remove('hidden');
    
    document.getElementById('result-student-name').textContent = studentName;
    document.getElementById('result-exam-title').textContent = currentExam.title;
    document.getElementById('result-score').textContent = '--';
    document.getElementById('result-total').textContent = currentExam.questions.reduce((sum, q) => sum + q.points, 0);
    
    document.getElementById('result-details').innerHTML = `
        <div class="result-message">
            <p>Bài làm của bạn đã được nộp thành công.</p>
            <p>Kết quả sẽ được gửi đến bạn sau khi được chấm điểm.</p>
        </div>
    `;
    
    // Save submission to database
    saveExamSubmission();
}

function showExamResults(totalPoints, maxPoints, percentage, results) {
    examResults.classList.remove('hidden');
    
    document.getElementById('result-student-name').textContent = studentName;
    document.getElementById('result-exam-title').textContent = currentExam.title;
    document.getElementById('result-score').textContent = totalPoints;
    document.getElementById('result-total').textContent = maxPoints;
    
    // Create result details
    const resultDetails = document.getElementById('result-details');
    resultDetails.innerHTML = '';
    
    // Add summary
    const summaryElement = document.createElement('div');
    summaryElement.className = 'result-summary-card';
    summaryElement.innerHTML = `
        <h3>Tổng kết</h3>
        <div class="score-circle">
            <div class="circle-background">
                <div class="circle-progress" style="--percentage: ${percentage}">
                    <span>${percentage}%</span>
                </div>
            </div>
        </div>
        <p>Bạn đạt được ${totalPoints}/${maxPoints} điểm</p>
    `;
    resultDetails.appendChild(summaryElement);
    
    // Add question-by-question results
    results.forEach((result, index) => {
        const resultElement = document.createElement('div');
        resultElement.className = `question-result ${result.isCorrect ? 'correct' : 'incorrect'}`;
        
        let answerHtml = '';
        if (result.question.type === 'multiple-choice') {
            answerHtml = `
                <p><strong>Đáp án của bạn:</strong> ${result.userAnswer || 'Không trả lời'}</p>
                <p><strong>Đáp án đúng:</strong> ${result.question.correctAnswer}</p>
            `;
        } else if (result.question.type === 'true-false') {
            answerHtml = `
                <p><strong>Đáp án của bạn:</strong> ${result.userAnswer === 'true' ? 'Đúng' : 'Sai'}</p>
                <p><strong>Đáp án đúng:</strong> ${result.question.correctAnswer ? 'Đúng' : 'Sai'}</p>
            `;
        } else {
            answerHtml = `
                <p><strong>Câu trả lời của bạn:</strong> ${result.userAnswer || 'Không trả lời'}</p>
                ${result.question.sampleAnswer ? `<p><strong>Đáp án tham khảo:</strong> ${result.question.sampleAnswer}</p>` : ''}
            `;
        }
        
        resultElement.innerHTML = `
            <div class="question-result-header">
                <span class="question-number">Câu ${index + 1}</span>
                <span class="question-points">${result.pointsEarned}/${result.question.points} điểm</span>
            </div>
            <div class="question-content">${result.question.content}</div>
            ${answerHtml}
        `;
        
        resultDetails.appendChild(resultElement);
    });
    
    // Save results to database for AI exams
    saveExamSubmission(totalPoints, maxPoints);
}

function saveExamSubmission(score, totalScore) {
    const submissionData = {
        examId: currentExam.id,
        examTitle: currentExam.title,
        studentName: studentName,
        answers: userAnswers,
        submittedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (score !== undefined && totalScore !== undefined) {
        submissionData.score = score;
        submissionData.totalScore = totalScore;
        submissionData.isGraded = true;
    } else {
        submissionData.isGraded = false;
    }
    
    // Save to Firestore
    db.collection('examSubmissions').add(submissionData)
        .then(() => {
            console.log("Exam submission saved successfully");
        })
        .catch((error) => {
            console.error("Error saving exam submission: ", error);
        });
}

// Initialize QR scanner when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Check if we have an exam ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('examId');
    
    if (examId) {
        loadExam(examId);
    }
});