// DOM Elements
const stepContents = document.querySelectorAll('.creation-step-content');
const steps = document.querySelectorAll('.creation-step');
const nextStepButtons = document.querySelectorAll('.next-step');
const prevStepButtons = document.querySelectorAll('.prev-step');
const methodCards = document.querySelectorAll('.method-card');
const manualForm = document.getElementById('manual-creation-form');
const aiForm = document.getElementById('ai-creation-form');
const wordForm = document.getElementById('word-import-form');
const imageForm = document.getElementById('image-import-form');
const questionsListContainer = document.getElementById('questions-list-container');
const questionsList = document.getElementById('questions-list');
const questionTypeSelect = document.getElementById('question-type');
const questionOptions = document.querySelectorAll('.question-options');
const addQuestionBtn = document.getElementById('add-question');
const cancelQuestionBtn = document.getElementById('cancel-question');
const generateAIExamBtn = document.getElementById('generate-ai-exam');
const processWordBtn = document.getElementById('process-word-file');
const uploadImageBtn = document.getElementById('upload-image-btn');
const captureImageBtn = document.getElementById('capture-image-btn');
const processImageBtn = document.getElementById('process-image-file');
const imageFileInput = document.getElementById('image-file');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const removeImageBtn = document.getElementById('remove-image-btn');
const saveExamBtn = document.getElementById('save-exam-btn');
const printExamBtn = document.getElementById('print-exam-btn');
const exportPdfBtn = document.getElementById('export-pdf-btn');
const qrShare = document.getElementById('qr-share');
const linkShare = document.getElementById('link-share');
const shareOutput = document.getElementById('share-output');
const qrContainer = document.getElementById('qr-container');
const linkContainer = document.getElementById('link-container');
const downloadQrBtn = document.getElementById('download-qr-btn');
const copyLinkBtn = document.getElementById('copy-link-btn');
const examLink = document.getElementById('exam-link');
const cameraModal = document.getElementById('camera-modal');
const cameraFeed = document.getElementById('camera-feed');
const cameraCanvas = document.getElementById('camera-canvas');
const captureBtn = document.getElementById('capture-btn');
const retryBtn = document.getElementById('retry-btn');
const usePhotoBtn = document.getElementById('use-photo-btn');
const closeCameraBtn = cameraModal.querySelector('.close-btn');

// Exam data
let examData = {
    title: '',
    description: '',
    duration: 60,
    questions: [],
    security: {
        preventCopyPaste: false,
        preventTabSwitch: false,
        enableNotifications: false
    },
    createdAt: null,
    createdBy: null
};

// Current state
let currentStep = 'step1';
let currentMethod = null;
let stream = null;

// Event Listeners
nextStepButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        const nextStep = e.target.dataset.next;
        goToStep(nextStep);
    });
});

prevStepButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        const prevStep = e.target.dataset.prev;
        goToStep(prevStep);
    });
});

methodCards.forEach(card => {
    card.addEventListener('click', () => {
        currentMethod = card.id.split('-')[0];
        showMethodForm(currentMethod);
    });
});

questionTypeSelect.addEventListener('change', (e) => {
    showQuestionOptions(e.target.value);
});

addQuestionBtn.addEventListener('click', addQuestion);
cancelQuestionBtn.addEventListener('click', resetQuestionForm);
generateAIExamBtn.addEventListener('click', generateAIExam);
processWordBtn.addEventListener('click', processWordFile);
uploadImageBtn.addEventListener('click', () => imageFileInput.click());
captureImageBtn.addEventListener('click', openCameraModal);
processImageBtn.addEventListener('click', processImageFile);
imageFileInput.addEventListener('change', handleImageUpload);
removeImageBtn.addEventListener('click', removeImage);
saveExamBtn.addEventListener('click', saveExam);
printExamBtn.addEventListener('click', printExam);
exportPdfBtn.addEventListener('click', exportToPDF);
qrShare.addEventListener('click', showQRCode);
linkShare.addEventListener('click', showExamLink);
downloadQrBtn.addEventListener('click', downloadQRCode);
copyLinkBtn.addEventListener('click', copyExamLink);
captureBtn.addEventListener('click', captureImage);
retryBtn.addEventListener('click', retryCapture);
usePhotoBtn.addEventListener('click', useCapturedImage);
closeCameraBtn.addEventListener('click', closeCameraModal);

