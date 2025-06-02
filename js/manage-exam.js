// DOM Elements
const yourExamsTab = document.getElementById('your-exams-tab');
const yourSubmissionsTab = document.getElementById('your-submissions-tab');
const yourExamsContent = document.getElementById('your-exams-content');
const yourSubmissionsContent = document.getElementById('your-submissions-content');
const examsList = document.getElementById('exams-list');
const submissionsList = document.getElementById('submissions-list');
const examDetailsModal = document.getElementById('exam-details-modal');
const submissionDetailsModal = document.getElementById('submission-details-modal');
const gradingOptionsModal = document.getElementById('grading-options-modal');
const examSubmissionsList = document.getElementById('exam-submissions-list');
const submissionDetails = document.getElementById('submission-details');
const gradingSection = document.getElementById('grading-section');
const gradeScoreInput = document.getElementById('grade-score');
const gradeFeedbackInput = document.getElementById('grade-feedback');
const submitGradeBtn = document.getElementById('submit-grade-btn');
const modalCloseBtns = document.querySelectorAll('.close-btn');

// State variables
let currentUser = null;
let currentExamId = null;
let currentSubmissionId = null;
let currentGradingMethod = null;

// Event Listeners
yourExamsTab.addEventListener('click', () => {
    yourExamsTab.classList.add('active');
    yourSubmissionsTab.classList.remove('active');
    yourExamsContent.classList.add('active');
    yourSubmissionsContent.classList.remove('active');
    loadUserExams();
});

yourSubmissionsTab.addEventListener('click', () => {
    yourSubmissionsTab.classList.add('active');
    yourExamsTab.classList.remove('active');
    yourSubmissionsContent.classList.add('active');
    yourExamsContent.classList.remove('active');
    loadUserSubmissions();
});

// Modal close buttons
modalCloseBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        examDetailsModal.classList.add('hidden');
        submissionDetailsModal.classList.add('hidden');
        gradingOptionsModal.classList.add('hidden');
    });
});

// Grading options
document.getElementById('ai-grade-card').addEventListener('click', () => {
    currentGradingMethod = 'ai';
    gradeWithAI();
});

document.getElementById('ai-assist-card').addEventListener('click', () => {
    currentGradingMethod = 'ai-assist';
    gradeWithAIAssist();
});

document.getElementById('manual-grade-card').addEventListener('click', () => {
    currentGradingMethod = 'manual';
    gradeManually();
});

// Submit grade
submitGradeBtn.addEventListener('click', submitGrade);

// Initialize
function init() {
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            loadUserExams();
            loadUserSubmissions();
        } else {
            // Redirect to login if not authenticated
            window.location.href = 'index.html';
        }
    });
}

