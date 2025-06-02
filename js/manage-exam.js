import { auth, db } from './firebase.js';

// DOM Elements
const tabs = document.getElementById('tabs');
const tabPanes = {
    'your-exams': document.getElementById('your-exams-content'),
    'your-results': document.getElementById('your-results-content')
};
const examsList = document.getElementById('exams-list');
const resultsList = document.getElementById('results-list');
const examDetailsModal = document.getElementById('exam-details-modal');
const examDetailsTitle = document.getElementById('exam-details-title');
const examDetailsDescription = document.getElementById('exam-details-description');
const examDetailsDuration = document.getElementById('exam-details-duration');
const examDetailsDate = document.getElementById('exam-details-date');
const submissionsList = document.getElementById('submissions-list');
const gradingSection = document.getElementById('grading-section');
const submissionContent = document.getElementById('submission-content');
const gradeInput = document.getElementById('grade-input');
const gradeWithAiBtn = document.getElementById('grade-with-ai');
const gradeWithAiAssistBtn = document.getElementById('grade-with-ai-assist');
const submitGradeBtn = document.getElementById('submit-grade');
const aiFeedback = document.getElementById('ai-feedback');
const aiFeedbackText = document.getElementById('ai-feedback-text');
const closeExamDetails = document.getElementById('close-exam-details');
const resultDetailsModal = document.getElementById('result-details-modal');
const resultDetailsTitle = document.getElementById('result-details-title');
const resultStudentName = document.getElementById('result-student-name');
const resultSubmittedDate = document.getElementById('result-submitted-date');
const resultScore = document.getElementById('result-score');
const resultContent = document.getElementById('result-content');
const closeResultDetails = document.getElementById('close-result-details');

// State
let currentUser = null;
let currentExamId = null;
let currentSubmissionId = null;
let currentExamData = null;
let currentSubmissionData = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            loadUserExams();
            loadUserResults();
        } else {
            window.location.href = 'index.html';
        }
    });

    // Setup event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Tab switching
    tabs.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' && e.target.dataset.tab) {
            const tabId = e.target.dataset.tab;
            
            // Update active tab
            document.querySelectorAll('#tabs button').forEach(btn => {
                btn.classList.remove('active', 'border-indigo-500', 'text-indigo-600');
            });
            e.target.classList.add('active', 'border-indigo-500', 'text-indigo-600');
            
            // Show corresponding content
            Object.values(tabPanes).forEach(pane => pane.classList.add('hidden'));
            tabPanes[tabId].classList.remove('hidden');
        }
    });

    // Close modals
    closeExamDetails.addEventListener('click', () => examDetailsModal.classList.add('hidden'));
    closeResultDetails.addEventListener('click', () => resultDetailsModal.classList.add('hidden'));

    // Grading buttons
    gradeWithAiBtn.addEventListener('click', gradeWithAI);
    gradeWithAiAssistBtn.addEventListener('click', gradeWithAIAssist);
    submitGradeBtn.addEventListener('click', submitGrade);
}