// Initialize
function init() {
    // Load user data if available
    const user = auth.currentUser;
    if (user) {
        examData.createdBy = user.uid;
    }
    
    // Set up event listeners for step 1 form
    document.getElementById('exam-title').addEventListener('input', (e) => {
        examData.title = e.target.value;
        updatePreview();
    });
    
    document.getElementById('exam-duration').addEventListener('input', (e) => {
        examData.duration = parseInt(e.target.value);
        updatePreview();
    });
    
    document.getElementById('exam-description').addEventListener('input', (e) => {
        examData.description = e.target.value;
        updatePreview();
    });
    
    // Set up event listeners for security settings
    document.getElementById('prevent-copy-paste').addEventListener('change', (e) => {
        examData.security.preventCopyPaste = e.target.checked;
    });
    
    document.getElementById('prevent-tab-switch').addEventListener('change', (e) => {
        examData.security.preventTabSwitch = e.target.checked;
    });
    
    document.getElementById('enable-notifications').addEventListener('change', (e) => {
        examData.security.enableNotifications = e.target.checked;
    });
}

// Navigation functions
function goToStep(step) {
    // Validate before proceeding
    if (step === 'step2' && currentStep === 'step1') {
        if (!validateStep1()) return;
    } else if (step === 'step3' && currentStep === 'step2') {
        if (examData.questions.length === 0) {
            alert('Vui lòng thêm ít nhất một câu hỏi');
            return;
        }
    } else if (step === 'step4' && currentStep === 'step3') {
        // No validation needed for step 3
    }
    
    // Update UI
    document.getElementById(`${currentStep}-content`).classList.remove('active');
    document.getElementById(currentStep).classList.remove('active');
    
    document.getElementById(`${step}-content`).classList.add('active');
    document.getElementById(step).classList.add('active');
    
    currentStep = step;
    
    // Special handling for step 4
    if (step === 'step4') {
        updatePreview();
    }
}

function validateStep1() {
    const title = document.getElementById('exam-title').value.trim();
    const duration = document.getElementById('exam-duration').value;
    
    if (!title) {
        alert('Vui lòng nhập tiêu đề đề thi');
        return false;
    }
    
    if (!duration || parseInt(duration) <= 0) {
        alert('Thời gian làm bài phải lớn hơn 0');
        return false;
    }
    
    return true;
}

// Method selection functions
function showMethodForm(method) {
    // Hide all method forms first
    manualForm.classList.add('hidden');
    aiForm.classList.add('hidden');
    wordForm.classList.add('hidden');
    imageForm.classList.add('hidden');
    
    // Show selected method form
    switch (method) {
        case 'manual':
            manualForm.classList.remove('hidden');
            resetQuestionForm();
            break;
        case 'ai':
            aiForm.classList.remove('hidden');
            break;
        case 'word':
            wordForm.classList.remove('hidden');
            break;
        case 'image':
            imageForm.classList.remove('hidden');
            break;
    }
}

// Question creation functions
function showQuestionOptions(type) {
    // Hide all options first
    questionOptions.forEach(option => option.classList.add('hidden'));
    
    // Show options for selected type
    switch (type) {
        case 'multiple-choice':
            document.getElementById('multiple-choice-options').classList.remove('hidden');
            break;
        case 'true-false':
            document.getElementById('true-false-options').classList.remove('hidden');
            break;
        case 'short-answer':
        case 'essay':
            document.getElementById('text-answer-options').classList.remove('hidden');
            break;
    }
}