// Load user's created exams
function loadUserExams() {
    examsList.innerHTML = '<div class="loading">Đang tải đề thi...</div>';
    
    db.collection('exams')
        .where('createdBy', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .get()
        .then(querySnapshot => {
            examsList.innerHTML = '';
            
            if (querySnapshot.empty) {
                examsList.innerHTML = '<p class="empty-message">Bạn chưa tạo đề thi nào.</p>';
                return;
            }
            
            querySnapshot.forEach(doc => {
                const exam = doc.data();
                const examCard = createExamCard(exam, doc.id);
                examsList.appendChild(examCard);
            });
        })
        .catch(error => {
            console.error("Error loading exams: ", error);
            examsList.innerHTML = '<p class="error-message">Có lỗi xảy ra khi tải đề thi.</p>';
        });
}

// Create exam card element
function createExamCard(exam, examId) {
    const examCard = document.createElement('div');
    examCard.className = 'card';
    examCard.dataset.examId = examId;
    
    const createdAt = exam.createdAt ? exam.createdAt.toDate().toLocaleString() : 'Chưa xác định';
    const submissionsCount = exam.submissionsCount || 0;
    
    examCard.innerHTML = `
        <div class="card-header">
            <h3>${exam.title || 'Không có tiêu đề'}</h3>
            <span class="badge">${submissionsCount} bài thi</span>
        </div>
        <div class="card-body">
            <p><strong>Mô tả:</strong> ${exam.description || 'Không có mô tả'}</p>
            <p><strong>Thời gian:</strong> ${exam.duration || 0} phút</p>
            <p><strong>Số câu hỏi:</strong> ${exam.questions ? exam.questions.length : 0}</p>
            <p><strong>Ngày tạo:</strong> ${createdAt}</p>
        </div>
        <div class="card-footer">
            <button class="btn view-submissions-btn">Xem bài thi</button>
        </div>
    `;
    
    examCard.querySelector('.view-submissions-btn').addEventListener('click', () => {
        currentExamId = examId;
        viewExamSubmissions(examId);
    });
    
    return examCard;
}

// View submissions for an exam
function viewExamSubmissions(examId) {
    examSubmissionsList.innerHTML = '<div class="loading">Đang tải bài thi...</div>';
    examDetailsModal.classList.remove('hidden');
    
    // Load exam details
    db.collection('exams').doc(examId).get()
        .then(examDoc => {
            const exam = examDoc.data();
            document.getElementById('exam-modal-title').textContent = `Bài thi cho đề: ${exam.title}`;
            
            // Load submissions for this exam
            db.collection('examSubmissions')
                .where('examId', '==', examId)
                .orderBy('submittedAt', 'desc')
                .get()
                .then(submissionsSnapshot => {
                    examSubmissionsList.innerHTML = '';
                    
                    if (submissionsSnapshot.empty) {
                        examSubmissionsList.innerHTML = '<p class="empty-message">Chưa có bài thi nào.</p>';
                        return;
                    }
                    
                    submissionsSnapshot.forEach(subDoc => {
                        const submission = subDoc.data();
                        const submissionItem = createSubmissionItem(submission, subDoc.id, exam);
                        examSubmissionsList.appendChild(submissionItem);
                    });
                })
                .catch(error => {
                    console.error("Error loading submissions: ", error);
                    examSubmissionsList.innerHTML = '<p class="error-message">Có lỗi xảy ra khi tải bài thi.</p>';
                });
        })
        .catch(error => {
            console.error("Error loading exam: ", error);
            examSubmissionsList.innerHTML = '<p class="error-message">Có lỗi xảy ra khi tải đề thi.</p>';
        });
}

// Create submission list item
function createSubmissionItem(submission, submissionId, exam) {
    const submissionItem = document.createElement('div');
    submissionItem.className = 'submission-item';
    submissionItem.dataset.submissionId = submissionId;
    
    const submittedAt = submission.submittedAt ? submission.submittedAt.toDate().toLocaleString() : 'Chưa xác định';
    let scoreDisplay = 'Chưa chấm';
    
    if (submission.isGraded) {
        scoreDisplay = `${submission.score}/${submission.totalScore}`;
    }
    
    submissionItem.innerHTML = `
        <div class="submission-header">
            <h4>${submission.studentName || 'Không tên'}</h4>
            <span class="score-badge">${scoreDisplay}</span>
        </div>
        <div class="submission-details">
            <p><strong>Nộp lúc:</strong> ${submittedAt}</p>
            <p><strong>Đề thi:</strong> ${submission.examTitle}</p>
        </div>
        <div class="submission-actions">
            <button class="btn view-submission-btn">Xem chi tiết</button>
            ${!submission.isGraded ? '<button class="btn grade-submission-btn">Chấm điểm</button>' : ''}
        </div>
    `;
    
    submissionItem.querySelector('.view-submission-btn').addEventListener('click', () => {
        viewSubmissionDetails(submissionId, exam);
    });
    
    if (!submission.isGraded) {
        submissionItem.querySelector('.grade-submission-btn').addEventListener('click', () => {
            currentSubmissionId = submissionId;
            showGradingOptions();
        });
    }
    
    return submissionItem;
}

// View submission details
function viewSubmissionDetails(submissionId, exam) {
    submissionDetails.innerHTML = '<div class="loading">Đang tải chi tiết bài thi...</div>';
    submissionDetailsModal.classList.remove('hidden');
    
    db.collection('examSubmissions').doc(submissionId).get()
        .then(subDoc => {
            const submission = subDoc.data();
            currentSubmissionId = submissionId;
            
            document.getElementById('submission-modal-title').textContent = 
                `Bài thi của ${submission.studentName} - ${submission.examTitle}`;
            
            let detailsHtml = `
                <div class="submission-info">
                    <p><strong>Thí sinh:</strong> ${submission.studentName}</p>
                    <p><strong>Đề thi:</strong> ${submission.examTitle}</p>
                    <p><strong>Thời gian nộp:</strong> ${submission.submittedAt.toDate().toLocaleString()}</p>
            `;
            
            if (submission.isGraded) {
                detailsHtml += `
                    <p><strong>Điểm:</strong> ${submission.score}/${submission.totalScore}</p>
                    <p><strong>Nhận xét:</strong> ${submission.feedback || 'Không có nhận xét'}</p>
                `;
            }
            
            detailsHtml += `</div><div class="submission-answers">`;
            
            // Show questions and answers
            exam.questions.forEach((question, index) => {
                const userAnswer = submission.answers[question.id] || 'Không trả lời';
                let correctAnswer = '';
                
                if (question.type === 'multiple-choice') {
                    correctAnswer = `Đáp án đúng: ${question.correctAnswer}`;
                } else if (question.type === 'true-false') {
                    correctAnswer = `Đáp án đúng: ${question.correctAnswer ? 'Đúng' : 'Sai'}`;
                } else if (question.sampleAnswer) {
                    correctAnswer = `Đáp án tham khảo: ${question.sampleAnswer}`;
                }
                
                detailsHtml += `
                    <div class="submission-question">
                        <div class="question-header">
                            <span class="question-number">Câu ${index + 1}</span>
                            <span class="question-points">(${question.points} điểm)</span>
                        </div>
                        <div class="question-content">${question.content}</div>
                        <div class="user-answer">
                            <strong>Câu trả lời:</strong> ${formatAnswer(userAnswer, question.type)}
                        </div>
                        ${correctAnswer ? `<div class="correct-answer">${correctAnswer}</div>` : ''}
                    </div>
                `;
            });
            
            detailsHtml += `</div>`;
            submissionDetails.innerHTML = detailsHtml;
            
            // Show grading section if not graded
            if (!submission.isGraded) {
                gradingSection.classList.remove('hidden');
                gradeScoreInput.max = exam.questions.reduce((sum, q) => sum + q.points, 0);
            } else {
                gradingSection.classList.add('hidden');
            }
        })
        .catch(error => {
            console.error("Error loading submission: ", error);
            submissionDetails.innerHTML = '<p class="error-message">Có lỗi xảy ra khi tải bài thi.</p>';
        });
}

// Format answer based on question type
function formatAnswer(answer, questionType) {
    if (questionType === 'true-false') {
        return answer === 'true' ? 'Đúng' : 'Sai';
    }
    return answer;
}

// Show grading options
function showGradingOptions() {
    gradingOptionsModal.classList.remove('hidden');
}

// Grade with AI
function gradeWithAI() {
    gradingOptionsModal.classList.add('hidden');
    
    // Simulate AI grading (in a real app, this would call an API)
    setTimeout(() => {
        const score = Math.floor(Math.random() * 20) + 1; // Random score for demo
        const totalScore = 20; // Assuming max score is 20 for demo
        
        gradeScoreInput.value = score;
        gradeFeedbackInput.value = 'AI đã chấm điểm bài thi này. Kết quả khá tốt!';
        
        Swal.fire({
            icon: 'success',
            title: 'Chấm điểm bằng AI thành công',
            text: `Điểm số: ${score}/${totalScore}`
        });
    }, 1500);
}

// Grade with AI assist
function gradeWithAIAssist() {
    gradingOptionsModal.classList.add('hidden');
    
    // Simulate AI assist (in a real app, this would call an API)
    setTimeout(() => {
        // Highlight good and bad parts in the answers
        const questions = submissionDetails.querySelectorAll('.submission-question');
        questions.forEach((question, index) => {
            if (index % 2 === 0) { // Simulate some good answers
                question.classList.add('ai-good');
                const aiNote = document.createElement('div');
                aiNote.className = 'ai-note good';
                aiNote.textContent = 'AI: Câu trả lời tốt, đầy đủ ý';
                question.appendChild(aiNote);
            } else { // Simulate some bad answers
                question.classList.add('ai-bad');
                const aiNote = document.createElement('div');
                aiNote.className = 'ai-note bad';
                aiNote.textContent = 'AI: Câu trả lời thiếu ý chính';
                question.appendChild(aiNote);
            }
        });
        
        Swal.fire({
            icon: 'info',
            title: 'AI đã đánh dấu các phần trong bài thi',
            text: 'Vui lòng xem các ghi chú và chấm điểm theo đánh giá của bạn'
        });
    }, 1500);
}

// Grade manually
function gradeManually() {
    gradingOptionsModal.classList.add('hidden');
    Swal.fire({
        icon: 'info',
        title: 'Chế độ chấm thủ công',
        text: 'Vui lòng nhập điểm và nhận xét cho bài thi này'
    });
}

// Submit grade
function submitGrade() {
    const score = parseFloat(gradeScoreInput.value);
    const feedback = gradeFeedbackInput.value.trim();
    
    if (isNaN(score) || score < 0) {
        alert('Vui lòng nhập điểm hợp lệ');
        return;
    }
    
    // Calculate total possible score
    db.collection('exams').doc(currentExamId).get()
        .then(examDoc => {
            const exam = examDoc.data();
            const totalScore = exam.questions.reduce((sum, q) => sum + q.points, 0);
            
            if (score > totalScore) {
                alert(`Điểm không được vượt quá ${totalScore}`);
                return;
            }
            
            // Update submission with grade
            db.collection('examSubmissions').doc(currentSubmissionId).update({
                isGraded: true,
                score: score,
                totalScore: totalScore,
                feedback: feedback,
                gradedAt: firebase.firestore.FieldValue.serverTimestamp(),
                gradedBy: currentUser.uid
            })
            .then(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'Chấm điểm thành công',
                    text: `Đã gửi điểm ${score}/${totalScore} cho thí sinh`
                });
                
                // Close modal and refresh lists
                submissionDetailsModal.classList.add('hidden');
                viewExamSubmissions(currentExamId);
                loadUserExams();
            })
            .catch(error => {
                console.error("Error grading submission: ", error);
                alert('Có lỗi xảy ra khi chấm điểm. Vui lòng thử lại.');
            });
        })
        .catch(error => {
            console.error("Error loading exam: ", error);
            alert('Có lỗi xảy ra khi tải đề thi. Vui lòng thử lại.');
        });
}