async function loadUserExams() {
    try {
        const examsSnapshot = await db.collection('exams')
            .where('createdBy', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .get();

        if (examsSnapshot.empty) {
            examsList.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <i class="fas fa-book-open text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-600">Bạn chưa tạo đề thi nào</p>
                    <a href="create-exam.html" class="mt-4 inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded">
                        <i class="fas fa-plus mr-2"></i>Tạo đề thi mới
                    </a>
                </div>
            `;
            return;
        }

        examsList.innerHTML = '';
        examsSnapshot.forEach(doc => {
            const exam = doc.data();
            const examDate = exam.createdAt ? exam.createdAt.toDate() : new Date();
            
            const examCard = document.createElement('div');
            examCard.className = 'bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow card-hover';
            examCard.innerHTML = `
                <div class="p-4">
                    <h3 class="font-semibold text-lg mb-2 truncate">${exam.title}</h3>
                    <p class="text-gray-600 text-sm mb-3 line-clamp-2">${exam.description || 'Không có mô tả'}</p>
                    <div class="flex justify-between items-center text-sm text-gray-500">
                        <span><i class="fas fa-clock mr-1"></i> ${exam.duration} phút</span>
                        <span>${examDate.toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 flex justify-end">
                    <button class="view-exam-btn text-indigo-600 hover:text-indigo-800 font-medium" data-exam-id="${doc.id}">
                        Xem chi tiết <i class="fas fa-chevron-right ml-1"></i>
                    </button>
                </div>
            `;
            
            examsList.appendChild(examCard);
        });

        // Add event listeners to view buttons
        document.querySelectorAll('.view-exam-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const examId = e.target.dataset.examId;
                viewExamDetails(examId);
            });
        });
    } catch (error) {
        console.error('Error loading exams:', error);
        examsList.innerHTML = `
            <div class="col-span-full text-center py-8 text-red-500">
                <i class="fas fa-exclamation-circle text-4xl mb-4"></i>
                <p>Có lỗi xảy ra khi tải danh sách đề thi</p>
                <button onclick="location.reload()" class="mt-4 inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded">
                    <i class="fas fa-sync-alt mr-2"></i>Tải lại
                </button>
            </div>
        `;
    }
}

async function loadUserResults() {
    try {
        const resultsSnapshot = await db.collection('exam_results')
            .where('studentName', '==', currentUser.displayName || currentUser.email)
            .orderBy('submittedAt', 'desc')
            .get();

        if (resultsSnapshot.empty) {
            resultsList.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-clipboard-list text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-600">Bạn chưa tham gia bài thi nào</p>
                    <a href="take-exam.html" class="mt-4 inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded">
                        <i class="fas fa-play mr-2"></i>Tham gia thi ngay
                    </a>
                </div>
            `;
            return;
        }

        resultsList.innerHTML = '';
        resultsSnapshot.forEach(doc => {
            const result = doc.data();
            const submittedDate = result.submittedAt ? result.submittedAt.toDate() : new Date();
            
            const resultItem = document.createElement('div');
            resultItem.className = 'bg-white rounded-lg shadow-md p-4 border border-gray-200';
            resultItem.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-semibold">${result.examTitle || 'Bài thi không có tiêu đề'}</h3>
                        <p class="text-sm text-gray-500 mt-1">
                            <i class="fas fa-calendar-alt mr-1"></i> ${submittedDate.toLocaleString()}
                        </p>
                    </div>
                    <div class="text-right">
                        ${result.graded ? `
                            <span class="inline-block px-3 py-1 rounded-full text-sm font-semibold ${getScoreColorClass(result.score)}">
                                ${result.score !== undefined ? result.score.toFixed(1) : '--'} điểm
                            </span>
                        ` : `
                            <span class="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
                                <i class="fas fa-hourglass-half mr-1"></i> Đang chấm
                            </span>
                        `}
                    </div>
                </div>
                <div class="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                    <button class="view-result-btn text-indigo-600 hover:text-indigo-800 text-sm font-medium" data-result-id="${doc.id}">
                        Xem chi tiết <i class="fas fa-chevron-right ml-1"></i>
                    </button>
                </div>
            `;
            
            resultsList.appendChild(resultItem);
        });

        // Add event listeners to view buttons
        document.querySelectorAll('.view-result-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const resultId = e.target.dataset.resultId;
                viewResultDetails(resultId);
            });
        });
    } catch (error) {
        console.error('Error loading results:', error);
        resultsList.innerHTML = `
            <div class="text-center py-8 text-red-500">
                <i class="fas fa-exclamation-circle text-4xl mb-4"></i>
                <p>Có lỗi xảy ra khi tải danh sách bài thi</p>
                <button onclick="location.reload()" class="mt-4 inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded">
                    <i class="fas fa-sync-alt mr-2"></i>Tải lại
                </button>
            </div>
        `;
    }
}

function getScoreColorClass(score) {
    if (score === undefined || score === null) return 'bg-gray-100 text-gray-800';
    if (score >= 8) return 'bg-green-100 text-green-800';
    if (score >= 5) return 'bg-blue-100 text-blue-800';
    return 'bg-red-100 text-red-800';
}

async function viewExamDetails(examId) {
    try {
        currentExamId = examId;
        
        // Load exam data
        const examDoc = await db.collection('exams').doc(examId).get();
        if (!examDoc.exists) {
            alert('Không tìm thấy đề thi');
            return;
        }
        
        currentExamData = examDoc.data();
        const examDate = currentExamData.createdAt ? currentExamData.createdAt.toDate() : new Date();
        
        // Update modal content
        examDetailsTitle.textContent = currentExamData.title;
        examDetailsDescription.textContent = currentExamData.description || 'Không có mô tả';
        examDetailsDuration.textContent = currentExamData.duration || '--';
        examDetailsDate.textContent = examDate.toLocaleString();
        
        // Load submissions
        const submissionsSnapshot = await db.collection('exam_results')
            .where('examId', '==', examId)
            .orderBy('submittedAt', 'desc')
            .get();
        
        submissionsList.innerHTML = '';
        if (submissionsSnapshot.empty) {
            submissionsList.innerHTML = `
                <div class="text-center py-4 text-gray-500">
                    <i class="fas fa-user-slash text-2xl mb-2"></i>
                    <p>Chưa có bài thi nào được nộp</p>
                </div>
            `;
            gradingSection.classList.add('hidden');
        } else {
            submissionsSnapshot.forEach(doc => {
                const submission = doc.data();
                const submittedDate = submission.submittedAt ? submission.submittedAt.toDate() : new Date();
                
                const submissionItem = document.createElement('div');
                submissionItem.className = 'flex justify-between items-center p-2 hover:bg-gray-50 rounded';
                submissionItem.innerHTML = `
                    <div>
                        <span class="font-medium">${submission.studentName}</span>
                        <span class="text-xs text-gray-500 ml-2">${submittedDate.toLocaleString()}</span>
                    </div>
                    <div>
                        ${submission.graded ? `
                            <span class="inline-block px-2 py-1 rounded text-xs font-semibold ${getScoreColorClass(submission.score)}">
                                ${submission.score !== undefined ? submission.score.toFixed(1) : '--'} điểm
                            </span>
                        ` : `
                            <span class="inline-block px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
                                <i class="fas fa-hourglass-half mr-1"></i> Chưa chấm
                            </span>
                        `}
                        <button class="view-submission-btn ml-2 text-indigo-600 hover:text-indigo-800 text-sm" data-submission-id="${doc.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                `;
                
                submissionsList.appendChild(submissionItem);
            });

            // Add event listeners to view buttons
            document.querySelectorAll('.view-submission-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const submissionId = e.target.closest('button').dataset.submissionId;
                    viewSubmission(submissionId);
                });
            });
        }
        
        // Show modal
        examDetailsModal.classList.remove('hidden');
    } catch (error) {
        console.error('Error viewing exam details:', error);
        alert('Có lỗi xảy ra khi tải chi tiết đề thi');
    }
}