function addQuestion() {
    const type = questionTypeSelect.value;
    const content = document.getElementById('question-content').value.trim();
    const points = parseFloat(document.getElementById('question-points').value);
    
    if (!content) {
        alert('Vui lòng nhập nội dung câu hỏi');
        return;
    }
    
    const question = {
        id: Date.now().toString(),
        type,
        content,
        points
    };
    
    // Add answer based on question type
    switch (type) {
        case 'multiple-choice':
            const options = {
                A: document.getElementById('option-a').value.trim(),
                B: document.getElementById('option-b').value.trim(),
                C: document.getElementById('option-c').value.trim(),
                D: document.getElementById('option-d').value.trim()
            };
            
            const correctAnswer = document.querySelector('input[name="correct-answer"]:checked')?.value;
            
            if (!correctAnswer) {
                alert('Vui lòng chọn đáp án đúng');
                return;
            }
            
            question.options = options;
            question.correctAnswer = correctAnswer;
            break;
            
        case 'true-false':
            const correctTF = document.querySelector('input[name="correct-tf"]:checked')?.value;
            
            if (!correctTF) {
                alert('Vui lòng chọn đáp án đúng');
                return;
            }
            
            question.correctAnswer = correctTF === 'true';
            break;
            
        case 'short-answer':
        case 'essay':
            const sampleAnswer = document.getElementById('correct-answer-text').value.trim();
            question.sampleAnswer = sampleAnswer;
            break;
    }
    
    // Add question to exam data
    examData.questions.push(question);
    
    // Update questions list
    updateQuestionsList();
    
    // Reset form
    resetQuestionForm();
    
    // Show questions list
    questionsListContainer.classList.remove('hidden');
}

function resetQuestionForm() {
    document.getElementById('question-content').value = '';
    document.getElementById('question-points').value = '1';
    
    // Reset multiple choice options
    document.getElementById('option-a').value = '';
    document.getElementById('option-b').value = '';
    document.getElementById('option-c').value = '';
    document.getElementById('option-d').value = '';
    document.getElementById('option-a-radio').checked = false;
    document.getElementById('option-b-radio').checked = false;
    document.getElementById('option-c-radio').checked = false;
    document.getElementById('option-d-radio').checked = false;
    
    // Reset true/false options
    document.getElementById('true-radio').checked = false;
    document.getElementById('false-radio').checked = false;
    
    // Reset text answer
    document.getElementById('correct-answer-text').value = '';
    
    // Reset to default question type
    questionTypeSelect.value = 'multiple-choice';
    showQuestionOptions('multiple-choice');
}

function updateQuestionsList() {
    questionsList.innerHTML = '';
    
    examData.questions.forEach((question, index) => {
        const questionElement = document.createElement('div');
        questionElement.className = 'question-item';
        questionElement.innerHTML = `
            <div class="question-header">
                <span class="question-number">Câu ${index + 1}</span>
                <span class="question-points">${question.points} điểm</span>
                <button class="delete-question" data-id="${question.id}"><i class="fas fa-trash"></i></button>
            </div>
            <div class="question-content">${question.content}</div>
            ${getQuestionAnswerPreview(question)}
        `;
        
        questionsList.appendChild(questionElement);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-question').forEach(button => {
        button.addEventListener('click', (e) => {
            const questionId = e.target.closest('button').dataset.id;
            deleteQuestion(questionId);
        });
    });
}

function getQuestionAnswerPreview(question) {
    switch (question.type) {
        case 'multiple-choice':
            return `
                <div class="question-options-preview">
                    <div class="option ${question.correctAnswer === 'A' ? 'correct' : ''}">A. ${question.options.A}</div>
                    <div class="option ${question.correctAnswer === 'B' ? 'correct' : ''}">B. ${question.options.B}</div>
                    <div class="option ${question.correctAnswer === 'C' ? 'correct' : ''}">C. ${question.options.C}</div>
                    <div class="option ${question.correctAnswer === 'D' ? 'correct' : ''}">D. ${question.options.D}</div>
                </div>
            `;
        case 'true-false':
            return `
                <div class="question-answer-preview">
                    Đáp án đúng: <strong>${question.correctAnswer ? 'Đúng' : 'Sai'}</strong>
                </div>
            `;
        case 'short-answer':
        case 'essay':
            return `
                <div class="question-answer-preview">
                    <strong>Đáp án mẫu:</strong> ${question.sampleAnswer || 'Không có'}
                </div>
            `;
        default:
            return '';
    }
}

function deleteQuestion(questionId) {
    examData.questions = examData.questions.filter(q => q.id !== questionId);
    updateQuestionsList();
    
    if (examData.questions.length === 0) {
        questionsListContainer.classList.add('hidden');
    }
}