// Load user's submissions
function loadUserSubmissions() {
    submissionsList.innerHTML = '<div class="loading">Đang tải bài thi...</div>';
    
    db.collection('examSubmissions')
        .where('studentName', '==', currentUser.email) // Using email as student name for demo
        .orderBy('submittedAt', 'desc')
        .get()
        .then(querySnapshot => {
            submissionsList.innerHTML = '';
            
            if (querySnapshot.empty) {
                submissionsList.innerHTML = '<p class="empty-message">Bạn chưa làm bài thi nào.</p>';
                return;
            }
            
            querySnapshot.forEach(doc => {
                const submission = doc.data();
                const submissionCard = createSubmissionCard(submission, doc.id);
                submissionsList.appendChild(submissionCard);
            });
        })
        .catch(error => {
            console.error("Error loading submissions: ", error);
            submissionsList.innerHTML = '<p class="error-message">Có lỗi xảy ra khi tải bài thi.</p>';
        });
}

// Create submission card for user's submissions
function createSubmissionCard(submission, submissionId) {
    const submissionCard = document.createElement('div');
    submissionCard.className = 'card';
    submissionCard.dataset.submissionId = submissionId;
    
    const submittedAt = submission.submittedAt ? submission.submittedAt.toDate().toLocaleString() : 'Chưa xác định';
    let scoreDisplay = 'Chưa chấm';
    let statusClass = 'pending';
    
    if (submission.isGraded) {
        scoreDisplay = `${submission.score}/${submission.totalScore}`;
        statusClass = 'graded';
    }
    
    submissionCard.innerHTML = `
        <div class="card-header">
            <h3>${submission.examTitle || 'Không có tiêu đề'}</h3>
            <span class="badge ${statusClass}">${scoreDisplay}</span>
        </div>
        <div class="card-body">
            <p><strong>Thời gian nộp:</strong> ${submittedAt}</p>
            <p><strong>Trạng thái:</strong> ${submission.isGraded ? 'Đã chấm' : 'Đang chờ chấm'}</p>
            ${submission.feedback ? `<p><strong>Nhận xét:</strong> ${submission.feedback.substring(0, 50)}...</p>` : ''}
        </div>
        <div class="card-footer">
            <button class="btn view-submission-btn">Xem chi tiết</button>
        </div>
    `;
    
    submissionCard.querySelector('.view-submission-btn').addEventListener('click', () => {
        // Load exam first to show questions and correct answers
        db.collection('exams').doc(submission.examId).get()
            .then(examDoc => {
                viewSubmissionDetails(submissionId, examDoc.data());
            })
            .catch(error => {
                console.error("Error loading exam: ", error);
                alert('Có lỗi xảy ra khi tải đề thi.');
            });
    });
    
    return submissionCard;
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);