async function viewSubmission(submissionId) {
    try {
        currentSubmissionId = submissionId;
        
        // Load submission data
        const submissionDoc = await db.collection('exam_results').doc(submissionId).get();
        if (!submissionDoc.exists) {
            alert('Không tìm thấy bài thi');
            return;
        }
        
        currentSubmissionData = submissionDoc.data();
        
        // Load exam data if not already loaded
        if (!currentExamData) {
            const examDoc = await db.collection('exams').doc(currentSubmissionData.examId).get();
            if (examDoc.exists) {
                currentExamData = examDoc.data();
            }
        }
        
        // Display submission content
        submissionContent.innerHTML = '';
        
        if (currentExamData && currentExamData.questions) {
            currentExamData.questions.forEach((question, index) => {
                const submissionAnswer = currentSubmissionData.answers.find(a => a.questionId === question.id);
                
                const questionElement = document.createElement('div');
                questionElement.className = 'mb-6 pb-4 border-b border-gray-200 last:border-0';
                questionElement.innerHTML = `
                    <h4 class="font-medium mb-2">Câu ${index + 1}: ${question.content}</h4>
                    <div class="ml-4">
                        ${renderQuestionAnswer(question, submissionAnswer)}
                    </div>
                `;
                
                submissionContent.appendChild(questionElement);
            });
        } else {
            submissionContent.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-exclamation-circle text-2xl mb-2"></i>
                    <p>Không thể hiển thị nội dung bài thi</p>
                </div>
            `;
        }
        
        // Set grade if already graded
        gradeInput.value = currentSubmissionData.score || '';
        
        // Show grading section
        gradingSection.classList.remove('hidden');
        aiFeedback.classList.add('hidden');
    } catch (error) {
        console.error('Error viewing submission:', error);
        alert('Có lỗi xảy ra khi tải bài thi');
    }
}

function renderQuestionAnswer(question, submissionAnswer) {
    if (!submissionAnswer) return '<p class="text-red-500">Không có câu trả lời</p>';
    
    if (question.type === 'multiple-choice') {
        const selectedOption = question.options.find(opt => opt.option === submissionAnswer.answer);
        const correctOption = question.options.find(opt => opt.option === question.correctAnswer);
        
        return `
            <div class="space-y-2">
                <div class="flex items-center">
                    <span class="font-medium mr-2">Câu trả lời:</span>
                    <span class="${submissionAnswer.answer === question.correctAnswer ? 'text-green-600' : 'text-red-600'}">
                        ${selectedOption ? `${selectedOption.option.toUpperCase()}: ${selectedOption.value}` : '--'}
                    </span>
                </div>
                ${submissionAnswer.answer !== question.correctAnswer ? `
                    <div class="flex items-center text-green-600">
                        <span class="font-medium mr-2">Đáp án đúng:</span>
                        <span>${correctOption ? `${correctOption.option.toUpperCase()}: ${correctOption.value}` : '--'}</span>
                    </div>
                ` : ''}
            </div>
        `;
    } else if (question.type === 'true-false') {
        return `
            <div class="space-y-2">
                <div class="flex items-center">
                    <span class="font-medium mr-2">Câu trả lời:</span>
                    <span class="${submissionAnswer.answer === question.correctAnswer ? 'text-green-600' : 'text-red-600'}">
                        ${submissionAnswer.answer === 'true' ? 'Đúng' : 'Sai'}
                    </span>
                </div>
                ${submissionAnswer.answer !== question.correctAnswer ? `
                    <div class="flex items-center text-green-600">
                        <span class="font-medium mr-2">Đáp án đúng:</span>
                        <span>${question.correctAnswer === 'true' ? 'Đúng' : 'Sai'}</span>
                    </div>
                ` : ''}
            </div>
        `;
    } else if (question.type === 'short-answer' || question.type === 'essay') {
        return `
            <div class="space-y-2">
                <div class="font-medium mb-1">Câu trả lời:</div>
                <div class="bg-gray-50 p-3 rounded whitespace-pre-wrap">${submissionAnswer.answer || 'Không có câu trả lời'}</div>
                ${question.correctAnswer ? `
                    <div class="mt-2">
                        <div class="font-medium mb-1">Đáp án mẫu:</div>
                        <div class="bg-green-50 p-3 rounded whitespace-pre-wrap">${question.correctAnswer}</div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    return '<p class="text-gray-500">Không thể hiển thị câu trả lời</p>';
}

async function gradeWithAI() {
    // In a real app, this would call an AI API to grade the submission
    // For demo purposes, we'll simulate AI grading
    
    try {
        // Show loading state
        aiFeedbackText.textContent = 'AI đang chấm điểm...';
        aiFeedback.classList.remove('hidden');
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Calculate score (simple implementation for demo)
        let correctCount = 0;
        if (currentExamData && currentExamData.questions && currentSubmissionData.answers) {
            currentExamData.questions.forEach(question => {
                const answer = currentSubmissionData.answers.find(a => a.questionId === question.id);
                if (answer && answer.answer === question.correctAnswer) {
                    correctCount++;
                }
            });
            
            const score = (correctCount / currentExamData.questions.length) * 10;
            gradeInput.value = score.toFixed(1);
            
            // Generate feedback
            if (score >= 8) {
                aiFeedbackText.textContent = 'Bài làm xuất sắc! Học sinh có kiến thức văn học vững vàng, diễn đạt tốt.';
            } else if (score >= 6) {
                aiFeedbackText.textContent = 'Bài làm khá tốt. Một số câu trả lời cần diễn đạt rõ ràng hơn.';
            } else if (score >= 4) {
                aiFeedbackText.textContent = 'Bài làm đạt yêu cầu tối thiểu. Cần cải thiện kiến thức và cách diễn đạt.';
            } else {
                aiFeedbackText.textContent = 'Bài làm chưa đạt yêu cầu. Cần ôn tập lại kiến thức cơ bản.';
            }
        } else {
            aiFeedbackText.textContent = 'Không thể chấm điểm tự động. Vui lòng chấm thủ công.';
        }
    } catch (error) {
        console.error('Error grading with AI:', error);
        aiFeedbackText.textContent = 'Có lỗi xảy ra khi chấm điểm bằng AI. Vui lòng thử lại.';
    }
}

async function gradeWithAIAssist() {
    // In a real app, this would call an AI API to provide grading assistance
    // For demo purposes, we'll simulate AI assistance
    
    try {
        // Show loading state
        aiFeedbackText.textContent = 'AI đang phân tích bài làm...';
        aiFeedback.classList.remove('hidden');
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Generate feedback (simulated)
        const feedbackPoints = [];
        
        if (currentExamData && currentExamData.questions && currentSubmissionData.answers) {
            // Check for unanswered questions
            const unanswered = currentExamData.questions.filter(question => {
                const answer = currentSubmissionData.answers.find(a => a.questionId === question.id);
                return !answer || !answer.answer;
            });
            
            if (unanswered.length > 0) {
                feedbackPoints.push(`- Có ${unanswered.length} câu chưa được trả lời.`);
            }
            
            // Check for correct answers
            const correctAnswers = currentExamData.questions.filter(question => {
                const answer = currentSubmissionData.answers.find(a => a.questionId === question.id);
                return answer && answer.answer === question.correctAnswer;
            });
            
            if (correctAnswers.length > 0) {
                feedbackPoints.push(`- Có ${correctAnswers.length} câu trả lời đúng.`);
            }
            
            // Check for essay questions
            const essayQuestions = currentExamData.questions.filter(q => q.type === 'essay');
            if (essayQuestions.length > 0) {
                feedbackPoints.push(`- Bài luận cần kiểm tra về ý tưởng, bố cục và cách diễn đạt.`);
            }
        }
        
        if (feedbackPoints.length > 0) {
            aiFeedbackText.innerHTML = '<strong>Gợi ý chấm điểm:</strong><br>' + feedbackPoints.join('<br>');
        } else {
            aiFeedbackText.textContent = 'Không có gợi ý chấm điểm cụ thể. Vui lòng kiểm tra từng câu hỏi.';
        }
    } catch (error) {
        console.error('Error getting AI assistance:', error);
        aiFeedbackText.textContent = 'Có lỗi xảy ra khi lấy gợi ý từ AI. Vui lòng thử lại.';
    }
}

async function submitGrade() {
    const score = parseFloat(gradeInput.value);
    
    if (isNaN(score) {
        alert('Vui lòng nhập điểm hợp lệ');
        return;
    }
    
    try {
        await db.collection('exam_results').doc(currentSubmissionId).update({
            graded: true,
            score: score,
            gradedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert('Đã lưu điểm thành công');
        
        // Reload submissions list
        viewExamDetails(currentExamId);
    } catch (error) {
        console.error('Error submitting grade:', error);
        alert('Có lỗi xảy ra khi lưu điểm. Vui lòng thử lại.');
    }
}

async function viewResultDetails(resultId) {
    try {
        // Load result data
        const resultDoc = await db.collection('exam_results').doc(resultId).get();
        if (!resultDoc.exists) {
            alert('Không tìm thấy kết quả bài thi');
            return;
        }
        
        const result = resultDoc.data();
        const submittedDate = result.submittedAt ? result.submittedAt.toDate() : new Date();
        
        // Update modal content
        resultDetailsTitle.textContent = result.examTitle || 'Bài thi không có tiêu đề';
        resultStudentName.textContent = result.studentName;
        resultSubmittedDate.textContent = submittedDate.toLocaleString();
        
        if (result.graded && result.score !== undefined) {
            resultScore.textContent = result.score.toFixed(1);
        } else {
            resultScore.textContent = '--';
        }
        
        // Load exam data if available
        let examData = null;
        if (result.examId) {
            const examDoc = await db.collection('exams').doc(result.examId).get();
            if (examDoc.exists) {
                examData = examDoc.data();
            }
        }
        
        // Display result content
        resultContent.innerHTML = '';
        
        if (examData && examData.questions && result.answers) {
            examData.questions.forEach((question, index) => {
                const answer = result.answers.find(a => a.questionId === question.id);
                
                const questionElement = document.createElement('div');
                questionElement.className = 'mb-6 pb-4 border-b border-gray-200 last:border-0';
                questionElement.innerHTML = `
                    <h4 class="font-medium mb-2">Câu ${index + 1}: ${question.content}</h4>
                    <div class="ml-4">
                        ${renderQuestionResult(question, answer, result.graded)}
                    </div>
                `;
                
                resultContent.appendChild(questionElement);
            });
        } else {
            resultContent.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-exclamation-circle text-2xl mb-2"></i>
                    <p>Không thể hiển thị chi tiết bài thi</p>
                </div>
            `;
        }
        
        // Show modal
        resultDetailsModal.classList.remove('hidden');
    } catch (error) {
        console.error('Error viewing result details:', error);
        alert('Có lỗi xảy ra khi tải chi tiết kết quả');
    }
}

function renderQuestionResult(question, answer, isGraded) {
    if (!answer) return '<p class="text-red-500">Không có câu trả lời</p>';
    
    if (question.type === 'multiple-choice') {
        const selectedOption = question.options.find(opt => opt.option === answer.answer);
        const correctOption = question.options.find(opt => opt.option === question.correctAnswer);
        
        return `
            <div class="space-y-2">
                <div class="flex items-center">
                    <span class="font-medium mr-2">Câu trả lời của bạn:</span>
                    <span class="${isGraded ? (answer.answer === question.correctAnswer ? 'text-green-600' : 'text-red-600') : ''}">
                        ${selectedOption ? `${selectedOption.option.toUpperCase()}: ${selectedOption.value}` : '--'}
                    </span>
                </div>
                ${isGraded && answer.answer !== question.correctAnswer ? `
                    <div class="flex items-center text-green-600">
                        <span class="font-medium mr-2">Đáp án đúng:</span>
                        <span>${correctOption ? `${correctOption.option.toUpperCase()}: ${correctOption.value}` : '--'}</span>
                    </div>
                ` : ''}
            </div>
        `;
    } else if (question.type === 'true-false') {
        return `
            <div class="space-y-2">
                <div class="flex items-center">
                    <span class="font-medium mr-2">Câu trả lời của bạn:</span>
                    <span class="${isGraded ? (answer.answer === question.correctAnswer ? 'text-green-600' : 'text-red-600') : ''}">
                        ${answer.answer === 'true' ? 'Đúng' : 'Sai'}
                    </span>
                </div>
                ${isGraded && answer.answer !== question.correctAnswer ? `
                    <div class="flex items-center text-green-600">
                        <span class="font-medium mr-2">Đáp án đúng:</span>
                        <span>${question.correctAnswer === 'true' ? 'Đúng' : 'Sai'}</span>
                    </div>
                ` : ''}
            </div>
        `;
    } else if (question.type === 'short-answer' || question.type === 'essay') {
        let feedback = '';
        if (isGraded && answer.feedback) {
            feedback = `
                <div class="mt-2 bg-blue-50 border border-blue-200 rounded p-2">
                    <h5 class="font-medium text-blue-800">Nhận xét:</h5>
                    <p class="text-blue-700">${answer.feedback}</p>
                </div>
            `;
        }
        
        return `
            <div class="space-y-2">
                <div class="font-medium mb-1">Câu trả lời của bạn:</div>
                <div class="bg-gray-50 p-3 rounded whitespace-pre-wrap">${answer.answer || 'Không có câu trả lời'}</div>
                ${isGraded && question.correctAnswer ? `
                    <div class="mt-2">
                        <div class="font-medium mb-1">Đáp án mẫu:</div>
                        <div class="bg-green-50 p-3 rounded whitespace-pre-wrap">${question.correctAnswer}</div>
                    </div>
                ` : ''}
                ${feedback}
            </div>
        `;
    }
    
    return '<p class="text-gray-500">Không thể hiển thị chi tiết câu hỏi</p>';
}