// AI Exam Generation
function generateAIExam() {
    const prompt = document.getElementById('ai-prompt').value.trim();
    
    if (!prompt) {
        alert('Vui lòng nhập mô tả đề thi');
        return;
    }
    
    const aiLoading = document.getElementById('ai-loading');
    aiLoading.classList.remove('hidden');
    generateAIExamBtn.disabled = true;
    
    // Simulate AI generation (in a real app, this would call an API)
    setTimeout(() => {
        // This is a mock implementation
        const mockQuestions = generateMockQuestionsFromPrompt(prompt);
        examData.questions = mockQuestions;
        
        updateQuestionsList();
        questionsListContainer.classList.remove('hidden');
        
        aiLoading.classList.add('hidden');
        generateAIExamBtn.disabled = false;
        
        // Show success message
        Swal.fire({
            icon: 'success',
            title: 'Tạo đề thi thành công',
            text: `Đã tạo ${mockQuestions.length} câu hỏi từ mô tả của bạn`
        });
    }, 2000);
}

function generateMockQuestionsFromPrompt(prompt) {
    // This is a simplified mock implementation
    // In a real app, you would call an AI API here
    
    const questions = [];
    const questionTypes = ['multiple-choice', 'true-false', 'short-answer', 'essay'];
    
    // Generate 5-10 questions based on prompt
    const questionCount = 5 + Math.floor(Math.random() * 6);
    
    for (let i = 0; i < questionCount; i++) {
        const type = questionTypes[Math.floor(Math.random() * questionTypes.length)];
        const question = {
            id: Date.now().toString() + i,
            type,
            content: `Câu hỏi ${i + 1} về "${prompt.substring(0, 20)}..."`,
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

// Word file processing
function processWordFile() {
    const fileInput = document.getElementById('word-file');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Vui lòng chọn file Word');
        return;
    }
    
    const wordLoading = document.getElementById('word-loading');
    wordLoading.classList.remove('hidden');
    processWordBtn.disabled = true;
    
    // Simulate processing (in a real app, this would call an API)
    setTimeout(() => {
        // This is a mock implementation
        const mockQuestions = generateMockQuestionsFromWord();
        examData.questions = mockQuestions;
        
        updateQuestionsList();
        questionsListContainer.classList.remove('hidden');
        
        wordLoading.classList.add('hidden');
        processWordBtn.disabled = false;
        
        // Show success message
        Swal.fire({
            icon: 'success',
            title: 'Xử lý file thành công',
            text: `Đã tạo ${mockQuestions.length} câu hỏi từ file Word`
        });
    }, 2000);
}

function generateMockQuestionsFromWord() {
    // This is a simplified mock implementation
    // In a real app, you would parse the Word file
    
    const questions = [];
    const questionCount = 3 + Math.floor(Math.random() * 5); // 3-7 questions
    
    for (let i = 0; i < questionCount; i++) {
        const type = 'multiple-choice'; // Default to multiple choice for mock
        const question = {
            id: Date.now().toString() + i,
            type,
            content: `Câu hỏi ${i + 1} từ file Word`,
            points: 1,
            options: {
                A: `Lựa chọn A từ Word`,
                B: `Lựa chọn B từ Word`,
                C: `Lựa chọn C từ Word`,
                D: `Lựa chọn D từ Word`
            },
            correctAnswer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]
        };
        
        questions.push(question);
    }
    
    return questions;
}

// Image processing
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        imagePreview.src = event.target.result;
        imagePreviewContainer.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    imagePreview.src = '';
    imagePreviewContainer.classList.add('hidden');
    imageFileInput.value = '';
}

function openCameraModal() {
    cameraModal.classList.remove('hidden');
    
    // Start camera
    navigator.mediaDevices.getUserMedia({ video: true })
        .then((mediaStream) => {
            stream = mediaStream;
            cameraFeed.srcObject = stream;
        })
        .catch((err) => {
            console.error("Camera error: ", err);
            alert('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.');
            closeCameraModal();
        });
}

function closeCameraModal() {
    cameraModal.classList.add('hidden');
    
    // Stop camera
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    
    // Reset camera UI
    cameraFeed.classList.remove('hidden');
    cameraCanvas.classList.add('hidden');
    captureBtn.style.display = 'inline-block';
    retryBtn.style.display = 'none';
    usePhotoBtn.style.display = 'none';
}

function captureImage() {
    const context = cameraCanvas.getContext('2d');
    cameraCanvas.width = cameraFeed.videoWidth;
    cameraCanvas.height = cameraFeed.videoHeight;
    context.drawImage(cameraFeed, 0, 0, cameraCanvas.width, cameraCanvas.height);
    
    cameraFeed.classList.add('hidden');
    cameraCanvas.classList.remove('hidden');
    captureBtn.style.display = 'none';
    retryBtn.style.display = 'inline-block';
    usePhotoBtn.style.display = 'inline-block';
}

function retryCapture() {
    cameraFeed.classList.remove('hidden');
    cameraCanvas.classList.add('hidden');
    captureBtn.style.display = 'inline-block';
    retryBtn.style.display = 'none';
    usePhotoBtn.style.display = 'none';
}

function useCapturedImage() {
    imagePreview.src = cameraCanvas.toDataURL('image/png');
    imagePreviewContainer.classList.remove('hidden');
    closeCameraModal();
}

function processImageFile() {
    if (!imagePreview.src || imagePreview.src === '') {
        alert('Vui lòng tải lên ảnh hoặc chụp ảnh đề thi');
        return;
    }
    
    const imageLoading = document.getElementById('image-loading');
    imageLoading.classList.remove('hidden');
    processImageBtn.disabled = true;
    
    // Simulate processing (in a real app, this would call an OCR API)
    setTimeout(() => {
        // This is a mock implementation
        const mockQuestions = generateMockQuestionsFromImage();
        examData.questions = mockQuestions;
        
        updateQuestionsList();
        questionsListContainer.classList.remove('hidden');
        
        imageLoading.classList.add('hidden');
        processImageBtn.disabled = false;
        
        // Show success message
        Swal.fire({
            icon: 'success',
            title: 'Xử lý ảnh thành công',
            text: `Đã tạo ${mockQuestions.length} câu hỏi từ ảnh`
        });
    }, 2000);
}

function generateMockQuestionsFromImage() {
    // This is a simplified mock implementation
    // In a real app, you would use OCR to extract text
    
    const questions = [];
    const questionCount = 2 + Math.floor(Math.random() * 4); // 2-5 questions
    
    for (let i = 0; i < questionCount; i++) {
        const type = 'multiple-choice'; // Default to multiple choice for mock
        const question = {
            id: Date.now().toString() + i,
            type,
            content: `Câu hỏi ${i + 1} từ ảnh`,
            points: 1,
            options: {
                A: `Lựa chọn A từ ảnh`,
                B: `Lựa chọn B từ ảnh`,
                C: `Lựa chọn C từ ảnh`,
                D: `Lựa chọn D từ ảnh`
            },
            correctAnswer: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]
        };
        
        questions.push(question);
    }
    
    return questions;
}

// Exam preview and export
function updatePreview() {
    document.getElementById('preview-exam-title').textContent = examData.title || 'Tiêu đề đề thi';
    document.getElementById('preview-exam-description').textContent = examData.description || 'Mô tả đề thi';
    document.getElementById('preview-exam-duration').textContent = examData.duration || '60';
    document.getElementById('preview-exam-questions').textContent = examData.questions.length;
    
    const previewQuestionsList = document.getElementById('preview-questions-list');
    previewQuestionsList.innerHTML = '';
    
    examData.questions.forEach((question, index) => {
        const questionElement = document.createElement('div');
        questionElement.className = 'preview-question';
        questionElement.innerHTML = `
            <div class="preview-question-header">
                <span class="preview-question-number">Câu ${index + 1}</span>
                <span class="preview-question-points">(${question.points} điểm)</span>
            </div>
            <div class="preview-question-content">${question.content}</div>
        `;
        
        previewQuestionsList.appendChild(questionElement);
    });
}

function saveExam() {
    if (!examData.title || examData.questions.length === 0) {
        alert('Vui lòng điền đầy đủ thông tin và thêm ít nhất một câu hỏi');
        return;
    }
    
    examData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    
    // Save to Firestore
    db.collection('exams').add(examData)
        .then((docRef) => {
            // Generate shareable link and QR code
            const examLink = `${window.location.origin}/take-exam.html?examId=${docRef.id}`;
            examData.id = docRef.id;
            
            // Show success message
            Swal.fire({
                icon: 'success',
                title: 'Lưu đề thi thành công',
                text: 'Đề thi của bạn đã được lưu vào hệ thống'
            });
            
            // Enable sharing options
            document.getElementById('exam-link').value = examLink;
        })
        .catch((error) => {
            console.error("Error saving exam: ", error);
            alert('Có lỗi xảy ra khi lưu đề thi. Vui lòng thử lại.');
        });
}

function printExam() {
    window.print();
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text(examData.title || 'Đề thi Văn học', 105, 20, { align: 'center' });
    
    // Add description
    doc.setFontSize(12);
    doc.text(examData.description || 'Mô tả đề thi', 105, 30, { align: 'center' });
    
    // Add exam info
    doc.setFontSize(10);
    doc.text(`Thời gian làm bài: ${examData.duration || 60} phút`, 14, 40);
    doc.text(`Số câu hỏi: ${examData.questions.length}`, 14, 45);
    
    // Add questions
    let yPosition = 60;
    examData.questions.forEach((question, index) => {
        // Add question number and content
        doc.setFontSize(12);
        doc.text(`Câu ${index + 1}: ${question.content} (${question.points} điểm)`, 14, yPosition);
        yPosition += 10;
        
        // Add options if multiple choice
        if (question.type === 'multiple-choice') {
            doc.setFontSize(10);
            doc.text(`A. ${question.options.A}`, 20, yPosition);
            yPosition += 7;
            doc.text(`B. ${question.options.B}`, 20, yPosition);
            yPosition += 7;
            doc.text(`C. ${question.options.C}`, 20, yPosition);
            yPosition += 7;
            doc.text(`D. ${question.options.D}`, 20, yPosition);
            yPosition += 10;
        } else if (question.type === 'true-false') {
            doc.text(`Đáp án: ${question.correctAnswer ? 'Đúng' : 'Sai'}`, 20, yPosition);
            yPosition += 10;
        } else {
            doc.text(`Đáp án mẫu: ${question.sampleAnswer || 'Không có'}`, 20, yPosition);
            yPosition += 10;
        }
        
        // Add space between questions
        yPosition += 5;
        
        // Add new page if needed
        if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
        }
    });
    
    // Save the PDF
    doc.save(`${examData.title || 'de-thi'}.pdf`);
}

// Sharing functions
function showQRCode() {
    if (!examData.id) {
        alert('Vui lòng lưu đề thi trước khi tạo QR code');
        return;
    }
    
    qrContainer.classList.remove('hidden');
    linkContainer.classList.add('hidden');
    shareOutput.classList.remove('hidden');
    
    // Generate QR code
    const qrCode = new QRCode(document.getElementById('qr-code'), {
        text: `${window.location.origin}/take-exam.html?examId=${examData.id}`,
        width: 200,
        height: 200
    });
}

function showExamLink() {
    if (!examData.id) {
        alert('Vui lòng lưu đề thi trước khi tạo liên kết');
        return;
    }
    
    qrContainer.classList.add('hidden');
    linkContainer.classList.remove('hidden');
    shareOutput.classList.remove('hidden');
}

function downloadQRCode() {
    const qrCodeCanvas = document.querySelector('#qr-code canvas');
    const link = document.createElement('a');
    link.download = `qr-code-${examData.id}.png`;
    link.href = qrCodeCanvas.toDataURL('image/png');
    link.click();
}

function copyExamLink() {
    const linkInput = document.getElementById('exam-link');
    linkInput.select();
    document.execCommand('copy');
    
    // Show copied message
    const originalText = copyLinkBtn.innerHTML;
    copyLinkBtn.innerHTML = '<i class="fas fa-check"></i> Đã sao chép';
    
    setTimeout(() => {
        copyLinkBtn.innerHTML = originalText;
    }, 2000);
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);